# SP Residency — Conceptual 3D Modelling Specification (Phase 7)

> **Accuracy statement.** This is a **conceptual** specification for presentation models: SketchUp, Revit, Blender and GLB/glTF for the web. It is built only from the sales brochure. **It is not construction-accurate.** Where the brochure gives a dimension, it is used exactly as printed. Where it does not, the value is recorded as an **open parameter**, never filled with a guess. Any model built from this spec must carry the label "Conceptual — based on sales brochure, not for construction".

Companion data: [`unit-geometry.json`](unit-geometry.json) holds the room schedule for every unit, with printed and derived metric dimensions.

---

## 1. Sufficiency check: what the brochure can and cannot support

| Need | Available? | Source |
|---|---|---|
| Typical floor layout (units A–F, corridor, stair, lift) | **Yes**, as a raster plan without overall dimensions | R07 (p15) |
| Unit room dimensions | **Yes**, every room | R08–R13 (pp. 16–21) |
| Floor-to-floor height | **Yes**: 10′ including slab | p22 |
| Number of floors | **Yes**: stilt + 5 + terrace | p5, R01, R04 |
| Stilt floor layout | **Yes**, as a 3D cut-away with no dimensions | R05 (p10) |
| Terrace layout | **Yes**, as a 3D cut-away with no dimensions | R06 (p13) |
| Front elevation | **Yes**, as a render (night) | R04 (p26) |
| One side facade | **Partial**: oblique view only | R01 (p4) |
| Rear and second side facades | **No** | — |
| 5th-floor plan (4 BHK + 3 BHK) | **No** | — |
| Overall footprint, plot, setbacks | **No** | — |
| Stilt height, parapet height, slab and wall thicknesses | **No** | — |
| Door sizes | **Yes** | p23 |
| Window sizes and sills | **No**: positions only, from the plans | — |
| Interior designs | Living/dining, one bedroom, balcony, corridor, lobby, amenities | R14–R25 |

**Verdict:** the brochure is sufficient for an **LOD 200 conceptual model** of the typical floors (1–4), the stilt and the terrace, plus an **LOD 300 look-dev** of the rooms that have renders. It is **not** sufficient for the 5th floor, the rear and second side facades, or any construction documentation.

---

## 2. Coordinate system, units and naming

| Item | Convention |
|---|---|
| Origin | South-west corner of the building's outer wall line on the typical floor, at the finished stilt floor level (FFL ±0) |
| Axes | +X = east, +Y = north (matches the p15 north arrow), +Z = up. **glTF/GLB:** export as Y-up per the glTF spec |
| Units | Revit: millimetres · SketchUp: feet-inches (brochure native) · Blender: metres (unit scale 1.0, display in m) · GLB: metres |
| Conversion | 1 ft = 0.3048 m exactly. Keep the printed feet-inch string in a `brochure_dim` attribute or parameter |
| Level names | `L00_Stilt`, `L01`, `L02`, `L03`, `L04`, `L05` *(plan unknown)*, `L06_Terrace`, `L07_RoofHeadroom` |
| Unit names | `L01_UA`, `L01_UB` … `L04_UF` |
| Room names | `L01_UA_Bedroom1`, `L01_UA_Hall`, `L01_UA_Kitchen`, `L01_UA_Bath1`, `L01_UA_Service`, `L01_UA_BalconyW` … (as in `unit-geometry.json`) |
| Common areas | `Lxx_Corridor`, `Lxx_CourtN`, `Lxx_CourtS`, `Core_Stair`, `Core_Lift` |

### Level stack (heights from FFL ±0)
| Level | Elevation | Status |
|---|---|---|
| L00 Stilt | 0 | — |
| L01 | **H_stilt** | **Open parameter.** The stilt height is not in the brochure |
| L02–L05 | H_stilt + n × 10′ (3.048 m) | 10′ floor-to-floor is printed (p22) |
| L06 Terrace | H_stilt + 5 × 10′ | Derived from the above |
| Parapet, gym roof, sign mast | **Open parameters** | Visible in R04 only; not dimensioned |

---

## 3. Calibrating the brochure plans (how to get geometry without inventing it)

None of the plan rasters carries a scale bar. Each raster must be calibrated against a **printed** dimension and then traced.

