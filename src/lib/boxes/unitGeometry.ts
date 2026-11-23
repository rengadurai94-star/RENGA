/**
 * Turns a conceptual FloorPlan into geometry (via Builder):
 *  - the exterior shell used on the tower elevation
 *  - the waist-height "cutaway" model shown when a floor is selected
 *  - the full-height furnished interior used in the walkthrough
 */
import type { FloorPlan, Room, RoomType } from "@/config/floorplans";
import { Builder } from "./builder";
import type { MatKey } from "./materials";
import {
  CEILING_HEIGHT,
  DOOR_HEIGHT,
  EPS,
  WALL_EXT,
  WALL_INT,
  WINDOW_SPEC,
  doors,
  indoorRooms,
  interiorWalls,
  outdoorRooms,
  sideLine,
  windowsOn,
  type ExtSide,
} from "./plan";
import { furnishRoom } from "./furnish";
import { FLOOR_H, SLAB } from "./layout";

export type Collider = [number, number, number, number];

export interface BuildOptions {
  /** Wall height (top of walls) in metres above finished floor. */
  height: number;
  /** Optional cut height — clips walls / glass (cutaway model). */
  cut?: number;
  /** Materials for walls (exterior shell uses render, interiors use wall). */
  wallMat: MatKey;
  /** Add the bronze window surrounds / box frames on the facade. */
  facadeDetail: boolean;
  /** Glass material for windows. */
  glassMat: MatKey;
  /** Record collision footprints (walkthrough). */
  colliders?: Collider[];
}

/** Outward normal (in plan) for each exterior side. */
const OUT: Record<ExtSide, [number, number]> = {
  front: [0, 1],
  back: [0, -1],
  left: [-1, 0],
  right: [1, 0],
};

/** Place a box spanning [a,b] along an exterior side line, from y0 to y1, `t` thick (inside the unit). */
function sideBox(
  b: Builder,
  plan: FloorPlan,
  side: ExtSide,
  mat: MatKey,
  a: number,
  c: number,
  y0: number,
  y1: number,
  t: number,
  offset = 0, // shift outwards (+) / inwards (-) from the wall's outer face
) {
  if (y1 - y0 < 0.005 || c - a < 0.005) return;
  const line = sideLine(plan, side);
  const [ox, oz] = OUT[side];
  if (line.orient === "h") {
    const zOuter = line.at + oz * offset;
    const zInner = zOuter - oz * t;
    b.boxMinMax(mat, a, y0, zInner, c, y1, zOuter);
  } else {
    const xOuter = line.at + ox * offset;
    const xInner = xOuter - ox * t;
    b.boxMinMax(mat, xInner, y0, a, xOuter, y1, c);
  }
}

function pushCollider(opts: BuildOptions, plan: FloorPlan, side: ExtSide, a: number, c: number) {
  if (!opts.colliders) return;
  const line = sideLine(plan, side);
  const [ox, oz] = OUT[side];
  if (line.orient === "h") {
    const z1 = line.at;
    const z0 = z1 - oz * WALL_EXT;
    opts.colliders.push([a, Math.min(z0, z1), c, Math.max(z0, z1)]);
  } else {
    const x1 = line.at;
    const x0 = x1 - ox * WALL_EXT;
    opts.colliders.push([Math.min(x0, x1), a, Math.max(x0, x1), c]);
  }
}

