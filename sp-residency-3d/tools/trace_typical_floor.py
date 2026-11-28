"""
Trace the typical-floor unit outlines from the ORIGINAL brochure plan (page 15).

Source of truth : source-assets/brochure/SPR-Brochure-11-05-2026.pdf, page 15
Input raster    : the plan image + its alpha mask (soft mask) embedded in that page
Output          : src/data/plan-geometry.json  (pixel + feet coordinates)

Method
  1. The PDF soft-mask gives the exact building outline (transparent = outside).
  2. Partition lines between units are read off the printed plan (walls between
     units) and expressed in plan-pixel coordinates below.
  3. Each region is rasterised on a 2 px grid and its boundary traced into an
     orthogonal polygon. Balconies are stored separately (printed sizes).
  4. Scale: 7.6 px per foot, calibrated on the printed 28'4" halls of
     Types A, D and F (measured 215-219 px).  Footprint is therefore DERIVED,
     not printed - the brochure carries no overall dimensions.

Usage: python3 -I tools/trace_typical_floor.py <plan.jpg> <alpha.png|ppm> <out.json>
"""
import json, sys
import numpy as np
from PIL import Image

PX_PER_FT = 7.6
ROI = (620, 85, 1250, 925)          # x0, y0, x1, y1 in plan pixels
CORR_X = (903, 957)                 # central corridor (clear) x-range
CORR_Y = (214, 780)
CELL = 2                            # tracing grid in px

def classify(x, y):
    """Return the region key for plan pixel (x, y) inside the building mask."""
    if CORR_X[0] <= x < CORR_X[1]:
        if y < CORR_Y[0]:
            return "lightwell_n"
        if y >= CORR_Y[1]:
            return "lightwell_s"
        return "corridor"
    if x < CORR_X[0]:                               # west row: C / B / A
        if (x >= 779 and 481 <= y < 553):
            return "stair"
        if (x >= 832 and 553 <= y < 599):
            return "lift"
        if (y < 318 and x < 782) or (y < 305 and x >= 782):
            return "C"
        if (y >= 590 and x < 832) or (y >= 599):
            return "A"
        return "B"
    # east row: D / E / F
    if x < 990 and 576 <= y < 600:                  # planter at corridor edge
        return None
    if y < 402:
        return "D"
    if y < 590:
        return "E"
    return "F"

# Balconies (plan px, x0,y0,x1,y1) with the size printed on the plan.
BALCONIES = {
    "C": [((692, 94, 744, 123), "7'3\" x 4'")],
    "D": [((1007, 94, 1054, 123), "8'10\" x 4'"), ((1088, 94, 1173, 123), "11'4\" x 4'"),
          ((1176, 214, 1238, 300), "7'1\" x 11'")],
    "B": [((626, 402, 685, 480), "7'1\" x 9'4\"")],
    "E": [((1185, 483, 1238, 578), "6'5\" x 12'")],
    "A": [((627, 699, 685, 780), "7'1\" x 10'8\""), ((692, 876, 784, 909), "10'6\" x 3'6\""),
          ((797, 876, 897, 909), "10'6\" x 3'6\"")],
    "F": [((1185, 699, 1238, 780), "7'1\" x 10'8\""), ((960, 876, 1060, 909), "10'6\" x 3'6\""),
          ((1104, 876, 1195, 909), "10'6\" x 3'6\"")],
}

# White architectural frames / fins drawn at the building corners (plan px).
FRAMES = {
    "nw": [(631, 105, 690, 115), (631, 105, 641, 146)],
    "ne": [(1173, 102, 1232, 112), (1222, 102, 1232, 145)],
    "sw": [(631, 907, 758, 919), (631, 872, 641, 919)],
    "se": [(1216, 840, 1223, 909)],
}

def trace(grid):
    """Trace outer boundaries of a boolean grid into orthogonal loops (grid units)."""
    h, w = grid.shape
    edges = {}
    def add(a, b):
        edges.setdefault(a, []).append(b)
    for j in range(h):
        for i in range(w):
            if not grid[j, i]:
                continue
            if j == 0 or not grid[j - 1, i]: add((i, j), (i + 1, j))
            if j == h - 1 or not grid[j + 1, i]: add((i + 1, j + 1), (i, j + 1))
            if i == 0 or not grid[j, i - 1]: add((i, j + 1), (i, j))
            if i == w - 1 or not grid[j, i + 1]: add((i + 1, j), (i + 1, j + 1))
    loops = []
    while edges:
        start = next(iter(edges))
        loop = [start]
        cur = start
        while True:
            nxts = edges[cur]
            nxt = nxts.pop()
            if not nxts:
                del edges[cur]
            if nxt == start:
                break
            loop.append(nxt)
            cur = nxt
        # merge collinear points
        simp = []
        n = len(loop)
        for k in range(n):
            p0, p1, p2 = loop[k - 1], loop[k], loop[(k + 1) % n]
            if (p0[0] == p1[0] == p2[0]) or (p0[1] == p1[1] == p2[1]):
                continue
            simp.append(p1)
        loops.append(simp)
    return loops