1. Import the plan raster: `reference/floor-plans/p15-typical-floor-plan.jpg` for the floor, or the unit files `p16…p21` for detail. Apply the `_alpha-mask.png` as opacity if your tool supports it.
2. **Scale** the image so a long printed dimension measures true:
   - **Typical floor:** use Hall A, 28′4″, its long side running east–west. Cross-check with Hall F, 28′4″, and Hall C, 18′8″.
   - **Unit rasters:** use that unit's longest printed hall dimension. Cross-check with a bedroom.
3. **Accept the calibration** only if three other printed room dimensions land within ±3 in (±75 mm). If they don't, the raster is not orthographically true at that location. Trace room by room using the printed dimensions instead.
4. **Trace** walls on their centre-lines.
   - Record wall thickness as **traced** values, e.g. `t_ext_traced`, `t_int_traced`, with a tolerance note.
   - These are not brochure values and must be labelled as traced.
5. **Corridor width, courts, stair and lift core:** take these from the calibrated typical-floor trace. Label them `traced`.
6. **Carpet-area sanity check.** The labelled rooms in each unit add up to about 70 % of the printed carpet area; see `sum_of_labelled_room_areas_excl_balconies_sqft_derived`. The difference is passages, wardrobe niches and walls, which the brochure includes in carpet area. **Do not stretch rooms to hit the carpet figure.**

### Typical floor topology (p15, verified at 300 dpi)
```
              N
   ┌──────────┬──[court N]──┬──────────┐
   │  C 2BHK  │             │  D 3BHK  │
   ├──────────┤             ├──────────┤
   │  B 2BHK  │  CORRIDOR   │  E 2BHK  │
   ├──────────┤  (N–S)      │          │
   │ STAIR    │             ├──────────┤
   │ LIFT     │             │          │
   ├──────────┤             │  F 3BHK  │
   │  A 3BHK  │             │          │
   └──────────┴──[court S]──┴──────────┘
                ROAD (south)
```
- **Unit entries:** A, B and C open east onto the corridor. D, E and F open west.
- **South-court slot:** the south court's slot is open on the elevation, with planters on every level (R04).

### Unit room schedule
Printed dimensions are below. Metric conversions and areas are in `unit-geometry.json`; kitchen dimensions include the utility area.

| Unit | Hall | Kitchen | Bed 1 | Bed 2 | Bed 3 | Baths | Service | Balconies |
|---|---|---|---|---|---|---|---|---|
| A 3BHK | 28′4″×11′ | 10′×12′4″ | 12′×12′ | 12′×12′6″ | 14′×12′4″ | 3 × 4′6″×8′ | 4′6″×8′ | 7′1″×10′8″, 2 × 10′6″×3′6″ |
| B 2BHK | 28′4″×10′7″ | 13′×7′ | 13′×11′ | 11′×11′ | — | 2 × 4′6″×8′ | 4′6″×7′2″ | 7′1″×9′4″ |
| C 2BHK | 16′×18′8″ | 11′6″×7′5″ | 13′×11′5″ | 13′×12′ | — | 2 × 4′6″×8′ | 4′6″×5′ | 7′3″×4′ |
| D 3BHK | 28′4″×11′ | 10′×12′ | 12′×11′5″ | 12′×11′5″ | 13′×14′ | 3 × 4′6″×8′ | 4′6″×8′ | 8′10″×4′, 11′4″×4′, 7′1″×11′ |
| E 2BHK | 10′×11′ | 8′×8′ | 12′×13′ | 10′×11′3″ | — | 2 × 4′6″×8′ | — | 6′5″×12′ |
| F 3BHK | 28′4″×11′ | 10′×12′4″ | 12′×12′ | 12′×12′ | 14′×12′4″ | 3 × 4′6″×8′ | 4′6″×8′ | 7′1″×10′8″, 2 × 10′6″×3′6″ |

### Doors (p23)
- **Main:** 4′ × 8′, 38 mm, teak veneer with PU polish.
- **Bedroom and other doors:** 3′6″ × 8′, 30 mm, 1 mm laminate.
- **Toilet:** 2′9″ × 8′, 30 mm, 1 mm laminate.
- **Frames:** all teak.

### Windows (p23)
- **Specification:** UPVC with toughened glass; ventilators are UPVC louvred units with exhaust fans.
- **Positions:** take them from the plan rasters.
- **Sizes and sill heights:** not given. Use the open parameters `win_w_traced`, `win_sill` and `win_head`.

---

## 4. Facade modelling (front + one side only)

