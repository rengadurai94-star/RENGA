# Shan Poornam Residence: Project Information Report

**Prepared:** 28 Nov 2026
**Single source of truth:** `source-assets/brochure/SPR-Brochure-11-05-2026.pdf`. It has 36 pages, was made in Adobe Illustrator, and is dated 11 May 2026. SHA-256 `29ea1631…003b5b`.

This report records what the website shows, where each fact comes from, and what is missing. Nothing on the public website is invented. Values the brochure does not give are stored as `null` in `src/data/project-data.json` and hidden on the site.

---

## 1. Source asset inventory

The only document supplied was the brochure PDF. **No CAD drawings (DWG/DXF), section drawings, separate photographs or logo files were supplied.** Every asset below was extracted from the brochure without alteration.

| Asset | Brochure page | Native size | Used for |
|---|---|---|---|
| Cover logo (vector) | 1 | vector | `public/brand/shan-poornam-logo-on-dark.svg` (background removed only) |
| Light-background logo colourway | 35 | vector | `shan-poornam-logo-on-light.svg`: same paths in the brochure's p.35 teal `#008177` |
| Exterior perspective (day) | 4 | 2263×1273 | Hero, gallery |
| Front elevation (dusk) | 26 | 2704×1792 | Intro reveal, gallery, facade reference for 3D |
| Stilt floor plan (3D illustration) | 10 | 2339×1279 | Floor-plan viewer (Stilt) |
| Elegant Lobby / Security Cabin / Management Office / Co-working | 11 | 703–1105 px wide | Amenities, gallery (captioned in brochure) |
| Gym ×2 / Rooftop Lounge | 12 | 705–1447 px wide | Amenities, gallery (captioned in brochure) |
| Terrace floor plan (3D illustration) | 13 | 2914×2042 | Floor-plan viewer (Terrace) |
| Typical floor plan (with alpha mask) | 15 | 1772×997 (plan area 630×840) | 2D floor viewer and 3D geometry tracing |
| Unit plans, Types A–F (with alpha masks) | 16–21 | 1314–1731 px wide after trim | Apartment detail, plan viewer |
| Specifications | 22–23 | text | Specifications section |
| Bedroom, balcony sit-out, corridor | 24 | 519–1065 px | Gallery (uncaptioned in brochure) |
| Living/dining, lounge with library shelving | 25 | ~775 px wide | Gallery (uncaptioned in brochure) |
| Location distances | 6 | text | Location section |
| Location map | 7 | vector, rasterised at 220 dpi | Location section |
| Contact, QR codes | 35 | text + 3 QR | Contact section; Map QR decoded to `https://maps.app.goo.gl/sCMexnfBfakJEFRt8` |

**Excluded:** pages 28–33 show other ENS/SKR developer projects (Radisson RAK, Crown Penang, Zudio Madurai and others). They are not SP Residence and are not used anywhere.

**Image quality note:** the interior and amenity renders are only 519–1447 px wide in the brochure. They are shown framed, not stretched full-screen, and are never upscaled. The typical floor plan is 630×840 px in the brochure, so the 2D viewer is limited to that resolution. A higher-resolution CAD export from the architect would fix this.

---

## 2. Verified project data

| Item | Value | Source |
|---|---|---|
| Project name | **Shan Poornam Residence** (also "SP Residence", p.28; website www.spresidence.com) | p.1, 5, 28, 35 |
| Developer | Shan Poornam Development Pvt. Ltd., an ENS Development company | p.1, 35 |
| Collaboration partner | SKR Elite Properties Pvt. Ltd. | p.1, 35 |
| Tagline | Boutique Living in the Heart of Madurai | p.1, 35 |
| Location | PT Rajan Road, Visalakshipuram (Reserve Police Line), Madurai 625014, Tamil Nadu | p.6, 35 |
| Total residences | **26** | p.5, 15, 25, 28 |
| Residential floors | **5** ("26 homes across 5 floors") | p.5, 15 |
| Levels | Stilt + 1st–5th floors + Terrace | p.10, 13, 15, 26 (elevation shows stilt + 5 floors + terrace) |
| Unit mix | 4 BHK × 1 · 3 BHK × 13 · 2 BHK × 12 | p.5 |
| Carpet/SBU efficiency | up to 85% | p.5, 25, 27 |
| Floor-to-floor height | 10' (incl. slab) | p.22 |
| Lift | OTIS, 1020 kg (15 pax) | p.23 |
| Amenities | 21, in 4 groups (p.8). Stilt legend 1–9 (p.10). Terrace legend 10–16 (p.13) | p.8, 10, 13, 25 |
| Contact | +91 81100 04007 (shown with WhatsApp icon) · sales@skrgroup.co · www.spresidence.com | p.35 |

### Unit types (all "Available on 1st, 2nd, 3rd and 4th floors")

