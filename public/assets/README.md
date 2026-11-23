# BOXES — asset folders

The prototype runs entirely on **procedural geometry and runtime-generated textures**,
so none of these folders need content for the site to work. They exist so real
project assets can be dropped in later.

| Folder | Purpose |
| --- | --- |
| `models/building/` | Full tower model (`.glb` / `.gltf`) exported from SketchUp, Revit or Blender |
| `models/interiors/` | One interior model per unit type (A, B, C, D) |
| `textures/` | PBR texture sets (albedo / roughness / normal) to replace the canvas-generated ones in `src/lib/boxes/materials.ts` |
| `environments/` | HDR / EXR lighting environments (the prototype uses procedural Lightformers instead) |
| `images/gallery/` | Gallery images referenced from `project.gallery` in `src/config/project.ts` |
| `floorplans/` | Static SVG exports of the conceptual plans (the site renders plans live from `src/config/floorplans.ts`) |

## Plugging in a GLB building model

1. Export the model as **glTF Binary (.glb)**, Y-up, metres, origin at the centre of the core at ground level.
2. Name the node of each residential storey `Floor_01` … `Floor_08` and the roof `Roof`.
   These nodes are lifted / hidden by the scroll-driven exploded view exactly like the procedural floors.
3. Place the file in `models/building/` and set `project.models.building = "/assets/models/building/boxes.glb"`.
4. If the file is missing or fails to load, the site logs a warning and falls back to the procedural tower.

The procedural cutaway (waist-height plan with furniture), unit pickers, camera paths and
interiors still come from `src/config/floorplans.ts`, so keep the plans in sync with the model.

## Plugging in interior models

Export each unit type in its **local plan coordinates** (see the header of `src/config/floorplans.ts`:
x across the unit, z from the core/entrance towards the facade, metres) and set
`project.models.interiors.A` … `.D`. Walkthrough navigation, room hotspots and collisions keep
using the plan data.

**Tips:** keep each GLB under ~15 MB, compress with `gltf-transform optimize --compress draco`,
bake lighting where possible, and use KTX2/WebP textures.
