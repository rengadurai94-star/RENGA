/**
 * Parametric cabinet geometry.
 *
 * A pure function that turns a product definition + dimensions into a list of
 * physical panels. The 3D renderer draws these panels, and the pricing engine
 * measures them (board area, edge banding, hardware counts) — so what you see
 * is exactly what you are charged for.
 *
 * Coordinates: millimetres, origin at the cabinet's bottom-left-back corner,
 * +x along the width, +y up, +z towards the room (front face at z = depth).
 */
import type { CategoryId, FrontZone, Handle, MountType, Product } from "@/lib/catalog/types";

export type Vec3 = [number, number, number];

export type Surface =
  | "carcass"
  | "back"
  | "front"
  | "drawerbox"
  | "metal"
  | "plinth"
  | "appliance"
  | "stone"
  | "basin"
  | "glass";

export type PartRole =
  | "side"
  | "bottom"
  | "top"
  | "rail"
  | "back"
  | "shelf"
  | "fixed-shelf"
  | "divider"
  | "plinth"
  | "door"
  | "drawer-front"
  | "flap"
  | "blind-panel"
  | "drawer-box"
  | "handle"
  | "rod"
  | "appliance"
  | "countertop"
  | "basin"
  | "tap"
  | "hob";

export interface Part {
  id: string;
  role: PartRole;
  surface: Surface;
  /** Box extents (mm). For cylinders: [length, diameter, diameter] along `axis`. */
  size: Vec3;
  /** Centre position in cabinet coordinates (mm). */
  pos: Vec3;
  shape?: "box" | "cylinder";
  axis?: "x" | "y" | "z";
  /** Edge-band running length (mm) used by pricing. */
  edgeMm?: number;
}

export type HingeSide = "left" | "right" | "top" | "slide";

export interface Front {
  id: string;
  kind: "door" | "drawer" | "flap";
  hinge: HingeSide;
  /** Rotation / slide origin in cabinet coordinates. */
  pivot: Vec3;
  /** Drawer travel (mm) or door/flap opening angle (radians). */
  travel: number;
  width: number;
  height: number;
  parts: Part[];
}

export interface CabinetCounts {
  doors: number;
  drawers: number;
  flaps: number;
  fronts: number;
  hinges: number;
  channels: number;
  shelves: number;
}

export interface CabinetGeometry {
  width: number;
  height: number;
  depth: number;
  plinth: number;
  parts: Part[];
  fronts: Front[];
  counts: CabinetCounts;
}

export const BOARD_T = 18;
export const BACK_T = 6;
export const FRONT_T = 18;
export const DRAWER_T = 12;
export const GAP = 3;
const SHELF_SETBACK = 20;
const PLINTH_RECESS = 50;

/** Categories whose top is closed by rails because a countertop sits on them. */
const COUNTER_CATEGORIES: CategoryId[] = ["kitchen-base", "corner", "drawer", "sink"];

export interface BuildInput {
  category: CategoryId;
  mount: MountType;
  zones: FrontZone[];
  plinthMm: number;
  width: number;
  height: number;
  depth: number;
  handle?: Pick<Handle, "style" | "lengthMm">;
}

export function inputFromProduct(
  product: Product,
  dims: { width: number; height: number; depth: number },
  handle?: Pick<Handle, "style" | "lengthMm">,
): BuildInput {
  return {
    category: product.category,
    mount: product.mount,
    zones: product.zones,
    plinthMm: product.plinthMm,
    width: dims.width,
    height: dims.height,
    depth: dims.depth,
    handle,
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Box helper from min/max corners. */
function box(id: string, role: PartRole, surface: Surface, min: Vec3, max: Vec3, edgeMm?: number): Part {
  return {
    id,
    role,
    surface,
    size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]],
    pos: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
    edgeMm,
  };
}

export function autoDoorCount(width: number) {
  if (width <= 600) return 1;
  if (width <= 1200) return 2;
  if (width <= 1800) return 3;
  return 4;
}

