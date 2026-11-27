#!/usr/bin/env python3
"""
SP Residency - website asset builder (Phase 8).

    python3 -I sp-residency/scripts/build_web_assets.py --root .

Reads sp-residency/reference/reference-map.json and writes website-ready WebP files to
public/images/sp-residency/<category>/ plus public/images/sp-residency/manifest.json.

* Never upscales: files keep their native resolution (capped at 2400 px on the long edge).
* Floor plans are composited with their PDF soft-mask -> transparent WebP, trimmed.
* Every asset is recorded with its brochure page, reference id, status (original|generated) and
  approval state (pending until the client signs off on usage rights).
* Generated images (once approved) are added with --generated, which reads
  sp-residency/prompts/generation-requests.json and picks up files present in sp-residency/generated/.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import tempfile
from datetime import date
from pathlib import Path

CREDIT = "Artist's impression - Shan Poornam Residence brochure, ENS Development / SKR Elite Properties"

# (id, reference id, output path under public/images/sp-residency, alt, caption, website usage)
WEB = [
    ("sp-exterior-day-3q", "R01", "exterior/sp-exterior-day-3q.webp",
     "Shan Poornam Residence in daylight: white-framed bays, copper-toned vertical louvres and the SP monogram pylon",
     "Three-quarter view from the street", ["project-hero", "project-intro", "home-projects-list"]),
    ("sp-front-elevation-night", "R04", "elevation/sp-front-elevation-night.webp",
     "Front elevation of Shan Poornam Residence at night, stilt plus five floors with rooftop garden",
     "Front elevation at blue hour", ["project-intro", "cinematic:06"]),
    ("sp-entrance-security-cabin", "R03", "entrance/sp-entrance-security-cabin.webp",
     "Illuminated security cabin with Shan Poornam Residence signage at the stilt parking entrance",
     "Arrival - the security cabin", ["cinematic:01"]),
    ("sp-entrance-frontage", "R34", "entrance/sp-entrance-frontage.webp",
     "Street frontage with security cabin, boom barrier and timber-look compound wall at dusk",
     "Street frontage", ["project-intro"]),
    ("sp-lobby", "R18", "lobby/sp-lobby.webp",
     "Private lobby with travertine-look panels, mustard and ivory bucket chairs and a woven rattan pendant",
     "The private lobby", ["cinematic:02"]),
    ("sp-lobby-library-lounge", "R19", "lobby/sp-lobby-library-lounge.webp",
     "Lobby lounge with charcoal leather sofas, a backlit walnut bookshelf and travertine-look wall panels",
     "Lobby lounge and library", ["amenities"]),
    ("sp-living-dining", "R14", "living/sp-living-dining.webp",
     "Apartment hall with fluted walnut TV wall, light grey sofa and the dining zone by a curtained window",
     "Living and dining hall", ["cinematic:03", "dining"]),
    ("sp-master-bedroom", "R16", "bedrooms/sp-master-bedroom.webp",
     "Bedroom with a tropical-leaf mural above walnut panelling, cream headboard and wide-plank walnut floor",
     "The bedroom", ["cinematic:04"]),
    ("sp-balcony", "R17", "balcony/sp-balcony.webp",
     "Balcony sit-out with two beige lounge chairs on brass frames, wall planters and a white baluster railing",
     "The balcony sit-out", ["cinematic:05"]),
    ("sp-corridor", "R25", "amenities/sp-corridor.webp",
     "Residential corridor with grey granite floor, black inlay bands and brass ring pendants",
     "Typical-floor corridor", ["amenities"]),
    ("sp-management-office", "R20", "amenities/sp-management-office.webp",
     "Management office with fluted grey wall panel, white desk and backlit walnut bookshelf",
     "Management office", ["amenities"]),
    ("sp-coworking", "R21", "amenities/sp-coworking.webp",
     "Co-working room with three workstations, light oak cabinets and black mesh chairs",
     "Co-working / study room", ["amenities"]),
    ("sp-gym-cardio", "R22", "amenities/sp-gym-cardio.webp",
     "Terrace gym cardio zone with ellipticals and treadmills along a sunlit glazed wall",
     "Gym - cardio", ["amenities"]),
    ("sp-gym-strength", "R23", "amenities/sp-gym-strength.webp",
     "Terrace gym strength zone with mural, benches and Swiss balls",
     "Gym - strength", ["amenities"]),
    ("sp-rooftop-lounge", "R24", "amenities/sp-rooftop-lounge.webp",
     "Rooftop lounge on a timber deck with BBQ counter, dining tables and tropical planters",
     "Rooftop lounge", ["amenities"]),
    ("sp-stilt-plan-3d", "R05", "amenities/sp-stilt-plan-3d.webp",
     "3D cut-away of the stilt floor showing parking, lobby block, playground and security cabin",
     "Stilt floor - parking and lobby amenities", ["floor-plans"]),
    ("sp-terrace-plan-3d", "R06", "amenities/sp-terrace-plan-3d.webp",
     "3D cut-away of the terrace with rooftop lounge, BBQ, gym and yoga lawn",
     "Terrace - wellness and leisure", ["floor-plans"]),
    ("sp-plan-typical", "R07", "floor-plans/sp-typical-floor-plan.webp",
     "Typical floor plan with units A to F around a central corridor", "Typical floor (1st-4th)", ["floor-plans"]),
    ("sp-plan-a", "R08", "floor-plans/sp-unit-a-3bhk.webp", "Unit Type A, 3 BHK floor plan", "Unit A - 3 BHK", ["floor-plans"]),
    ("sp-plan-b", "R09", "floor-plans/sp-unit-b-2bhk.webp", "Unit Type B, 2 BHK floor plan", "Unit B - 2 BHK", ["floor-plans"]),
    ("sp-plan-c", "R10", "floor-plans/sp-unit-c-2bhk.webp", "Unit Type C, 2 BHK floor plan", "Unit C - 2 BHK", ["floor-plans"]),
    ("sp-plan-d", "R11", "floor-plans/sp-unit-d-3bhk.webp", "Unit Type D, 3 BHK floor plan", "Unit D - 3 BHK", ["floor-plans"]),
    ("sp-plan-e", "R12", "floor-plans/sp-unit-e-2bhk.webp", "Unit Type E, 2 BHK floor plan", "Unit E - 2 BHK", ["floor-plans"]),
    ("sp-plan-f", "R13", "floor-plans/sp-unit-f-3bhk.webp", "Unit Type F, 3 BHK floor plan", "Unit F - 3 BHK", ["floor-plans"]),
    ("sp-location-map", "R28", "location/sp-location-map.webp",
     "Location map of Shan Poornam Residence in Visalakshipuram, Madurai, with 1-5 km rings",
     "Location map", ["location"]),
]

NOT_PUBLISHED = {
    "R02": "245 px dusk thumbnail - too small for web; lighting reference for EXT-04 only",
    "R15": "230 px dining crop - too small for web; the dining zone is shown in sp-living-dining",
    "R26": "Amenity icon sheet - rendered as live text on the page instead",
    "R27": "Distance table - rendered as live data on the page instead",
}

EMPTY_CATEGORIES = {
    "kitchen": "No kitchen render in the brochure (prompt KIT-00 blocked pending a design brief).",
    "pooja": "No pooja room anywhere in the brochure (POO-00 blocked).",
    "bathrooms": "No bathroom render in the brochure (BTH-00 blocked pending a design brief).",
    "dining": "No standalone dining render; the dining zone appears in living/sp-living-dining.webp.",
}

MAX_EDGE = 2400


def sh(*cmd: str) -> str:
    return subprocess.run(cmd, check=True, capture_output=True, text=True).stdout


def dims(p: Path) -> tuple[int, int]:
    w, h = sh("identify", "-format", "%w %h", f"{p}[0]").split()
    return int(w), int(h)


def badge_free_mask(mask: Path, out: Path) -> Path:
    """Hide the presentation badge ('TYPE A', 'FLOOR PLAN') baked into the bottom-right of each plan
    raster: any separate opaque component lying wholly in the bottom-right corner zone is masked out.
    The plan itself and the ENTRY marker are separate, larger / elsewhere components and are kept."""
    w, h = dims(mask)
    report = subprocess.run(
        ["convert", str(mask), "-threshold", "50%", "-define", "connected-components:verbose=true",
         "-define", "connected-components:area-threshold=50", "-connected-components", "8", "null:"],
        check=True, capture_output=True, text=True).stdout
    rects = []
    for line in report.splitlines()[1:]:
        m = re.match(r"\s*\d+: (\d+)x(\d+)\+(\d+)\+(\d+) \S+ (\d+) gray\(255\)", line)
        if not m:
            continue
        bw, bh, bx, by, area = map(int, m.groups())
        if bx >= 0.75 * w and by >= 0.80 * h and area < 0.05 * w * h:
            rects.append(f"rectangle {bx - 2},{by - 2} {bx + bw + 2},{by + bh + 2}")
    cmd = ["convert", str(mask), "-fill", "black"]
    for rect in rects:
        cmd += ["-draw", rect]
    sh(*cmd, str(out))
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", type=Path, default=Path("."))
    ap.add_argument("--generated", action="store_true", help="also publish approved generated images")
    args = ap.parse_args()
    root = args.root.resolve()
    sp = root / "sp-residency"
    pub = root / "public" / "images" / "sp-residency"
    refmap = json.loads((sp / "reference" / "reference-map.json").read_text())
    refs = {r["id"]: r for r in refmap["references"]}

    assets = []
    for aid, rid, rel, alt, caption, usage in WEB:
        r = refs[rid]
        src = sp / r["file"]
        dst = pub / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        resize = ["-resize", f"{MAX_EDGE}x{MAX_EDGE}>"]
        if "alpha_mask_file" in r:  # floor plan: apply PDF soft mask, trim, keep transparency
            with tempfile.TemporaryDirectory() as td:
                mask = badge_free_mask(sp / r["alpha_mask_file"], Path(td) / "mask.png")
                sh("convert", str(src), str(mask), "-alpha", "off", "-compose", "CopyOpacity", "-composite",
                   "-trim", "+repage", *resize, "-quality", "90", "-define", "webp:alpha-quality=100", str(dst))
            processing = ("Soft-mask applied for transparency (corner 'TYPE'/'FLOOR PLAN' badge masked out), "
                          "trimmed, WebP q90 - plan content unchanged")
        else:
            sh("convert", str(src), "-strip", *resize, "-quality", "82", "-define", "webp:method=6", str(dst))
            processing = "Converted to WebP q82" + (" and downscaled" if max(dims(src)) > MAX_EDGE else "") + \
                         " - no content change"
        w, h = dims(dst)
        asset = {
            "id": aid,
            "filename": rel,
            "src": f"/images/sp-residency/{rel}",
            "category": rel.split("/")[0],
            "sourceBrochurePages": r["source_pages"],
            "referenceId": rid,
            "referenceFile": f"sp-residency/{r['file']}",
            "status": "original",
            "processing": processing,
            "approval": "pending",
            "width": w,
            "height": h,
            "bytes": dst.stat().st_size,
            "alt": alt,
            "caption": caption,
            "credit": CREDIT,
            "websiteUsage": usage,
        }
        if w < 1200 and "floor-plans" not in rel:
            asset["resolutionNote"] = (f"Native {w}px wide - shown framed, not full-bleed. Tier-0 upscale or the "
                                       f"matching enhancement prompt is recommended.")
        assets.append(asset)

    generated = []
    if root.joinpath("sp-residency/prompts/generation-requests.json").exists():
        pack = json.loads((sp / "prompts" / "generation-requests.json").read_text())
        for req in pack["requests"]:
            raw = req["output"]["raw"]
            target = req["output"]["website"]
            present = bool(raw) and (sp / raw).exists()
            entry = {"promptId": req["id"], "title": req["title"], "category": req["category"],
                     "status": "generated" if present else "not-generated", "approval": "pending",
                     "risk": req["risk"], "plannedFile": target.replace("public/images/sp-residency/", "")
                     if target else None}
            if present and target and args.generated:
                dst = root / target
                dst.parent.mkdir(parents=True, exist_ok=True)
                sh("convert", str(sp / raw), "-strip", "-resize", f"{MAX_EDGE}x{MAX_EDGE}>", "-quality", "82",
                   str(dst))
                entry["published"] = True
            generated.append(entry)

    for cat, why in EMPTY_CATEGORIES.items():
        d = pub / cat
        d.mkdir(parents=True, exist_ok=True)
        if not any(p for p in d.iterdir() if p.name != ".gitkeep"):
            (d / ".gitkeep").write_text("")

    manifest = {
        "project": "Shan Poornam Residence (SP Residency)",
        "location": "Visalakshipuram, Madurai",
        "builtOn": str(date.today()),
        "builtBy": "sp-residency/scripts/build_web_assets.py",
        "statusLegend": {"original": "Brochure render, format-converted only",
                         "generated": "AI-enhanced from a brochure reference (see sp-residency/prompts)"},
        "approvalLegend": {"pending": "Awaiting client sign-off and developer usage permission",
                           "approved": "Cleared for publication", "rejected": "Do not publish"},
        "usageNote": "All images are artists' impressions owned by the developer (ENS Development / SKR Elite "
                     "Properties). Obtain written permission before going live.",
        "assets": assets,
        "emptyCategories": EMPTY_CATEGORIES,
        "notPublished": NOT_PUBLISHED,
        "plannedGeneratedAssets": generated,
    }
    (pub / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    total = sum(a["bytes"] for a in assets)
    print(f"{len(assets)} web assets, {total/1e6:.1f} MB -> {pub}")
    for a in assets:
        print(f"  {a['filename']:<48} {a['width']}x{a['height']}  {a['bytes']//1024} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
