# SP Residency — Brochure Analysis (Phase 1)

**Source of truth:** `sp-residency/source/SPR-Brochure-11-05-2026.pdf`. This is a 36-page, 290 × 205 mm landscape print brochure, exported from Adobe Illustrator on 11 May 2026.
**Structured data:** [`project-information.json`](project-information.json).
**Raw text:** [`brochure-text-layer.txt`](brochure-text-layer.txt) (PDF text layer) and [`brochure-ocr.txt`](brochure-ocr.txt) (Tesseract OCR of 300 dpi renders).

> **Name.** The brochure brands the project **Shan Poornam Residence by ENS**. Page 28 shortens it to **"SP Residence"**, and the file name uses **"SPR"**. "SP Residency" is the client's working name for the same project. The website uses *Shan Poornam Residence* as the display title, with *SP Residency* as the short label.

---

## 0. How the brochure was read

| Method | Used for |
|---|---|
| Visual read of every page (all 36) | Layout, renders, plans, icons |
| `pdftotext -layout` | All live text: facts, specs, distances, unit area tables, Vastu |
| `pdfimages -all -p` | 109 embedded rasters at original resolution: 33 SP Residency images, plus duplicates, masks, logos, QR codes and other-project imagery |
| Tesseract 5.3.4 OCR on 300 dpi renders | Labels baked into raster or outlined plan art: room names and room dimensions |
| Visual verification at 300 dpi | Every room dimension on pp. 15–21, including the rotated labels that OCR missed |

## 1. Page index

| Page | Content | SP Residency asset? |
|---|---|---|
| 1 | Cover: Shan Poornam Residence by ENS, "Boutique living in the heart of Madurai" | branding |
| 2 | ENS Development + SKR Elite Properties logos; developer statement | — |
| 3 | Foundational Vision: SP sun monogram; meaning of *Shan* and *Poornam* | branding |
| 4 | **Exterior three-quarter perspective, daylight**; disclaimer | **R01** |
| 5 | Why Shan Poornam Residence: 26 homes, unit mix, 85 % carpet, location | facts |
| 6 | Strategically Located: distance/time table | location |
| 7 | Location map with 1–5 km rings | location |
| 8 | Divider: "Thoughtfully planned from the ground up" | — |
| 9 | Amenity icon sheet: 21 amenities in 4 groups | amenities |
| 10 | **Stilt floor plan (3D)**, keys 1–9 | **R05** |
| 11 | **Elegant lobby, security cabin, management office, co-working** | **R18, R03, R20, R21** |
| 12 | **Gym ×2, rooftop lounge** | **R22, R23, R24** |
| 13 | **Terrace floor plan (3D)**, keys 10–16 | **R06** |
| 14 | Divider: "Floor plans" | — |
| 15 | **Typical floor plan** (floors 1–4) | **R07** |
| 16–21 | **Unit types A–F**: plan, areas, Vastu, floors | **R08–R13** |
| 22–23 | Specifications 1–10 | specs |
| 24 | **Bedroom, balcony, corridor** | **R16, R17, R25** |
| 25 | **Lobby/library lounge, living + dining**; "The Shan Poornam Residence Advantage" | **R19, R14** |
| 26 | **Front elevation at night** | **R04** |
| 27 | Advantage summary (6 icons) over a crop of the night elevation | (R04) |
| 28 | ENS project highlights, including the **SP Residence dusk thumbnail** | **R02** (others excluded) |
| 29 | ENS portfolio continued; "The Developer" | excluded |
| 30 | Crown Penang (other project) | excluded |
| 31 | Radisson RAK (other project) | excluded |
| 32 | Ongoing & completed projects, Madurai (other projects) | excluded |
| 33 | SKR collaboration partner; upcoming projects (other projects) | excluded |
| 34 | SP monogram; full legal disclaimer | — |
| 35 | Contact: WhatsApp, website, QR codes, site address, email | facts |
| 36 | Back cover | — |

**Important:** pages 28–33 show *other* developments. That includes the Crown Penang and Radisson RAK interiors on pp. 30–31. They have been archived in `reference/_excluded-other-developer-projects/` and are **never** used as SP Residency references.

---

## A. Project architecture