export function hingesPerDoor(doorHeight: number) {
  if (doorHeight <= 900) return 2;
  if (doorHeight <= 1600) return 3;
  return 4;
}

function doorHinges(n: number): HingeSide[] {
  // Pairs open away from each other; an odd door out hinges left.
  const out: HingeSide[] = [];
  let i = 0;
  if (n % 2 === 1) {
    out.push("left");
    i = 1;
  }
  for (; i < n; i += 2) out.push("left", "right");
  return out.slice(0, n);
}

/** Resolve zone heights (bottom → top) so they sum to the carcass height. */
export function resolveZoneHeights(zones: FrontZone[], carcassH: number): number[] {
  const fixed = zones.map((z) => (z.mm ? z.mm : z.frac ? z.frac * carcassH : 0));
  const used = fixed.reduce((a, b) => a + b, 0);
  const restCount = zones.filter((z) => !z.mm && !z.frac).length;
  const rest = restCount ? Math.max(0, carcassH - used) / restCount : 0;
  const heights = zones.map((z, i) => (z.mm || z.frac ? fixed[i] : rest));
  // If fixed zones overflow (e.g. a short custom height), scale proportionally.
  const sum = heights.reduce((a, b) => a + b, 0);
  return sum > 0 ? heights.map((h) => (h * carcassH) / sum) : heights;
}

