/**
 * Pure (no three.js) analysis of the conceptual floor plans:
 * wall extraction, openings, free wall spans for furniture, and viewpoints.
 * Shared by the 3D builders, the interior walkthrough and the SVG plans.
 */
import type { ExteriorWindow, FloorPlan, Room, Side } from "@/config/floorplans";

export const EPS = 1e-4;

export interface Segment {
  orient: "h" | "v"; // h: constant z, spans x | v: constant x, spans z
  at: number;
  from: number;
  to: number;
}

export interface DoorInfo extends Segment {
  kind: "door" | "open" | "entry";
}

export const WINDOW_SPEC: Record<ExteriorWindow["kind"], { sill: number; head: number }> = {
  window: { sill: 0.75, head: 2.4 },
  vent: { sill: 1.75, head: 2.3 },
  slider: { sill: 0, head: 2.7 },
  french: { sill: 0, head: 2.4 },
};

export const DOOR_HEIGHT = 2.2;
export const CEILING_HEIGHT = 3.0;
export const WALL_INT = 0.12;
export const WALL_EXT = 0.22;

type Interval = [number, number];

function unionIntervals(list: Interval[]): Interval[] {
  const sorted = list
    .map(([a, b]) => (a < b ? [a, b] : [b, a]) as Interval)
    .sort((p, q) => p[0] - q[0]);
  const out: Interval[] = [];
  for (const iv of sorted) {
    const last = out[out.length - 1];
    if (last && iv[0] <= last[1] + EPS) last[1] = Math.max(last[1], iv[1]);
    else out.push([iv[0], iv[1]]);
  }
  return out;
}

export function subtractIntervals(base: Interval[], cut: Interval[]): Interval[] {
  let result = base.map((iv) => [...iv] as Interval);
  for (const [c0, c1] of cut) {
    const next: Interval[] = [];
    for (const [a, b] of result) {
      if (c1 <= a + EPS || c0 >= b - EPS) {
        next.push([a, b]);
        continue;
      }
      if (c0 > a + EPS) next.push([a, c0]);
      if (c1 < b - EPS) next.push([c1, b]);
    }
    result = next;
  }
  return result.filter(([a, b]) => b - a > 0.02);
}

export const indoorRooms = (plan: FloorPlan) => plan.rooms.filter((r) => !r.outdoor);
export const outdoorRooms = (plan: FloorPlan) => plan.rooms.filter((r) => r.outdoor);

function onPerimeter(plan: FloorPlan, s: Segment) {
  const hw = plan.width / 2;
  if (s.orient === "h") return Math.abs(s.at) < EPS || Math.abs(s.at - plan.depth) < EPS;
  return Math.abs(s.at + hw) < EPS || Math.abs(s.at - hw) < EPS;
}

const key = (orient: string, at: number) => `${orient}:${at.toFixed(3)}`;

/** Interior partition walls (perimeter excluded), with door/open gaps removed. */
export function interiorWalls(plan: FloorPlan): Segment[] {
  const groups = new Map<string, { orient: "h" | "v"; at: number; ivs: Interval[] }>();
  const push = (orient: "h" | "v", at: number, a: number, b: number) => {
    const seg: Segment = { orient, at, from: a, to: b };
    if (onPerimeter(plan, seg)) return;
    const k = key(orient, at);
    if (!groups.has(k)) groups.set(k, { orient, at, ivs: [] });
    groups.get(k)!.ivs.push([a, b]);
  };
  for (const r of indoorRooms(plan)) {
    const [x0, z0, x1, z1] = r.rect;
    push("h", z0, x0, x1);
    push("h", z1, x0, x1);
    push("v", x0, z0, z1);
    push("v", x1, z0, z1);
  }
  const out: Segment[] = [];
  for (const g of groups.values()) {
    const cuts = plan.openings
      .filter((o) => o.orient === g.orient && Math.abs(o.at - g.at) < EPS)
      .map((o) => [o.from, o.to] as Interval);
    for (const [a, b] of subtractIntervals(unionIntervals(g.ivs), cuts)) {
      out.push({ orient: g.orient, at: g.at, from: a, to: b });
    }
  }
  return out;
}

/** Doors and wide openings inside the unit, plus the entrance. */
export function doors(plan: FloorPlan): DoorInfo[] {
  return [
    ...plan.openings.map((o) => ({ orient: o.orient, at: o.at, from: o.from, to: o.to, kind: o.kind })),
    { orient: "h", at: 0, from: plan.entry[0], to: plan.entry[1], kind: "entry" },
  ];
}

export type ExtSide = "front" | "left" | "right" | "back";

/** Line and range of an exterior side. */
export function sideLine(plan: FloorPlan, side: ExtSide): Segment {
  const hw = plan.width / 2;
  switch (side) {
    case "front":
      return { orient: "h", at: plan.depth, from: -hw, to: hw };
    case "back":
      return { orient: "h", at: 0, from: -hw, to: hw };
    case "left":
      return { orient: "v", at: -hw, from: 0, to: plan.depth };
    case "right":
      return { orient: "v", at: hw, from: 0, to: plan.depth };
  }
}