/** One exterior side with all its windows / doors. */
function buildSide(b: Builder, plan: FloorPlan, side: ExtSide, opts: BuildOptions) {
  const line = sideLine(plan, side);
  const H = opts.height;
  const top = opts.cut !== undefined ? Math.min(opts.cut, H) : H;
  const t = WALL_EXT;
  type Gap = { from: number; to: number; sill: number; head: number; kind: string };
  const gaps: Gap[] = windowsOn(plan, side).map((w) => ({
    from: w.from,
    to: w.to,
    sill: WINDOW_SPEC[w.kind].sill,
    head: WINDOW_SPEC[w.kind].head,
    kind: w.kind,
  }));
  if (side === "back") gaps.push({ from: plan.entry[0], to: plan.entry[1], sill: 0, head: DOOR_HEIGHT, kind: "entry" });
  gaps.sort((p, q) => p.from - q.from);

  let cursor = line.from;
  for (const g of gaps) {
    sideBox(b, plan, side, opts.wallMat, cursor, g.from, 0, top, t);
    pushCollider(opts, plan, side, cursor, g.from);
    // sill & head
    if (g.sill > 0) {
      sideBox(b, plan, side, opts.wallMat, g.from, g.to, 0, Math.min(g.sill, top), t);
      pushCollider(opts, plan, side, g.from, g.to);
    }
    if (g.head < top) sideBox(b, plan, side, opts.wallMat, g.from, g.to, g.head, top, t);
    const glassTop = Math.min(g.head, top);
    if (g.kind === "entry") {
      // Entrance: solid timber door, opened inwards.
      if (opts.colliders === undefined) sideBox(b, plan, side, "door", g.from, g.to, 0, glassTop, 0.05, -0.08);
      else {
        // open leaf, hinged at `from`
        const w = g.to - g.from;
        b.boxMinMax("door", g.from, 0, 0.12, g.from + 0.05, glassTop, 0.12 + w);
      }
      sideBox(b, plan, side, "walnut", g.from - 0.06, g.from, 0, glassTop + 0.06, t + 0.02);
      sideBox(b, plan, side, "walnut", g.to, g.to + 0.06, 0, glassTop + 0.06, t + 0.02);
    } else if (glassTop > g.sill) {
      // glass pane in the middle of the wall
      sideBox(b, plan, side, opts.glassMat, g.from, g.to, g.sill, glassTop, 0.03, -t / 2 + 0.015);
      // frame profiles
      const f = 0.06;
      sideBox(b, plan, side, "metalDark", g.from, g.from + f, g.sill, glassTop, 0.08, -t / 2 + 0.04);
      sideBox(b, plan, side, "metalDark", g.to - f, g.to, g.sill, glassTop, 0.08, -t / 2 + 0.04);
      if (g.head <= top) sideBox(b, plan, side, "metalDark", g.from, g.to, g.head - f, g.head, 0.08, -t / 2 + 0.04);
      sideBox(b, plan, side, "metalDark", g.from, g.to, g.sill, g.sill + f, 0.08, -t / 2 + 0.04);
      const width = g.to - g.from;
      const panes = Math.max(1, Math.round(width / (g.kind === "slider" ? 2.0 : 1.2)));
      for (let i = 1; i < panes; i++) {
        const x = g.from + (width * i) / panes;
        sideBox(b, plan, side, "metalDark", x - 0.03, x + 0.03, g.sill, glassTop, 0.08, -t / 2 + 0.04);
      }
      if (g.kind === "window" && glassTop > 1.6) {
        // transom bar
        sideBox(b, plan, side, "metalDark", g.from, g.to, 2.0, 2.05, 0.08, -t / 2 + 0.04);
      }
      // Bronze "box" surround protruding from the facade (signature detail).
      if (opts.facadeDetail && (g.kind === "window" || g.kind === "vent")) {
        const d = 0.32;
        const th = 0.07;
        sideBox(b, plan, side, "bronze", g.from - th, g.to + th, g.head, Math.min(g.head + th, top), d, d);
        if (g.sill > 0 && g.sill - th < top) sideBox(b, plan, side, "bronze", g.from - th, g.to + th, g.sill - th, Math.min(g.sill, top), d, d);
        sideBox(b, plan, side, "bronze", g.from - th, g.from, g.sill, glassTop, d, d);
        sideBox(b, plan, side, "bronze", g.to, g.to + th, g.sill, glassTop, d, d);
      }
    }
    cursor = g.to;
  }
  sideBox(b, plan, side, opts.wallMat, cursor, line.to, 0, top, t);
  pushCollider(opts, plan, side, cursor, line.to);
}

