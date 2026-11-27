#!/usr/bin/env python3
"""
SP Residency - image-generation prompt pack (Phases 3, 4, 6).

    python3 -I sp-residency/scripts/build_prompt_pack.py --out sp-residency

Writes
  prompts/generation-requests.json   - machine-readable: one request per visualisation, with its
                                       reference image(s), model, aspect ratio, preserve/QA lists
  prompts/image-generation-prompts.md - the same pack for people, with reference thumbnails

Design rules baked into every prompt
  * The brochure reference is the geometry. Prompts ask for realism (light, texture, lens) only.
  * Nothing is described that the reference does not show. Unspecified materials are described
    by colour/finish, never by a guessed product or substance.
  * Each request carries a risk level:
      low      - same camera as the reference (enhancement only)
      medium   - new camera inside the same space, limited to surfaces visible in the reference
      high     - view the brochure never shows (model must infer unseen geometry) -> concept-only
      blocked  - no reference at all; nothing is generated
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

REF = {  # reference id -> repo-relative file (from reference/reference-map.json)
    "R01": "reference/exterior/p04-exterior-day-three-quarter-perspective.jpg",
    "R02": "reference/exterior/p28-exterior-dusk-three-quarter-thumbnail.jpg",
    "R03": "reference/exterior/p11-entrance-security-cabin-night.jpg",
    "R04": "reference/elevation/p26-front-elevation-night.jpg",
    "R34": "reference/elevation/p26-entrance-frontage-crop.jpg",
    "R05": "reference/floor-plans/p10-stilt-floor-plan-3d.jpg",
    "R06": "reference/floor-plans/p13-terrace-floor-plan-3d.jpg",
    "R07": "reference/floor-plans/p15-typical-floor-plan.jpg",
    "R08": "reference/floor-plans/p16-unit-type-a-3bhk.jpg",
    "R14": "reference/living-room/p25-living-dining-hall-view.jpg",
    "R15": "reference/dining/p25-dining-zone-crop.jpg",
    "R16": "reference/master-bedroom/p24-bedroom-tropical-leaf-feature-wall.jpg",
    "R17": "reference/balcony/p24-balcony-sit-out.jpg",
    "R18": "reference/amenities/p11-private-lobby.jpg",
    "R19": "reference/amenities/p25-lobby-library-lounge.jpg",
    "R20": "reference/amenities/p11-management-office.jpg",
    "R21": "reference/amenities/p11-coworking-study-room.jpg",
    "R22": "reference/amenities/p12-gym-cardio-zone.jpg",
    "R23": "reference/amenities/p12-gym-strength-zone.jpg",
    "R24": "reference/amenities/p12-rooftop-lounge.jpg",
    "R25": "reference/amenities/p24-typical-floor-corridor.jpg",
    "R32": "reference/specifications/p22-specifications-1.jpg",
}

PHOTO = (
    "Natural, unfiltered professional architectural photograph. Physically accurate light and soft natural "
    "shadows; true-to-life materials with real texture (genuine wood grain, real stone veining, woven fabric "
    "weave, crisp glass reflections); balanced exposure holding detail in highlights and shadows; neutral "
    "white balance; vertical lines kept vertical; subtle real-lens character; correct furniture scale."
)
AVOID = [
    "HDR look, halos or tone-mapping artefacts", "artificial glow or bloom", "oversaturated colour",
    "plastic, waxy or CGI-smooth surfaces", "bent, warped or melted geometry",
    "any added furniture, decor, plants, people, vehicles, signage, text or logos",
    "any change to layout, proportions, openings, counts or materials",
]

EXT_PRESERVE = [
    "stilt level + exactly 5 residential floors + terrace (count the stacked bays)",
    "white projecting box frames around the stacked bays and their wood-tone soffits",
    "copper/teak-tone vertical louvre fields - position, extent and colour",
    "balcony positions, MS vertical-baluster handrails, window mullion patterns",
    "sandstone-look pylon and the teal SP sun monogram / sign mast",
    "cascading planters at the same ledges; rooftop trees",
    "compound wall, gates, boom barriers, security cabin and its signage",
]

S = "seedream_5_5"      # edit-preserving model: best for same-camera enhancement
N = "nano_banana_pro"   # multi-reference model: used for relights / new cameras

REQUESTS: list[dict] = [
    # ======================================================== PHASE 3 - EXTERIOR
    dict(id="EXT-01", phase=3, category="elevation", title="Main front elevation - night (enhanced)",
         refs=[("R04", "geometry + composition")], model=S, aspect="3:2", risk="low",
         prompt="Enhance this exact night photograph of the front (road-facing) elevation of Shan Poornam Residence, "
                "Madurai, keeping the identical frontal camera, framing and every architectural element. Blue-hour "
                "sky with the last light on the horizon; warm 2700-3000K interior light behind sheer curtains in the "
                "occupied bays; copper/teak louvres catching soft uplight; white bay frames reading clean but not "
                "glowing; teal signage over the security cabin lit at a realistic brightness; wet-free asphalt with "
                "faint reflections; street lamp at left. " + PHOTO,
         preserve=EXT_PRESERVE, web="elevation/sp-front-elevation-night-enhanced.webp"),
    dict(id="EXT-02", phase=3, category="elevation", title="Main front elevation - daylight relight",
         refs=[("R04", "geometry + composition (primary)"), ("R01", "daylight materials and colour")],
         model=N, aspect="3:2", risk="medium",
         prompt="Re-light the building in the first reference image to natural late-morning daylight, using the second "
                "reference only to match daylight material colours (white frames, warm grey walls, copper/teak "
                "louvres, sandstone-look pylon). Keep the first image's frontal camera, framing, building geometry, "
                "bay count, louvre fields, planters, rooftop trees, sign mast, compound wall, gates and security "
                "cabin exactly. Clear sky with light haze, sun from the upper left, soft shadows under each bay frame "
                "and balcony slab, interiors darker than the sky as in real daylight. " + PHOTO,
         preserve=EXT_PRESERVE, web="elevation/sp-front-elevation-day.webp",
         notes="Lighting change only. Reject if any floor, bay or louvre field differs from R04."),
    dict(id="EXT-03", phase=3, category="exterior", title="Three-quarter perspective - day (enhanced)",
         refs=[("R01", "geometry + composition")], model=S, aspect="16:9", risk="low",
         prompt="Enhance this exact daylight three-quarter photograph of Shan Poornam Residence, keeping the same low "
                "street-level camera, framing and all architecture. Late-morning sun from the left, soft blue sky "
                "with light cloud; crisp shadow lines under every white bay frame and balcony slab; louvres keep "
                "their exact copper/teak colour with a matte finish; clear glazing reflecting sky and trees with "
                "visible interior depth; real leaves on the framing trees; stone texture on the rubble compound wall. "
                + PHOTO,
         preserve=EXT_PRESERVE, web="exterior/sp-exterior-day-3q-enhanced.webp"),
    dict(id="EXT-04", phase=3, category="exterior", title="Three-quarter perspective - dusk",
         refs=[("R01", "geometry + composition (primary)"), ("R02", "dusk lighting only")], model=N, aspect="16:9",
         risk="medium",
         prompt="Re-light the building in the first reference image to dusk, matching the time of day, sky colour and "
                "warm window glow of the second (small) reference. Keep the first image's camera, framing, building "
                "geometry, bay count, louvres, pylon with SP monogram, planters, trees and compound wall exactly. "
                "Soft violet-to-peach sky, warm interior light in some bays, gentle facade uplight. " + PHOTO,
         preserve=EXT_PRESERVE, web="exterior/sp-exterior-dusk-3q.webp",
         notes="R02 is 245 px - lighting reference only, never geometry."),
    dict(id="EXT-05", phase=3, category="elevation", title="Side elevation", refs=[], model=None, aspect=None,
         risk="blocked", prompt=None, preserve=[], web=None,
         notes="BLOCKED. The brochure contains no side or rear elevation. R01 shows one side obliquely only; an "
               "orthographic side elevation would require inventing it. Needs the architect's elevation drawing."),
    dict(id="EXT-06", phase=3, category="entrance", title="Building entrance - security cabin (enhanced)",
         refs=[("R03", "geometry + composition")], model=S, aspect="16:9", risk="low",
         prompt="Enhance this exact night photograph of the residence entrance: glazed security cabin with the "
                "illuminated teal 'Shan Poornam Residence by ENS' lettering, timber-slat base, stilt parking beyond "
                "with black-and-yellow hazard-striped columns and red sprinkler mains under a dark soffit, white bay "
                "frames and louvres above. Keep camera, framing and the existing person and car unchanged in position. "
                "Realistic signage brightness, warm cabin interior light, cool ambient night, real tyre and paint "
                "reflections, concrete paving texture. " + PHOTO,
         preserve=["cabin size, glazing and signage text/position", "column positions and hazard striping",
                   "sprinkler mains", "facade elements above"],
         web="entrance/sp-entrance-security-cabin-enhanced.webp"),
    dict(id="EXT-07", phase=3, category="entrance", title="Entrance frontage - dusk (enhanced crop)",
         refs=[("R34", "geometry + composition"), ("R04", "context for the uncropped building")], model=S,
         aspect="21:9", risk="low",
         prompt="Enhance this exact street-level frontage of Shan Poornam Residence at blue hour: illuminated security "
                "cabin with teal signage, timber-look compound wall, boom barrier, stilt parking entry with "
                "hazard-striped columns, the lowest residential floors with white bay frames, copper louvres and "
                "trailing planters. Keep framing and all elements; realistic light falloff on the pavement, warm "
                "interior glow, natural sky gradient. " + PHOTO,
         preserve=["cabin, signage, boom barrier and wall positions", "column count in view", "facade above"],
         web="entrance/sp-entrance-frontage-dusk.webp"),
    dict(id="EXT-08", phase=3, category="lobby", title="Apartment lobby (enhanced)",
         refs=[("R18", "geometry + composition")], model=S, aspect="16:9", risk="low",
         prompt="Enhance this exact photograph of the private lobby: travertine-look wall panels, grey lift door, "
                "timber restroom door, mustard and ivory bucket chairs on wire legs, walnut coffee table and "
                "console, woven rattan pendant, horizontal-stripe frosted glass partition, exposed soffit with red "
                "sprinkler mains, walnut floor meeting polished white tiles. Same camera and layout. Soft daylight "
                "from the glazing mixed with warm pendant light; real travertine pores and veining; visible "
                "upholstery weave; believable reflections in the polished tile. " + PHOTO,
         preserve=["every furniture piece and its position", "lift and restroom doors", "pendant",
                   "striped glass", "exposed services"],
         web="lobby/sp-lobby-enhanced.webp"),
    dict(id="EXT-09", phase=3, category="lobby", title="Lobby lounge / library (enhanced)",
         refs=[("R19", "geometry + composition")], model=S, aspect="16:9", risk="low",
         prompt="Enhance this exact photograph of the lobby lounge and library: charcoal leather sofas and armchair, "
                "walnut floor with a slim LED edge stepping down to a polished white tile walkway, backlit walnut "
                "and black-metal bookshelf, rattan-detailed side cabinets, woven pendant, striped frosted glazing, "
                "tall travertine-look panels with shadow gaps, exposed grey soffit with cassette AC. Same camera and "
                "layout. Soft daylight, warm shelf lighting, natural leather creasing, real stone texture. " + PHOTO,
         preserve=["sofa/armchair positions", "bookshelf grid and contents layout", "floor transition",
                   "panel joints", "ceiling services"],
         web="lobby/sp-lobby-library-lounge-enhanced.webp",
         notes="R19 is uncaptioned in the brochure (assumption A2)."),
    dict(id="EXT-10", phase=3, category="amenities", title="Parking & access - stilt cut-away (enhanced)",
         refs=[("R05", "geometry + composition")], model=S, aspect="16:9", risk="low",
         prompt="Enhance this exact 3D cut-away of the stilt floor as a photoreal architectural model photograph: "
                "same high oblique camera, same parking layout with yellow bay lines, two-way drive aisle with arrows, "
                "lobby block with lobby, management office, co-working and library, playground in the far corner, "
                "perimeter garden strips, security cabin and utilities, compound wall and gates. Soft overhead "
                "daylight, realistic asphalt, paving, foliage and car paint; keep the teal gradient backdrop. " + PHOTO,
         preserve=["all bay positions and markings", "lobby block plan", "playground equipment layout",
                   "entry/exit openings and cabin", "number and position of drawn cars"],
         web="amenities/sp-stilt-plan-3d-enhanced.webp"),
    dict(id="EXT-11", phase=3, category="entrance", title="Parking & access - eye-level stilt drive (NEW VIEW)",
         refs=[("R03", "stilt materials: soffit, columns, striping"), ("R05", "stilt layout")], model=N,
         aspect="16:9", risk="high",
         prompt="Eye-level photograph standing just inside the south-east vehicle entrance of the stilt parking of the "
                "building in the references, looking north along the two-way central drive aisle. Use only what the "
                "references show: dark soffit with red sprinkler mains, columns with black-and-yellow hazard bands, "
                "yellow-lined bays either side, direction arrows on the asphalt, the glazed lobby block on the left. "
                "Soft daylight from the open perimeter. " + PHOTO,
         preserve=["aisle direction and width relative to bays", "lobby block on the west side"],
         web=None,
         notes="CONCEPT ONLY - not for publication without client approval. The brochure never shows this view; "
               "column grid, ceiling height and lobby facade will be inferred by the model."),
    dict(id="EXT-12", phase=3, category="amenities", title="Terrace & amenities - terrace cut-away (enhanced)",
         refs=[("R06", "geometry + composition")], model=S, aspect="4:3", risk="low",
         prompt="Enhance this exact 3D cut-away of the terrace level as a photoreal architectural model photograph: "
                "same camera; timber-deck rooftop lounge with dining tables, outdoor lounge benches, BBQ counter "
                "against a stone-tile wall, foosball games corner, glazed gym with equipment and mural, outdoor yoga "
                "lawn with three loungers, perimeter terrace-garden planting, open light-well. Soft late-afternoon "
                "light, real timber grain, real turf, real foliage; keep the teal gradient backdrop. " + PHOTO,
         preserve=["every zone boundary and its numbered position (10-16)", "furniture counts", "light-well"],
         web="amenities/sp-terrace-plan-3d-enhanced.webp"),
    dict(id="EXT-13", phase=3, category="exterior", title="Aerial perspective - high oblique (NEW VIEW)",
         refs=[("R01", "front + side facades (primary)"), ("R04", "front facade + rooftop"),
               ("R06", "terrace layout")], model=N, aspect="16:9", risk="high",
         prompt="High oblique aerial photograph from the same side as the first reference, roughly 30 degrees down, "
                "showing the front facade, the same side facade, and the terrace level of Shan Poornam Residence. "
                "Facades exactly as in the first two references; terrace exactly as in the third (timber deck, "
                "glazed gym, yoga lawn, perimeter planting, light-well). Natural daylight, real neighbourhood "
                "rooftops and trees kept low-detail and generic. " + PHOTO,
         preserve=EXT_PRESERVE + ["terrace zoning from R06"], web=None,
         notes="CONCEPT ONLY - the brochure has no aerial; surrounding context and roof edges will be inferred. "
               "Do not show the rear or the far side facade."),
    # ======================================================== PHASE 4 - INTERIORS
    dict(id="LIV-01", phase=4, category="living", title="Living - main wide view (enhanced)",
         refs=[("R14", "geometry + composition")], model=S, aspect="16:9", risk="low",
         prompt="Enhance this exact photograph of the apartment hall: living zone in front, dining under a walnut-clad "
                "bulkhead, window with white sheers and taupe drapes at the far end. Keep camera, layout, furniture "
                "and finishes: large-format travertine-look panels on the left wall, dark-walnut framed openings and "
                "doors, vertical fluted dark-walnut TV wall with wall-hung TV, black-metal floor-to-ceiling rod "
                "shelving with backlit shelves and brass objects, floating walnut console with smoked fluted-glass "
                "shutters, light-grey sofa with grey and brown cushions, grey tub armchair, jute flat-weave rug, "
                "white hydrangeas, two white ceiling fans, recessed downlights, light beige polished floor tiles. "
                "Soft daylight through the sheers, gentle bounce light, subtle tile reflections. " + PHOTO,
         preserve=["hall proportion (long and narrow)", "TV wall, shelving and console design",
                   "sofa/armchair/rug positions", "bulkhead, fans, downlights", "panel joints and door positions"],
         web="living/sp-living-main.webp"),
    dict(id="LIV-02", phase=4, category="living", title="Living - secondary three-quarter view",
         refs=[("R14", "design + materials")], model=N, aspect="4:5", risk="medium",
         prompt="Three-quarter photograph of the same living room, camera at seated eye level near the left wall "
                "looking diagonally across to the fluted dark-walnut TV wall, the black-metal rod shelving with "
                "backlit shelves and brass objects, the floating walnut console with smoked fluted glass, the "
                "light-grey sofa and grey tub armchair in the foreground, and the dining zone and curtained window "
                "beyond. Only surfaces visible in the reference; identical materials and furniture. Soft daylight. "
                + PHOTO,
         preserve=["TV-wall composition (TV, shelving left, console below)", "furniture design and colours"],
         web="living/sp-living-secondary.webp",
         notes="New camera inside the same room; restricted to surfaces shown in R14."),
    dict(id="LIV-03", phase=4, category="living", title="Living - material detail",
         refs=[("R14", "material source")], model=N, aspect="4:5", risk="low",
         prompt="Close-up architectural detail photograph from the same living room: vertical fluted dark-walnut "
                "panelling with real grain, the black-metal rod shelf with a warm LED-lit shelf and a brushed-brass "
                "sculptural object, and the corner of the walnut console with smoked fluted-glass shutter below. "
                "Shallow depth of field, soft side light raking across the flutes. " + PHOTO,
         preserve=["flute width and orientation", "walnut tone", "black metal + brass combination"],
         web="living/sp-living-detail.webp"),
    dict(id="DIN-01", phase=4, category="dining", title="Dining - main view toward the window",
         refs=[("R15", "dining zone (low-res crop)"), ("R14", "context and materials")], model=N, aspect="4:5",
         risk="medium",
         prompt="Photograph of the dining zone at the window end of the same apartment hall: oval glass-top dining "
                "table with taupe upholstered shell chairs on dark legs, dried-flower centrepiece, walnut-clad "
                "bulkhead above, full-height window with white sheers and taupe drapes opening to a balcony with "
                "white vertical balusters, split AC and white ceiling fan, light beige polished floor tiles, white "
                "walls with small framed art. Soft daylight through the sheers. " + PHOTO,
         preserve=["chair and table type/colour", "window, drapes, AC and bulkhead arrangement"],
         web="dining/sp-dining-main.webp",
         notes="Only source is a 230 px crop; table base and chair details will be partly inferred - review closely."),
    dict(id="DIN-02", phase=4, category="dining", title="Dining - secondary / detail", refs=[], model=None,
         aspect=None, risk="blocked", prompt=None, preserve=[], web=None,
         notes="BLOCKED. Only one distant dining view exists; any other angle or close-up would invent the dining "
               "furniture design."),
    dict(id="BED-01", phase=4, category="bedrooms", title="Master bedroom - main wide view (enhanced)",
         refs=[("R16", "geometry + composition")], model=S, aspect="1:1", risk="low",
         prompt="Enhance this exact bedroom photograph: bed wall wrapping the right-hand corner with dark-walnut "
                "panelling to dado height and four walnut-framed panels of an illustrated tropical-leaf mural "
                "(beige, ochre and brown leaves, one leopard-spotted) with concealed cove light; cream upholstered "
                "headboard, taupe bedding, rust cushions; walnut bedside units with brass-base lamps and white "
                "shades; dark wide-plank walnut-look floor; grey-ivory textured rug; tan lounge chair with throw by "
                "the window; walnut box niches on the left wall; white sheers and taupe drapes; white ceiling fan; "
                "recessed downlights. Same camera and layout. Soft window daylight from the left, warm lamp and cove "
                "light. " + PHOTO,
         preserve=["mural panel count, framing and leaf design", "panelling height", "bed, bedside, lamp design",
                   "floor plank direction", "chair, niches, fan, downlights"],
         web="bedrooms/sp-master-bedroom-main.webp"),
    dict(id="BED-02", phase=4, category="bedrooms", title="Master bedroom - secondary three-quarter view",
         refs=[("R16", "design + materials")], model=N, aspect="4:5", risk="medium",
         prompt="Three-quarter photograph of the same bedroom from beside the window and lounge chair, looking "
                "diagonally toward the bed wall and its wrap-around corner: walnut dado panelling, framed "
                "tropical-leaf mural panels with cove light, cream headboard, taupe bedding with rust cushions, "
                "walnut bedside unit and brass lamp, dark plank floor and textured rug. Only surfaces visible in the "
                "reference. Soft daylight from behind the camera. " + PHOTO,
         preserve=["mural design and framing", "corner wrap of the panelling", "bed and bedside design"],
         web="bedrooms/sp-master-bedroom-secondary.webp"),
    dict(id="BED-03", phase=4, category="bedrooms", title="Master bedroom - material detail",
         refs=[("R16", "material source")], model=N, aspect="4:5", risk="low",
         prompt="Close-up detail photograph from the same bedroom: one framed tropical-leaf mural panel meeting the "
                "dark-walnut dado panelling, the walnut bedside unit with its brass-base lamp lit, and the edge of "
                "the cream upholstered headboard. Cove light grazing the mural, real walnut grain, fabric texture. "
                + PHOTO,
         preserve=["mural leaf style and palette", "walnut tone", "lamp design"],
         web="bedrooms/sp-master-bedroom-detail.webp"),
    dict(id="BAL-01", phase=4, category="balcony", title="Balcony - main view (enhanced)",
         refs=[("R17", "geometry + composition")], model=S, aspect="16:9", risk="low",
         prompt="Enhance this exact balcony photograph: honey-toned wood-look floor tiles, travertine-look wall "
                "cladding both sides, sculptural face-mask wall art, wall-mounted wood-tone planter boxes with "
                "trailing greens, two beige upholstered lounge chairs on slim brass frames with mustard cushions, "
                "round fluted pedestal side table with two cups, white vertical-baluster handrail with a flat top "
                "rail, charcoal soffit, neighbouring building and trees beyond. Same camera. Soft morning daylight. "
                + PHOTO,
         preserve=["chair, table and planter design/positions", "baluster spacing", "wall art", "view beyond"],
         web="balcony/sp-balcony-main.webp"),
    dict(id="BAL-02", phase=4, category="balcony", title="Balcony - secondary view along the sit-out",
         refs=[("R17", "design + materials")], model=N, aspect="4:5", risk="medium",
         prompt="Photograph along the same balcony from beside the face-mask wall art, looking toward the two lounge "
                "chairs, fluted side table, the planter-box wall and the white baluster handrail with trees beyond. "
                "Only elements visible in the reference. Morning daylight. " + PHOTO,
         preserve=["furniture design", "planter wall", "handrail design"],
         web="balcony/sp-balcony-secondary.webp"),
    dict(id="BAL-03", phase=4, category="balcony", title="Balcony - material detail",
         refs=[("R17", "material source")], model=N, aspect="4:5", risk="low",
         prompt="Close-up of the balcony lounge chair: beige upholstery with a mustard cushion on a slim brass frame, "
                "the fluted pedestal side table with two cups, and the honey wood-look floor tile. Soft daylight, "
                "shallow depth of field. " + PHOTO,
         preserve=["chair frame and colours", "table fluting"], web="balcony/sp-balcony-detail.webp"),
    dict(id="COR-01", phase=4, category="amenities", title="Corridor - main view (enhanced)",
         refs=[("R25", "geometry + composition")], model=S, aspect="1:1", risk="low",
         prompt="Enhance this exact one-point-perspective photograph of the residential corridor: grey speckled "
                "granite floor with two black-granite inlay bands, black skirting, cream walls, dark-walnut doors "
                "with brass number plates, white wall-mounted cabinets beside the doors, raised false-ceiling tray "
                "with perimeter cove light, brass ring pendants and downlights, window to greenery at the end. Same "
                "camera. Real granite speckle and polish, warm 3000K cove light balanced with daylight from the end "
                "window. " + PHOTO,
         preserve=["corridor length and vanishing point", "door and cabinet rhythm", "pendant count",
                   "inlay band positions"],
         web="amenities/sp-corridor-main.webp"),
    dict(id="COR-02", phase=4, category="amenities", title="Corridor - landscape web format",
         refs=[("R25", "geometry + composition")], model="flux_2_pro_outpaint", aspect="16:9", risk="medium",
         prompt="Extend the corridor photograph left and right only with the same cream walls, black skirting, "
                "granite floor and ceiling tray. No new doors, fixtures or objects.",
         preserve=["original pixels unchanged"], web="amenities/sp-corridor-wide.webp",
         notes="Outpaint side walls to 16:9 for web banners (expand_left/expand_right ~ 200 px each)."),
    dict(id="COR-03", phase=4, category="amenities", title="Corridor - material detail",
         refs=[("R25", "material source")], model=N, aspect="4:5", risk="low",
         prompt="Upward detail photograph of the same corridor ceiling: brass ring pendant hanging in the raised "
                "false-ceiling tray with warm perimeter cove light and a downlight; and a matching floor detail of "
                "the grey speckled granite meeting the black-granite inlay band and black skirting. " + PHOTO,
         preserve=["ring pendant design", "cove detail", "granite colours"], web="amenities/sp-corridor-detail.webp"),
    # ======================================================== AMENITIES
    dict(id="AME-01", phase=4, category="amenities", title="Management office (enhanced)",
         refs=[("R20", "geometry + composition")], model=S, aspect="16:9", risk="low",
         prompt="Enhance this exact photograph of the management office: light-grey fluted wall panel with a framed "
                "botanical sketch, white desk with all-in-one computer, two black mesh task chairs, full-height walnut "
                "bookshelf with backlit shelves, striped frosted glass partition, timber door with long brass pull, "
                "white large-format floor tiles. Same camera and layout. Soft daylight. " + PHOTO,
         preserve=["furniture positions", "bookshelf design", "partition and door"],
         web="amenities/sp-management-office.webp"),
    dict(id="AME-02", phase=4, category="amenities", title="Co-working / study room (enhanced)",
         refs=[("R21", "geometry + composition")], model=S, aspect="16:9", risk="low",
         prompt="Enhance this exact photograph of the co-working room: three workstations on a white worktop, "
                "light-oak overhead cabinets and pedestal drawers, black mesh chairs, monitors, travertine-look wall "
                "tiles, striped frosted glazing, window at left. Same camera and layout. Soft daylight. " + PHOTO,
         preserve=["three-station layout", "cabinet module count", "glazing film"],
         web="amenities/sp-coworking.webp"),
    dict(id="AME-03", phase=4, category="amenities", title="Gym - cardio zone (enhanced)",
         refs=[("R22", "geometry + composition")], model=S, aspect="16:9", risk="low",
         prompt="Enhance this exact gym photograph: light wood-look floor, grey walls, crossing linear LED strips and "
                "recessed spots on the ceiling, ellipticals and treadmills along a glazed wall with horizontal blinds "
                "and planting outside, glass door. Same camera and equipment. Warm afternoon sun through the blinds "
                "casting real slatted shadows. " + PHOTO,
         preserve=["equipment count and positions", "ceiling LED pattern", "door and glazing"],
         web="amenities/sp-gym-cardio.webp"),
    dict(id="AME-04", phase=4, category="amenities", title="Gym - strength zone (enhanced)",
         refs=[("R23", "geometry + composition")], model=S, aspect="16:9", risk="low",
         prompt="Enhance this exact gym photograph: large bodybuilder wall mural, multi-station machine, benches with "
                "orange upholstery, dumbbell rack, yellow and grey Swiss balls, wood-look floor, crossing LED ceiling "
                "strips, glazing with planting. Same camera and equipment. Warm afternoon sun. " + PHOTO,
         preserve=["mural", "equipment layout", "ceiling pattern"], web="amenities/sp-gym-strength.webp"),
    dict(id="AME-05", phase=4, category="amenities", title="Rooftop lounge (enhanced)",
         refs=[("R24", "geometry + composition")], model=S, aspect="16:9", risk="low",
         prompt="Enhance this exact rooftop lounge photograph: covered timber deck under a dark soffit with "
                "downlights, slate/sandstone tile feature wall with clock, BBQ counter with tan leather bar stools, "
                "carved walnut cabinet, two dining tables with ivory shell chairs and flowers, foosball table, glazed "
                "gym beyond, stone wall with the existing logo, tropical planters, timber benches. Keep camera, "
                "furniture and the existing people unchanged. Golden-hour light, real deck grain. " + PHOTO,
         preserve=["furniture and people positions", "tile wall pattern", "planters", "logo wall as-is"],
         web="amenities/sp-rooftop-lounge.webp"),
    dict(id="AME-06", phase=4, category="amenities", title="Rooftop lounge - material detail",
         refs=[("R24", "material source")], model=N, aspect="4:5", risk="low",
         prompt="Close-up from the same rooftop lounge: the slate/sandstone tile feature wall behind the BBQ counter, "
                "tan leather bar stools, the timber deck underfoot. Golden-hour side light raking the stone. " + PHOTO,
         preserve=["tile colours and pattern", "stool design"], web="amenities/sp-rooftop-detail.webp"),
    dict(id="AME-07", phase=4, category="lobby", title="Lobby - material detail",
         refs=[("R18", "material source"), ("R19", "material source")], model=N, aspect="4:5", risk="low",
         prompt="Close-up detail from the lobby: woven rattan pendant in front of the horizontal-stripe frosted glass, "
                "travertine-look wall panel with shadow gap, and the walnut-to-white-tile floor transition with its "
                "slim LED edge. Soft daylight. " + PHOTO,
         preserve=["pendant weave", "stripe film spacing", "panel joint"], web="lobby/sp-lobby-detail.webp"),
    # ======================================================== GAPS (not generated)
    dict(id="KIT-00", phase=4, category="kitchen", title="Kitchen", refs=[("R32", "specification only"),
                                                                         ("R08", "plan only")],
         model=None, aspect="4:5", risk="blocked",
         prompt="DRAFT - DO NOT RUN WITHOUT A CLIENT DESIGN BRIEF. Kitchen of a Shan Poornam Residence 3BHK "
                "(10' x 12'4\" incl. utility): L-shaped counter of concrete slab finished in granite, premium "
                "single-bowl sink with Kohler faucet, hob on the external wall with a window, 4' x 2' glazed vitrified "
                "wall tiles, 4' x 2' light beige floor tiles, door to a 4'6\" x 8' service yard. Cabinet design, "
                "colours and appliances are NOT defined in the brochure.",
         preserve=[], web=None,
         notes="BLOCKED. No kitchen render in the brochure. The draft lists only specified facts; generating it "
               "would invent cabinetry and finishes."),
    dict(id="BTH-00", phase=4, category="bathrooms", title="Bathroom", refs=[("R32", "specification only")],
         model=None, aspect="4:5", risk="blocked",
         prompt="DRAFT - DO NOT RUN WITHOUT A CLIENT DESIGN BRIEF. 4'6\" x 8' bathroom: Kohler wall-hung WC, basin and "
                "CP fittings, Kajaria 4' x 2' glazed vitrified wall tiles, 2' x 2' floor tiles, toughened-glass "
                "shower partition, geyser point. Tile colours, vanity and mirror design are NOT defined in the brochure.",
         preserve=[], web=None, notes="BLOCKED. No bathroom render in the brochure."),
    dict(id="POO-00", phase=4, category="pooja", title="Pooja room", refs=[], model=None, aspect=None,
         risk="blocked", prompt=None, preserve=[], web=None,
         notes="BLOCKED. No pooja room, unit or niche appears anywhere in the brochure."),
    dict(id="BED-90", phase=4, category="bedrooms", title="Secondary bedrooms / wardrobes", refs=[], model=None,
         aspect=None, risk="blocked", prompt=None, preserve=[], web=None,
         notes="BLOCKED. Only one bedroom design is shown; wardrobes appear only as plan symbols."),
    dict(id="LOC-00", phase=9, category="location", title="Location visualisation", refs=[], model=None,
         aspect=None, risk="blocked", prompt=None, preserve=[], web=None,
         notes="No AI imagery: a generated neighbourhood would be fiction. The website renders the brochure's "
               "distance data as a typographic panel, and the original map (R28) is available as a reference."),
]

UPSCALE_FIRST = [
    "R01", "R04", "R03", "R18", "R19", "R14", "R16", "R17", "R25", "R20", "R21", "R22", "R23", "R24",
]

COSTS = {  # Higgsfield quotes taken 27 Nov 2026 via estimate_image_cost
    "seedream_5_5": "2.5 credits per image (4k, 16:9)",
    "nano_banana_pro": "4 credits per image (4k, 16:9)",
    "gpt_image_2_6": "2 credits per image (high quality, 2k, 16:9)",
}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True, type=Path)
    out: Path = ap.parse_args().out.resolve()
    pdir = out / "prompts"
    pdir.mkdir(parents=True, exist_ok=True)

    reqs = []
    for r in REQUESTS:
        item = {
            "id": r["id"], "phase": r["phase"], "category": r["category"], "title": r["title"],
            "risk": r["risk"],
            "status": ("blocked" if r["risk"] == "blocked"
                       else "concept-only" if r["risk"] == "high" else "ready-to-generate"),
            "model": r["model"], "aspect_ratio": r["aspect"],
            "resolution": ("4k" if r["model"] in (S, N) else None),
            "reference_images": [{"ref_id": rid, "file": REF[rid], "role": role,
                                  "higgsfield_media_role": "image_references"} for rid, role in r["refs"]],
            "prompt": r["prompt"],
            "must_preserve": r["preserve"],
            "avoid": AVOID if r["prompt"] and r["risk"] != "blocked" else [],
            "qa_checklist": ([
                "Overlay output on the reference at 50% opacity: no moved edges, openings or furniture",
                "Count floors / bays / furniture pieces against the reference",
                "Compare material colours side by side under the same exposure",
                "Reject on any invented element; regenerate with the deviation named in the prompt",
            ] if r["risk"] not in ("blocked",) else []),
            "output": {
                "raw": f"generated/{r['category']}/{r['id']}.png" if r["risk"] != "blocked" else None,
                "website": f"public/images/sp-residency/{r['web']}" if r["web"] else None,
            },
            "notes": r.get("notes"),
            "generated": False,
        }
        reqs.append(item)

    ready = [x for x in reqs if x["status"] == "ready-to-generate"]
    concept = [x for x in reqs if x["status"] == "concept-only"]
    blocked = [x for x in reqs if x["status"] == "blocked"]
    pack = {
        "_about": "SP Residency image-generation pack. Nothing in it has been generated yet (generated: false).",
        "generation_status": "NOT RUN - Higgsfield account balance was 0 credits on 27 Nov 2026",
        "cost_quotes": COSTS,
        "recommended_order": [
            "1. Tier 0 - faithful upscale (upscale_image) of the originals listed in upscale_first_ref_ids",
            "2. All low-risk enhancement requests (same camera as the brochure)",
            "3. Medium-risk relights / secondary views, after Tier 2 approval",
            "4. Concept-only views for internal review only",
        ],
        "upscale_first_ref_ids": UPSCALE_FIRST,
        "counts": {"ready": len(ready), "concept_only": len(concept), "blocked": len(blocked)},
        "shared_photography_standard": PHOTO,
        "shared_avoid_list": AVOID,
        "requests": reqs,
    }
    (pdir / "generation-requests.json").write_text(json.dumps(pack, indent=2, ensure_ascii=False) + "\n")

    # ---------------------------------------------------------------- markdown
    md = ["# SP Residency - image-generation prompts", "",
          "> **Status: not generated.** The connected Higgsfield account had **0 credits** when this pack was "
          "built (27 Nov 2026), so no image was generated. Every request below is ready to run "
          "(`generation-requests.json` is the machine-readable version). Nothing on the website claims to be "
          "generated.", "",
          f"**{len(ready)} ready** - **{len(concept)} concept-only** (views the brochure never shows) - "
          f"**{len(blocked)} blocked** (no brochure reference).", "",
          "## How to run", "",
          "1. Upload each reference image (`media_upload` + `media_confirm`, or your tool's image input).",
          "2. Send the prompt with the reference(s) as **image references**, the listed model and aspect ratio.",
          "3. Save output to the `output.raw` path, run the QA checklist against the reference, then approve.",
          "4. Approved images: convert with `scripts/build_web_assets.py --generated` (WebP) and set "
          "`status: generated`, `approval: approved` in the manifest.", "",
          "Cost quotes (Higgsfield, 27 Nov 2026): " + "; ".join(f"`{k}` {v}" for k, v in COSTS.items()) + ".",
          f" Running all {len(ready)} ready requests at 4k costs roughly "
          f"{sum(2.5 if x['model'] == S else 4 if x['model'] == N else 1 for x in ready):.0f} credits.", "",
          "**Recommended first step (Tier 0):** a faithful upscale of the original renders "
          f"({', '.join(UPSCALE_FIRST)}). It is the lowest-risk way to get web-resolution images, because the "
          "brochure interiors are only 700-1000 px wide.", "",
          "### Shared photography standard (appended to every prompt)", "", f"> {PHOTO}", "",
          "### Shared avoid list", ""] + [f"- {a}" for a in AVOID] + [""]

    phase_names = {3: "Phase 3 - Exterior", 4: "Phase 4 - Interiors & amenities", 9: "Location"}
    current = None
    for x, r in zip(reqs, REQUESTS):
        if r["phase"] != current:
            current = r["phase"]
            md += [f"## {phase_names[current]}", ""]
        badge = {"ready-to-generate": "READY", "concept-only": "CONCEPT ONLY", "blocked": "BLOCKED"}[x["status"]]
        md += [f"### {x['id']} - {x['title']}  `{badge}` `risk: {x['risk']}`", ""]
        if x["reference_images"]:
            md.append("| Reference | Role |")
            md.append("|---|---|")
            for ri in x["reference_images"]:
                md.append(f"| ![{ri['ref_id']}](../{ri['file']}) <br>`{ri['ref_id']}` `{ri['file']}` | {ri['role']} |")
            md.append("")
        if x["model"]:
            md.append(f"**Model:** `{x['model']}` - **Aspect:** {x['aspect_ratio']} - **Resolution:** "
                      f"{x['resolution'] or 'source'}")
            md.append("")
        if x["prompt"]:
            md += ["```text", x["prompt"], "```", ""]
        if x["must_preserve"]:
            md.append("**Must preserve:** " + "; ".join(x["must_preserve"]) + ".")
            md.append("")
        if x["notes"]:
            md.append(f"**Note:** {x['notes']}")
            md.append("")
        if x["output"]["raw"]:
            md.append(f"Output -> `{x['output']['raw']}`" +
                      (f" -> web `{x['output']['website']}`" if x["output"]["website"] else " (not for web)"))
            md.append("")
    (pdir / "image-generation-prompts.md").write_text("\n".join(md))
    print(f"ready={len(ready)} concept={len(concept)} blocked={len(blocked)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
