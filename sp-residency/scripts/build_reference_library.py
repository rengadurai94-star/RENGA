#!/usr/bin/env python3
"""
SP Residency (Shan Poornam Residence) - brochure reference-library builder.

Phase 2 of the SP Residency visual workflow. Re-runnable and deterministic:

    python3 -I sp-residency/scripts/build_reference_library.py \
        --pdf sp-residency/source/SPR-Brochure-11-05-2026.pdf \
        --out sp-residency

What it does
  1. Extracts every embedded raster from the PDF at its ORIGINAL resolution
     with `pdfimages -all -p` (no re-encoding of JPEG streams).
  2. Renders every brochure page (110 dpi JPEG) for page-level reference, plus
     200 dpi renders of the vector-only pages (location, specs, plans).
  3. Copies each SP Residency image into its category folder under
     reference/<category>/ with a descriptive filename. Floor-plan rasters
     keep their original JPEG plus their soft-mask (alpha) PNG beside them.
  4. Writes reference/reference-map.json and reference/reference-map.md.

Requires: poppler-utils (pdfimages, pdftoppm), ImageMagick (convert).
Nothing here generates or alters image content: files are byte-identical
copies of the embedded originals, page renders, or plainly-labelled crops.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

# ---------------------------------------------------------------------------
# Reference table: every SP Residency image found in the brochure.
#   raw      -> pdfimages output name (img-<page>-<index>) of the original
#   mask     -> its soft-mask raster, when the mask carries real transparency
#   pages    -> every brochure page the same PDF object appears on
# ---------------------------------------------------------------------------
REFERENCES: list[dict] = [
    # ---------------------------------------------------------------- exterior
    dict(
        id="R01", category="exterior", raw="img-004-002.jpg", pages=[4], pdf_object=30,
        filename="p04-exterior-day-three-quarter-perspective.jpg",
        feature="Main building - front (road-facing, south per p15 north arrow) facade + side facade (inferred west), "
                "three-quarter view, daylight",
        details=(
            "Stilt + 5 residential floors. White projecting 'picture-frame' bay boxes (5 stacked) with "
            "wood-tone soffits; full-height warm copper/teak-tone vertical louvre fins; warm-grey painted walls; "
            "sandstone/travertine-look vertical pylon carrying the teal 'SP' sun monogram at the parapet; "
            "MS vertical-bar balcony handrails; white UPVC windows; cascading planters at mid-floor ledges; "
            "rubble-stone compound wall (left) and timber-look panel compound wall/gates; mature trees."
        ),
    ),
    dict(
        id="R02", category="exterior", raw="img-028-047.jpg", pages=[28], pdf_object=324,
        filename="p28-exterior-dusk-three-quarter-thumbnail.jpg",
        feature="Same three-quarter viewpoint as R01 at dusk (portfolio thumbnail on the developer page)",
        details=(
            "Only 245x207 px - usable as a lighting/time-of-day reference only, not as a geometry source. "
            "Shows warm interior glow, purple-pink dusk sky, road in foreground, white neighbouring bungalow."
        ),
    ),
    dict(
        id="R03", category="exterior", raw="img-011-007.jpg", pages=[11], pdf_object=87,
        filename="p11-entrance-security-cabin-night.jpg",
        feature="Building entrance - security cabin at the stilt-level vehicle entry (night)",
        details=(
            "Glazed cabin with dark fascia carrying illuminated teal 'Shan Poornam Residence by ENS' lettering; "
            "timber-slat cladding at base; stilt parking beyond with black/yellow hazard-striped columns and "
            "red fire-sprinkler mains on a dark soffit; white bay frames, copper louvres and trailing planters above."
        ),
    ),
    # --------------------------------------------------------------- elevation
    dict(
        id="R04", category="elevation", raw="img-026-040.jpg", pages=[26, 27], pdf_object=473,
        filename="p26-front-elevation-night.jpg",
        feature="Front (south, road-facing) elevation - orthographic-style view at night",
        details=(
            "Reads as stilt + 5 floors + terrace with rooftop trees and a tall sign mast at the centre-top. "
            "Left: white-framed bay stack; two large copper/teak-tone vertical louvre fields; centre: recessed "
            "open slot (south end of the central corridor) with planters/trees at every level; right: balcony "
            "stacks, white frames, cascading planters. Ground: timber-look compound wall with boom barriers "
            "at both ends of the frontage, illuminated security cabin + signage, stilt parking."
        ),
    ),
    dict(
        id="R34", category="elevation", derived_from="R04", raw="img-026-040.jpg", pages=[26], pdf_object=473,
        filename="p26-entrance-frontage-crop.jpg", crop="1400x600+1100+950",
        feature="Entrance frontage - DERIVED CROP of R04 (security cabin, signage, gate, stilt, lower floors)",
        details=(
            "Right-hand ground frontage of the night elevation: illuminated security cabin with teal signage, "
            "timber-look compound wall, boom barrier, stilt parking entry with hazard-striped columns, the "
            "lowest residential floors above. Used as the frontage reference for entrance views."
        ),
    ),
    # ------------------------------------------------------------- floor plans
    dict(
        id="R05", category="floor-plans", raw="img-010-004.jpg", pages=[10], pdf_object=81,
        filename="p10-stilt-floor-plan-3d.jpg", page_render=10,
        feature="Stilt (ground) floor plan - 3D cut-away, keyed 1-9",
        details=(
            "1 Private Lobby, 2 Management Office, 3 Co-working/Study, 4 Library, 5 Playground, 6 Garden, "
            "7 Centralised Gasline, 8 Security Cabin, 9 Utilities Area. Two-way central drive aisle, perimeter "
            "parking bays (yellow-lined), perimeter landscape strips, two vehicle openings on the south "
            "frontage (security cabin at the south-east opening). Car count drawn is illustrative only."
        ),
    ),
    dict(
        id="R06", category="floor-plans", raw="img-013-013.jpg", pages=[13], pdf_object=102,
        filename="p13-terrace-floor-plan-3d.jpg", page_render=13,
        feature="Terrace floor plan - 3D cut-away, keyed 10-16",
        details=(
            "10 Games Corner, 11 Gym (enclosed, glazed), 12 BBQ Area, 13 Rooftop Lounge (timber deck), "
            "14 Outdoor Lounge, 15 Terrace Garden, 16 Outdoor Yoga Lawn (artificial turf, loungers). "
            "Stone-tile feature wall behind BBQ; open light-well over the central corridor; stair/lift heads."
        ),
    ),
    dict(
        id="R07", category="floor-plans", raw="img-015-015.jpg", mask="img-015-016.png", pages=[15], pdf_object=120,
        filename="p15-typical-floor-plan.jpg", page_render=15,
        feature="Typical floor plan (floors 1-4) - units A-F around a central N-S corridor",
        details=(
            "West row N->S: C (2BHK), B (2BHK), staircase + lift, A (3BHK). East row N->S: D (3BHK), "
            "E (2BHK), F (3BHK). Landscaped courts at both ends of the corridor. Road along the south edge. "
            "North arrow points up the page."
        ),
    ),
    dict(
        id="R08", category="floor-plans", raw="img-016-017.jpg", mask="img-016-018.png", pages=[16], pdf_object=136,
        filename="p16-unit-type-a-3bhk.jpg", page_render=16,
        feature="Unit Type A - 3 BHK - 1500 sq.ft carpet - east-facing flat entry",
        details="Room dimensions and areas: see analysis/project-information.json units.A.",
    ),
    dict(
        id="R09", category="floor-plans", raw="img-017-021.jpg", mask="img-017-022.png", pages=[16, 17], pdf_object=467,
        filename="p17-unit-type-b-2bhk.jpg", page_render=17,
        feature="Unit Type B - 2 BHK - 957 sq.ft carpet - east-facing flat entry",
        details="Room dimensions and areas: see analysis/project-information.json units.B.",
    ),
    dict(
        id="R10", category="floor-plans", raw="img-018-023.jpg", mask="img-018-024.png", pages=[18], pdf_object=166,
        filename="p18-unit-type-c-2bhk.jpg", page_render=18,
        feature="Unit Type C - 2 BHK - 1003 sq.ft carpet - east-facing flat entry",
        details="Room dimensions and areas: see analysis/project-information.json units.C.",
    ),
    dict(
        id="R11", category="floor-plans", raw="img-019-027.jpg", mask="img-019-028.png", pages=[18, 19], pdf_object=469,
        filename="p19-unit-type-d-3bhk.jpg", page_render=19,
        feature="Unit Type D - 3 BHK - 1472 sq.ft carpet - west-facing flat entry",
        details="Room dimensions and areas: see analysis/project-information.json units.D.",
    ),
    dict(
        id="R12", category="floor-plans", raw="img-020-029.jpg", mask="img-020-030.png", pages=[20], pdf_object=196,
        filename="p20-unit-type-e-2bhk.jpg", page_render=20,
        feature="Unit Type E - 2 BHK - 846 sq.ft carpet - west-facing flat entry",
        details="Room dimensions and areas: see analysis/project-information.json units.E.",
    ),
    dict(
        id="R13", category="floor-plans", raw="img-021-033.jpg", mask="img-021-034.png", pages=[20, 21], pdf_object=472,
        filename="p21-unit-type-f-3bhk.jpg", page_render=21,
        feature="Unit Type F - 3 BHK - 1486 sq.ft carpet - west-facing flat entry",
        details="Room dimensions and areas: see analysis/project-information.json units.F.",
    ),
    # ---------------------------------------------------------------- interiors
    dict(
        id="R14", category="living-room", raw="img-025-039.jpg", pages=[25], pdf_object=231,
        filename="p25-living-dining-hall-view.jpg",
        feature="Apartment hall - living zone in foreground, dining zone + window at far end",
        details=(
            "Long linear hall (matches the 28'4\" x 11' halls of Types A/D/F). Left wall: large-format "
            "travertine-look vertical panels with dark-walnut framed openings; right: TV wall in vertical "
            "dark-walnut fluting with wall-hung TV, black-metal floor-to-ceiling rod shelving with backlit "
            "shelves and brass decor, floating walnut console with smoked fluted-glass shutters. White ceiling, "
            "recessed downlights, two white 3-blade ceiling fans, walnut-clad bulkhead dividing living/dining, "
            "split AC over the window. Light-grey sofa with grey/brown cushions, grey tub armchair, jute "
            "flat-weave rug, white hydrangea centrepiece. Light beige polished large-format floor tiles. "
            "White sheers + taupe drapes. Dark-walnut doors and frames."
        ),
    ),
    dict(
        id="R15", category="dining", derived_from="R14", raw="img-025-039.jpg", pages=[25], pdf_object=231,
        filename="p25-dining-zone-crop.jpg", crop="230x230+270+90",
        feature="Dining zone - DERIVED CROP of R14 (no standalone dining render exists in the brochure)",
        details=(
            "Oval/round glass-top dining table with taupe upholstered shell chairs on dark legs and a "
            "dried-flower centrepiece, beneath the walnut bulkhead; full-height window with white sheers and "
            "taupe drapes opening to a balcony with white vertical balusters; split AC and white ceiling fan "
            "above. Low resolution (230 px) - detail reference only. "
            "Floor plans show 6-seat rectangular tables (A/B/C/D/F) and a 4-seat round table (E)."
        ),
    ),
    dict(
        id="R16", category="master-bedroom", raw="img-024-037.jpg", pages=[24], pdf_object=225,
        filename="p24-bedroom-tropical-leaf-feature-wall.jpg",
        feature="Bedroom - the only bedroom render in the brochure (treated as master bedroom; brochure does not label it)",
        details=(
            "Bed wall wraps the corner: dark-walnut panelling to dado height, above it four walnut-framed "
            "panels of an illustrated tropical-leaf mural (beige/ochre/brown, one leopard-spotted leaf) with "
            "concealed cove light; cream upholstered headboard, taupe bedding, rust cushions; walnut bedside "
            "units with brass-base lamps (white shades); dark wide-plank walnut-look floor; grey/ivory "
            "textured rug; tan leather lounge chair with throw by the window; walnut box niches on the left "
            "wall; white sheers + taupe drapes; white 3-blade ceiling fan; recessed downlights."
        ),
    ),
    dict(
        id="R17", category="balcony", raw="img-024-035.jpg", pages=[24], pdf_object=223,
        filename="p24-balcony-sit-out.jpg",
        feature="Balcony / sit-out - extracted original is wider than the crop printed on page 24",
        details=(
            "Honey-toned wood-look floor tiles; travertine-look wall cladding both sides; sculptural "
            "face-mask wall art; wall-mounted wood-tone planter boxes with trailing greens; two beige "
            "upholstered lounge chairs on slim brass frames with mustard cushions; round fluted pedestal side "
            "table; white MS vertical-baluster handrail with flat top rail; charcoal soffit; view to a "
            "neighbouring building and trees."
        ),
    ),
    # -------------------------------------------------------- amenities/common
    dict(
        id="R18", category="amenities", raw="img-011-006.jpg", pages=[11], pdf_object=86,
        filename="p11-private-lobby.jpg",
        feature="Private lobby (stilt level, key 1)",
        details=(
            "Exposed soffit with red sprinkler mains and services; travertine-look wall panels; lift door in "
            "grey/SS; timber restroom door; mustard and ivory bucket chairs on wire legs, walnut coffee table, "
            "walnut console with plants; woven rattan pendant; horizontal-stripe frosted glass partition; "
            "walnut floor zone meeting polished white large-format tiles."
        ),
    ),
    dict(
        id="R19", category="amenities", raw="img-025-038.jpg", pages=[25], pdf_object=230,
        filename="p25-lobby-library-lounge.jpg",
        feature="Lobby lounge / library (stilt level) - UNCAPTIONED in the brochure; identified by shared materials with R18",
        details=(
            "Exposed grey soffit with cassette AC; charcoal leather sofas and armchair; walnut floor with LED "
            "edge stepping down to a polished white tile walkway; backlit walnut + black-metal bookshelf "
            "(likely the Library, key 4); rattan-detailed side cabinets; woven pendant; striped frosted glass; "
            "tall travertine-look panels with shadow gaps."
        ),
    ),
    dict(
        id="R20", category="amenities", raw="img-011-009.jpg", pages=[11], pdf_object=89,
        filename="p11-management-office.jpg",
        feature="Management office (stilt level, key 2)",
        details=(
            "Light-grey fluted wall panel with framed botanical sketch; white desk with all-in-one computer; "
            "two black mesh task chairs; full-height walnut bookshelf with backlit shelves; striped frosted "
            "glass partition; timber door with long brass pull; white large-format floor tiles."
        ),
    ),
    dict(
        id="R21", category="amenities", raw="img-011-008.jpg", pages=[11], pdf_object=88,
        filename="p11-coworking-study-room.jpg",
        feature="Co-working / study room (stilt level, key 3)",
        details=(
            "Three workstations on a white worktop, light-oak overhead cabinets and pedestal drawers, black "
            "mesh chairs, monitors, travertine-look wall tiles, striped frosted glazing, window at left."
        ),
    ),
    dict(
        id="R22", category="amenities", raw="img-012-011.jpg", pages=[12], pdf_object=95,
        filename="p12-gym-cardio-zone.jpg",
        feature="Gym - cardio zone (terrace, key 11)",
        details=(
            "Light wood-look floor; grey walls; crossing linear LED strips + recessed spots on the ceiling; "
            "ellipticals and treadmills along a glazed wall with horizontal blinds and planting outside; "
            "glass door to the terrace."
        ),
    ),
    dict(
        id="R23", category="amenities", raw="img-012-012.jpg", pages=[12], pdf_object=96,
        filename="p12-gym-strength-zone.jpg",
        feature="Gym - strength zone (terrace, key 11)",
        details=(
            "Same shell as R22; large bodybuilder wall mural; multi-station machine, benches with orange "
            "upholstery, dumbbell rack, yellow/grey Swiss balls."
        ),
    ),
    dict(
        id="R24", category="amenities", raw="img-012-010.jpg", pages=[12], pdf_object=94,
        filename="p12-rooftop-lounge.jpg",
        feature="Rooftop lounge + BBQ + games corner (terrace, keys 10/12/13)",
        details=(
            "Covered timber deck under a dark soffit with downlights; slate/sandstone tile feature wall with "
            "wall clock; BBQ counter with tan leather bar stools; carved walnut cabinet; two dining tables with "
            "ivory shell chairs and flowers; foosball table; glazed gym beyond; stone wall with ENS logo; "
            "tropical planters; pallet-style timber benches."
        ),
    ),
    dict(
        id="R25", category="amenities", raw="img-024-036.jpg", pages=[24], pdf_object=224,
        filename="p24-typical-floor-corridor.jpg",
        feature="Typical-floor common corridor (matches central corridor of the typical plan)",
        details=(
            "Grey speckled granite floor with two black-granite inlay bands; black skirting; cream walls; "
            "dark-walnut doors/frames with brass number plates; white wall-mounted cabinets beside doors; "
            "raised false-ceiling tray with perimeter cove light, brass ring pendants and downlights; window "
            "to greenery at the far end."
        ),
    ),
]

# Page renders filed into categories (vector-only content: maps, tables, legends)
PAGE_RENDERS: list[dict] = [
    dict(id="R26", category="amenities", page=9, dpi=150, filename="p09-amenities-list-21.jpg",
         feature="Amenities icon sheet - 21 amenities in 4 groups",
         details="Private comfort/safety & security (5), Lifestyle (4), Outdoor living (6), Infrastructure (6)."),
    dict(id="R27", category="location", page=6, dpi=200, filename="p06-location-distances.jpg",
         feature="Strategically located - distance/time table",
         details="Education, healthcare, shopping, hotels, leisure, landmarks, connectivity with km + minutes."),
    dict(id="R28", category="location", page=7, dpi=200, filename="p07-location-map.jpg",
         feature="Location map - 1-5 km rings around the site",
         details="Schools, colleges, hospitals, landmarks, bus stand, railway station, airport (diagrammatic map)."),
    dict(id="R29", category="location", page=5, dpi=150, filename="p05-why-shan-poornam-residence.jpg",
         feature="Project facts page - 26 homes, unit mix, 85% carpet efficiency, strategic location",
         details="4 BHK x1, 3 BHK x13, 2 BHK x12; 3 BHK from 1472 sq.ft carpet."),
    dict(id="R30", category="branding", page=1, dpi=150, filename="p01-cover-logo.jpg",
         feature="Cover - Shan Poornam Residence by ENS wordmark",
         details="Teal sun/moon wordmark on deep navy with vertical-bar motif. Developer trademark - reference only."),
    dict(id="R31", category="branding", page=3, dpi=150, filename="p03-foundational-vision-monogram.jpg",
         feature="Foundational vision - SP sun monogram, meaning of Shan (five elements) and Poornam (completeness)",
         details="Brand story source text. Developer trademark - reference only."),
    dict(id="R32", category="specifications", page=22, dpi=150, filename="p22-specifications-1.jpg",
         feature="Specifications 1-6: structure, walls, ceiling, floors, kitchen & dining, bathrooms",
         details="Primary material source for kitchen/bathroom prompts (no kitchen or bathroom renders exist)."),
    dict(id="R33", category="specifications", page=23, dpi=150, filename="p23-specifications-2.jpg",
         feature="Specifications 7-10: joinery, electrical, sit-out, common amenities",
         details="Door sizes/finishes, windows, lift, corridor and staircase finishes, security."),
]

# Developer-portfolio imagery: NOT SP Residency. Archived separately so it is never mistaken for it.
EXCLUDED = [
    ("img-028-043.jpg", 28, "ENS CLQ, Penang (labour quarters) - portfolio thumbnail"),
    ("img-028-044.jpg", 28, "Crown, Penang - portfolio thumbnail"),
    ("img-028-045.jpg", 28, "Buddhist Temple and Association, Penang - portfolio thumbnail"),
    ("img-028-046.jpg", 28, "Warehousing, Malaysia - portfolio thumbnail"),
    ("img-028-048.jpg", 28, "Radisson RAK, UAE - portfolio thumbnail"),
    ("img-029-068.jpg", 29, "Penang Exchange - portfolio thumbnail"),
    ("img-029-069.jpg", 29, "Batu Uban City Centre - portfolio thumbnail"),
    ("img-029-070.jpg", 29, "The Gardens, Penang - portfolio thumbnail"),
    ("img-030-080.jpg", 30, "Crown Penang - bedroom"),
    ("img-030-081.jpg", 30, "Crown Penang - living/kitchen"),
    ("img-030-082.jpg", 30, "Crown Penang - lobby"),
    ("img-030-083.jpg", 30, "Crown Penang - podium exterior"),
    ("img-030-084.jpg", 30, "Crown Penang - rooftop pool"),
    ("img-030-085.jpg", 30, "Crown Penang - tower exterior"),
    ("img-031-086.jpg", 31, "Radisson RAK - bedroom"),
    ("img-031-087.jpg", 31, "Radisson RAK - lounge"),
    ("img-031-088.jpg", 31, "Radisson RAK - podium courtyard"),
    ("img-031-089.jpg", 31, "Radisson RAK - restaurant"),
    ("img-031-090.jpg", 31, "Radisson RAK - pool deck"),
    ("img-031-091.jpg", 31, "Radisson RAK - aerial"),
    ("img-032-092.jpg", 32, "Shri Meenakshi Fan House, Bypass, Madurai"),
    ("img-032-093.jpg", 32, "Mount Litera Zee School, Sivagangai"),
    ("img-032-094.jpg", 32, "Zudio, Madurai"),
    ("img-032-095.jpg", 32, "The Lifestyle, Madurai"),
    ("img-032-096.jpg", 32, "Jewel One, Madurai"),
    ("img-032-097.jpg", 32, "Poonguzhali Jewellers, Madurai"),
    ("img-032-099.jpg", 32, "RR Complex, Madurai"),
    ("img-032-100.jpg", 32, "Shri Meenakshi Fan House, Dindigul"),
    ("img-033-101.jpg", 33, "AGAM by Venka Service Apartments, Madurai (upcoming)"),
    ("img-033-102.jpg", 33, "Residential Apartments, Surya Nagar, Madurai (upcoming)"),
    ("img-033-103.jpg", 33, "Integrated Township, Oomachikulam, Madurai (upcoming)"),
]

# Categories the brief asks for that have NO dedicated render in the brochure.
MISSING = {
    "kitchen": (
        "No kitchen render exists in the brochure. Available evidence only: unit plans (L/U-shaped "
        "counters, hob, sink, fridge position; kitchen sizes per unit) and the specification page "
        "(concrete-slab counter finished in granite, premium single-bowl sink, Kohler faucet, 4'x2' glazed "
        "vitrified wall tiles, chimney/hob/purifier/washing-machine points, metered piped gas in SS 306). "
        "See ../specifications/p22-specifications-1.jpg and ../floor-plans/."
    ),
    "pooja": (
        "No pooja room, pooja unit or pooja niche is shown, labelled or specified anywhere in the 36-page "
        "brochure. Nothing may be generated for this category without a design brief from the client."
    ),
    "bathrooms": (
        "No bathroom render exists in the brochure. Available evidence only: unit plans (all bathrooms "
        "4'6\" x 8', WC + basin + shower zones) and the specification page (Kohler sanitary and CP "
        "fittings, Kajaria 4'x2' glazed vitrified wall tiles, 2'x2' floor tiles, toughened-glass shower "
        "partition, geyser points)."
    ),
    "bedrooms": (
        "Only ONE bedroom render exists (filed under ../master-bedroom/). No secondary/kids bedroom design "
        "is shown. Secondary bedrooms are documented only by plan dimensions and the floor spec "
        "(wooden glazed vitrified tiles 48\" x 8')."
    ),
}


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def sha1(path: Path) -> str:
    return hashlib.sha1(path.read_bytes()).hexdigest()[:12]


def dims(path: Path) -> tuple[int, int]:
    out = subprocess.run(["identify", "-format", "%w %h", f"{path}[0]"], check=True,
                         capture_output=True, text=True).stdout.split()
    return int(out[0]), int(out[1])


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path, help="sp-residency/ folder")
    args = ap.parse_args()

    pdf: Path = args.pdf.resolve()
    out: Path = args.out.resolve()
    ref = out / "reference"
    ref.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmpd:
        tmp = Path(tmpd)
        raw = tmp / "raw"
        raw.mkdir()
        run(["pdfimages", "-all", "-p", str(pdf), str(raw / "img")])

        # 1. page renders (whole brochure)
        pages_dir = ref / "brochure-pages"
        pages_dir.mkdir(exist_ok=True)
        run(["pdftoppm", "-r", "110", "-jpeg", "-jpegopt", "quality=82", str(pdf), str(pages_dir / "page")])

        entries: list[dict] = []

        # 2. embedded originals
        for r in REFERENCES:
            cat_dir = ref / r["category"]
            cat_dir.mkdir(exist_ok=True)
            src = raw / r["raw"]
            dst = cat_dir / r["filename"]
            if "crop" in r:
                run(["convert", str(src), "-crop", r["crop"], "+repage", "-quality", "92", str(dst)])
                kind = "derived-crop"
            else:
                shutil.copyfile(src, dst)
                kind = "embedded-original"
            entry = {
                "id": r["id"],
                "category": r["category"],
                "file": str(dst.relative_to(out)),
                "kind": kind,
                "source_pages": r["pages"],
                "pdf_object_id": r["pdf_object"],
                "pdfimages_name": r["raw"],
                "width": dims(dst)[0],
                "height": dims(dst)[1],
                "sha1": sha1(dst),
                "feature": r["feature"],
                "design_details": r["details"],
                "is_sp_residency": True,
            }
            if "derived_from" in r:
                entry["derived_from"] = r["derived_from"]
                entry["crop_geometry"] = r["crop"]
            if "mask" in r:
                mdst = cat_dir / (dst.stem + "_alpha-mask.png")
                shutil.copyfile(raw / r["mask"], mdst)
                entry["alpha_mask_file"] = str(mdst.relative_to(out))
            if "page_render" in r:
                pr = cat_dir / (dst.stem + "_page-annotated.jpg")
                prefix = tmp / f"pr{r['page_render']}"
                run(["pdftoppm", "-r", "200", "-jpeg", "-jpegopt", "quality=85",
                     "-f", str(r["page_render"]), "-l", str(r["page_render"]), "-singlefile",
                     str(pdf), str(prefix)])
                shutil.move(str(prefix) + ".jpg", pr)
                entry["annotated_page_render"] = str(pr.relative_to(out))
            entries.append(entry)

        # 3. page renders filed by category
        for r in PAGE_RENDERS:
            cat_dir = ref / r["category"]
            cat_dir.mkdir(exist_ok=True)
            prefix = tmp / f"pg{r['page']}"
            run(["pdftoppm", "-r", str(r["dpi"]), "-jpeg", "-jpegopt", "quality=85",
                 "-f", str(r["page"]), "-l", str(r["page"]), "-singlefile", str(pdf), str(prefix)])
            dst = cat_dir / r["filename"]
            shutil.move(str(prefix) + ".jpg", dst)
            w, h = dims(dst)
            entries.append({
                "id": r["id"], "category": r["category"], "file": str(dst.relative_to(out)),
                "kind": f"page-render-{r['dpi']}dpi", "source_pages": [r["page"]],
                "width": w, "height": h, "sha1": sha1(dst),
                "feature": r["feature"], "design_details": r["details"], "is_sp_residency": True,
            })

        # 4. excluded developer-portfolio images
        exc_dir = ref / "_excluded-other-developer-projects"
        exc_dir.mkdir(exist_ok=True)
        excluded = []
        for name, page, desc in EXCLUDED:
            dst = exc_dir / f"p{page:02d}-{name.replace('img-', '').replace('.jpg', '')}.jpg"
            shutil.copyfile(raw / name, dst)
            excluded.append({"file": str(dst.relative_to(out)), "source_page": page,
                             "description": desc, "is_sp_residency": False})
        (exc_dir / "README.md").write_text(
            "# NOT SP Residency\n\nThese images come from brochure pages 28-33 (ENS / SKR portfolio). They show "
            "OTHER projects (Crown Penang, Radisson RAK, Madurai commercial work, upcoming projects).\n\n"
            "They are archived only so the extraction is complete. **Never use them as SP Residency "
            "references, prompts, or website imagery.**\n")

        # 5. explain empty categories
        for cat, text in MISSING.items():
            d = ref / cat
            d.mkdir(exist_ok=True)
            (d / "README.md").write_text(f"# {cat}: no brochure reference\n\n{text}\n")

    category_order = ["exterior", "elevation", "floor-plans", "living-room", "dining", "kitchen",
                      "master-bedroom", "bedrooms", "pooja", "bathrooms", "balcony", "amenities",
                      "location", "branding", "specifications"]
    mapping = {
        "project": "Shan Poornam Residence (SP Residence / SP Residency) by ENS",
        "source_pdf": "source/SPR-Brochure-11-05-2026.pdf",
        "source_pdf_pages": 36,
        "generated_by": "scripts/build_reference_library.py",
        "references": entries,
        "missing_categories": MISSING,
        "excluded_not_sp_residency": excluded,
        "brochure_pages_dir": "reference/brochure-pages",
    }
    (ref / "reference-map.json").write_text(json.dumps(mapping, indent=2, ensure_ascii=False) + "\n")

    # human-readable map
    lines = ["# SP Residency - reference map", "",
             "Generated by `scripts/build_reference_library.py` from the 36-page brochure "
             "(`source/SPR-Brochure-11-05-2026.pdf`). Every file below is either a byte-identical copy of "
             "an image embedded in the PDF, a page render, or a clearly-labelled crop.", ""]
    for cat in category_order:
        rows = [e for e in entries if e["category"] == cat]
        lines.append(f"## {cat}")
        lines.append("")
        if not rows:
            lines.append(f"_No brochure reference._ {MISSING.get(cat, '')}")
            lines.append("")
            continue
        lines.append("| ID | Page(s) | File | Size | Kind | Feature |")
        lines.append("|---|---|---|---|---|---|")
        for e in rows:
            pages = ", ".join(str(p) for p in e["source_pages"])
            lines.append(f"| {e['id']} | {pages} | `{e['file']}` | {e['width']}x{e['height']} | "
                         f"{e['kind']} | {e['feature']} |")
        lines.append("")
        for e in rows:
            lines.append(f"- **{e['id']}** - {e['design_details']}")
        lines.append("")
        if cat in MISSING:
            lines.append(f"> Note: {MISSING[cat]}")
            lines.append("")
    lines += ["## Excluded - not SP Residency", "",
              "Pages 28-33 present the developers' other projects. Their images are archived in "
              "`reference/_excluded-other-developer-projects/` and must not be used for SP Residency.", ""]
    for x in excluded:
        lines.append(f"- p{x['source_page']}: {x['description']} (`{x['file']}`)")
    lines.append("")
    (ref / "reference-map.md").write_text("\n".join(lines))
    print(f"wrote {len(entries)} SP Residency references, {len(excluded)} excluded, "
          f"{len(MISSING)} documented gaps -> {ref}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
