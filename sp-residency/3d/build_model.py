#!/usr/bin/env python3
"""
SP Residency - conceptual 3D model builder (GLB / glTF 2.0).

    python3 -I sp-residency/3d/build_model.py --root .

Builds a working, conceptual 3D model directly from the brochure floor plans:

  * Walls are the walls DRAWN in the brochure plan rasters: dark wall pixels are extracted,
    cleaned (morphological opening removes label text), decomposed into axis-aligned blocks and
    extruded. Nothing is redrawn by hand.
  * Floors carry the brochure plan itself as their texture (finishes + furniture layout as drawn).
  * Scale (px per ft) per plan:
      - unit plans  : from the PRINTED carpet area (sqrt(unit pixel area excl. balconies / carpet)),
                      spot-checked against enclosed rooms (see model-report.json)
      - typical plan: from the four printed 28'4" x 11' halls of units A, D and F
  * Heights: 10' floor-to-floor is printed (p22). Stilt height, slab thickness and parapet height
    are NOT in the brochure; they are explicit ASSUMED parameters below and recorded in the model.
  * The 5th floor has no plan in the brochure: it is exported as translucent ghost massing only.

Outputs
  sp-residency/3d/exports/SPR_building_conceptual.glb   (stilt, floors 1-4, ghost L5, terrace)
  sp-residency/3d/exports/SPR_unit_<A-F>_conceptual.glb  (high-resolution unit models)
  sp-residency/3d/exports/model-report.json             (calibration, assumptions, checks)
  public/models/sp-residency/*                           (copies for the website viewer + model.json)

Requires: numpy, scipy, Pillow, trimesh  (pip install numpy scipy pillow trimesh)
"""

from __future__ import annotations

import argparse
import io
import json
import shutil
from pathlib import Path

import numpy as np
import trimesh
from PIL import Image
from scipy import ndimage as ndi

FT = 0.3048  # metres per foot

# ----------------------------------------------------------------------------- parameters
FLOOR_TO_FLOOR_FT = 10.0          # printed: "Floor to floor height (incl. slab) 10'" (p22)
ASSUMED = {
    "stilt_floor_to_floor_ft": 10.0,   # NOT in brochure - set equal to typical floors
    "slab_thickness_ft": 0.5,          # NOT in brochure - 150 mm typical RCC slab
    "parapet_height_ft": 3.5,          # NOT in brochure
    "parapet_thickness_ft": 0.75,      # NOT in brochure
}
WALL_GRID_PX_PER_FT = 6.0          # geometry grid for wall blocks (2 inch) - smooths raster jaggies
FLOOR_GRID_PX_PER_FT = 4.0         # geometry grid for floor plates (~3 inches)

UNITS = {  # key: (plan file stem, printed carpet sq.ft, configuration)
    "A": ("p16-unit-type-a-3bhk", 1500, "3 BHK"),
    "B": ("p17-unit-type-b-2bhk", 957, "2 BHK"),
    "C": ("p18-unit-type-c-2bhk", 1003, "2 BHK"),
    "D": ("p19-unit-type-d-3bhk", 1472, "3 BHK"),
    "E": ("p20-unit-type-e-2bhk", 846, "2 BHK"),
    "F": ("p21-unit-type-f-3bhk", 1486, "3 BHK"),
}
TYPICAL = "p15-typical-floor-plan"
TYPICAL_PX_PER_FT = 7.55           # from the 28'4" x 11' halls of A, D, F (trimmed raster px)
TYPICAL_UPSCALE = 3                # walls are extracted on a 3x Lanczos upscale (thin partitions survive)
CORRIDOR_INLAY_X = (284, 327)      # trimmed px: black granite inlay bands in the corridor (floor, not walls)

# Unit footprints on the typical floor (trimmed typical px; hit areas / highlights in the viewer)
UNIT_REGIONS = {
    "C": [(13, 18, 274, 222)],
    "B": [(0, 222, 274, 386), (13, 386, 152, 482)],
    "A": [(3, 503, 274, 812)],
    "D": [(331, 0, 596, 303)],
    "E": [(331, 303, 613, 497)],
    "F": [(331, 503, 613, 812)],
}
CORE_REGION = (152, 384, 274, 498)  # staircase + lift (trimmed typical px)