| Type | Config | Carpet | Excl. balcony | Super built-up | UDS | Vastu | Flat entry | Bedrooms | Kitchen | Baths | Page |
|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 3 BHK | 1500 | 142.8 | 1764 | 578.87 | East facing | E | NE/NW/SW | SE | N/S | 16 |
| B | 2 BHK | 957 | 68.3 | 1125 | 369.34 | East facing | E | NE/SW | NW | N/S | 17 |
| C | 2 BHK | 1003 | 23.6 | 1179 | 387.08 | East facing | E | NW/SW | SE | N/S | 18 |
| D | 3 BHK | 1472 | 144.4 | 1731 | 568.07 | West facing | W | NW/SW/NE | SE | N/S | 19 |
| E | 2 BHK | 846 | 72.0 | 995 | 326.51 | West facing | W | NE/SW | SE | S | 20 |
| F | 3 BHK | 1486 | 143.3 | 1747 | 573.47 | West facing | W | NW/SW/NE | SE | N/S | 21 |

Areas are in sq.ft. Room-by-room dimensions are in `project-data.json → unitTypes.*.rooms`. They were checked one by one against both the unit plans and the typical floor plan.

**Arithmetic check:** carpet ÷ SBU is 85.0–85.1% for every type, which matches the "85%" claim.

---

## 3. Floor and apartment mapping

The building entry is from the **south** (road side). A central N–S corridor splits the typical floor into a west row (C, B, A from north to south, all east-facing entries) and an east row (D, E, F from north to south, all west-facing entries). The stair and lift sit on the west side of the corridor between B and A. Landscaped light wells sit at the north and south ends of the corridor (p.15).

| Level | Residences | Configuration | Evidence |
|---|---|---|---|
| Terrace | none | Games Corner, Gym, BBQ Area, Rooftop Lounge, Outdoor Lounge, Terrace Garden, Outdoor Yoga Lawn | p.13 |
| 5th Floor | **2** | 1 × 4 BHK, 1 × 3 BHK | **Derived**: 26 − 24 = 2. The only 4 BHK and the 13th 3 BHK are not among Types A–F. **No plan, areas or facing are published.** |
| 4th Floor | 6 | A, B, C, D, E, F | p.15–21 |
| 3rd Floor | 6 | A, B, C, D, E, F | p.15–21 |
| 2nd Floor | 6 | A, B, C, D, E, F | p.15–21 |
| 1st Floor | 6 | A, B, C, D, E, F | p.15–21 |
| Stilt | none | Parking, Private Lobby, Management Office, Co-working, Library, Playground, Garden, Gasline, Security Cabin, Utilities | p.10 |
| **Total** | **26** | 4 BHK ×1 · 3 BHK ×13 · 2 BHK ×12 ✔ | |

**Apartment numbers:** the brochure gives **no official flat numbers**. The website uses reference codes (e.g. `2D` = 2nd floor, Type D) labelled as "Ref.", never as official numbers. Each unit has an `officialNumber` field, currently `null`, ready for the real numbers.

---

## 4. Contradictions and inconsistencies found

