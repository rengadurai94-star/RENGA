/**
 * Conceptual floor plans for the four apartment typologies.
 *
 * These plans are ILLUSTRATIVE ONLY — they exist so the prototype can generate
 * the 3D cutaways, the walk-through interiors and the 2D plans from a single
 * source. Replace them with approved layouts when available.
 *
 * Coordinate system (metres), per unit:
 *   x : across the unit, from -width/2 ("left") to +width/2 ("right")
 *   z : from 0 at the core / entrance ("back") to `depth` at the facade ("front")
 *   The facade (+z) faces the unit's `facing` direction from project.ts.
 *
 * Rooms are axis-aligned rectangles [x0, z0, x1, z1] that tile the unit.
 * Outdoor rooms (balconies) sit outside the unit rectangle.
 */

import type { UnitId } from "./project";

export type RoomType =
  | "living"
  | "dining"
  | "kitchen"
  | "master"
  | "bedroom"
  | "bath"
  | "powder"
  | "foyer"
  | "balcony"
  | "utility"
  | "pooja"
  | "lounge"
  | "media"
  | "study"
  | "dress"
  | "store"
  | "passage";

/** back = core side (z=0), front = facade (z=depth), left = -x, right = +x */
export type Side = "back" | "front" | "left" | "right";

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  rect: [number, number, number, number];
  /** Wall used for the main furniture piece (bed headboard, TV, counter...). */
  anchor?: Side;
  /** Secondary wall (wardrobe, second kitchen leg...). */
  anchor2?: Side;
  outdoor?: boolean;
}

/** Interior wall opening. orient "v" = wall at constant x spanning z; "h" = constant z spanning x. */
export interface Opening {
  orient: "v" | "h";
  at: number;
  from: number;
  to: number;
  kind: "door" | "open";
}

/** Opening in an exterior wall. `from`/`to` run along z for left/right, along x for front. */
export interface ExteriorWindow {
  side: "front" | "left" | "right";
  from: number;
  to: number;
  kind: "window" | "vent" | "slider" | "french";
}

export interface FloorPlan {
  id: UnitId;
  width: number;
  depth: number;
  /** Entrance door on the back (core) wall, along x. */
  entry: [number, number];
  rooms: Room[];
  openings: Opening[];
  windows: ExteriorWindow[];
}

/* ------------------------------------------------------------------ */
/* Unit A — 2 BHK                                                      */
/* ------------------------------------------------------------------ */
const planA: FloorPlan = {
  id: "A",
  width: 10,
  depth: 10.5,
  entry: [-0.9, 0.1],
  rooms: [
    { id: "foyer", name: "Foyer", type: "foyer", rect: [-1.4, 0, 1.0, 3.4], anchor: "left" },
    { id: "kitchen", name: "Kitchen", type: "kitchen", rect: [-5, 0, -1.4, 3.4], anchor: "back", anchor2: "right" },
    { id: "bed2", name: "Bedroom 2", type: "bedroom", rect: [1.0, 0, 5, 3.8], anchor: "back", anchor2: "front" },
    { id: "dining", name: "Dining", type: "dining", rect: [-5, 3.4, 1.0, 6.4] },
    { id: "living", name: "Living Room", type: "living", rect: [-5, 6.4, 1.0, 10.5], anchor: "right" },
    { id: "bathC", name: "Common Bath", type: "bath", rect: [1.0, 3.8, 3.0, 6.0], anchor: "right" },
    { id: "mbath", name: "Master Bath", type: "bath", rect: [3.0, 3.8, 5, 6.0], anchor: "left" },
    { id: "master", name: "Master Bedroom", type: "master", rect: [1.0, 6.0, 5, 10.5], anchor: "left", anchor2: "back" },
    { id: "balcony", name: "Balcony", type: "balcony", rect: [-5, 10.5, 1.0, 12.2], outdoor: true },
    { id: "utilityB", name: "Utility Balcony", type: "utility", rect: [-6.3, 0.6, -5, 3.0], outdoor: true },
  ],
  openings: [
    { orient: "h", at: 3.4, from: -3.8, to: -2.6, kind: "door" },
    { orient: "h", at: 3.4, from: -1.4, to: 1.0, kind: "open" },
    { orient: "v", at: 1.0, from: 2.3, to: 3.2, kind: "door" },
    { orient: "v", at: 1.0, from: 4.4, to: 5.2, kind: "door" },
    { orient: "h", at: 6.4, from: -5, to: 1.0, kind: "open" },
    { orient: "v", at: 1.0, from: 6.5, to: 7.3, kind: "door" },
    { orient: "h", at: 6.0, from: 4.1, to: 4.9, kind: "door" },
  ],
  windows: [
    { side: "left", from: 1.0, to: 1.9, kind: "french" },
    { side: "left", from: 4.2, to: 5.8, kind: "window" },
    { side: "left", from: 7.2, to: 9.8, kind: "window" },
    { side: "right", from: 0.9, to: 2.9, kind: "window" },
    { side: "right", from: 4.5, to: 5.3, kind: "vent" },
    { side: "right", from: 7.4, to: 9.8, kind: "window" },
    { side: "front", from: -4.6, to: 0.6, kind: "slider" },
    { side: "front", from: 1.6, to: 4.4, kind: "window" },
  ],
};

