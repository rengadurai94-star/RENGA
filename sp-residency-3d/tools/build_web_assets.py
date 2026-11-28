"""
Build web-optimised copies of the ORIGINAL brochure images.

Nothing here alters content: images are only resized (never upscaled), re-encoded
as WebP, and - for plans - composited with the alpha mask that the brochure PDF
itself carries. Originals stay untouched in source-assets/extracted-originals/.

Usage (from the project folder):
    python3 -I tools/build_web_assets.py
Requires: Pillow (with WebP), poppler-utils (pdfimages, pdftoppm).
"""
import json
import os
import subprocess
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(ROOT, "source-assets", "brochure", "SPR-Brochure-11-05-2026.pdf")
SRC = os.path.join(ROOT, "source-assets", "extracted-originals")
PUB = os.path.join(ROOT, "public", "media")
GEOM_RAW = os.path.join(ROOT, "tools", "plan-geometry.raw.json")
GEOM_OUT = os.path.join(ROOT, "src", "data", "plan-geometry.json")

TYPICAL_ROI = (620, 85, 1250, 925)   # must match tools/trace_typical_floor.py

# (source file, output path, kind, brochure page)
PHOTOS = [
    ("img-004-002.jpg", "exterior/exterior-day", 4),
    ("img-026-040.jpg", "exterior/front-elevation-dusk", 26),
    ("img-011-006.jpg", "amenities/elegant-lobby", 11),
    ("img-011-007.jpg", "amenities/security-cabin", 11),
    ("img-011-009.jpg", "amenities/management-office", 11),
    ("img-011-008.jpg", "amenities/coworking-study-room", 11),
    ("img-012-011.jpg", "amenities/gym-cardio", 12),
    ("img-012-012.jpg", "amenities/gym-strength", 12),
    ("img-012-010.jpg", "amenities/rooftop-lounge", 12),
    ("img-024-037.jpg", "residences/bedroom", 24),
    ("img-024-035.jpg", "residences/balcony-sit-out", 24),
    ("img-024-036.jpg", "residences/typical-floor-corridor", 24),
    ("img-025-039.jpg", "residences/living-dining", 25),
    ("img-025-038.jpg", "residences/lounge-with-library", 25),
]

PLANS = [  # (image, smask, out, page)
    ("img-016-017.jpg", "img-016-018.png", "plans/unit-type-a", 16),
    ("img-016-019.jpg", "img-016-020.png", "plans/unit-type-b", 17),
    ("img-018-023.jpg", "img-018-024.png", "plans/unit-type-c", 18),
    ("img-018-025.jpg", "img-018-026.png", "plans/unit-type-d", 19),
    ("img-020-029.jpg", "img-020-030.png", "plans/unit-type-e", 20),
    ("img-020-031.jpg", "img-020-032.png", "plans/unit-type-f", 21),
    ("img-010-004.jpg", "img-010-005.jpg", "plans/stilt-floor-3d", 10),
    ("img-013-013.jpg", "img-013-014.jpg", "plans/terrace-floor-3d", 13),
]


def ensure_extracted():
    if os.path.exists(os.path.join(SRC, "img-004-002.jpg")):
        return
    os.makedirs(SRC, exist_ok=True)
    subprocess.run(["pdfimages", "-all", "-p", PDF, os.path.join(SRC, "img")], check=True)


def save_webp(im, out_base, widths, quality=82, lossless=False):
    manifest = {}
    for w in widths:
        if w >= im.width:
            w = im.width
        h = round(im.height * w / im.width)
        r = im if w == im.width else im.resize((w, h), Image.LANCZOS)
        path = f"{out_base}-{w}.webp"
        os.makedirs(os.path.dirname(path), exist_ok=True)
        r.save(path, "WEBP", quality=quality, method=6, lossless=lossless)
        manifest[w] = os.path.relpath(path, os.path.join(ROOT, "public")).replace(os.sep, "/")
        if w == im.width:
            break
    return manifest


def composite(img_path, mask_path):
    im = Image.open(img_path).convert("RGB")
    m = Image.open(mask_path).convert("L")
    if m.size != im.size:
        m = m.resize(im.size)
    rgba = im.copy()
    rgba.putalpha(m)
    return rgba