# Enclosed rooms used to spot-check each unit's scale (seed px in the RAW unit raster; printed ft)
SPOT_CHECKS = {
    "A": [("Bedroom-1", 650, 200, 12, 12)],
    "B": [("Bedroom-1", 720, 850, 13, 11)],
    "C": [("Bedroom-1", 750, 330, 13, 11.42), ("Bedroom-2", 750, 680, 13, 12)],
    "D": [],  # every D room opens to the hall or kitchen - no enclosed seed
    "E": [("Bedroom-2", 1050, 300, 10, 11.25)],
    "F": [],
}

COLORS = {
    "wall": (238, 233, 224, 255),       # warm white architectural-model walls
    "slab": (205, 199, 189, 255),       # concrete edge
    "ghost": (195, 167, 106, 70),       # gold, translucent: geometry not in brochure
    "parapet": (230, 224, 214, 255),
    "core": (120, 116, 110, 255),
}


# ----------------------------------------------------------------------------- raster helpers
def load_plan(ref: Path, stem: str) -> tuple[np.ndarray, np.ndarray]:
    rgb = np.asarray(Image.open(ref / f"{stem}.jpg").convert("RGB"))
    alpha = np.asarray(Image.open(ref / f"{stem}_alpha-mask.png").convert("L")) > 128
    alpha = alpha.copy()
    # drop the corner presentation badge ('TYPE A' / 'FLOOR PLAN'): separate blobs bottom-right
    h, w = alpha.shape
    lab, n = ndi.label(alpha)
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        if sl[1].start >= 0.75 * w and sl[0].start >= 0.80 * h and (lab[sl] == i).sum() < 0.05 * w * h:
            alpha[lab == i] = False
    # keep the largest component (the plan) + anything touching it within 2 px
    lab, n = ndi.label(ndi.binary_dilation(alpha, iterations=2))
    sizes = ndi.sum(alpha, lab, range(1, n + 1))
    alpha &= lab == (int(np.argmax(sizes)) + 1)
    return rgb, alpha


def trim(rgb: np.ndarray, alpha: np.ndarray):
    ys, xs = np.where(alpha)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    return rgb[y0:y1, x0:x1], alpha[y0:y1, x0:x1], (int(x0), int(y0))


def wall_mask(rgb: np.ndarray, alpha: np.ndarray, open_k: int) -> np.ndarray:
    a = rgb.astype(int)
    mx = a.max(axis=2)
    mn = a.min(axis=2)
    wall = (mx < 100) & (mx - mn < 16) & alpha
    wall = ndi.binary_opening(wall, np.ones((open_k, open_k)))
    lab, n = ndi.label(wall)
    if n:
        sizes = ndi.sum(wall, lab, range(1, n + 1))
        wall = np.isin(lab, np.where(sizes >= open_k * open_k * 6)[0] + 1)
    return wall


def resample_mask(mask: np.ndarray, factor: float, smooth: bool = False) -> np.ndarray:
    """Resample a boolean mask by `factor` (area-average, then threshold).
    smooth=True applies a 3x3 majority (median) filter on the grid so straight walls come out straight."""
    h, w = mask.shape
    nh, nw = max(1, round(h * factor)), max(1, round(w * factor))
    img = Image.fromarray((mask * 255).astype(np.uint8)).resize((nw, nh), Image.BOX)
    out = np.asarray(img) > 110
    if smooth:
        out = ndi.median_filter(out.astype(np.uint8), size=3) > 0
    return out


def rects_from_mask(mask: np.ndarray) -> list[tuple[int, int, int, int]]:
    """Decompose a boolean mask into axis-aligned rectangles (x0, y0, x1, y1), exclusive ends."""
    rects, active = [], {}
    h, w = mask.shape
    for y in range(h + 1):
        runs = set()
        if y < h:
            row = np.concatenate([[False], mask[y], [False]])
            d = np.diff(row.astype(np.int8))
            starts, ends = np.where(d == 1)[0], np.where(d == -1)[0]
            runs = set(zip(starts.tolist(), ends.tolist()))
        for run in list(active):
            if run not in runs:
                y0 = active.pop(run)
                rects.append((run[0], y0, run[1], y))
        for run in runs:
            active.setdefault(run, y)
    return rects