- **Method:** camera-match R01 (`fSpy`, or Blender's camera solver on the building verticals and floor lines), then model the facade modules against it. Validate the front against R04, which is near-orthographic.
- **Front facade modules (west to east), from R04:**
  1. a white-framed bay stack spanning floors 1–5;
  2. a copper/teak louvre field;
  3. a narrow bay column;
  4. a recessed planted slot at the corridor's south court, with trees and planters at every level;
  5. a white-framed balcony stack;
  6. a second louvre field;
  7. a bay column, then the stone-look edge band.
- **Above the parapet:** rooftop trees and the central sign mast.
- **Pylon:** a sandstone-look vertical pylon carrying the SP monogram at the parapet. It is visible in R01; locate it by camera match.
- **Unseen facades:** the north and east facades are **not** in the brochure. Leave them as neutral massing (material `M_Massing_Unknown`, flat grey). Do not mirror the front onto them.
- **Stilt level:**
  - columns with black/yellow hazard bands;
  - dark soffit with sprinkler mains;
  - compound wall with boom barriers at both openings;
  - security cabin at the south-east opening (R03, R34);
  - ground layout from R05.

---

## 5. Material library

Colours are approximate sRGB values sampled from the brochure renders. Lighting affects them, so use them for look-dev only. The brochure-specified product goes in the material description.

| Material ID | Where | Brochure spec | Look-dev base colour | Notes |
|---|---|---|---|---|
| `M_Ext_Paint_WarmWhite` | Bay frames | Asian Paints Apex exterior emulsion | `#E7D8CB` | Matte |
| `M_Ext_Paint_WarmGrey` | Walls between modules | Asian Paints Apex | `#B79F95` | Matte |
| `M_Ext_Louvre_CopperTeak` | Vertical fins | **Material unspecified** | `#825033` | Matte; fin depth and spacing are open parameters |
| `M_Ext_Stone_Pylon` | Pylon / edge band | **Unspecified** (stone-look) | sandstone beige | Sample from R01 when look-dev starts |
| `M_Ext_Compound_Timberlook` | Compound wall panels | **Unspecified** | `#AF5728` | |
| `M_Ext_Stone_Rubble` | Rubble wall segment | **Unspecified** | `#A48877` | |
| `M_UPVC_White` + `M_Glass_Toughened` | Windows | UPVC, toughened glass | white / clear | |
| `M_MS_Handrail_White` | Balconies | MS handrail (architect's design) | white | Vertical balusters, flat top rail (R17) |
| `M_Tile_GVT_4x2_Beige` | Living, dining, kitchen floors | GVT 4′ × 2′ | `#C1B5A5` | Polished; 1220 × 610 mm grid |
| `M_Tile_WoodGVT_48x8_Walnut` | Bedroom floor | Wooden GVT 48″ × 8″ | `#3C281E` | Plank 1220 × 203 mm |
| `M_Tile_WoodGVT_48x8_Honey` | Balcony floor | Wooden GVT 48″ × 8″ | `#6E4220` | |
| `M_Granite_Corridor` + `M_Granite_Inlay_Black` | Corridor, staircase | Granite | `#83735F` / near-black | Two longitudinal inlay bands (R25) |
| `M_Wall_Int_WarmWhite` | Interior walls | Asian Paints emulsion | `#D1BDA0` (corridor, lit) | |
| `M_Panel_Travertine` | Living / lobby / balcony feature walls | Render-only finish | `#BEB4A5` | Large vertical panels with shadow gaps |
| `M_Wood_Walnut_Fluted` / `_Flat` | TV wall, bed wall, doors | Render-only finish | `#523D2E` / `#472413` | |
| `M_Brass_Brushed` | Lamps, ring pendants, decor | — | brass | |
| `M_Fabric_LightGrey` | Living sofa | — | `#99918A` | |
| `M_Kitchen_Granite_Top` | Kitchen counter | Granite on concrete slab | **unspecified colour** | Kitchen design not in brochure |
| `M_Tile_Kajaria_4x2` / `_2x2` | Bathroom wall / floor | Kajaria GVT | **unspecified colour** | Bathroom design not in brochure |
| `M_Massing_Unknown` | Unseen facades, 5th floor | — | `#9A9A9A` | Flags non-brochure geometry |

---

## 6. Tool-specific setup

### SketchUp
- **Template:** Architectural, feet and inches. Import R07 with *File → Import → Use as image*, then scale it with the Tape Measure tool to 28′4″ on Hall A.
- **Tags:** `L00`–`L07`, `Facade_Front`, `Facade_Side`, `Massing_Unknown`, `Interiors_LOD300`, `Reference_Images`.
- **Components:** model each unit type once, as `UNIT_A`…`UNIT_F`, and instance it four times (L01–L04).
- **Rooms:** set a `brochure_dim` attribute on each room group.
- **Export:** `.skp` (2024+). For the web, export glTF/GLB with an exporter extension, then check the units are metres.

### Revit
- **Levels:** set as in §2, with `H_stilt` as a project parameter (Manage → Project Parameters, Length).
- **Plans:** import each plan raster with *Insert → Image*, then *Scale* using the 28′4″ hall.
- **Walls:** create generic wall types `SPR_Ext_traced` and `SPR_Int_traced`, with thickness taken from the trace and labelled as traced.
- **Rooms:** place Room elements named as in §2. Add shared parameters `Brochure_Dim` (Text) and `Carpet_Area_Printed` (Area, unit level). Schedule the computed room areas next to the printed values.
- **Doors:** create families at the p23 sizes. Windows are a generic family with type parameters `win_w_traced`, `win_sill` and `win_head`.
- **Phasing / Design Options:** put the 5th floor and the unseen facades in a Design Option named `NOT_IN_BROCHURE`.

### Blender
- **Scene:** units Metric, scale 1.0. Add reference images as Image Empties per level, scaled using the calibrated factor.
- **Collections:** `SPR_Stilt`, `SPR_L01`…`SPR_L04`, `SPR_L05_UNKNOWN`, `SPR_Terrace`, `SPR_Facade`, `SPR_Interiors`, `SPR_Cameras`, `SPR_Refs`.
- **Cameras:** `CAM_R01_3q` camera-matched to R01, `CAM_R04_front` (orthographic), and one camera per interior render: `CAM_R14_living`, `CAM_R16_bed`, `CAM_R17_balcony`, `CAM_R25_corridor`, `CAM_R18_lobby`. These let every model view be overlaid on its brochure reference for QA.
- **Materials:** Principled BSDF named exactly as in §5. Use a sun lamp plus Nishita sky for exteriors and an HDRI for interiors.
- **Export:** glTF 2.0 Binary (`.glb`), +Y up, apply modifiers, Draco compression level 6, textures as WebP or KTX2.

### GLB / glTF for the website
- **Budget:** under 150 k triangles for the whole building at LOD 200; under 60 k per interior LOD 300 scene; 2K textures max; total under 15 MB per GLB.
- **Files:** `SPR_exterior_LOD200.glb`, `SPR_typical_floor_LOD200.glb`, `SPR_unitA_LOD300.glb` (unit A matches the 28′4″ hall render), `SPR_stilt.glb`, `SPR_terrace.glb`.
- **Hotspot nodes:** add empty nodes named `HS_<room>` (for example `HS_L01_UA_Hall`) at eye height (1.6 m) for a viewer such as `<model-viewer>` or three.js.
- **Metadata:** in `extras`, write `{ "source": "SP Residency brochure 11-05-2026", "accuracy": "conceptual", "generated_from": ["R07","R08",…] }`.

---

## 7. Validation checklist (before any model is shown publicly)
- [ ] Five residential floors, the stilt and the terrace, matching R01 and R04.
- [ ] Every room dimension matches `unit-geometry.json` within ±3″ (±75 mm).
- [ ] Unit positions and entries match the p15 topology.
- [ ] Facade overlays against R01 (camera-matched) and R04 (orthographic) show no module, bay or louvre-field mismatch.
- [ ] Interior LOD 300 cameras overlay on R14, R16, R17 and R25 with no furniture or panel mismatches.
- [ ] Every non-brochure element (`L05`, unseen facades, traced thicknesses) is tagged and labelled as such.
- [ ] Every file and viewer carries the "Conceptual — based on sales brochure, not for construction" label.

## 8. Information to request from the developer / architect
1. The 5th-floor plan, with the 4 BHK.
2. Site plan with plot boundary, setbacks and parking count.
3. Stilt height, slab thickness, wall thicknesses and parapet height.
4. All four elevations and at least one section.
5. Window schedule.
6. Facade material schedule: louvres, frames, stone-look cladding.
7. Kitchen, bathroom and wardrobe designs, and confirmation on whether a pooja provision exists.