### Building configuration
- **Levels:** stilt (parking + lobby amenities), then **5 residential floors**, then a terrace amenity level. This is confirmed by the stacked bays in R01 and R04, and by p5 ("26 … homes across 5 floors").
- **Homes:** 26 in total, split 4 BHK × 1, 3 BHK × 13, 2 BHK × 12 (p5).
- **Typical floor (floors 1–4):** six units, A–F (p15; each unit page says "Available on 1st, 2nd, 3rd and 4th floors"). That accounts for 24 homes.
- **5th floor (derived):** 26 − 24 = 2 homes, which the unit mix implies are 1 × 4 BHK and 1 × 3 BHK. **The brochure has no 5th-floor plan.**
- **Floor-to-floor height:** 10′ including the slab (p22). The stilt height is **not given**.
- **Structure:** RCC frame, raft foundation, M-40 concrete (p22).
- **Circulation:** one central north–south corridor, double-loaded. One staircase and one OTIS lift (1020 kg / 15 pax) sit on its west side between Units B and A. Landscaped courts close both ends of the corridor (p15).
- **Orientation:** the north arrow on p15 points up the page. The road runs along the **south** edge, and the building entry is from the south (Vastu tables).

### Facade (from renders R01, R02, R04 and R03)
| Element | What the renders show | Specified in brochure? |
|---|---|---|
| Bay frames | White projecting box "picture frames" around stacked windows and balconies, with wood-tone soffits; 5 storeys tall | No |
| Louvres | Full-height warm copper/teak-tone vertical fins in large fields | No |
| Walls | Warm grey and white painted render | **Yes**: Asian Paints primer + 2 coats Apex exterior emulsion |
| Feature pylon | Sandstone/travertine-look vertical pylon, with the teal SP sun monogram at the parapet (R01); a sign mast at the centre-top (R04) | No |
| Windows | White UPVC, divided lites | **Yes**: premium UPVC with toughened glass |
| Balcony rails | White MS vertical-baluster handrail with a flat top rail | **Yes**: "MS handrail as per architect's design" |
| Greenery | Cascading planters at ledges; planted slot at the south end of the corridor (R04); rooftop trees | Partly (terrace garden) |
| Stilt | Exposed columns with black/yellow hazard bands; dark soffit with red sprinkler mains | No |
| Compound | Timber-look panel wall with boom barriers at both vehicle openings (R04); rubble-stone wall segment (R01) | No |
| Signage | Illuminated teal "Shan Poornam Residence by ENS" over a glazed security cabin with a timber-slat base | No |

**Exterior palette:** warm white, warm grey, copper/teak orange-brown, sandstone beige, teal (brand), and green planting.

### Window and door positions
- **Elevation:** five identical stacked bays per vertical module; window positions are fixed by the white frames in R01 and R04.
- **Plans:** windows are drawn as double lines on external walls in every bedroom, kitchen and bathroom (pp. 15–21).
- **Unit doors:** every entry opens off the corridor. Units A, B and C have east-facing doors; D, E and F have west-facing doors.
- **Door sizes (p23):** main door 4′ × 8′; bedroom doors 3′6″ × 8′; toilet doors 2′9″ × 8′.

### Entrance, lobby, landscape and parking
- **Stilt plan (p10):**
  - two vehicle openings on the south frontage, with the security cabin at the south-east opening;
  - a two-way central drive aisle with perimeter parking bays;
  - perimeter garden strips;
  - a playground in the north-east corner;
  - the lobby block on the west side, holding the lobby, management office, co-working room and library;
  - a centralised gas line and a utilities area along the east edge.
- **Parking:** the number of spaces is **not stated**. The cars drawn on the plan are illustrative.
- **Security (p23):**
  - security cabin;
  - RFID-controlled private lobby, lift and car-park entry;
  - CCTV in all common areas.

---

## B. Apartment details

### Unit schedule (pp. 16–21)

| Type | BHK | Carpet (sq.ft) | Excl. balcony (sq.ft) | SBU (sq.ft) | UDS (sq.ft) | Flat entry | Position on typical floor |
|---|---|---|---|---|---|---|---|
| A | 3 | 1500 | 142.8 | 1764 | 578.87 | E | SW corner |
| B | 2 | 957 | 68.3 | 1125 | 369.34 | E | West, mid |
| C | 2 | 1003 | 23.6 | 1179 | 387.08 | E | NW corner |
| D | 3 | 1472 | 144.4 | 1731 | 568.07 | W | NE corner |
| E | 2 | 846 | 72.0 | 995 | 326.51 | W | East, mid |
| F | 3 | 1486 | 143.3 | 1747 | 573.47 | W | SE corner |

Every carpet/SBU ratio falls between 0.8503 and 0.8507, consistent with the brochure's "85 %" claim.

### Room dimensions (as printed)