| # | Topic | What the sources say | Website handling |
|---|---|---|---|
| 1 | **Project name** | The brief says "SP Residency". The brochure says **"Shan Poornam Residence"** and, on p.28, **"SP Residence"** (not "Residency"). | Uses the brochure name. Change `project.name` / `shortName` in the data file if "SP Residency" is intended. |
| 2 | **Floor count** | The brief says "approximately 6 floors". The brochure says "26 homes across **5 floors**", with a stilt level below and a terrace above. | Shows "Stilt + 5 residential floors + Terrace". The "6" is likely stilt + 5. |
| 3 | Terrace amenity naming | p.8 icon reads "Terrace Garden Lounge". p.13 legend lists "14. Outdoor Lounge" and "15. Terrace Garden" separately. | Both names shown as printed. No plan number is claimed for the p.8 item. |
| 4 | Spelling variants | "Maatuthavani" (p.6) vs "Mattuthavani" (p.7). "Apollo Specialty" (p.6) vs "Speciality" (p.7). "Vadamalayan Hospitals" vs "Hospital". | Uses the p.6 table spelling. |
| 5 | Scale of the plans | Derived from the typical plan at 7.6 px/ft (calibrated on the printed 28'4" halls), the traced unit outlines come out about 10–15% **smaller** than the printed carpet areas. Earlier analysis also found room deviations of up to about 8%. | **The plans are not drawn exactly to scale.** The website shows only printed areas and dimensions. The 3D model is labelled as derived and not dimensionally exact. |
| 6 | LPG piping grade | "SS 306 piping" (p.22). SS 306 is not a common grade (304/316 are). Possibly a typo. | Shown as printed. Worth confirming with the developer. |

No conflicting **numbers** were found between pages. Unit areas, unit counts and the 85% ratio all agree wherever they repeat.

---

## 5. Information not provided (kept `null`, not shown)

- **5th floor:** plan, areas, facing and room schedule for the 4 BHK and the 3 BHK.
- **Official flat numbers**, **prices**, **availability/sold status**, **possession date**, **RERA registration number**.
- **CAD data:** overall building dimensions, plot area, setbacks, stilt height, slab/wall thicknesses, structural grid and column positions.
- **Elevations:** side and rear elevations, sections.
- **Renders:** kitchen, bathrooms and secondary bedrooms (only specifications exist). Pages 24–25 renders are **uncaptioned**, so the website labels them descriptively and does not assign them to a unit type.
- **Parking:** number of car parks and allocation per unit.
- **Map:** exact coordinates. The brochure's Map QR link is used. The link could not be resolved in this build environment because the network proxy blocked it.
- **Pooja room:** not mentioned anywhere.

---

## 6. 3D model: method and limitations

- **Footprint and unit outlines** were traced from the original typical floor plan (p.15) using the PDF's own transparency mask as the building outline (`tools/trace_typical_floor.py`). Partition lines between units follow the printed walls.
- **Scale:** 7.6 px/ft, calibrated on the printed 28'4" halls of Types A, D and F. Derived footprint ≈ **80.5 ft × 108.3 ft**. This is not a printed value.
- **Heights:** 10' floor-to-floor is printed. The stilt height is **assumed** to be 10' because it is not printed.
- **5th floor:** modelled as the same envelope as the floors below, as the elevation shows. It is a single neutral volume labelled "layout not published". It is not split into units.
- **Facade:** timber-tone vertical louvres, white balcony frames and grey cladding follow the brochure renders (p.4, 26). They are approximate, not surveyed.
- **Stilt and terrace** contents in 3D are **indicative** placements taken from the p.10 and p.13 illustrations.
- **City:** stylised procedural massing with a gopuram-inspired silhouette as distant atmosphere only. **No geographic claim is made**, and the project is not shown beside any landmark.

---

## 7. Development plan (as executed)

1. Extract and inventory the brochure assets → `source-assets/`, `public/media/`, `public/brand/`.
2. Build the structured data → `src/data/project-data.json` (editable) and `src/data/plan-geometry.json` (traced).
3. App: Vite + React 19 + TypeScript + three.js / React Three Fiber / drei + GSAP.
4. Cinematic intro: procedural sky and clouds, cloud parting, aerial reveal of the stylised Madurai massing, building approach, Skip Intro, and auto-skip on return visits.
5. Interactive building: orbit/zoom, scroll and button floor navigation, floor highlight, unit hover and select.
6. Unit detail panel, original plans, gallery with full-screen viewer, 2D plan viewer synchronised with the 3D selection.
7. Amenities, specifications, location, contact.
8. Data editor (`/#/editor`), low-power mode, WebGL fallback, mobile layout.
9. Type-check, lint, production build, browser tests, ZIP.

---

## 8. Verification (28 Nov 2026)

| Check | Result |
|---|---|
| `npm run typecheck` (TypeScript strict) | ✅ no errors |
| `npm run lint` (ESLint) | ✅ no errors |
| `npm run build` (production) | ✅ built |
| Automated browser suite `tests/e2e.cjs` against the production build | ✅ **38 / 38 checks passed**. See `tests/report.md` |
| Data editor: save to `project-data.json` and the site updates | ✅ tested (and restored) |
| Console errors, page errors, failed requests | ✅ none |

The suite covers every item in Part 17 of the brief: website opens without errors; intro runs; Skip Intro; building renders; all 7 levels; exactly 26 residences; floor-wise distribution 6/6/6/6/2; wheel, button, next/previous and reset navigation; apartment selection in 3D and 2D; correct details for Types A–F; original plans and images load; 2D↔3D synchronisation in both directions; mobile layout with no overflow; return-visit auto-skip; no-WebGL 2D fallback.

Screenshots are in `docs/screenshots/`.

## 9. Known limitations

1. **Software-GPU testing.** The automated tests ran in a headless browser with a software GPU (no graphics card). There the site correctly lowered itself to Performance mode. Real-device frame rates were not measured in this environment. High-quality mode (soft shadows and ambient occlusion) was verified visually. Please try it on your target phones and laptops.
2. **The 3D model is not survey-accurate** (see §6). The brochure plans are not to scale, and no CAD data was supplied. With DWG/DXF files or a dimensioned set from the architect, the model can be rebuilt to exact dimensions using the same pipeline.
3. **Image resolution is limited by the brochure.** The interiors are 519–1447 px and the typical plan 630×840 px. Higher-resolution originals from the developer would improve the gallery and plan viewer.
4. **The map pin is not resolved.** The brochure's Google Maps short link could not be expanded here because the network proxy blocked it. The "Open in Google Maps" button uses that exact link. The optional embedded map searches the printed address and may be approximate.
5. **The 5th floor, flat numbers, prices, availability and RERA number** are absent from the brochure and are therefore not shown. They can be entered in the data editor.
6. **Usage rights.** All images and logos belong to the developer (ENS Development / SKR Elite Properties). Confirm permission before publishing publicly.