export function buildCabinet(input: BuildInput): CabinetGeometry {
  const { width: W, height: H, depth: D, plinthMm, zones, mount, category, handle } = input;
  const T = BOARD_T;
  const pl = plinthMm;
  const y0 = pl;
  const y1 = H;
  const hc = y1 - y0;

  const parts: Part[] = [];
  const fronts: Front[] = [];
  const counts: CabinetCounts = { doors: 0, drawers: 0, flaps: 0, fronts: 0, hinges: 0, channels: 0, shelves: 0 };

  /* ── Carcass ── */
  parts.push(box("side-l", "side", "carcass", [0, y0, 0], [T, y1, D], hc));
  parts.push(box("side-r", "side", "carcass", [W - T, y0, 0], [W, y1, D], hc));
  parts.push(box("bottom", "bottom", "carcass", [T, y0, BACK_T], [W - T, y0 + T, D], W - 2 * T));

  const railTop = COUNTER_CATEGORIES.includes(category) && mount === "floor";
  if (railTop) {
    parts.push(box("rail-f", "rail", "carcass", [T, y1 - T, D - 100], [W - T, y1, D], W - 2 * T));
    parts.push(box("rail-b", "rail", "carcass", [T, y1 - T, BACK_T], [W - T, y1, BACK_T + 100]));
  } else {
    parts.push(box("top", "top", "carcass", [T, y1 - T, BACK_T], [W - T, y1, D], W - 2 * T));
  }
  parts.push(box("back", "back", "back", [T, y0, 0], [W - T, y1, BACK_T]));

  if (pl > 0) {
    parts.push(box("plinth", "plinth", "plinth", [0, 0, D - PLINTH_RECESS - T], [W, pl, D - PLINTH_RECESS]));
  }

  /* ── Zones ── */
  const heights = resolveZoneHeights(zones, hc);
  const zf = D + FRONT_T; // front face plane
  let cursor = y0;

  zones.forEach((zone, zi) => {
    const zy0 = cursor;
    const zy1 = cursor + heights[zi];
    cursor = zy1;
    const isFirst = zi === 0;
    const isLast = zi === zones.length - 1;

    // Fixed shelf at every internal zone boundary.
    if (!isLast) {
      parts.push(box(`fixed-${zi}`, "fixed-shelf", "carcass", [T, zy1 - T / 2, BACK_T], [W - T, zy1 + T / 2, D], W - 2 * T));
    }
    // Interior bounds for shelves inside this zone.
    const iy0 = isFirst ? y0 + T : zy0 + T / 2;
    const iy1 = isLast ? y1 - T : zy1 - T / 2;
    const open = zone.kind === "open";
    const shelfDepthEnd = open ? D : D - SHELF_SETBACK;

    const addShelves = (n: number, x0: number, x1: number, a: number, b: number, tag: string) => {
      for (let k = 1; k <= n; k++) {
        const y = a + ((b - a) * k) / (n + 1);
        parts.push(box(`shelf-${zi}-${tag}-${k}`, "shelf", "carcass", [x0, y - T / 2, BACK_T], [x1, y + T / 2, shelfDepthEnd], x1 - x0));
        counts.shelves++;
      }
    };

    const addHanging = (x0: number, x1: number, tag: string) => {
      const shelfY = iy1 - 320;
      parts.push(box(`shelf-${zi}-${tag}-top`, "shelf", "carcass", [x0, shelfY - T / 2, BACK_T], [x1, shelfY + T / 2, shelfDepthEnd], x1 - x0));
      counts.shelves++;
      parts.push({
        id: `rod-${zi}-${tag}`,
        role: "rod",
        surface: "metal",
        shape: "cylinder",
        axis: "x",
        size: [x1 - x0, 25, 25],
        pos: [(x0 + x1) / 2, shelfY - T / 2 - 70, BACK_T + (D - BACK_T) / 2],
      });
    };

    /* Interior fit-out */
    if (zone.kind === "doors" || zone.kind === "open" || zone.kind === "flap" || zone.kind === "blind") {
      const shelves = zone.shelves ?? 0;
      if (zone.divider) {
        const mid = W / 2;
        parts.push(box(`divider-${zi}`, "divider", "carcass", [mid - T / 2, iy0, BACK_T], [mid + T / 2, iy1, D], iy1 - iy0));
        addShelves(shelves, T, mid - T / 2, iy0, iy1, "l");
        if (zone.rod) addHanging(mid + T / 2, W - T, "r");
        else addShelves(shelves, mid + T / 2, W - T, iy0, iy1, "r");
      } else if (zone.rod) {
        addHanging(T, W - T, "c");
      } else {
        addShelves(shelves, T, W - T, iy0, iy1, "c");
      }
    }

    const fy0 = zy0 + GAP / 2;
    const fy1 = zy1 - GAP / 2;

    /* Fronts */
    if (zone.kind === "doors") {
      const n = zone.count === "auto" || zone.count === undefined ? autoDoorCount(W) : zone.count;
      const sides = doorHinges(n);
      for (let i = 0; i < n; i++) {
        const fx0 = (W * i) / n + GAP / 2;
        const fx1 = (W * (i + 1)) / n - GAP / 2;
        addDoor(`door-${zi}-${i}`, fx0, fx1, fy0, fy1, sides[i]);
      }
    } else if (zone.kind === "flap") {
      const id = `flap-${zi}`;
      const front = makeFront(id, "flap", "top", [W / 2, fy1, D], -Math.PI * 0.42, GAP / 2, W - GAP / 2, fy0, fy1);
      front.parts.push(...handleParts(id, "flap", GAP / 2, W - GAP / 2, fy0, fy1, "top"));
      counts.flaps++;
      counts.hinges += 2;
      fronts.push(front);
    } else if (zone.kind === "drawers") {
      const n = zone.count === "auto" || zone.count === undefined ? 3 : zone.count;
      const ratios = zone.ratios && zone.ratios.length === n ? zone.ratios : Array(n).fill(1);
      const total = ratios.reduce((a, b) => a + b, 0);
      // ratios are top → bottom; build from the top down.
      let top = zy1;
      for (let i = 0; i < n; i++) {
        const h = ((zy1 - zy0) * ratios[i]) / total;
        addDrawer(`drawer-${zi}-${i}`, GAP / 2, W - GAP / 2, top - h + GAP / 2, top - GAP / 2, T, W - T);
        top -= h;
      }
    } else if (zone.kind === "drawer-row") {
      const n = zone.count === "auto" || zone.count === undefined ? Math.max(2, Math.round(W / 600)) : zone.count;
      for (let i = 0; i < n; i++) {
        const fx0 = (W * i) / n + GAP / 2;
        const fx1 = (W * (i + 1)) / n - GAP / 2;
        // Each drawer box sits between imaginary dividers.
        const bx0 = i === 0 ? T : (W * i) / n;
        const bx1 = i === n - 1 ? W - T : (W * (i + 1)) / n;
        addDrawer(`drawer-${zi}-${i}`, fx0, fx1, fy0, fy1, bx0, bx1);
        if (i > 0) {
          parts.push(box(`row-div-${zi}-${i}`, "divider", "carcass", [(W * i) / n - T / 2, iy0, BACK_T], [(W * i) / n + T / 2, iy1, D], iy1 - iy0));
        }
      }
    } else if (zone.kind === "blind") {
      const doorW = clamp(W - 550, 300, 600);
      const split = W - doorW;
      parts.push(box(`blind-${zi}`, "blind-panel", "front", [GAP / 2, fy0, D], [split - GAP / 2, fy1, zf], 2 * (split + (fy1 - fy0))));
      addDoor(`door-${zi}-0`, split + GAP / 2, W - GAP / 2, fy0, fy1, "right");
    } else if (zone.kind === "niche") {
      const ax0 = T + 6;
      const ax1 = W - T - 6;
      const ay0 = zy0 + T / 2 + 8;
      const ay1 = zy1 - T / 2 - 8;
      parts.push(box(`appliance-${zi}`, "appliance", "appliance", [ax0, ay0, Math.max(BACK_T + 10, D - 540)], [ax1, ay1, D - 2]));
      parts.push(box(`appliance-glass-${zi}`, "appliance", "glass", [ax0 + 30, ay0 + 40, D - 2], [ax1 - 30, ay1 - 110, D + 2]));
      parts.push({
        id: `appliance-handle-${zi}`,
        role: "handle",
        surface: "metal",
        shape: "cylinder",
        axis: "x",
        size: [(ax1 - ax0) * 0.75, 16, 16],
        pos: [(ax0 + ax1) / 2, ay1 - 70, D + 26],
      });
    }
  });

  counts.fronts = counts.doors + counts.drawers + counts.flaps;
  return { width: W, height: H, depth: D, plinth: pl, parts, fronts, counts };

  /* ── helpers (hoisted) ── */

  function makeFront(
    id: string,
    kind: Front["kind"],
    hinge: HingeSide,
    pivot: Vec3,
    travel: number,
    fx0: number,
    fx1: number,
    fy0: number,
    fy1: number,
  ): Front {
    const role: PartRole = kind === "door" ? "door" : kind === "drawer" ? "drawer-front" : "flap";
    const panel = box(`${id}-panel`, role, "front", [fx0, fy0, D], [fx1, fy1, zf], 2 * (fx1 - fx0 + (fy1 - fy0)));
    return { id, kind, hinge, pivot, travel, width: fx1 - fx0, height: fy1 - fy0, parts: [panel] };
  }

  function addDoor(id: string, fx0: number, fx1: number, fy0: number, fy1: number, side: HingeSide) {
    const pivotX = side === "left" ? fx0 : fx1;
    const angle = side === "left" ? -Math.PI * 0.58 : Math.PI * 0.58;
    const front = makeFront(id, "door", side, [pivotX, (fy0 + fy1) / 2, D], angle, fx0, fx1, fy0, fy1);
    front.parts.push(...handleParts(id, "door", fx0, fx1, fy0, fy1, side));
    counts.doors++;
    counts.hinges += hingesPerDoor(fy1 - fy0);
    fronts.push(front);
  }

  function addDrawer(id: string, fx0: number, fx1: number, fy0: number, fy1: number, bx0: number, bx1: number) {
    const front = makeFront(id, "drawer", "slide", [0, 0, 0], Math.min(450, D * 0.72), fx0, fx1, fy0, fy1);
    // Drawer box behind the front, inside the carcass runners.
    const ix0 = bx0 + 13;
    const ix1 = bx1 - 13;
    const bh = Math.max(70, fy1 - fy0 - 70);
    const by0 = fy0 + 20;
    const bd = Math.max(200, D - BACK_T - 40);
    const bz0 = D - bd;
    const t = DRAWER_T;
    front.parts.push(
      box(`${id}-box-l`, "drawer-box", "drawerbox", [ix0, by0, bz0], [ix0 + t, by0 + bh, D]),
      box(`${id}-box-r`, "drawer-box", "drawerbox", [ix1 - t, by0, bz0], [ix1, by0 + bh, D]),
      box(`${id}-box-b`, "drawer-box", "drawerbox", [ix0 + t, by0, bz0], [ix1 - t, by0 + bh, bz0 + t]),
      box(`${id}-box-btm`, "drawer-box", "drawerbox", [ix0 + t, by0, bz0 + t], [ix1 - t, by0 + 8, D]),
    );
    front.parts.push(...handleParts(id, "drawer", fx0, fx1, fy0, fy1, "slide"));
    counts.drawers++;
    counts.channels++;
    fronts.push(front);
  }

  function handleParts(
    id: string,
    kind: Front["kind"],
    fx0: number,
    fx1: number,
    fy0: number,
    fy1: number,
    side: HingeSide,
  ): Part[] {
    const style = handle?.style ?? "none";
    if (style === "none") return [];
    const L = handle?.lengthMm || 160;
    const fw = fx1 - fx0;
    const fh = fy1 - fy0;
    const highMount = mount === "wall" || mount === "loft" || fy0 > 1300;

    if (style === "gprofile") {
      const y = highMount ? fy0 + 10 : fy1 - 10;
      return [box(`${id}-gp`, "handle", "metal", [fx0, y - 10, D - 2], [fx1, y + 10, zf + 6])];
    }

    // Anchor point on the front face.
    let cx: number;
    let cy: number;
    let vertical = false;
    if (kind === "door") {
      vertical = style === "bar";
      cx = side === "left" ? fx1 - 42 : fx0 + 42;
      if (highMount) cy = fy0 + 45 + (vertical ? L / 2 : 0);
      else if (fh > 900 && fy0 < 1050 && fy1 > 1050) cy = 1050;
      else cy = fy1 - 45 - (vertical ? L / 2 : 0);
    } else if (kind === "drawer") {
      cx = (fx0 + fx1) / 2;
      cy = fh < 220 ? (fy0 + fy1) / 2 : fy1 - 55;
    } else {
      cx = (fx0 + fx1) / 2;
      cy = fy0 + 45;
    }

    if (style === "knob") {
      return [
        { id: `${id}-knob`, role: "handle", surface: "metal", shape: "cylinder", axis: "z", size: [26, 30, 30], pos: [cx, cy, zf + 13] },
      ];
    }
    if (style === "edge") {
      const len = Math.min(L, fw - 40);
      const ex = kind === "door" ? (side === "left" ? fx1 - 20 - len / 2 : fx0 + 20 + len / 2) : cx;
      const ey = highMount && kind !== "drawer" ? fy0 + 4 : fy1 - 4;
      return [box(`${id}-edge`, "handle", "metal", [ex - len / 2, ey - 4, zf - 6], [ex + len / 2, ey + 4, zf + 26])];
    }
    // Bar handle with two stand-offs.
    const len = Math.min(L, (vertical ? fh : fw) - 60);
    const out: Part[] = [];
    if (vertical) {
      out.push(box(`${id}-bar`, "handle", "metal", [cx - 6, cy - len / 2, zf + 18], [cx + 6, cy + len / 2, zf + 30]));
      for (const s of [-1, 1]) {
        const y = cy + s * (len / 2 - 12);
        out.push(box(`${id}-leg${s}`, "handle", "metal", [cx - 4, y - 4, zf], [cx + 4, y + 4, zf + 18]));
      }
    } else {
      out.push(box(`${id}-bar`, "handle", "metal", [cx - len / 2, cy - 6, zf + 18], [cx + len / 2, cy + 6, zf + 30]));
      for (const s of [-1, 1]) {
        const x = cx + s * (len / 2 - 12);
        out.push(box(`${id}-leg${s}`, "handle", "metal", [x - 4, cy - 4, zf], [x + 4, cy + 4, zf + 18]));
      }
    }
    return out;
  }
}