# ----------------------------------------------------------------------------- mesh helpers
def boxes_mesh(rects, m_per_px, origin, y0, height, color, top=True, bottom=False) -> trimesh.Trimesh:
    """Extrude rectangles (grid px) into one mesh. Plan u -> +X (east), v -> +Z (south)."""
    if not rects:
        return trimesh.Trimesh()
    r = np.asarray(rects, dtype=float)
    ox, oz = origin
    x0, x1 = r[:, 0] * m_per_px - ox, r[:, 2] * m_per_px - ox
    z0, z1 = r[:, 1] * m_per_px - oz, r[:, 3] * m_per_px - oz
    n = len(r)
    ya, yb = np.full(n, y0), np.full(n, y0 + height)
    v = np.stack([
        np.stack([x0, ya, z0], 1), np.stack([x1, ya, z0], 1), np.stack([x1, ya, z1], 1), np.stack([x0, ya, z1], 1),
        np.stack([x0, yb, z0], 1), np.stack([x1, yb, z0], 1), np.stack([x1, yb, z1], 1), np.stack([x0, yb, z1], 1),
    ], 1).reshape(-1, 3)
    faces = [  # outward-facing (counter-clockwise seen from outside)
        (0, 1, 5), (0, 5, 4),   # north (-z)
        (2, 3, 7), (2, 7, 6),   # south (+z)
        (3, 0, 4), (3, 4, 7),   # west (-x)
        (1, 2, 6), (1, 6, 5),   # east (+x)
    ]
    if top:
        faces += [(4, 5, 6), (4, 6, 7)]
    if bottom:
        faces += [(0, 3, 2), (0, 2, 1)]
    f = np.asarray(faces)
    allf = (f[None, :, :] + (np.arange(n) * 8)[:, None, None]).reshape(-1, 3)
    mesh = trimesh.Trimesh(vertices=v, faces=allf, process=False)
    mesh.visual = trimesh.visual.ColorVisuals(mesh, face_colors=np.tile(color, (len(allf), 1)))
    return mesh


def floor_mesh(alpha_grid, grid_m_per_px, origin, y, tex: Image.Image) -> trimesh.Trimesh:
    """Top surface of the floor plate, textured with the brochure plan."""
    rects = rects_from_mask(alpha_grid)
    gh, gw = alpha_grid.shape
    verts, uvs, faces = [], [], []
    ox, oz = origin
    for i, (x0, y0, x1, y1) in enumerate(rects):
        quad = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
        for (u, v) in quad:
            verts.append((u * grid_m_per_px - ox, y, v * grid_m_per_px - oz))
            uvs.append((u / gw, 1.0 - v / gh))
        b = i * 4
        faces += [(b, b + 2, b + 1), (b, b + 3, b + 2)]   # +Y facing
    mesh = trimesh.Trimesh(vertices=np.asarray(verts), faces=np.asarray(faces), process=False)
    material = trimesh.visual.material.PBRMaterial(
        name="brochure_plan", baseColorTexture=tex, metallicFactor=0.0, roughnessFactor=0.85)
    mesh.visual = trimesh.visual.TextureVisuals(uv=np.asarray(uvs), material=material)
    return mesh


def flat_material(mesh: trimesh.Trimesh, name: str, rgba) -> trimesh.Trimesh:
    """Give a mesh a named PBR material (glTF-friendly) instead of per-face colours."""
    m = mesh.copy()
    alpha_mode = "BLEND" if rgba[3] < 255 else "OPAQUE"
    m.visual = trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(
        name=name, baseColorFactor=[c / 255 for c in rgba], metallicFactor=0.0, roughnessFactor=0.9,
        alphaMode=alpha_mode, doubleSided=rgba[3] < 255))
    return m


