# BOXES

**Design Your Space. Down to Every Detail.**

BOXES is a modular furniture design and configuration platform: a premium
landing page, an interactive 3D product catalog with a parametric cabinet
configurator, and (in progress) a room-based kitchen designer.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # Vitest: geometry, pricing, units, validation
npm run lint
npm run build
```

## Stack

- **Next.js 16** (App Router, Turbopack), TypeScript, Tailwind CSS v4
- **Three.js + React Three Fiber + Drei** for all 3D
- **Zustand** for configurator and design state
- **Zod** for configuration validation (client and server)
- **Framer Motion** for scroll-driven animation
- UI primitives follow **shadcn/ui** conventions (`components.json`,
  `src/components/ui`, `cn()`), authored by hand because the shadcn registry
  was unreachable from the build environment

## Architecture

One parametric model drives everything:

```
src/lib/catalog/        products (29 SKUs, 11 categories), materials & hardware, Zod schema
src/lib/geometry/       buildCabinet(): product + dimensions → physical panels, fronts, hardware counts
src/lib/pricing/        priceCabinet(): measures those panels → itemised INR price (server-side)
src/lib/drawing/        2D front elevations from the same geometry
src/lib/room/           room + wall coordinate system (walls A–D), demo L-shaped kitchen
src/components/three/   CabinetModel renderer, procedural wood/stone textures, room shell
src/components/landing/ landing page walkthrough and sections
src/components/catalog/ 3D catalog: category nav, viewport, configuration panel, design tray
src/app/api/pricing/    POST /api/pricing — validated server-side pricing
```

Every cabinet is real geometry: sides, bottom, rails/top, back, shelves,
dividers, plinth, doors on hinges, drawers with boxes, flaps, handles, hanging
rods, appliance niches, sink basins and hobs. The pricing engine charges for
exactly those panels (board m², edge banding metres, hinges, runners,
handles), then adds fabrication, labour, wastage, overhead, margin and 18% GST.

## Sprint status

| Sprint | Scope | Status |
| --- | --- | --- |
| 1 | Landing page, three-option header | Done |
| 2 | 3D catalog and parametric cabinet models | Done |
| 3 | Individual cabinet configurator | Done (dimensions, materials, finish, colour, hardware, live server pricing, save, add to design) |
| 4 | Room dimension engine and kitchen layout | Not started — room/wall coordinate system is in place |
| 5 | Synchronised top / front / side / 3D views | Not started — elevation drawing helper exists |
| 6 | Materials, hardware & pricing | Partly done — pricing engine + API live; material library page and admin-managed rates pending |
| 7 | Sample orders and customer login | Not started — `/sample-orders` is a browse-only library, `/login` is a notice |
| 8 | Admin panel and order management | Not started |
| 9 | Testing and production deployment | Unit tests in place; deployment pending |

Saved configurations and the working design are currently stored on the
device (localStorage) until Supabase accounts and the Prisma/PostgreSQL schema
land in Sprint 7.

## Notes

- Prices are realistic demo rates (`PRICING_RULES` and the material library)
  and will move to the admin panel.
- No image assets are used for materials: wood grain and stone are generated
  procedurally on a canvas, so 2D swatches and 3D surfaces always match.