| Room | A | B | C | D | E | F |
|---|---|---|---|---|---|---|
| Hall (living + dining) | 28′4″ × 11′ | 28′4″ × 10′7″ | 16′ × 18′8″ | 28′4″ × 11′ | 10′ × 11′ | 28′4″ × 11′ |
| Kitchen (incl. utility) | 10′ × 12′4″ | 13′ × 7′ | 11′6″ × 7′5″ | 10′ × 12′ | 8′ × 8′ | 10′ × 12′4″ |
| Service | 4′6″ × 8′ | 4′6″ × 7′2″ | 4′6″ × 5′ | 4′6″ × 8′ | — | 4′6″ × 8′ |
| Bedroom-1 | 12′ × 12′ | 13′ × 11′ | 13′ × 11′5″ | 12′ × 11′5″ | 12′ × 13′ | 12′ × 12′ |
| Bedroom-2 | 12′ × 12′6″ | 11′ × 11′ | 13′ × 12′ | 12′ × 11′5″ | 10′ × 11′3″ | 12′ × 12′ |
| Bedroom-3 | 14′ × 12′4″ | — | — | 13′ × 14′ | — | 14′ × 12′4″ |
| Bathrooms | 3 × 4′6″ × 8′ | 2 × 4′6″ × 8′ | 2 × 4′6″ × 8′ | 3 × 4′6″ × 8′ | 2 × 4′6″ × 8′ | 3 × 4′6″ × 8′ |
| Balconies | 7′1″ × 10′8″; 2 × 10′6″ × 3′6″ | 7′1″ × 9′4″ | 7′3″ × 4′ | 8′10″ × 4′; 11′4″ × 4′; 7′1″ × 11′ | 6′5″ × 12′ | 7′1″ × 10′8″; 2 × 10′6″ × 3′6″ |

Per the p34 disclaimer, **kitchen dimensions include the utility area**.

### Spaces
- **Living and dining:** every unit has a single linear "Hall" that combines living and dining. The sofa group sits at the entry end and a 6-seat dining table at the balcony end; Unit E has a 4-seat round table.
- **Living render (R14):** this looks down the long hall: living in front, then dining under a walnut bulkhead, then the window and balcony. It matches the 28′4″ halls of Types A, D and F.
- **Kitchen:** L- or U-shaped counters with the hob on an external wall, plus a service/utility yard. Specified: concrete slab top finished in granite, Kohler faucet, single-bowl sink, 4′ × 2′ GVT wall tiles, metered piped LPG, and points for chimney, hob, purifier and washing machine. **No kitchen render exists.**
- **Bedrooms:** wooden GVT floors, 48″ × 8″. The one bedroom render (R16) is unlabelled. It is treated as the *master bedroom* because it is the only one and it includes a lounge chair; this is an **assumption**.
- **Bathrooms:** all are 4′6″ × 8′. Specified: Kohler sanitaryware and CP fittings, Kajaria 4′ × 2′ wall tiles and 2′ × 2′ floor tiles, toughened-glass shower partition, geyser points. **No bathroom render exists.**
- **Balconies:** wooden GVT floor and MS handrail. Render R17 is a two-chair sit-out with travertine-look walls and wall planters.
- **Wardrobes:** drawn as hatched niches. In the 3-bed units they sit in the lobby between bedroom and bathroom; Units C and E have linear wardrobes. **No wardrobe elevation or render exists.**
- **Pooja:** **not shown, labelled or specified anywhere in the brochure.**
- **Ceilings:**
  - The spec gives "false ceiling with lights" for unit interiors and "false ceiling with decorative lights" for the corridor.
  - The renders show flat white ceilings with recessed downlights, a walnut bulkhead in the hall, a cove-lit tray in the corridor, a cove-lit bed wall, and linear LED in the gym.
- **Furniture layouts:** per-unit descriptions are in `project-information.json → units.*.furniture_layout_as_drawn`.

### Interior palette (consistent across R14, R16, R17, R18, R19 and R25)
- **Surfaces:** travertine-look beige stone panels; dark walnut, both flat and fluted; warm white walls; light beige large-format vitrified floor.
- **Floors by zone:** wide-plank walnut-look floor in the bedroom; honey wood-look floor on the balcony.
- **Accents:** brushed brass, black metal and charcoal leather.
- **Textiles:** taupe and sand, with rust and mustard accents.
- **Key signature elements:**
  - tropical-leaf mural feature wall (bedroom);
  - fluted walnut TV wall with black rod shelving (living);
  - brass ring pendants over the black-banded granite corridor floor;
  - striped frosted glazing film with woven rattan pendants (lobby).

---

## C. Project features

### Amenities: 21 (p9)
- **Private comfort / safety & security (5):** management office · access-card-controlled lift & car park · security & cabin · CCTV · private lobby
- **Lifestyle (4):** co-working / study room · library · games corner · gym
- **Outdoor living (6):** garden · playground · BBQ area · roof-top lounge · terrace garden lounge · outdoor yoga lawn
- **Infrastructure (6):** smart main door lock · centralised gas pipeline · water softener · power-backup generator · EV charging bay provisions · false ceiling