/** Floor slab (and balcony slabs) — top at y = 0. */
export function buildSlab(b: Builder, plan: FloorPlan, mat: MatKey = "frame", soffit = true) {
  const hw = plan.width / 2;
  b.boxMinMax(mat, -hw, -SLAB, 0, hw, 0, plan.depth);
  for (const r of outdoorRooms(plan)) {
    const [x0, z0, x1, z1] = r.rect;
    b.boxMinMax(mat, x0, -SLAB, z0, x1, 0, z1);
    if (soffit) b.boxMinMax("soffit", x0 + 0.05, -SLAB - 0.02, z0 + 0.05, x1 - 0.05, -SLAB, z1 - 0.05);
  }
}

/** Balcony railings, pilasters ("box" frames) and utility parapets. */
function buildOutdoor(b: Builder, plan: FloorPlan, opts: BuildOptions) {
  const hw = plan.width / 2;
  const H = opts.height;
  const top = opts.cut !== undefined ? Math.min(opts.cut, H) : H;
  const railH = Math.min(1.05, top);
  for (const r of outdoorRooms(plan)) {
    const [x0, z0, x1, z1] = r.rect;
    const isFront = z0 >= plan.depth - EPS;
    const isUtility = r.type === "utility";
    const edges: { a: [number, number]; c: [number, number] }[] = [];
    if (isFront) {
      edges.push({ a: [x0, z1], c: [x1, z1] });
    } else if (x1 <= -hw + EPS) {
      edges.push({ a: [x0, z0], c: [x0, z1] }, { a: [x0, z0], c: [x1, z0] }, { a: [x0, z1], c: [x1, z1] });
    } else {
      edges.push({ a: [x1, z0], c: [x1, z1] }, { a: [x0, z0], c: [x1, z0] }, { a: [x0, z1], c: [x1, z1] });
    }
    for (const e of edges) {
      const [ax, az] = e.a;
      const [cx, cz] = e.c;
      const horizontal = Math.abs(az - cz) < EPS;
      const thick = 0.06;
      const bx0 = horizontal ? ax : ax - thick / 2;
      const bx1 = horizontal ? cx : ax + thick / 2;
      const bz0 = horizontal ? az - thick / 2 : az;
      const bz1 = horizontal ? az + thick / 2 : cz;
      if (isUtility) {
        b.boxMinMax(opts.wallMat, bx0 - 0.04, 0, bz0 - 0.04, bx1 + 0.04, railH, bz1 + 0.04);
      } else {
        b.boxMinMax("railGlass", bx0, 0.08, bz0, bx1, railH, bz1);
        b.boxMinMax("bronze", bx0 - 0.02, railH - 0.05, bz0 - 0.02, bx1 + 0.02, railH, bz1 + 0.02);
        b.boxMinMax("metalDark", bx0 - 0.02, 0, bz0 - 0.02, bx1 + 0.02, 0.08, bz1 + 0.02);
      }
      if (opts.colliders) opts.colliders.push([bx0 - 0.05, bz0 - 0.05, bx1 + 0.05, bz1 + 0.05]);
    }
    if (isFront && opts.facadeDetail) {
      // White "box" pilasters framing the balcony, full storey height.
      const pw = 0.35;
      const pTop = opts.cut !== undefined ? top : FLOOR_H - SLAB;
      b.boxMinMax("frame", x0 - pw, 0, z0, x0, pTop, z1 + 0.15);
      b.boxMinMax("frame", x1, 0, z0, x1 + pw, pTop, z1 + 0.15);
      // slab nosing
      b.boxMinMax("frame", x0 - pw, -SLAB - 0.1, z1, x1 + pw, 0.02, z1 + 0.15);
    }
  }
}