/* ------------------------------------------------------------------ */
/* Unit B — 3 BHK                                                      */
/* ------------------------------------------------------------------ */
const planB: FloorPlan = {
  id: "B",
  width: 13,
  depth: 13,
  entry: [-0.5, 0.5],
  rooms: [
    { id: "foyer", name: "Foyer", type: "foyer", rect: [-2.5, 0, 2.5, 2.8], anchor: "right" },
    { id: "dining", name: "Dining", type: "dining", rect: [-2.5, 2.8, 2.5, 9.6] },
    { id: "living", name: "Living Room", type: "living", rect: [-2.5, 9.6, 6.5, 13], anchor: "left" },
    { id: "kitchen", name: "Kitchen", type: "kitchen", rect: [2.5, 0, 6.5, 4.0], anchor: "back", anchor2: "left" },
    { id: "bed2", name: "Bedroom 2", type: "bedroom", rect: [2.5, 4.0, 6.5, 7.6], anchor: "back", anchor2: "front" },
    { id: "pooja", name: "Pooja", type: "pooja", rect: [2.5, 7.6, 4.5, 9.6], anchor: "front" },
    { id: "bath2", name: "Bath 2", type: "bath", rect: [4.5, 7.6, 6.5, 9.6], anchor: "left" },
    { id: "bed3", name: "Bedroom 3", type: "bedroom", rect: [-6.5, 0, -2.5, 3.8], anchor: "back", anchor2: "front" },
    { id: "bath3", name: "Bath 3", type: "bath", rect: [-6.5, 3.8, -4.5, 6.0], anchor: "right" },
    { id: "powder", name: "Powder Room", type: "powder", rect: [-4.5, 3.8, -2.5, 6.0], anchor: "left" },
    { id: "mbath", name: "Master Bath", type: "bath", rect: [-6.5, 6.0, -4.3, 8.4], anchor: "right" },
    { id: "dress", name: "Dressing", type: "dress", rect: [-4.3, 6.0, -2.5, 8.4], anchor: "back" },
    { id: "master", name: "Master Bedroom", type: "master", rect: [-6.5, 8.4, -2.5, 13], anchor: "right" },
    { id: "balcony", name: "Balcony", type: "balcony", rect: [-6.5, 13, 6.5, 14.8], outdoor: true },
    { id: "utilityB", name: "Utility Balcony", type: "utility", rect: [6.5, 0.6, 7.8, 3.0], outdoor: true },
  ],
  openings: [
    { orient: "h", at: 2.8, from: -2.5, to: 2.5, kind: "open" },
    { orient: "v", at: -2.5, from: 1.7, to: 2.6, kind: "door" },
    { orient: "v", at: 2.5, from: 3.0, to: 3.9, kind: "door" },
    { orient: "v", at: -2.5, from: 4.4, to: 5.2, kind: "door" },
    { orient: "h", at: 3.8, from: -6.1, to: -5.3, kind: "door" },
    { orient: "v", at: 2.5, from: 6.6, to: 7.5, kind: "door" },
    { orient: "h", at: 7.6, from: 5.5, to: 6.3, kind: "door" },
    { orient: "v", at: 2.5, from: 8.3, to: 9.1, kind: "door" },
    { orient: "v", at: -2.5, from: 8.6, to: 9.5, kind: "door" },
    { orient: "h", at: 8.4, from: -6.1, to: -5.3, kind: "door" },
    { orient: "h", at: 8.4, from: -4.1, to: -2.7, kind: "open" },
    { orient: "h", at: 9.6, from: -2.5, to: 2.5, kind: "open" },
  ],
  windows: [
    { side: "left", from: 0.8, to: 3.0, kind: "window" },
    { side: "left", from: 4.5, to: 5.3, kind: "vent" },
    { side: "left", from: 6.8, to: 7.6, kind: "vent" },
    { side: "left", from: 9.4, to: 12.2, kind: "window" },
    { side: "right", from: 1.0, to: 1.9, kind: "french" },
    { side: "right", from: 2.4, to: 3.5, kind: "window" },
    { side: "right", from: 4.6, to: 7.0, kind: "window" },
    { side: "right", from: 8.2, to: 9.0, kind: "vent" },
    { side: "right", from: 10.2, to: 12.4, kind: "window" },
    { side: "front", from: -5.9, to: -3.4, kind: "french" },
    { side: "front", from: -2.0, to: 6.0, kind: "slider" },
  ],
};