export function windowsOn(plan: FloorPlan, side: ExtSide): ExteriorWindow[] {
  if (side === "back") return [];
  return plan.windows.filter((w) => w.side === side).sort((a, b) => a.from - b.from);
}

/** Wall line of a room side. */
export function roomSideLine(room: Room, side: Side): Segment {
  const [x0, z0, x1, z1] = room.rect;
  switch (side) {
    case "back":
      return { orient: "h", at: z0, from: x0, to: x1 };
    case "front":
      return { orient: "h", at: z1, from: x0, to: x1 };
    case "left":
      return { orient: "v", at: x0, from: z0, to: z1 };
    case "right":
      return { orient: "v", at: x1, from: z0, to: z1 };
  }
}

/** All blocked intervals (doors, openings, windows) along a given wall line. */
function blockersOnLine(plan: FloorPlan, line: Segment): Interval[] {
  const cuts: Interval[] = [];
  for (const d of doors(plan)) {
    if (d.orient === line.orient && Math.abs(d.at - line.at) < EPS) cuts.push([d.from - 0.08, d.to + 0.08]);
  }
  const hw = plan.width / 2;
  for (const w of plan.windows) {
    const wl: Segment =
      w.side === "front"
        ? { orient: "h", at: plan.depth, from: w.from, to: w.to }
        : { orient: "v", at: w.side === "left" ? -hw : hw, from: w.from, to: w.to };
    if (wl.orient === line.orient && Math.abs(wl.at - line.at) < EPS) cuts.push([w.from - 0.08, w.to + 0.08]);
  }
  return cuts;
}

/**
 * Largest continuous free interval on a room wall, leaving clearance for
 * doors that swing near the corners. Returns [from, to] along the wall.
 */
export function freeSpan(plan: FloorPlan, room: Room, side: Side): Interval {
  const line = roomSideLine(room, side);
  const cuts = blockersOnLine(plan, line);
  // Corner clearance for swing doors on the perpendicular walls.
  const perpSides: Side[] = line.orient === "h" ? ["left", "right"] : ["back", "front"];
  for (const ps of perpSides) {
    const pl = roomSideLine(room, ps);
    const cornerOnPerp = line.at; // where the perpendicular wall meets our line
    const doorsOnPerp = doors(plan).filter(
      (d) => d.kind !== "open" && d.orient === pl.orient && Math.abs(d.at - pl.at) < EPS,
    );
    for (const d of doorsOnPerp) {
      const dist = Math.min(Math.abs(d.from - cornerOnPerp), Math.abs(d.to - cornerOnPerp));
      const within = d.from <= Math.max(pl.from, pl.to) + EPS && d.to >= Math.min(pl.from, pl.to) - EPS;
      if (within && dist < 0.6) cuts.push(pl.at < (line.from + line.to) / 2 ? [line.from, line.from + 1.0] : [line.to - 1.0, line.to]);
    }
  }
  const free = subtractIntervals([[line.from, line.to]], cuts);
  if (!free.length) return [line.from, line.from];
  return free.reduce((best, iv) => (iv[1] - iv[0] > best[1] - best[0] ? iv : best));
}

export function roomCenter(room: Room): [number, number] {
  const [x0, z0, x1, z1] = room.rect;
  return [(x0 + x1) / 2, (z0 + z1) / 2];
}

export function roomSize(room: Room): [number, number] {
  const [x0, z0, x1, z1] = room.rect;
  return [x1 - x0, z1 - z0];
}

export function roomArea(room: Room): number {
  const [w, d] = roomSize(room);
  return w * d;
}

export function pointInRoom(room: Room, x: number, z: number, pad = 0): boolean {
  const [x0, z0, x1, z1] = room.rect;
  return x >= x0 - pad && x <= x1 + pad && z >= z0 - pad && z <= z1 + pad;
}

export function roomAt(plan: FloorPlan, x: number, z: number): Room | undefined {
  return plan.rooms.find((r) => pointInRoom(r, x, z));
}

/** Openings (doors / wide openings / exterior doors) that touch a room. */
export function roomOpenings(plan: FloorPlan, room: Room): Segment[] {
  const [x0, z0, x1, z1] = room.rect;
  const out: Segment[] = [];
  const touches = (s: Segment) => {
    if (s.orient === "h") {
      if (!(Math.abs(s.at - z0) < EPS || Math.abs(s.at - z1) < EPS)) return false;
      return s.to > x0 + EPS && s.from < x1 - EPS;
    }
    if (!(Math.abs(s.at - x0) < EPS || Math.abs(s.at - x1) < EPS)) return false;
    return s.to > z0 + EPS && s.from < z1 - EPS;
  };
  for (const d of doors(plan)) if (touches(d)) out.push(d);
  const hw = plan.width / 2;
  for (const w of plan.windows) {
    if (w.kind !== "slider" && w.kind !== "french") continue;
    const s: Segment =
      w.side === "front"
        ? { orient: "h", at: plan.depth, from: w.from, to: w.to }
        : { orient: "v", at: w.side === "left" ? -hw : hw, from: w.from, to: w.to };
    if (touches(s)) out.push(s);
  }
  return out;
}