/** Interior partitions with door frames and lintels. */
function buildPartitions(b: Builder, plan: FloorPlan, opts: BuildOptions) {
  const H = opts.height;
  const top = opts.cut !== undefined ? Math.min(opts.cut, H) : H;
  const t = WALL_INT;
  for (const s of interiorWalls(plan)) {
    const a = s.from - t / 2;
    const c = s.to + t / 2;
    if (s.orient === "h") {
      b.boxMinMax(opts.wallMat, a, 0, s.at - t / 2, c, top, s.at + t / 2);
      opts.colliders?.push([a, s.at - t / 2 - 0.02, c, s.at + t / 2 + 0.02]);
    } else {
      b.boxMinMax(opts.wallMat, s.at - t / 2, 0, a, s.at + t / 2, top, c);
      opts.colliders?.push([s.at - t / 2 - 0.02, a, s.at + t / 2 + 0.02, c]);
    }
  }
  for (const d of doors(plan)) {
    if (d.kind === "entry") continue;
    const head = d.kind === "door" ? DOOR_HEIGHT : 2.7;
    const lintelTop = top;
    const mk = (mat: MatKey, a: number, c: number, y0: number, y1: number, thick: number) => {
      if (y1 <= y0) return;
      if (d.orient === "h") b.boxMinMax(mat, a, y0, d.at - thick / 2, c, y1, d.at + thick / 2);
      else b.boxMinMax(mat, d.at - thick / 2, y0, a, d.at + thick / 2, y1, c);
    };
    if (head < lintelTop) mk(opts.wallMat, d.from, d.to, head, lintelTop, t);
    if (d.kind === "door") {
      const ft = Math.min(head, top);
      mk("oak", d.from, d.from + 0.05, 0, ft, t + 0.04);
      mk("oak", d.to - 0.05, d.to, 0, ft, t + 0.04);
      if (head <= top) mk("oak", d.from, d.to, head - 0.05, head, t + 0.04);
    }
  }
}

export function floorMatFor(type: RoomType): MatKey {
  switch (type) {
    case "master":
    case "bedroom":
    case "dress":
    case "study":
      return "floorWood";
    case "bath":
    case "powder":
    case "kitchen":
    case "store":
      return "floorTile";
    case "balcony":
    case "utility":
      return "deck";
    default:
      return "floorMarble";
  }
}

function buildFinishes(b: Builder, plan: FloorPlan) {
  for (const r of plan.rooms) {
    const [x0, z0, x1, z1] = r.rect;
    const mat = r.outdoor ? (r.type === "utility" ? "floorTile" : "deck") : floorMatFor(r.type);
    b.slab(mat, x0, z0, x1, z1, 0.012, 0.012);
  }
}

function buildCeiling(b: Builder, plan: FloorPlan) {
  for (const r of indoorRooms(plan)) {
    const [x0, z0, x1, z1] = r.rect;
    b.boxMinMax("ceiling", x0, CEILING_HEIGHT, z0, x1, CEILING_HEIGHT + 0.06, z1);
    const w = x1 - x0;
    const d = z1 - z0;
    const premium = r.type === "living" || r.type === "master" || r.type === "lounge" || r.type === "dining";
    if (premium && w > 3 && d > 3) {
      // Cove ceiling band with a warm light strip.
      const band = 0.55;
      const y0 = CEILING_HEIGHT - 0.28;
      b.boxMinMax("ceiling", x0, y0, z0, x1, CEILING_HEIGHT, z0 + band);
      b.boxMinMax("ceiling", x0, y0, z1 - band, x1, CEILING_HEIGHT, z1);
      b.boxMinMax("ceiling", x0, y0, z0 + band, x0 + band, CEILING_HEIGHT, z1 - band);
      b.boxMinMax("ceiling", x1 - band, y0, z0 + band, x1, CEILING_HEIGHT, z1 - band);
      const g = 0.03;
      b.boxMinMax("glow", x0 + band, y0 + 0.02, z0 + band - g, x1 - band, y0 + 0.05, z0 + band);
      b.boxMinMax("glow", x0 + band, y0 + 0.02, z1 - band, x1 - band, y0 + 0.05, z1 - band + g);
      // downlights in the band
      for (let x = x0 + 1.0; x < x1 - 0.6; x += 1.6) {
        b.cyl("glow", 0.05, 0.05, 0.01, x, y0 - 0.005, z0 + band / 2);
        b.cyl("glow", 0.05, 0.05, 0.01, x, y0 - 0.005, z1 - band / 2);
      }
    } else {
      const nx = Math.max(1, Math.round(w / 1.8));
      const nz = Math.max(1, Math.round(d / 1.8));
      for (let i = 0; i < nx; i++)
        for (let j = 0; j < nz; j++)
          b.cyl("glow", 0.05, 0.05, 0.01, x0 + ((i + 0.5) * w) / nx, CEILING_HEIGHT - 0.005, z0 + ((j + 0.5) * d) / nz);
    }
  }
}