/* ------------------------------------------------------------------ */
/* Unit C — 4 BHK                                                      */
/* ------------------------------------------------------------------ */
const planC: FloorPlan = {
  id: "C",
  width: 14,
  depth: 15.5,
  entry: [-0.5, 0.5],
  rooms: [
    { id: "foyer", name: "Foyer", type: "foyer", rect: [-2.6, 0, 2.6, 3.0], anchor: "right" },
    { id: "dining", name: "Dining", type: "dining", rect: [-2.6, 3.0, 2.6, 7.8] },
    { id: "lounge", name: "Family Lounge", type: "lounge", rect: [-2.6, 7.8, 2.6, 11.2], anchor: "left" },
    { id: "living", name: "Living Room", type: "living", rect: [-2.6, 11.2, 7, 15.5], anchor: "back" },
    { id: "kitchen", name: "Kitchen", type: "kitchen", rect: [2.6, 0, 7, 4.0], anchor: "back", anchor2: "left" },
    { id: "bed3", name: "Bedroom 3", type: "bedroom", rect: [2.6, 4.0, 7, 8.2], anchor: "back", anchor2: "front" },
    { id: "pooja", name: "Pooja", type: "pooja", rect: [2.6, 8.2, 4.6, 11.2], anchor: "front" },
    { id: "bath3", name: "Bath 3", type: "bath", rect: [4.6, 8.2, 7, 11.2], anchor: "left" },
    { id: "bed4", name: "Bedroom 4", type: "bedroom", rect: [-7, 0, -2.6, 3.8], anchor: "back", anchor2: "front" },
    { id: "bath4", name: "Bath 4", type: "bath", rect: [-7, 3.8, -4.8, 6.0], anchor: "right" },
    { id: "powder", name: "Powder Room", type: "powder", rect: [-4.8, 3.8, -2.6, 6.0], anchor: "left" },
    { id: "bed2", name: "Bedroom 2", type: "bedroom", rect: [-7, 6.0, -2.6, 9.6], anchor: "back", anchor2: "front" },
    { id: "bath2", name: "Bath 2", type: "bath", rect: [-7, 9.6, -4.8, 11.8], anchor: "right" },
    { id: "mbath", name: "Master Bath", type: "bath", rect: [-4.8, 9.6, -2.6, 11.8], anchor: "left" },
    { id: "master", name: "Master Bedroom", type: "master", rect: [-7, 11.8, -2.6, 15.5], anchor: "back", anchor2: "right" },
    { id: "balcony", name: "Balcony", type: "balcony", rect: [-7, 15.5, 7, 17.3], outdoor: true },
    { id: "bed2Balcony", name: "Bedroom Balcony", type: "balcony", rect: [-8.3, 6.6, -7, 9.0], outdoor: true },
    { id: "utilityB", name: "Utility Balcony", type: "utility", rect: [7, 0.6, 8.3, 3.0], outdoor: true },
  ],
  openings: [
    { orient: "h", at: 3.0, from: -2.6, to: 2.6, kind: "open" },
    { orient: "v", at: -2.6, from: 2.0, to: 2.9, kind: "door" },
    { orient: "v", at: 2.6, from: 3.1, to: 3.9, kind: "door" },
    { orient: "h", at: 3.8, from: -6.6, to: -5.8, kind: "door" },
    { orient: "v", at: -2.6, from: 4.4, to: 5.2, kind: "door" },
    { orient: "v", at: -2.6, from: 6.8, to: 7.7, kind: "door" },
    { orient: "v", at: 2.6, from: 6.8, to: 7.7, kind: "door" },
    { orient: "h", at: 7.8, from: -2.6, to: 2.6, kind: "open" },
    { orient: "h", at: 8.2, from: 5.6, to: 6.4, kind: "door" },
    { orient: "v", at: 2.6, from: 8.4, to: 9.2, kind: "door" },
    { orient: "h", at: 9.6, from: -6.6, to: -5.8, kind: "door" },
    { orient: "h", at: 11.2, from: -2.6, to: 2.6, kind: "open" },
    { orient: "h", at: 11.8, from: -3.5, to: -2.7, kind: "door" },
    { orient: "v", at: -2.6, from: 12.0, to: 12.9, kind: "door" },
  ],
  windows: [
    { side: "left", from: 0.8, to: 3.0, kind: "window" },
    { side: "left", from: 4.5, to: 5.3, kind: "vent" },
    { side: "left", from: 7.0, to: 8.6, kind: "french" },
    { side: "left", from: 10.3, to: 11.1, kind: "vent" },
    { side: "left", from: 12.4, to: 14.8, kind: "window" },
    { side: "right", from: 1.0, to: 1.9, kind: "french" },
    { side: "right", from: 2.3, to: 3.6, kind: "window" },
    { side: "right", from: 4.8, to: 7.4, kind: "window" },
    { side: "right", from: 9.2, to: 10.2, kind: "vent" },
    { side: "right", from: 11.8, to: 14.8, kind: "window" },
    { side: "front", from: -6.4, to: -4.0, kind: "french" },
    { side: "front", from: -2.2, to: 6.4, kind: "slider" },
  ],
};