def plan_texture(rgb: np.ndarray, alpha: np.ndarray, bg=(205, 199, 189), max_edge=2048) -> Image.Image:
    a = rgb.copy()
    a[~alpha] = bg
    img = Image.fromarray(a)
    s = min(1.0, max_edge / max(img.size))
    if s < 1:
        img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=88)
    buf.seek(0)
    out = Image.open(buf)
    out.load()
    return out


def ray_span(wall, alpha, x, y):
    def ray(dx, dy):
        k = 0
        while True:
            k += 1
            yy, xx = y + dy * k, x + dx * k
            if not (0 <= yy < wall.shape[0] and 0 <= xx < wall.shape[1]) or wall[yy, xx] or not alpha[yy, xx]:
                return k
    return ray(1, 0) + ray(-1, 0) - 1, ray(0, 1) + ray(0, -1) - 1


# ----------------------------------------------------------------------------- builders
def unit_scale(rgb, alpha, carpet_sqft) -> float:
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    wood_dark = (r < 125) & (r > g) & (g > b) & (r - b > 35) & alpha
    wood_dark = ndi.binary_closing(ndi.binary_opening(wood_dark, np.ones((7, 7))), np.ones((15, 15)))
    lab, n = ndi.label(wood_dark)
    sizes = ndi.sum(wood_dark, lab, range(1, n + 1)) if n else []
    balcony_px = float(sum(s for s in sizes if s > 4000))
    light_grey = (np.abs(r - g) < 8) & (np.abs(g - b) < 8) & (r > 185) & (r < 235) & alpha
    stub_px = float(ndi.binary_opening(light_grey, np.ones((15, 15))).sum())
    return float(np.sqrt((alpha.sum() - balcony_px - stub_px) / carpet_sqft))


def build_unit(ref: Path, key: str, out_dir: Path) -> dict:
    stem, carpet, config = UNITS[key]
    rgb_raw, alpha_raw = load_plan(ref, stem)
    px_per_ft = unit_scale(rgb_raw, alpha_raw, carpet)
    wall_raw = wall_mask(rgb_raw, alpha_raw, open_k=5)

    checks = []
    for name, x, y, a_ft, b_ft in SPOT_CHECKS[key]:
        w, h = ray_span(wall_raw, alpha_raw, x, y)
        if a_ft is None:
            checks.append({"room": name, "printed_ft": b_ft, "measured_ft": round(h / px_per_ft, 2),
                           "deviation_pct": round(100 * (h / px_per_ft - b_ft) / b_ft, 1)})
        else:
            meas = sorted([w / px_per_ft, h / px_per_ft])
            prin = sorted([a_ft, b_ft])
            checks.append({"room": name, "printed_ft": [a_ft, b_ft], "measured_ft": [round(v, 2) for v in meas],
                           "deviation_pct": [round(100 * (m - p) / p, 1) for m, p in zip(meas, prin)]})

    rgb, alpha, _ = trim(rgb_raw, alpha_raw)
    wall = wall_raw[_[1]:_[1] + alpha.shape[0], _[0]:_[0] + alpha.shape[1]]
    m_per_px = FT / px_per_ft
    W, H = alpha.shape[1] * m_per_px, alpha.shape[0] * m_per_px
    origin = (W / 2, H / 2)

    wf = WALL_GRID_PX_PER_FT / px_per_ft
    wgrid = resample_mask(wall, wf, smooth=True)
    wall_h = (FLOOR_TO_FLOOR_FT - ASSUMED["slab_thickness_ft"]) * FT
    walls = boxes_mesh(rects_from_mask(wgrid), FT / WALL_GRID_PX_PER_FT, origin, 0.0, wall_h, COLORS["wall"])
    ff = FLOOR_GRID_PX_PER_FT / px_per_ft
    agrid = resample_mask(alpha, ff)
    floor = floor_mesh(agrid, FT / FLOOR_GRID_PX_PER_FT, origin, 0.002, plan_texture(rgb, alpha))
    slab_rects = rects_from_mask(agrid)
    slab = boxes_mesh(slab_rects, FT / FLOOR_GRID_PX_PER_FT, origin, -ASSUMED["slab_thickness_ft"] * FT,
                      ASSUMED["slab_thickness_ft"] * FT, COLORS["slab"], top=False, bottom=True)

    scene = trimesh.Scene()
    scene.add_geometry(floor, node_name=f"Unit{key}_floor_brochure_plan", geom_name=f"Unit{key}_floor")
    scene.add_geometry(flat_material(walls, "wall_model_white", COLORS["wall"]),
                       node_name=f"Unit{key}_walls_from_plan", geom_name=f"Unit{key}_walls")
    scene.add_geometry(flat_material(slab, "slab_concrete", COLORS["slab"]),
                       node_name=f"Unit{key}_slab", geom_name=f"Unit{key}_slab")
    scene.metadata["extras"] = {"source": "SP Residency brochure 11-05-2026", "accuracy": "conceptual",
                                "unit": key, "px_per_ft": round(px_per_ft, 3)}
    glb = out_dir / f"SPR_unit_{key}_conceptual.glb"
    glb.write_bytes(trimesh.exchange.gltf.export_glb(scene, include_normals=True))
    return {
        "key": key, "configuration": config, "file": glb.name, "carpet_sqft": carpet,
        "px_per_ft": round(px_per_ft, 3), "scale_method": "printed carpet area",
        "size_m": [round(W, 2), round(H, 2)], "wall_height_m": round(wall_h, 3),
        "wall_blocks": len(rects_from_mask(wgrid)), "spot_checks": checks,
        "triangles": int(len(walls.faces) + len(floor.faces) + len(slab.faces)),
    }