def area(poly):
    s = 0
    for k in range(len(poly)):
        x0, y0 = poly[k - 1]; x1, y1 = poly[k]
        s += x0 * y1 - x1 * y0
    return s / 2

def clean(grid, k=1):
    """Binary opening then closing with a (2k+1) box to drop JPEG specks."""
    from numpy.lib.stride_tricks import sliding_window_view as swv
    def erode(g):
        p = np.pad(g, k, constant_values=False)
        return swv(p, (2*k+1, 2*k+1)).all(axis=(2, 3))
    def dilate(g):
        p = np.pad(g, k, constant_values=False)
        return swv(p, (2*k+1, 2*k+1)).any(axis=(2, 3))
    return erode(dilate(dilate(erode(grid))))  # open, then close (approx)

def main(plan_path, alpha_path, out_path):
    alpha = np.array(Image.open(alpha_path).convert("L")) > 128
    x0, y0, x1, y1 = ROI
    gw, gh = (x1 - x0) // CELL, (y1 - y0) // CELL
    labels = {}
    # balcony cells are removed from unit bodies
    balc_mask = np.zeros_like(alpha)
    for lst in BALCONIES.values():
        for (bx0, by0, bx1, by1), _ in lst:
            balc_mask[by0:by1, bx0:bx1] = True
    for lst in FRAMES.values():
        for (bx0, by0, bx1, by1) in lst:
            balc_mask[by0:by1 + 1, bx0:bx1 + 1] = True
    for j in range(gh):
        for i in range(gw):
            px, py = x0 + i * CELL + CELL // 2, y0 + j * CELL + CELL // 2
            blk = alpha[py - 1:py + 1, px - 1:px + 1]
            if blk.mean() < 0.5:
                continue
            if balc_mask[py, px]:
                continue
            key = classify(px, py)
            if key is None:
                continue
            labels.setdefault(key, np.zeros((gh, gw), bool))[j, i] = True

    # combined building outline (units + corridor + core), used for roof, parapet and facade
    outline = np.zeros((gh, gw), bool)
    for k in ("A", "B", "C", "D", "E", "F", "corridor", "stair", "lift"):
        outline |= labels[k]
    labels["outline"] = outline

    regions = {}
    for key, grid in sorted(labels.items()):
        g = clean(grid, 1)
        loops = trace(g)
        loops = [l for l in loops if area(l) > 40]   # drop specks (< ~40 cells)
        loops.sort(key=lambda l: -abs(area(l)))
        outer = loops[0]
        poly_px = [[x0 + p[0] * CELL, y0 + p[1] * CELL] for p in outer]
        holes = [[[x0 + p[0] * CELL, y0 + p[1] * CELL] for p in l] for l in loops[1:] if area(l) < 0]
        regions[key] = {"polygon_px": poly_px, "holes_px": holes,
                        "area_px": float(g.sum() * CELL * CELL)}

    # building extent
    ys, xs = np.where(alpha[y0:y1, x0:x1])
    bx0, bx1, by0, by1 = int(xs.min() + x0), int(xs.max() + x0), int(ys.min() + y0), int(ys.max() + y0)

    out = {
        "_about": "Typical floor (1st-4th) geometry traced from brochure page 15. Pixel coords refer to plan image "
                  "public/plans/typical-floor-plan.jpg (1772x997). Feet are DERIVED with px_per_ft; the brochure prints "
                  "no overall dimensions. Not for construction.",
        "source": {"pdf": "SPR-Brochure-11-05-2026.pdf", "page": 15},
        "image": {"width": 1772, "height": 997},
        "px_per_ft": PX_PER_FT,
        "calibration": "Printed 28'4\" hall of Types A, D, F measured 215-219 px on the plan raster",
        "building_bbox_px": [bx0, by0, bx1, by1],
        "building_size_ft_derived": [round((bx1 - bx0) / PX_PER_FT, 1), round((by1 - by0) / PX_PER_FT, 1)],
        "north": "up (compass on plan page 15); road / building entry on the south (bottom)",
        "regions": regions,
        "frames": {k: [list(r) for r in v] for k, v in FRAMES.items()},
        "balconies": {k: [{"rect_px": list(r), "printed": lab} for r, lab in v] for k, v in BALCONIES.items()},
    }
    with open(out_path, "w") as f:
        json.dump(out, f, indent=1)
    for k, v in regions.items():
        print(f"{k:12s} vertices={len(v['polygon_px']):3d} holes={len(v['holes_px'])} "
              f"area_ft2={v['area_px'] / PX_PER_FT**2:7.0f}")
    print("building", out["building_size_ft_derived"])

if __name__ == "__main__":
    main(*sys.argv[1:4])