/* ------------------------------------------------------------------ */
/* Unit D — 5 BHK                                                      */
/* ------------------------------------------------------------------ */
const planD: FloorPlan = {
  id: "D",
  width: 14,
  depth: 19.5,
  entry: [-0.5, 0.5],
  rooms: [
    { id: "foyer", name: "Foyer", type: "foyer", rect: [-2.6, 0, 2.6, 3.0], anchor: "right" },
    { id: "dining", name: "Dining", type: "dining", rect: [-2.6, 3.0, 2.6, 8.0] },
    { id: "lounge", name: "Family Lounge", type: "lounge", rect: [-2.6, 8.0, 2.6, 12.4], anchor: "left" },
    { id: "media", name: "Media Room", type: "media", rect: [-2.6, 12.4, 0.8, 15.8], anchor: "front" },
    { id: "gallery", name: "Gallery", type: "passage", rect: [0.8, 12.4, 2.6, 15.8] },
    { id: "living", name: "Living Room", type: "living", rect: [-2.6, 15.8, 7, 19.5], anchor: "back" },
    { id: "kitchen", name: "Kitchen", type: "kitchen", rect: [2.6, 0, 7, 4.2], anchor: "back", anchor2: "left" },
    { id: "bed3", name: "Bedroom 3", type: "bedroom", rect: [2.6, 4.2, 7, 8.0], anchor: "back", anchor2: "front" },
    { id: "pooja", name: "Pooja", type: "pooja", rect: [2.6, 8.0, 4.6, 10.2], anchor: "front" },
    { id: "bath3", name: "Bath 3", type: "bath", rect: [4.6, 8.0, 7, 10.2], anchor: "left" },
    { id: "bed2", name: "Bedroom 2", type: "bedroom", rect: [2.6, 10.2, 7, 13.8], anchor: "back", anchor2: "front" },
    { id: "store", name: "Store", type: "store", rect: [2.6, 13.8, 4.6, 15.8], anchor: "right" },
    { id: "bath2", name: "Bath 2", type: "bath", rect: [4.6, 13.8, 7, 15.8], anchor: "left" },
    { id: "bed5", name: "Bedroom 5", type: "bedroom", rect: [-7, 0, -2.6, 3.8], anchor: "back", anchor2: "front" },
    { id: "bath5", name: "Bath 5", type: "bath", rect: [-7, 3.8, -4.8, 6.0], anchor: "right" },
    { id: "powder", name: "Powder Room", type: "powder", rect: [-4.8, 3.8, -2.6, 6.0], anchor: "left" },
    { id: "bed4", name: "Bedroom 4", type: "bedroom", rect: [-7, 6.0, -2.6, 9.6], anchor: "back", anchor2: "front" },
    { id: "bath4", name: "Bath 4", type: "bath", rect: [-7, 9.6, -4.8, 11.8], anchor: "right" },
    { id: "study", name: "Study", type: "study", rect: [-4.8, 9.6, -2.6, 11.8], anchor: "left" },
    { id: "mbath", name: "Master Bath", type: "bath", rect: [-7, 11.8, -4.6, 14.0], anchor: "right" },
    { id: "dress", name: "Dressing", type: "dress", rect: [-4.6, 11.8, -2.6, 14.0], anchor: "left" },
    { id: "master", name: "Master Bedroom", type: "master", rect: [-7, 14.0, -2.6, 19.5], anchor: "left" },
    { id: "balcony", name: "Balcony", type: "balcony", rect: [-7, 19.5, 7, 21.3], outdoor: true },
    { id: "bed4Balcony", name: "Bedroom 4 Balcony", type: "balcony", rect: [-8.3, 6.6, -7, 9.0], outdoor: true },
    { id: "bed2Balcony", name: "Bedroom 2 Balcony", type: "balcony", rect: [7, 10.8, 8.3, 13.2], outdoor: true },
    { id: "utilityB", name: "Utility Balcony", type: "utility", rect: [7, 0.6, 8.3, 3.4], outdoor: true },
  ],
  openings: [
    { orient: "h", at: 3.0, from: -2.6, to: 2.6, kind: "open" },
    { orient: "v", at: -2.6, from: 2.0, to: 2.9, kind: "door" },
    { orient: "v", at: 2.6, from: 3.1, to: 4.0, kind: "door" },
    { orient: "h", at: 3.8, from: -6.6, to: -5.8, kind: "door" },
    { orient: "v", at: -2.6, from: 4.4, to: 5.2, kind: "door" },
    { orient: "v", at: -2.6, from: 6.9, to: 7.8, kind: "door" },
    { orient: "v", at: 2.6, from: 6.9, to: 7.8, kind: "door" },
    { orient: "h", at: 8.0, from: -2.6, to: 2.6, kind: "open" },
    { orient: "h", at: 8.0, from: 5.6, to: 6.4, kind: "door" },
    { orient: "v", at: 2.6, from: 8.6, to: 9.4, kind: "door" },
    { orient: "h", at: 9.6, from: -6.6, to: -5.8, kind: "door" },
    { orient: "v", at: -2.6, from: 10.4, to: 11.2, kind: "door" },
    { orient: "v", at: 2.6, from: 11.2, to: 12.1, kind: "door" },
    { orient: "h", at: 12.4, from: 0.8, to: 2.6, kind: "open" },
    { orient: "v", at: 0.8, from: 12.7, to: 13.6, kind: "door" },
    { orient: "h", at: 15.8, from: 0.8, to: 2.6, kind: "open" },
    { orient: "h", at: 13.8, from: 5.6, to: 6.4, kind: "door" },
    { orient: "h", at: 14.0, from: -6.6, to: -5.8, kind: "door" },
    { orient: "h", at: 14.0, from: -4.4, to: -2.8, kind: "open" },
    { orient: "v", at: 2.6, from: 14.4, to: 15.2, kind: "door" },
    { orient: "v", at: -2.6, from: 16.2, to: 17.1, kind: "door" },
  ],
  windows: [
    { side: "left", from: 0.8, to: 3.0, kind: "window" },
    { side: "left", from: 4.5, to: 5.3, kind: "vent" },
    { side: "left", from: 7.0, to: 8.6, kind: "french" },
    { side: "left", from: 10.3, to: 11.1, kind: "vent" },
    { side: "left", from: 12.4, to: 13.4, kind: "vent" },
    { side: "right", from: 1.0, to: 1.9, kind: "french" },
    { side: "right", from: 2.4, to: 3.8, kind: "window" },
    { side: "right", from: 4.8, to: 7.4, kind: "window" },
    { side: "right", from: 8.7, to: 9.5, kind: "vent" },
    { side: "right", from: 11.0, to: 12.6, kind: "french" },
    { side: "right", from: 14.4, to: 15.2, kind: "vent" },
    { side: "right", from: 16.2, to: 18.8, kind: "window" },
    { side: "front", from: -6.6, to: -3.0, kind: "french" },
    { side: "front", from: -2.2, to: 6.4, kind: "slider" },
  ],
};

export const floorPlans: Record<UnitId, FloorPlan> = {
  A: planA,
  B: planB,
  C: planC,
  D: planD,
};