def build_building(ref: Path, out_dir: Path) -> dict:
    rgb_raw, alpha_raw = load_plan(ref, TYPICAL)
    rgb, alpha, offset = trim(rgb_raw, alpha_raw)
    S = TYPICAL_UPSCALE
    big = np.asarray(Image.fromarray(rgb).resize((rgb.shape[1] * S, rgb.shape[0] * S), Image.LANCZOS))
    big_alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8))
                           .resize((rgb.shape[1] * S, rgb.shape[0] * S), Image.BILINEAR)) > 128
    wall = wall_mask(big, big_alpha, open_k=5)
    wall[:, CORRIDOR_INLAY_X[0] * S:CORRIDOR_INLAY_X[1] * S] = False

    px_per_ft = TYPICAL_PX_PER_FT
    m_per_px = FT / px_per_ft                       # trimmed typical px -> m
    W, D = alpha.shape[1] * m_per_px, alpha.shape[0] * m_per_px
    origin = (W / 2, D / 2)

    ftf = FLOOR_TO_FLOOR_FT * FT
    slab_t = ASSUMED["slab_thickness_ft"] * FT
    stilt = ASSUMED["stilt_floor_to_floor_ft"] * FT
    wall_h = ftf - slab_t

    wgrid = resample_mask(wall, WALL_GRID_PX_PER_FT / (px_per_ft * S), smooth=True)
    wrects = rects_from_mask(wgrid)
    wall_geom = flat_material(boxes_mesh(wrects, FT / WALL_GRID_PX_PER_FT, origin, 0.0, wall_h, COLORS["wall"]),
                              "wall_model_white", COLORS["wall"])
    agrid = resample_mask(alpha, FLOOR_GRID_PX_PER_FT / px_per_ft)
    arects = rects_from_mask(agrid)
    tex = plan_texture(big, big_alpha, max_edge=2048)
    floor_geom = floor_mesh(agrid, FT / FLOOR_GRID_PX_PER_FT, origin, 0.002, tex)
    slab_geom = flat_material(boxes_mesh(arects, FT / FLOOR_GRID_PX_PER_FT, origin, -slab_t, slab_t,
                                         COLORS["slab"], top=True, bottom=True), "slab_concrete", COLORS["slab"])
    ghost_geom = flat_material(boxes_mesh(arects, FT / FLOOR_GRID_PX_PER_FT, origin, 0.0, wall_h,
                                          COLORS["ghost"], top=True, bottom=True), "ghost_not_in_brochure",
                               COLORS["ghost"])
    # parapet ring from the footprint outline
    ring = agrid & ~ndi.binary_erosion(agrid, iterations=max(1, round(ASSUMED["parapet_thickness_ft"] * FLOOR_GRID_PX_PER_FT)))
    parapet_geom = flat_material(boxes_mesh(rects_from_mask(ring), FT / FLOOR_GRID_PX_PER_FT, origin, 0.0,
                                            ASSUMED["parapet_height_ft"] * FT, COLORS["parapet"]),
                                 "parapet", COLORS["parapet"])
    # stair + lift core on the stilt (walls of the core region only)
    cx0, cy0, cx1, cy1 = (int(v * WALL_GRID_PX_PER_FT / px_per_ft) for v in CORE_REGION)
    core_mask = np.zeros_like(wgrid)
    core_mask[cy0:cy1, cx0:cx1] = wgrid[cy0:cy1, cx0:cx1]
    core_geom = flat_material(boxes_mesh(rects_from_mask(core_mask), FT / WALL_GRID_PX_PER_FT, origin, 0.0,
                                         stilt - slab_t, COLORS["core"]), "core_concrete", COLORS["core"])

    scene = trimesh.Scene()
    levels = []

    def place(geom, geom_name, node_name, y):
        T = np.eye(4)
        T[1, 3] = y
        if geom_name in scene.geometry:
            scene.graph.update(frame_to=node_name, frame_from=scene.graph.base_frame,
                               geometry=geom_name, matrix=T)
        else:
            scene.add_geometry(geom, geom_name=geom_name, node_name=node_name, transform=T)

    # L00 stilt: ground slab + core only (no stilt plan drawing exists)
    place(slab_geom, "slab", "L00_Stilt_slab", 0.0)
    place(core_geom, "core", "L00_Stilt_core_stair_lift", 0.0)
    levels.append({"id": "L00", "name": "Stilt", "elevation_m": 0.0, "content": "slab + stair/lift core",
                   "note": "Stilt plan exists only as a 3D illustration (p10); columns not modelled"})
    for n in range(1, 5):
        y = stilt + (n - 1) * ftf
        place(slab_geom, "slab", f"L0{n}_slab", y)
        place(floor_geom, "typical_floor", f"L0{n}_floor_brochure_plan", y)
        place(wall_geom, "typical_walls", f"L0{n}_walls_from_plan", y)
        levels.append({"id": f"L0{n}", "name": f"Floor {n}", "elevation_m": round(y, 3), "content": "typical floor (p15)"})
    y5 = stilt + 4 * ftf
    place(slab_geom, "slab", "L05_slab", y5)
    place(ghost_geom, "ghost", "L05_GHOST_plan_not_in_brochure", y5)
    levels.append({"id": "L05", "name": "Floor 5", "elevation_m": round(y5, 3),
                   "content": "ghost massing - plan not in brochure (4 BHK + 3 BHK)"})
    yt = stilt + 5 * ftf
    place(slab_geom, "slab", "L06_Terrace_slab", yt)
    place(parapet_geom, "parapet", "L06_Terrace_parapet", yt)
    levels.append({"id": "L06", "name": "Terrace", "elevation_m": round(yt, 3),
                   "content": "slab + parapet (amenity layout in brochure p13 is an illustration only)"})

    scene.metadata["extras"] = {"source": "SP Residency brochure 11-05-2026", "accuracy": "conceptual",
                                "assumed": ASSUMED}
    glb = out_dir / "SPR_building_conceptual.glb"
    glb.write_bytes(trimesh.exchange.gltf.export_glb(scene, include_normals=True))

    def region_m(rect):
        x0, y0, x1, y1 = rect
        return [round(x0 * m_per_px - origin[0], 3), round(y0 * m_per_px - origin[1], 3),
                round(x1 * m_per_px - origin[0], 3), round(y1 * m_per_px - origin[1], 3)]

    return {
        "file": glb.name,
        "footprint_m": [round(W, 2), round(D, 2)],
        "footprint_ft_derived": [round(W / FT, 1), round(D / FT, 1)],
        "typical_px_per_ft": px_per_ft,
        "floor_to_floor_m": round(ftf, 4), "stilt_floor_to_floor_m": round(stilt, 4),
        "slab_m": round(slab_t, 4), "wall_height_m": round(wall_h, 4),
        "height_to_terrace_m": round(yt, 3), "parapet_m": round(ASSUMED["parapet_height_ft"] * FT, 3),
        "levels": levels,
        "unit_regions_m": {k: [region_m(r) for r in v] for k, v in UNIT_REGIONS.items()},
        "core_region_m": region_m(CORE_REGION),
        "corridor_clear_width_ft_derived": round((331.3 - 278.3) / px_per_ft, 1),
        "wall_blocks_per_floor": len(wrects),
        "triangles_per_typical_floor": int(len(wall_geom.faces) + len(floor_geom.faces) + len(slab_geom.faces)),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", type=Path, default=Path("."))
    root = ap.parse_args().root.resolve()
    ref = root / "sp-residency" / "reference" / "floor-plans"
    out_dir = root / "sp-residency" / "3d" / "exports"
    out_dir.mkdir(parents=True, exist_ok=True)

    building = build_building(ref, out_dir)
    units = [build_unit(ref, k, out_dir) for k in UNITS]

    info = json.loads((root / "sp-residency" / "analysis" / "project-information.json").read_text())
    for u in units:
        src = info["units"][u["key"]]
        u.update({"sbu_sqft": src["super_built_up_area_sqft"], "balcony_sqft": src["exclusive_balcony_area_sqft"],
                  "facing": src["vastu"]["label"], "position": src["position_on_typical_floor"],
                  "rooms": [{"name": r["name"], "dims": r["dimensions_as_printed"]} for r in src["rooms"]]})

    report = {
        "model": "SP Residency (Shan Poornam Residence) - conceptual 3D model",
        "accuracy": "CONCEPTUAL - geometry extruded from brochure plan rasters; not for construction",
        "printed_inputs": {"floor_to_floor_ft": FLOOR_TO_FLOOR_FT, "unit_carpet_areas_sqft":
                           {k: v[1] for k, v in UNITS.items()}, "typical_hall_ft": "28'4\" x 11' (A, D, F)"},
        "assumed_parameters": ASSUMED,
        "method": [
            "Wall pixels = neutral dark grey in the brochure plan (max channel < 100, chroma < 16).",
            "Morphological opening removes room-label text; corridor inlay bands removed on the typical plan.",
            "Walls decomposed into axis-aligned blocks on a ~1 inch grid and extruded to slab-soffit height.",
            "Unit scale from printed carpet area; typical-floor scale from the printed hall sizes.",
            "Floor surfaces carry the brochure plan image (finishes and furniture as drawn).",
        ],
        "known_limitations": [
            "Brochure plans are not drawn exactly to scale: enclosed rooms deviate up to ~8% from printed sizes.",
            "Dark built-ins (kitchen counters, wardrobe hatching) extrude like walls.",
            "Door and window openings are shown as gaps; no doors, glazing or sills are modelled.",
            "Facades (louvres, frames, pylon) are not modelled - see the brochure renders.",
            "Stilt columns, terrace amenities and the 5th-floor plan are not in the brochure as drawings.",
        ],
        "building": building,
        "units": units,
    }
    (out_dir / "model-report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")

    pub = root / "public" / "models" / "sp-residency"
    pub.mkdir(parents=True, exist_ok=True)
    for f in out_dir.glob("*.glb"):
        shutil.copyfile(f, pub / f.name)
    (pub / "model.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")

    print(f"building: {building['footprint_ft_derived']} ft footprint, {building['wall_blocks_per_floor']} wall blocks/floor, "
          f"{building['triangles_per_typical_floor']} tris/floor")
    for u in units:
        print(f"unit {u['key']}: {u['px_per_ft']} px/ft, {u['size_m']} m, {u['wall_blocks']} blocks, "
              f"{u['triangles']} tris, checks {u['spot_checks']}")
    for f in sorted(out_dir.glob("*.glb")):
        print(f"  {f.name}: {f.stat().st_size / 1e6:.2f} MB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