/* ───────────────────────── Countertop ───────────────────────── */

export const COUNTER_T = 20;
export const COUNTER_OVERHANG = 20;

/**
 * Countertop for a single base unit, optionally with a sink cut-out + basin
 * or a hob. Coordinates match the cabinet below it.
 */
export function buildCountertop(opts: { width: number; depth: number; height: number; sink?: boolean; hob?: boolean }): Part[] {
  const { width: W, depth: D, height: H } = opts;
  const y0 = H;
  const y1 = H + COUNTER_T;
  const zEnd = D + FRONT_T + COUNTER_OVERHANG;
  const parts: Part[] = [];

  if (opts.sink && W >= 450) {
    const hw = Math.min(250, W / 2 - 60);
    const hx0 = W / 2 - hw;
    const hx1 = W / 2 + hw;
    const hz0 = 110;
    const hz1 = Math.min(zEnd - 80, hz0 + 420);
    parts.push(box("ct-l", "countertop", "stone", [0, y0, 0], [hx0, y1, zEnd]));
    parts.push(box("ct-r", "countertop", "stone", [hx1, y0, 0], [W, y1, zEnd]));
    parts.push(box("ct-b", "countertop", "stone", [hx0, y0, 0], [hx1, y1, hz0]));
    parts.push(box("ct-f", "countertop", "stone", [hx0, y0, hz1], [hx1, y1, zEnd]));
    // Basin: an open stainless box hung below the cut-out.
    const depth = 190;
    const t = 2;
    const by0 = y1 - depth;
    parts.push(box("basin-btm", "basin", "basin", [hx0, by0, hz0], [hx1, by0 + t, hz1]));
    parts.push(box("basin-l", "basin", "basin", [hx0, by0, hz0], [hx0 + t, y1 - 1, hz1]));
    parts.push(box("basin-r", "basin", "basin", [hx1 - t, by0, hz0], [hx1, y1 - 1, hz1]));
    parts.push(box("basin-b", "basin", "basin", [hx0, by0, hz0], [hx1, y1 - 1, hz0 + t]));
    parts.push(box("basin-f", "basin", "basin", [hx0, by0, hz1 - t], [hx1, y1 - 1, hz1]));
    // Tap
    parts.push({ id: "tap-col", role: "tap", surface: "metal", shape: "cylinder", axis: "y", size: [300, 26, 26], pos: [W / 2, y1 + 150, 60] });
    parts.push({ id: "tap-spout", role: "tap", surface: "metal", shape: "cylinder", axis: "z", size: [200, 22, 22], pos: [W / 2, y1 + 290, 150] });
  } else {
    parts.push(box("ct", "countertop", "stone", [0, y0, 0], [W, y1, zEnd]));
  }

  if (opts.hob && W >= 600) {
    const hw = Math.min(W - 120, 760) / 2;
    parts.push(box("hob", "hob", "glass", [W / 2 - hw, y1, 90], [W / 2 + hw, y1 + 6, 90 + 510]));
  }
  return parts;
}
