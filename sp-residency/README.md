# SP Residency — Visual Package

**Project:** Shan Poornam Residence by ENS ("SP Residence" / SP Residency), PT Rajan Road, Visalakshipuram, Madurai 625014. It has 26 homes over stilt + 5 floors + a terrace.
**Single source of truth:** [`source/SPR-Brochure-11-05-2026.pdf`](source/SPR-Brochure-11-05-2026.pdf), 36 pages.
**Website page:** `/projects/sp-residency` ([`src/app/projects/sp-residency/page.tsx`](../src/app/projects/sp-residency/page.tsx)).

## Package contents (Phase 9 checklist)

| # | Deliverable | Where | Status |
|---|---|---|---|
| 1 | Brochure analysis | [`analysis/brochure-analysis.md`](analysis/brochure-analysis.md), [`analysis/project-information.json`](analysis/project-information.json), raw [`text layer`](analysis/brochure-text-layer.txt) + [`OCR`](analysis/brochure-ocr.txt) | Done: all 36 pages |
| 2 | Extracted reference library | [`reference/`](reference/) + [`reference/reference-map.md`](reference/reference-map.md) / [`.json`](reference/reference-map.json) | Done: 34 SP Residency references, 36 page renders, 31 other-project images quarantined |
| 3 | Exterior visualisations | Originals: `reference/exterior`, `reference/elevation`. Enhancements: prompts `EXT-01`…`EXT-13` | Originals published. **Enhancements not generated** (see below) |
| 4 | Interior visualisations | Originals: living, bedroom, balcony, corridor, lobby. Enhancements: prompts `LIV`, `DIN`, `BED`, `BAL`, `COR` | Same as above |
| 5 | Amenity visualisations | Originals: lobby, library lounge, office, co-working, gym ×2, rooftop lounge, stilt/terrace 3D. Prompts `AME-*`, `EXT-10/12` | Same as above |
| 6 | Location visualisation | Live data panel on the website + original map (`location/`) | Done. No AI imagery, to avoid inventing the neighbourhood |
| 7 | Image-generation prompts | [`prompts/image-generation-prompts.md`](prompts/image-generation-prompts.md) + [`prompts/generation-requests.json`](prompts/generation-requests.json) | 30 ready · 2 concept-only · 7 blocked |
| 8 | 3D modelling specification | [`3d/modelling-specification.md`](3d/modelling-specification.md) + [`3d/unit-geometry.json`](3d/unit-geometry.json) | Done: conceptual LOD 200/300; SketchUp, Revit, Blender, GLB |
| 8b | **Working 3D model** | [`3d/exports/`](3d/exports/): building GLB + 6 unit GLBs + `model-report.json`; viewer at **`/projects/sp-residency/model`** | Done: built from the brochure plans; glTF-validated (0 errors) |
| 9 | Website-ready images | [`../public/images/sp-residency/`](../public/images/sp-residency/): 25 WebP files, 2.0 MB | Done: originals only, `approval: pending` |
| 10 | Asset manifest | [`../public/images/sp-residency/manifest.json`](../public/images/sp-residency/manifest.json) | Done |

## Why no AI-generated images yet

- **No credits:** the connected Higgsfield account had **0 credits** on a free plan when this package was built (27 Nov 2026). Nothing was generated, and nothing in this repository claims to be generated.
- **Quotes:** 2.5 credits per image (Seedream 5.5, 4K) and 4 credits per image (Nano Banana Pro, 4K). The 30 ready requests come to roughly **92 credits** in total.
- **Recommended order:**
  1. **Tier 0, faithful upscale** of the 14 key originals. The brochure interiors are only 700–1000 px wide; the website currently shows them framed rather than full-bleed for this reason.
  2. **Low-risk enhancements**, which keep the brochure camera.
  3. **Medium-risk** secondary views and relights.
  4. **Concept-only** views, for internal review only.
- **QA:** every request carries a must-preserve list and a QA checklist for comparing the output against its reference.

## Gaps: what the brochure does not contain (nothing was invented for these)
- **Kitchen, bathrooms, pooja, secondary bedrooms, wardrobes:** no renders. Kitchens and bathrooms have specifications only, and pooja is not mentioned at all.
- **Side or rear elevation, aerial view:** not in the brochure. The aerial and stilt eye-level views are marked *concept-only*, and the side elevation is blocked.
- **5th-floor plan:** missing. It holds the 4 BHK and the 13th 3 BHK.
- **Building data:** plot area, footprint, stilt height and facade material specifications are not given.
- **Facts still needed from the developer:** listed in `3d/modelling-specification.md §8`.

## Assumptions (flagged in every file that uses them)
- **A1.** The single bedroom render is the master bedroom.
- **A2.** The uncaptioned lounge with bookshelves (p25) is the stilt-level lobby lounge / library.
- **A3.** The daytime perspective shows the front (south) facade and the west side.
- **A4.** The living render is the 28′4″ hall of Types A, D and F.
- **A5.** The dining reference is a crop of the living render.

## Before publishing the website page
- **Usage rights:** all images and logos are the developer's artists' impressions (ENS Development / SKR Elite Properties). Get written permission, then change `approval` to `approved` in the manifest.
- **UrbanMark's role:** confirm UrbanMark Interiors' role on the project. The page is worded as a *project showcase* and does not claim design authorship.

## Re-running the workflow
```bash
python3 -I sp-residency/scripts/build_reference_library.py --pdf sp-residency/source/SPR-Brochure-11-05-2026.pdf --out sp-residency
python3 -I sp-residency/scripts/build_project_information.py --out sp-residency
python3 -I sp-residency/scripts/build_prompt_pack.py --out sp-residency
python3 -I sp-residency/scripts/build_web_assets.py --root .
```
The 3D model is rebuilt with `python3 -I sp-residency/3d/build_model.py --root .`, which needs numpy, scipy, Pillow and trimesh.

Requires `poppler-utils` (`pdfimages`, `pdftoppm`) and ImageMagick. OCR additionally needs `tesseract-ocr`. To publish approved generated images, save them to `generated/<category>/<PROMPT-ID>.png` and re-run the last script with `--generated`.