**Stilt keys (p10):** 1 Private Lobby · 2 Management Office · 3 Co-working/Study · 4 Library · 5 Playground · 6 Garden · 7 Centralised Gasline · 8 Security Cabin · 9 Utilities Area
**Terrace keys (p13):** 10 Games Corner · 11 Gym · 12 BBQ Area · 13 Rooftop Lounge · 14 Outdoor Lounge · 15 Terrace Garden · 16 Outdoor Yoga Lawn

### Location (pp. 5–7)
**Visalakshipuram, Reserve Police Line, Madurai.** Site address: PT Rajan Road, Visalakshipuram, Madurai 625014.

| Category | Place | Distance | Time |
|---|---|---|---|
| Education | Kendriya Vidyalaya / Lady Doak College / The American College | 1.4 / 2.0 / 5.1 km | 4 / 6 / 10 min |
| Healthcare | Vadamalayan / Apollo Specialty / Meenakshi Mission | 1.8 / 5.8 / 6.4 km | 5 / 12 / 15 min |
| Shopping | Thangamayil 450 m · Meenakshi Fan House 650 m · Unlimited 1.0 km · Style Union 1.0 km · Zudio 1.7 km | — | 1–6 min |
| Hotels | JC Residency / Courtyard by Marriott | 1.7 / 2.3 km | 5 / 6 min |
| Leisure | Vishaal Mall / Madurai Rifle Club / Race Course | 2.4 / 2.9 / 3.2 km | 5 / 7 / 8 min |
| Landmarks | Farmer's Market (Uzhavar Sandhai) / Meenakshi Amman Temple | 900 m / 4.7 km | 3 / 12 min |
| Connectivity | Mattuthavani Bus Stand / Railway Station / Airport | 5.4 / 6 / 20 km | 10 / 12 / 30 min |

The map (p7) adds 13 more landmarks without distances; they are listed in the JSON.

### Specifications
The full table is in the JSON under `specifications`. Highlights:
- Kohler bathroom and kitchen fittings; Kajaria tiles; Legrand switches; Finolex FRLS wiring
- Teak-veneer main door with PU polish
- UPVC windows with toughened glass
- OTIS lift; 3-phase supply; 1 kVA backup per unit; 100 % backup for common areas

---

## Missing information (do not invent)
1. **5th-floor plan.** The 4 BHK and the 13th 3 BHK are not drawn.
2. **Site data.** Plot area, footprint, setbacks, overall height and stilt height are not given.
3. **Drawings.** There are no side or rear elevations and no sections. A true *side elevation* cannot be produced from the brochure.
4. **Facade materials.** The louvres, frames and stone-look cladding are not specified.
5. **Unit construction detail.** Wall thicknesses, window sizes and sill heights, and ceiling height under the false ceiling are not given.
6. **Parking.** The number of spaces, bay sizes and EV bay locations are not given.
7. **Interiors.** Kitchen, bathrooms, pooja, secondary bedrooms, wardrobes and a standalone dining view have no renders.
8. **Elevated views.** There is no aerial view. The 3D stilt and terrace cut-aways (R05, R06) are the only elevated views.

## Assumptions made (flagged everywhere they are used)
- **A1.** R16 (the only bedroom render) is used as the *master bedroom*.
- **A2.** R19 (an uncaptioned lounge with bookshelves) is the stilt-level *lobby lounge / library*. This is identified from materials it shares with the captioned lobby render R18.
- **A3.** R01 shows the front (south, road-facing) facade plus one side facade, inferred to be the west. This is based on the p15 north arrow and the road position.
- **A4.** R14's long hall represents the 28′4″ hall of Types A, D and F, which is the closest proportional match.
- **A5.** The dining crop R15 is derived from R14. It is not an independent design.

## Brochure inconsistencies
- The bus stand is spelled "Maatuthavani" on p6 and "Mattuthavani" on p7.
- "Apollo Specialty" (p6) vs "Apollo Speciality" (p7).
- Unit B's Vastu entry lists the kitchen as NW; every other unit lists SE. This is reported as printed.
- The unit pages show floors 1–4 only, but 26 homes requires two more units that are not drawn.

## Legal / usage note
- **Artists' impressions:** the brochure states repeatedly that all images, plans and finishes are artists' impressions and subject to change.
- **Third-party material:** the renders and logos belong to Shan Poornam Development Pvt. Ltd., ENS Development and SKR Elite Properties.
- **Approval required:** UrbanMark Interiors should obtain written permission before publishing them, and should credit them accurately. The asset manifest therefore marks every image `approval: "pending"`.