export interface Viewpoint {
  pos: [number, number];
  look: [number, number];
}

/** A natural standing viewpoint for a room: just inside its entrance, looking across. */
export function roomViewpoint(plan: FloorPlan, room: Room): Viewpoint {
  const [cx, cz] = roomCenter(room);
  const [x0, z0, x1, z1] = room.rect;
  if (room.outdoor) {
    // Stand on the balcony looking outwards.
    const hw = plan.width / 2;
    if (z0 >= plan.depth - EPS) return { pos: [cx, z0 + 0.5], look: [cx, z1 + 20] };
    if (x1 <= -hw + EPS) return { pos: [x1 - 0.4, cz], look: [x0 - 20, cz] };
    return { pos: [x0 + 0.4, cz], look: [x1 + 20, cz] };
  }
  const ops = roomOpenings(plan, room);
  // Prefer interior doors/openings over exterior ones, widest first.
  const isInterior = (s: Segment) => "kind" in s;
  const sorted = ops.sort(
    (a, b) => Number(isInterior(b)) - Number(isInterior(a)) || b.to - b.from - (a.to - a.from),
  );
  const op = sorted[0];
  if (!op) return { pos: [cx, cz], look: [cx, z1] };
  const mid = (op.from + op.to) / 2;
  let px: number, pz: number;
  const inset = Math.min(1.0, (op.orient === "h" ? z1 - z0 : x1 - x0) * 0.3);
  if (op.orient === "h") {
    const inward = Math.abs(op.at - z0) < EPS ? 1 : -1;
    px = Math.min(Math.max(mid, x0 + 0.5), x1 - 0.5);
    pz = op.at + inward * inset;
  } else {
    const inward = Math.abs(op.at - x0) < EPS ? 1 : -1;
    px = op.at + inward * inset;
    pz = Math.min(Math.max(mid, z0 + 0.5), z1 - 0.5);
  }
  // Look towards the far side of the room, through the centre.
  const dx = cx - px;
  const dz = cz - pz;
  const len = Math.hypot(dx, dz) || 1;
  return { pos: [px, pz], look: [px + (dx / len) * 6, pz + (dz / len) * 6] };
}

/** Rooms worth navigating to in the walkthrough, in a sensible order. */
export function navigableRooms(plan: FloorPlan): Room[] {
  const order: Record<string, number> = {
    living: 0,
    dining: 1,
    kitchen: 2,
    lounge: 3,
    media: 4,
    master: 5,
    bedroom: 6,
    dress: 7,
    study: 8,
    pooja: 9,
    bath: 10,
    powder: 11,
    balcony: 12,
    foyer: 13,
    utility: 14,
    passage: 15,
    store: 99,
  };
  return plan.rooms
    .filter((r) => r.type !== "store" && r.type !== "passage")
    .sort((a, b) => order[a.type] - order[b.type] || a.id.localeCompare(b.id));
}

/** Overall bounds including outdoor rooms. */
export function planBounds(plan: FloorPlan): [number, number, number, number] {
  let [x0, z0, x1, z1] = [-plan.width / 2, 0, plan.width / 2, plan.depth];
  for (const r of plan.rooms) {
    x0 = Math.min(x0, r.rect[0]);
    z0 = Math.min(z0, r.rect[1]);
    x1 = Math.max(x1, r.rect[2]);
    z1 = Math.max(z1, r.rect[3]);
  }
  return [x0, z0, x1, z1];
}

export const metresToFeet = (m: number) => m * 3.28084;

export function formatFeet(m: number): string {
  const totalIn = Math.round(metresToFeet(m) * 12);
  const ft = Math.floor(totalIn / 12);
  const inch = totalIn % 12;
  return `${ft}′${inch ? `${inch}″` : ""}`;
}

/** Validate tiling of a plan (used in development / tests). */
export function validatePlan(plan: FloorPlan): string[] {
  const issues: string[] = [];
  const rooms = indoorRooms(plan);
  const hw = plan.width / 2;
  let area = 0;
  for (const r of rooms) {
    const [x0, z0, x1, z1] = r.rect;
    if (x0 < -hw - EPS || x1 > hw + EPS || z0 < -EPS || z1 > plan.depth + EPS) issues.push(`${r.id} outside unit`);
    area += (x1 - x0) * (z1 - z0);
  }
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i].rect;
      const b = rooms[j].rect;
      const ox = Math.min(a[2], b[2]) - Math.max(a[0], b[0]);
      const oz = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
      if (ox > EPS && oz > EPS) issues.push(`${rooms[i].id} overlaps ${rooms[j].id}`);
    }
  }
  const total = plan.width * plan.depth;
  if (Math.abs(area - total) > 0.01) issues.push(`tiling gap: rooms ${area.toFixed(2)} vs unit ${total.toFixed(2)}`);
  return issues;
}