def main():
    ensure_extracted()
    report = {"photos": {}, "plans": {}}
    for src, out, page in PHOTOS:
        im = Image.open(os.path.join(SRC, src)).convert("RGB")
        files = save_webp(im, os.path.join(PUB, out), [960, 1920])
        report["photos"][out] = {"source": src, "page": page, "native": list(im.size), "files": files}
        print("photo", out, im.size)

    for src, mask, out, page in PLANS:
        rgba = composite(os.path.join(SRC, src), os.path.join(SRC, mask))
        bbox = rgba.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
        pad = 12
        bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad),
                min(rgba.width, bbox[2] + pad), min(rgba.height, bbox[3] + pad))
        rgba = rgba.crop(bbox)
        files = save_webp(rgba, os.path.join(PUB, out), [1200, 2400], quality=90)
        report["plans"][out] = {"source": src, "mask": mask, "page": page, "native": list(rgba.size), "files": files}
        print("plan", out, rgba.size)

    # typical floor plan: fixed crop so traced geometry lines up
    rgba = composite(os.path.join(SRC, "img-015-015.jpg"), os.path.join(SRC, "img-015-016.png"))
    crop = rgba.crop(TYPICAL_ROI)
    files = save_webp(crop, os.path.join(PUB, "plans/typical-floor"), [2000], quality=92)
    report["plans"]["plans/typical-floor"] = {"source": "img-015-015.jpg", "page": 15, "native": list(crop.size),
                                              "crop_in_source": TYPICAL_ROI, "files": files}
    print("typical", crop.size)

    # location map (vector page) - rasterise page 7 at 220 dpi
    tmp = os.path.join(SRC, "page-07")
    subprocess.run(["pdftoppm", "-r", "220", "-f", "7", "-l", "7", "-png", "-singlefile", PDF, tmp], check=True)
    im = Image.open(tmp + ".png").convert("RGB")
    files = save_webp(im, os.path.join(PUB, "location/location-map"), [1200, 2400], quality=88)
    report["photos"]["location/location-map"] = {"source": "page 7 (vector) rasterised at 220 dpi", "page": 7,
                                                 "native": list(im.size), "files": files}
    print("map", im.size)

    # geometry -> crop-local pixel coordinates
    g = json.load(open(GEOM_RAW))
    ox, oy = TYPICAL_ROI[0], TYPICAL_ROI[1]

    def sh(pts):
        return [[p[0] - ox, p[1] - oy] for p in pts]

    for r in g["regions"].values():
        r["polygon_px"] = sh(r["polygon_px"])
        r["holes_px"] = [sh(h) for h in r["holes_px"]]
    for lst in g["balconies"].values():
        for b in lst:
            x0, y0, x1, y1 = b["rect_px"]
            b["rect_px"] = [x0 - ox, y0 - oy, x1 - ox, y1 - oy]
    g["frames"] = {k: [[r[0] - ox, r[1] - oy, r[2] - ox, r[3] - oy] for r in v] for k, v in g["frames"].items()}
    bx0, by0, bx1, by1 = g["building_bbox_px"]
    g["building_bbox_px"] = [bx0 - ox, by0 - oy, bx1 - ox, by1 - oy]
    g["image"] = {"src": files_typical(report), "width": crop.width, "height": crop.height,
                  "crop_in_source_px": list(TYPICAL_ROI)}
    g["_about"] = g["_about"].replace("public/plans/typical-floor-plan.jpg (1772x997)",
                                      "public/media/plans/typical-floor-*.webp (crop of the 1772x997 source)")
    os.makedirs(os.path.dirname(GEOM_OUT), exist_ok=True)
    json.dump(g, open(GEOM_OUT, "w"), indent=1)
    json.dump(report, open(os.path.join(ROOT, "src", "data", "media-manifest.json"), "w"), indent=1)
    print("geometry ->", GEOM_OUT)


def files_typical(report):
    f = report["plans"]["plans/typical-floor"]["files"]
    return list(f.values())[0]


if __name__ == "__main__":
    sys.exit(main())