/** Exterior shell for the tower elevation (one unit, one storey). */
export function buildUnitShell(b: Builder, plan: FloorPlan) {
  const opts: BuildOptions = {
    height: FLOOR_H - SLAB,
    wallMat: "render",
    facadeDetail: true,
    glassMat: "glass",
  };
  for (const side of ["front", "left", "right", "back"] as ExtSide[]) buildSide(b, plan, side, opts);
  buildOutdoor(b, plan, opts);
  // dark interior backdrop so glazing never reveals an empty box
  const hw = plan.width / 2;
  b.boxMinMax("metalDark", -hw + 0.6, 0.02, 0.6, hw - 0.6, 0.04, plan.depth - 0.6);
}

/** Waist-height architectural model with furniture (selected floor). */
export function buildUnitCutaway(b: Builder, plan: FloorPlan) {
  const opts: BuildOptions = {
    height: CEILING_HEIGHT,
    cut: 1.15,
    wallMat: "wall",
    facadeDetail: false,
    glassMat: "glassInterior",
  };
  buildFinishes(b, plan);
  for (const side of ["front", "left", "right", "back"] as ExtSide[]) buildSide(b, plan, side, opts);
  buildOutdoor(b, plan, opts);
  buildPartitions(b, plan, opts);
  for (const r of plan.rooms) furnishRoom(b, plan, r, { detail: "low" });
}

/**
 * Full-height furnished interior for the walkthrough.
 * `overhead` receives ceilings and the slab above, so the dollhouse view can hide them.
 */
export function buildUnitInterior(
  b: Builder,
  overhead: Builder,
  plan: FloorPlan,
  wallColliders: Collider[],
  furnitureColliders: Collider[],
) {
  const opts: BuildOptions = {
    height: CEILING_HEIGHT,
    wallMat: "wall",
    facadeDetail: true,
    glassMat: "glassInterior",
    colliders: wallColliders,
  };
  buildSlab(b, plan, "concrete", false);
  buildFinishes(b, plan);
  for (const side of ["front", "left", "right", "back"] as ExtSide[]) buildSide(b, plan, side, opts);
  buildOutdoor(b, plan, opts);
  buildPartitions(b, plan, opts);
  buildCeiling(overhead, plan);
  // exterior band above the ceiling up to the next slab, and the balcony slabs above
  const hw = plan.width / 2;
  overhead.boxMinMax("concrete", -hw - 0.3, CEILING_HEIGHT + 0.06, -0.3, hw + 0.3, FLOOR_H, plan.depth + 0.3);
  for (const r of outdoorRooms(plan)) {
    const [x0, z0, x1, z1] = r.rect;
    overhead.boxMinMax("frame", x0 - (r.rect[1] >= plan.depth - EPS ? 0.35 : 0), FLOOR_H - SLAB, z0, x1 + (r.rect[1] >= plan.depth - EPS ? 0.35 : 0), FLOOR_H, z1 + (r.rect[1] >= plan.depth - EPS ? 0.15 : 0));
    overhead.boxMinMax("soffit", x0 + 0.05, FLOOR_H - SLAB - 0.02, z0 + 0.05, x1 - 0.05, FLOOR_H - SLAB, z1 - 0.05);
  }
  for (const r of plan.rooms) furnishRoom(b, plan, r, { detail: "high", colliders: furnitureColliders });
}

export type { Room };
