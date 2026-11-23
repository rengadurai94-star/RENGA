# BOXES — Interactive 3D Apartment Experience

A cinematic, explorable 3D website for **BOXES**, a *conceptual* 8-floor residential tower in
**Surya Nagar, Madurai, Tamil Nadu**: 32 residences (2, 3, 4 and 5 BHK), four per floor, each
facing a different direction.

> **Prototype notice.** All layouts, dimensions, areas, specifications, amenities and imagery are
> illustrative placeholders generated for this demo. They are **not** approved project information.
> Every unconfirmed value is marked "To be confirmed" in the UI and lives in one config file.

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Production build:

```bash
npm run build && npm start
```

Requires Node 20+ and a browser with WebGL (any recent Chrome, Edge, Safari or Firefox).
A dedicated or integrated GPU is recommended; software rendering works but is slow.

## What's in the experience

1. **Cinematic intro** — loader, clouds part to reveal the tower, the camera glides in, then
   *BOXES · Surya Nagar, Madurai* and an **Enter experience** button.
2. **3D tower** — procedurally generated building: 8 floors around a stone-clad core, white
   "box" frames, bronze window surrounds, glass balconies, stilt-level lobby, landscaped plot,
   rooftop pool and pergola, a low-rise neighbourhood, sun shadows and soft environment light.
3. **Scroll-driven floor journey** (GSAP ScrollTrigger + Lenis) — the first scroll focuses
   floor 1, the next floor 2 … up to floor 8. The focused floor slides out, floors above lift
   and ghost, its walls drop to waist height to reveal a furnished cutaway, and the camera
   spirals up the tower. Scrolling back reverses it. An elevator-style indicator on the right
   jumps to any floor; in the overview you can also click a floor on the model.
4. **Four units per floor** — hover a unit (in 3D or in the floor panel) to highlight it; click
   to zoom in. The unit panel shows unit number, BHK, facing, placeholder area, bedrooms,
   bathrooms, balconies and a conceptual floor plan.
5. **Walk inside** — *Enter apartment* dives the camera into the balcony and fades into a
   furnished, navigable 3D interior: living, dining, kitchen, bedrooms, baths, balconies (plus
   pooja, lounge, media, study, dressing where the plan has them). Move between rooms with the
   room bar, the floor rings or the live minimap; **drag** to look, **W A S D / arrows** to walk
   (with collisions), **scroll** to zoom, or switch to the **Dollhouse** view. Sunlight comes from
   the real direction relative to each unit's facing. **Exit apartment** (or `Esc`) returns to
   the floor.
6. **Website sections** — Overview, Location, Amenities, Apartment configurations (with
   "Explore in 3D" / "Walk inside" shortcuts), Specifications, Gallery (stills captured from the
   model) and an Enquiry form posting to `/api/enquiry`.

### Deep links

| URL | Opens |
| --- | --- |
| `/?floor=3` | Floor 3 in the journey |
| `/?unit=302` | Residence 302 (floor 3, unit B) |
| `/?unit=302&enter=1` | Inside residence 302 |
| `/?unit=403&room=kitchen` | Straight to a room |
| `/?unit=704&view=dollhouse` | Dollhouse view |
| add `&capture=1` | Hides all UI (used to make the gallery stills) |

## Editing project information

Everything content-related is centralised:

- **`src/config/project.ts`** — name, location, building config (floors, heights, core size),
  the four unit types (BHK, facing, counts, placeholder areas, accent colours, copy), overview,
  location points, amenities, specifications, gallery, contact, optional GLB model paths and
  the sun position. Values set to `TBC` render as "To be confirmed".
- **`src/config/floorplans.ts`** — the conceptual plan of each unit type as rooms (rectangles),
  doors/openings and exterior windows. The tower elevation, the floor cutaways, the furnished
  interiors, collisions, room viewpoints and the 2D plans are all generated from this file.
  Each unit must face a different direction (`facing` in `project.ts`).

## Assets & GLB models

See [`public/assets/README.md`](public/assets/README.md). The site runs with no external assets.
To use real models, set `project.models.building` (nodes `Floor_01`…`Floor_08`, `Roof` are
animated by the floor journey) and/or `project.models.interiors.A`…`D`; failed loads fall back to
the procedural geometry automatically. Static SVG exports of the conceptual plans are in
`public/assets/floorplans/`, gallery stills in `public/assets/images/gallery/`.

## Project structure

```
src/
  app/
    (boxes)/            BOXES root layout, global styles, homepage
    (urban-mark)/       previous Urban Mark Interior site, kept at /urban-mark
    api/enquiry/        enquiry endpoint (validates + logs; wire to CRM before launch)
    global-not-found.tsx
  config/               project.ts, floorplans.ts  ← edit content here
  lib/boxes/
    plan.ts             wall/opening analysis, viewpoints, free wall spans
    unitGeometry.ts     unit shell, cutaway and interior builders
    furnish.ts          procedural furniture per room type
    towerGeometry.ts    tower, core, roof, podium, site
    builder.ts          merges primitives into one mesh per material
    materials.ts        procedural PBR materials + canvas textures
    camera.ts           camera poses for intro / journey / unit / dive
    director.ts         GSAP-driven transitions between states
    scroll.ts, store.ts, layout.ts
  components/boxes/
    BoxesExperience.tsx Lenis + ScrollTrigger journey, overlays
    canvas/             R3F scene: Stage, Tower, Site, Atmosphere, CameraRig, InteriorWorld, ModelSlot
    ui/                 Loader, intro, top bar, floor indicator & panel, unit panel, interior HUD, plan SVG
    sections/           website sections, enquiry form, footer
```

Stack: Next.js 16 (App Router, Turbopack), React 19, TypeScript, Three.js, React Three Fiber,
Drei, GSAP + ScrollTrigger, Lenis, Tailwind CSS v4, Framer Motion, Zustand.

## Performance notes

- Geometry is merged per material (≈220 draw calls, ≈190k triangles per frame for the tower).
- Rendering pauses when the 3D section is scrolled out of view; DPR is capped at 1.75 and drops
  to 1 (with smaller shadow maps) if the frame rate declines.
- Textures are generated on a canvas at runtime; no HDR or texture downloads.
- If WebGL is unavailable or the scene fails, a fallback screen explains why and links to the
  project details.

## Verification performed

- `npx tsc --noEmit` and `npm run lint` — clean.
- `npm run build` — succeeds; routes `/`, `/urban-mark`, `/api/enquiry`, 404.
- Playwright runs in headless Chromium (software WebGL) at 1280×720, 1600×1000 and iPhone 13:
  intro and Enter, one wheel notch → floor 1, floor indicator → floor 5, unit hover/click, enter
  apartment, room changes, WASD walking + drag look, dollhouse, exit, back to floor, top nav to
  every section, enquiry validation and submission, "Explore in 3D", GLB model loading with a test
  file, mobile menu, no horizontal overflow — no console errors.
- Not tested on physical GPUs or real phones in this environment; please check frame rate on
  your target devices.

## The previous site

The Urban Mark Interior site that was in this repository is preserved unchanged at
`/urban-mark` (route group `src/app/(urban-mark)`, components in `src/components/urban-mark`).
Delete those folders if it is no longer needed.
