/**
 * Procedural furniture. Every room type has a "furnisher" that places pieces
 * against its anchor wall (see Room.anchor) using the free wall span computed
 * from the plan, so furniture never blocks doors or windows.
 *
 * Coordinates inside a furniture frame: u = along the wall, v = into the room,
 * y = up. The frame origin sits on the inner face of the wall.
 */
import type { FloorPlan, Room, Side } from "@/config/floorplans";
import type { Builder } from "./builder";
import type { MatKey } from "./materials";
import { CEILING_HEIGHT, EPS, WALL_EXT, WALL_INT, freeSpan, roomCenter, roomOpenings } from "./plan";

type Collider = [number, number, number, number];

interface Ctx {
  detail: "low" | "high";
  colliders?: Collider[];
}

interface Frame {
  x: number;
  z: number;
  rot: number;
  len: number;
  depth: number;
}

function onPerimeter(plan: FloorPlan, room: Room, side: Side) {
  const [x0, z0, x1, z1] = room.rect;
  const hw = plan.width / 2;
  switch (side) {
    case "back":
      return Math.abs(z0) < EPS;
    case "front":
      return Math.abs(z1 - plan.depth) < EPS;
    case "left":
      return Math.abs(x0 + hw) < EPS;
    case "right":
      return Math.abs(x1 - hw) < EPS;
  }
}

function anchorFrame(plan: FloorPlan, room: Room, side: Side, span?: [number, number]): Frame {
  const [x0, z0, x1, z1] = room.rect;
  const s = span ?? freeSpan(plan, room, side);
  const inset = room.outdoor ? 0.08 : onPerimeter(plan, room, side) ? WALL_EXT : WALL_INT / 2;
  const mid = (s[0] + s[1]) / 2;
  const len = s[1] - s[0];
  switch (side) {
    case "back":
      return { x: mid, z: z0 + inset, rot: 0, len, depth: z1 - z0 - inset - WALL_INT / 2 };
    case "front":
      return { x: mid, z: z1 - inset, rot: Math.PI, len, depth: z1 - z0 - inset - WALL_INT / 2 };
    case "left":
      return { x: x0 + inset, z: mid, rot: Math.PI / 2, len, depth: x1 - x0 - inset - WALL_INT / 2 };
    case "right":
      return { x: x1 - inset, z: mid, rot: -Math.PI / 2, len, depth: x1 - x0 - inset - WALL_INT / 2 };
  }
}

function inFrame(b: Builder, f: Frame, fn: () => void) {
  b.frame(f.x, 0, f.z, f.rot, fn);
}

function solid(b: Builder, ctx: Ctx, u0: number, v0: number, u1: number, v1: number) {
  ctx.colliders?.push(b.footprint(u0, v0, u1, v1));
}

/* ------------------------------------------------------------------ */
/* Pieces (built at the current frame origin, back at v = 0, facing +v) */
/* ------------------------------------------------------------------ */

function sofa(b: Builder, ctx: Ctx, len: number, mat: MatKey = "fabric", accent: MatKey = "fabricAccent") {
  const d = 0.95;
  for (const su of [-1, 1])
    for (const sv of [0.08, d - 0.08]) b.box("walnut", 0.05, 0.1, 0.05, su * (len / 2 - 0.1), 0.05, sv);
  b.rounded(mat, len, 0.2, d, 0.04, 0, 0.2, d / 2);
  b.rounded(mat, len, 0.48, 0.22, 0.06, 0, 0.54, 0.11);
  b.rounded(mat, 0.2, 0.32, d, 0.05, -(len / 2 - 0.1), 0.46, d / 2);
  b.rounded(mat, 0.2, 0.32, d, 0.05, len / 2 - 0.1, 0.46, d / 2);
  const n = len > 2.2 ? 3 : 2;
  const inner = len - 0.4;
  for (let i = 0; i < n; i++) {
    const u = -inner / 2 + (inner / n) * (i + 0.5);
    b.rounded(mat, inner / n - 0.02, 0.14, d - 0.24, 0.05, u, 0.37, 0.22 + (d - 0.22) / 2);
    if (ctx.detail === "high") b.rounded(mat, inner / n - 0.03, 0.42, 0.16, 0.07, u, 0.62, 0.3);
  }
  if (ctx.detail === "high") {
    b.rounded(accent, 0.42, 0.42, 0.12, 0.05, -(len / 2 - 0.45), 0.66, 0.42);
    b.rounded(accent, 0.42, 0.42, 0.12, 0.05, len / 2 - 0.45, 0.66, 0.42);
  }
  solid(b, ctx, -len / 2, 0, len / 2, d);
}

function armchair(b: Builder, ctx: Ctx, mat: MatKey = "fabricAccent") {
  const w = 0.8;
  const d = 0.82;
  b.rounded(mat, w, 0.24, d, 0.05, 0, 0.26, d / 2);
  b.rounded(mat, w, 0.5, 0.18, 0.06, 0, 0.56, 0.09);
  b.rounded(mat, 0.14, 0.28, d, 0.05, -w / 2 + 0.07, 0.48, d / 2);
  b.rounded(mat, 0.14, 0.28, d, 0.05, w / 2 - 0.07, 0.48, d / 2);
  for (const su of [-1, 1]) for (const sv of [0.08, d - 0.08]) b.box("walnut", 0.04, 0.14, 0.04, su * (w / 2 - 0.08), 0.07, sv);
  solid(b, ctx, -w / 2, 0, w / 2, d);
}

function plant(b: Builder, scale = 1) {
  const s = scale * 0.85;
  b.cyl("pot", 0.17 * s, 0.13 * s, 0.4 * s, 0, 0.2 * s, 0, 20);
  b.cyl("soil", 0.155 * s, 0.155 * s, 0.02, 0, 0.39 * s, 0, 16);
  b.cyl("walnut", 0.012 * s, 0.018 * s, 0.9 * s, 0, 0.82 * s, 0, 6);
  // leaf clusters spiralling up the stem
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4;
    const r = (0.09 + (i % 3) * 0.04) * s;
    const y = (0.75 + i * 0.075) * s;
    b.sphere("plant", (0.11 - i * 0.004) * s, Math.cos(a) * r, y, Math.sin(a) * r, 0.55, 9);
  }
}

function floorLamp(b: Builder) {
  b.cyl("brass", 0.15, 0.15, 0.02, 0, 0.01, 0);
  b.cyl("brass", 0.012, 0.012, 1.45, 0, 0.74, 0, 8);
  b.cyl("linen", 0.17, 0.22, 0.28, 0, 1.55, 0);
  b.sphere("glow", 0.06, 0, 1.48, 0);
}

function tableLamp(b: Builder, x: number, y: number, z: number) {
  b.cyl("brass", 0.06, 0.07, 0.04, x, y + 0.02, z);
  b.cyl("brass", 0.01, 0.01, 0.28, x, y + 0.16, z, 8);
  b.cyl("linen", 0.11, 0.14, 0.2, x, y + 0.38, z);
  b.sphere("glow", 0.045, x, y + 0.33, z);
}

function chair(b: Builder, ctx: Ctx) {
  b.rounded("fabric", 0.46, 0.08, 0.46, 0.03, 0, 0.47, 0);
  b.box("walnut", 0.46, 0.42, 0.04, 0, 0.74, -0.21);
  if (ctx.detail === "high")
    for (const su of [-1, 1]) for (const sv of [-1, 1]) b.box("walnut", 0.035, 0.44, 0.035, su * 0.2, 0.22, sv * 0.2);
}

function wardrobe(b: Builder, ctx: Ctx, len: number, height = 2.4) {
  const d = 0.6;
  b.box("lacquer", len, height, d, 0, height / 2 + 0.02, d / 2);
  b.box("black", len - 0.04, 0.02, d - 0.04, 0, 0.01, d / 2);
  const n = Math.max(2, Math.round(len / 0.55));
  for (let i = 1; i < n; i++) {
    const u = -len / 2 + (len * i) / n;
    b.box("black", 0.008, height - 0.06, 0.01, u, height / 2 + 0.02, d + 0.002);
  }
  if (ctx.detail === "high")
    for (let i = 0; i < n; i++) {
      const u = -len / 2 + (len * (i + 0.5)) / n + (i % 2 ? -0.2 : 0.2);
      b.box("bronze", 0.02, 0.5, 0.025, u, 1.15, d + 0.012);
    }
  solid(b, ctx, -len / 2, 0, len / 2, d);
}

function rug(b: Builder, w: number, d: number, u: number, v: number, mat: MatKey = "rug") {
  b.slab(mat, u - w / 2, v - d / 2, u + w / 2, v + d / 2, 0.025, 0.012);
}

function pendant(b: Builder, x: number, z: number, drop = 1.05, mat: MatKey = "brass") {
  const y = CEILING_HEIGHT - drop;
  b.cyl("black", 0.004, 0.004, drop - 0.15, x, CEILING_HEIGHT - (drop - 0.15) / 2, z, 6);
  b.cyl(mat, 0.05, 0.2, 0.2, x, y + 0.1, z, 20);
  b.sphere("glow", 0.07, x, y + 0.02, z);
}

function art(b: Builder, w: number, h: number, y: number, mat: MatKey) {
  b.box("walnut", w + 0.06, h + 0.06, 0.03, 0, y, 0.015);
  b.box(mat, w, h, 0.01, 0, y, 0.035);
}

/* ------------------------------------------------------------------ */
/* Room furnishers                                                     */
/* ------------------------------------------------------------------ */

function living(b: Builder, plan: FloorPlan, room: Room, ctx: Ctx, compact = false) {
  const side = room.anchor ?? "back";
  const f = anchorFrame(plan, room, side);
  const hi = ctx.detail === "high";
  inFrame(b, f, () => {
    const panelW = Math.min(3.4, f.len - 0.3);
    if (hi) {
      for (let u = -panelW / 2 + 0.05; u < panelW / 2; u += 0.13) b.box("oak", 0.07, 2.75, 0.04, u, 1.375, 0.02);
      b.box("black", 1.7, 0.98, 0.05, 0, 1.5, 0.07);
      b.box("screen", 1.64, 0.92, 0.01, 0, 1.5, 0.1);
    }
    const consoleW = Math.min(2.4, panelW - 0.2);
    b.box("walnut", consoleW, 0.36, 0.42, 0, 0.36, 0.25);
    b.box("black", consoleW - 0.1, 0.18, 0.36, 0, 0.09, 0.24);
    solid(b, ctx, -consoleW / 2, 0, consoleW / 2, 0.46);
    if (hi) {
      b.cyl("ceramic", 0.07, 0.05, 0.25, consoleW / 2 - 0.25, 0.665, 0.25);
      b.box("oak", 0.3, 0.05, 0.22, -consoleW / 2 + 0.3, 0.565, 0.25);
    }

    const sofaLen = Math.min(compact ? 2.2 : 2.8, f.len - 0.6);
    const dist = Math.max(2.3, Math.min(compact ? 3.0 : 3.7, f.depth - 1.15));
    b.frame(0, 0, dist + 0.95, Math.PI, () => sofa(b, ctx, sofaLen));
    rug(b, Math.min(3.2, sofaLen + 0.6), Math.min(2.4, dist - 0.3), 0, dist - (dist - 0.3) / 2 + 0.6);
    // coffee table
    const ct = dist - 0.55;
    b.cyl("counter", 0.52, 0.52, 0.04, 0, 0.4, ct, 32);
    b.cyl("walnut", 0.28, 0.32, 0.38, 0, 0.19, ct, 24);
    solid(b, ctx, -0.5, ct - 0.5, 0.5, ct + 0.5);
    if (hi) {
      b.box("oak", 0.3, 0.04, 0.22, 0.12, 0.44, ct - 0.05);
      b.cyl("ceramic", 0.07, 0.09, 0.18, -0.2, 0.51, ct + 0.1);
    }
    // armchairs if wide enough
    if (!compact && f.len > sofaLen + 2.2) {
      b.frame(-(sofaLen / 2 + 0.75), 0, ct, -Math.PI / 2 + 0.25, () => armchair(b, ctx));
      if (f.len > sofaLen + 3.2) b.frame(sofaLen / 2 + 0.75, 0, ct, Math.PI / 2 - 0.25, () => armchair(b, ctx));
    }
    if (hi) {
      b.frame(sofaLen / 2 + 0.35, 0, dist + 0.6, 0, () => floorLamp(b));
      b.frame(-panelW / 2 - 0.35 > -f.len / 2 ? -panelW / 2 - 0.35 : -f.len / 2 + 0.35, 0, 0.35, 0, () => plant(b, 1.15));
    }
  });
}

function dining(b: Builder, plan: FloorPlan, room: Room, ctx: Ctx) {
  const [x0, z0, x1, z1] = room.rect;
  const [cx, cz] = roomCenter(room);
  const w = x1 - x0;
  const d = z1 - z0;
  const big = w * d > 24;
  const L = big ? 2.4 : 1.9;
  const W = 1.0;
  const rot = w >= d ? 0 : Math.PI / 2;
  // keep the table out of the main circulation for very deep rooms
  const shiftZ = d > 5.5 ? -(d / 2 - 2.6) : 0;
  b.frame(cx, 0, cz + shiftZ, rot, () => {
    rug(b, L + 1.4, W + 1.6, 0, 0);
    b.box("oak", L, 0.05, W, 0, 0.745, 0);
    b.box("walnut", 0.12, 0.72, W * 0.7, -L / 2 + 0.35, 0.36, 0);
    b.box("walnut", 0.12, 0.72, W * 0.7, L / 2 - 0.35, 0.36, 0);
    solid(b, ctx, -L / 2 - 0.3, -W / 2 - 0.3, L / 2 + 0.3, W / 2 + 0.3);
    const perSide = big ? 3 : 2;
    for (let i = 0; i < perSide; i++) {
      const u = -L / 2 + (L / perSide) * (i + 0.5);
      b.frame(u, 0, -W / 2 - 0.3, 0, () => chair(b, ctx));
      b.frame(u, 0, W / 2 + 0.3, Math.PI, () => chair(b, ctx));
    }
    b.frame(-L / 2 - 0.35, 0, 0, Math.PI / 2, () => chair(b, ctx));
    b.frame(L / 2 + 0.35, 0, 0, -Math.PI / 2, () => chair(b, ctx));
    if (ctx.detail === "high") {
      for (let i = 0; i < 3; i++) pendant(b, -L / 3 + (L / 3) * i, 0, 1.25);
      b.cyl("ceramic", 0.12, 0.08, 0.06, 0, 0.8, 0);
      b.sphere("plant", 0.08, 0, 0.86, 0);
    }
  });
  if (ctx.detail === "high") {
    // corner plant
    b.frame(x0 + 0.45, 0, z1 - 0.45, 0, () => plant(b, 1.1));
  }
}

function kitchenLeg(b: Builder, ctx: Ctx, f: Frame, uppers: boolean, appliances: boolean) {
  const len = f.len;
  const hi = ctx.detail === "high";
  inFrame(b, f, () => {
    let cabLen = len;
    let cabU = 0;
    if (appliances && len > 2.6) {
      // fridge at one end
      b.box("chrome", 0.78, 1.9, 0.7, len / 2 - 0.39, 0.95, 0.36);
      if (hi) b.box("black", 0.01, 1.2, 0.02, len / 2 - 0.39, 1.2, 0.715);
      solid(b, ctx, len / 2 - 0.78, 0, len / 2, 0.72);
      cabLen = len - 0.82;
      cabU = -0.41;
    }
    b.box("lacquer", cabLen, 0.78, 0.58, cabU, 0.49, 0.29);
    b.box("black", cabLen, 0.1, 0.5, cabU, 0.05, 0.25);
    b.box("counter", cabLen, 0.04, 0.64, cabU, 0.9, 0.32);
    solid(b, ctx, cabU - cabLen / 2, 0, cabU + cabLen / 2, 0.64);
    if (hi) {
      const n = Math.max(2, Math.round(cabLen / 0.6));
      for (let i = 1; i < n; i++) b.box("black", 0.006, 0.74, 0.01, cabU - cabLen / 2 + (cabLen * i) / n, 0.49, 0.585);
      b.box("brass", cabLen - 0.1, 0.015, 0.015, cabU, 0.84, 0.6);
    }
    if (appliances) {
      b.box("black", 0.62, 0.012, 0.5, cabU - cabLen / 4, 0.925, 0.32);
      b.box("chrome", 0.72, 0.012, 0.44, cabU + cabLen / 4, 0.925, 0.32);
      if (hi) {
        b.cylX("chrome", 0.012, 0.25, cabU + cabLen / 4, 1.1, 0.12, Math.PI / 2);
        b.box("chrome", 0.7, 0.45, 0.45, cabU - cabLen / 4, 2.05, 0.225);
        for (let i = -1; i <= 1; i += 2) b.cyl("black", 0.09, 0.09, 0.006, cabU - cabLen / 4 + i * 0.15, 0.934, 0.32);
      }
    }
    if (hi) {
      b.box("counter", cabLen, 0.6, 0.02, cabU, 1.22, 0.01);
      if (uppers) {
        const upLen = appliances ? cabLen - 0.8 : cabLen;
        const upU = appliances ? cabU + 0.4 : cabU;
        if (upLen > 0.4) {
          b.box("oak", upLen, 0.72, 0.35, upU, 1.95, 0.175);
          b.box("glow", upLen - 0.05, 0.01, 0.04, upU, 1.585, 0.3);
        }
      }
    }
  });
}

function kitchen(b: Builder, plan: FloorPlan, room: Room, ctx: Ctx) {
  const s1 = room.anchor ?? "back";
  kitchenLeg(b, ctx, anchorFrame(plan, room, s1), true, true);
  if (room.anchor2) {
    const span = freeSpan(plan, room, room.anchor2);
    // trim the part that overlaps the first leg's counter
    const [x0, z0, x1, z1] = room.rect;
    const trimmed: [number, number] = [...span];
    const depth = 0.64 + (s1 === "back" || s1 === "front" ? 0 : 0);
    if (s1 === "back") trimmed[0] = Math.max(span[0], z0 + depth);
    if (s1 === "front") trimmed[1] = Math.min(span[1], z1 - depth);
    if (s1 === "left") trimmed[0] = Math.max(span[0], x0 + depth);
    if (s1 === "right") trimmed[1] = Math.min(span[1], x1 - depth);
    if (trimmed[1] - trimmed[0] > 0.6) kitchenLeg(b, ctx, anchorFrame(plan, room, room.anchor2, trimmed), false, false);
  }
  if (ctx.detail === "high") {
    const [cx, cz] = roomCenter(room);
    pendant(b, cx, cz, 0.9);
  }
}

function bedroom(b: Builder, plan: FloorPlan, room: Room, ctx: Ctx) {
  const master = room.type === "master";
  const hi = ctx.detail === "high";
  const side = room.anchor ?? "back";
  const f = anchorFrame(plan, room, side);
  const bedW = master ? 1.95 : 1.65;
  const bedL = 2.15;
  inFrame(b, f, () => {
    if (hi) {
      const pw = Math.min(f.len - 0.1, bedW + 2.0);
      b.box("oak", pw, 2.6, 0.03, 0, 1.3, 0.015);
      b.box("glow", pw - 0.1, 0.015, 0.02, 0, 2.59, 0.04);
    }
    b.rounded(master ? "fabricAccent" : "fabric", bedW + 0.3, 1.1, 0.1, 0.03, 0, 0.55, 0.08);
    b.box("oak", bedW, 0.28, bedL, 0, 0.18, 0.1 + bedL / 2);
    b.rounded("linen", bedW - 0.06, 0.24, bedL - 0.1, 0.06, 0, 0.42, 0.12 + bedL / 2);
    b.rounded(master ? "fabricDark" : "fabricAccent", bedW + 0.04, 0.05, 0.55, 0.02, 0, 0.56, 0.1 + bedL - 0.45);
    solid(b, ctx, -bedW / 2, 0, bedW / 2, bedL + 0.1);
    if (hi) {
      b.rounded("linen", 0.62, 0.16, 0.36, 0.07, -bedW / 4, 0.62, 0.36);
      b.rounded("linen", 0.62, 0.16, 0.36, 0.07, bedW / 4, 0.62, 0.36);
      b.rounded(master ? "fabricDark" : "fabric", 0.45, 0.32, 0.12, 0.05, 0, 0.66, 0.55);
      rug(b, bedW + 1.4, 1.8, 0, 0.1 + bedL * 0.62);
    }
    if (f.len >= bedW + 1.0) {
      for (const su of [-1, 1]) {
        const u = su * (bedW / 2 + 0.33);
        b.box("walnut", 0.45, 0.48, 0.4, u, 0.26, 0.24);
        solid(b, ctx, u - 0.23, 0, u + 0.23, 0.45);
        if (hi) tableLamp(b, u, 0.5, 0.24);
      }
    }
  });
  if (room.anchor2) {
    const span = freeSpan(plan, room, room.anchor2);
    const len = Math.min(span[1] - span[0] - 0.1, master ? 3.0 : 2.4);
    if (len > 1.0) {
      const f2 = anchorFrame(plan, room, room.anchor2, span);
      inFrame(b, f2, () => wardrobe(b, ctx, len, hi ? 2.4 : 2.4));
    }
  }
  if (hi && master) {
    // reading chair near the window wall corner
    const [x0, , x1, z1] = room.rect;
    const corners: [number, number][] = [
      [x0 + 0.7, z1 - 0.7],
      [x1 - 0.7, z1 - 0.7],
    ];
    const hw = plan.width / 2;
    const c = corners.find(([x]) => Math.abs(x) < hw - 0.3) ?? corners[0];
    b.frame(c[0], 0, c[1], Math.PI + 0.6, () => armchair(b, ctx, "fabric"));
  }
}

function bath(b: Builder, plan: FloorPlan, room: Room, ctx: Ctx, powder = false) {
  const side = room.anchor ?? "back";
  const span = freeSpan(plan, room, side);
  const [x0, , x1] = room.rect;
  const fullLen = side === "back" || side === "front" ? x1 - x0 : room.rect[3] - room.rect[1];
  const f = anchorFrame(plan, room, side, span);
  const hi = ctx.detail === "high";
  inFrame(b, f, () => {
    // where is the door? (in frame coords)
    const op = roomOpenings(plan, room)[0];
    let doorU = 0;
    if (op) {
      const mid = (op.from + op.to) / 2;
      const [u] = op.orient === "h" ? b.toLocal(mid, op.at) : b.toLocal(op.at, mid);
      doorU = u;
    }
    const end = doorU <= 0 ? 1 : -1; // shower at the end away from the door
    const len = Math.min(f.len, fullLen);
    if (!powder) {
      const sw = Math.min(1.0, len * 0.42);
      const su0 = end > 0 ? len / 2 - sw : -len / 2;
      const su1 = su0 + sw;
      const sd = Math.max(1.2, f.depth - 0.05);
      b.box("ceramic", sw, 0.04, sd, (su0 + su1) / 2, 0.03, sd / 2);
      const gu = end > 0 ? su0 : su1;
      b.box("glassInterior", 0.012, Math.min(2.0, hi ? 2.0 : 1.1), sd * 0.6, gu, hi ? 1.0 : 0.55, sd * 0.3);
      b.box("chrome", 0.02, 0.02, sd * 0.6, gu, hi ? 2.0 : 1.1, sd * 0.3);
      if (hi) {
        b.cyl("chrome", 0.11, 0.11, 0.015, (su0 + su1) / 2, 2.1, 0.35);
        b.box("chrome", 0.02, 0.02, 0.3, (su0 + su1) / 2, 2.12, 0.18);
      }
      solid(b, ctx, gu - 0.02, 0, gu + 0.02, sd * 0.6);
    }
    // vanity and WC on the remaining wall
    const vw = Math.min(powder ? 0.8 : 0.9, len * 0.4);
    const vu = -end * (len / 2 - vw / 2 - 0.05);
    b.box("walnut", vw, 0.42, 0.5, vu, 0.64, 0.25);
    b.box("ceramic", vw * 0.6, 0.12, 0.38, vu, 0.91, 0.25);
    solid(b, ctx, vu - vw / 2, 0, vu + vw / 2, 0.5);
    if (hi) {
      b.box("mirror", vw * 0.9, 0.85, 0.02, vu, 1.55, 0.015);
      b.box("glow", vw * 0.9, 0.02, 0.03, vu, 2.0, 0.03);
      b.cyl("chrome", 0.012, 0.012, 0.18, vu, 1.0, 0.1, 8);
    }
    const wu = vu + end * (vw / 2 + 0.35);
    b.box("ceramic", 0.38, 0.38, 0.5, wu, 0.19, 0.4);
    b.box("ceramic", 0.42, 0.32, 0.16, wu, 0.5, 0.1);
    solid(b, ctx, wu - 0.2, 0, wu + 0.2, 0.65);
  });
}

function simpleAnchor(b: Builder, plan: FloorPlan, room: Room, ctx: Ctx, fn: (f: Frame) => void) {
  const side = room.anchor ?? "back";
  const f = anchorFrame(plan, room, side);
  inFrame(b, f, () => fn(f));
}

function foyer(b: Builder, plan: FloorPlan, room: Room, ctx: Ctx) {
  simpleAnchor(b, plan, room, ctx, (f) => {
    const w = Math.min(1.4, f.len - 0.4);
    b.box("walnut", w, 0.08, 0.38, 0, 0.82, 0.2);
    b.box("walnut", 0.06, 0.8, 0.3, -w / 2 + 0.06, 0.4, 0.2);
    b.box("walnut", 0.06, 0.8, 0.3, w / 2 - 0.06, 0.4, 0.2);
    solid(b, ctx, -w / 2, 0, w / 2, 0.4);
    if (ctx.detail === "high") {
      b.cyl("mirror", 0.45, 0.45, 0.02, 0, 1.55, 0.02, 40);
      b.cyl("ceramic", 0.09, 0.06, 0.32, -w / 4, 1.02, 0.2);
      b.sphere("plant", 0.12, -w / 4, 1.25, 0.2);
      b.box("brass", 0.25, 0.03, 0.18, w / 4, 0.875, 0.2);
      pendant(b, 0, Math.min(1.3, f.depth / 2), 0.8);
    }
  });
}

function pooja(b: Builder, plan: FloorPlan, room: Room, ctx: Ctx) {
  simpleAnchor(b, plan, room, ctx, (f) => {
    const w = Math.min(1.2, f.len - 0.2);
    b.box("oak", w, 0.85, 0.45, 0, 0.425, 0.23);
    solid(b, ctx, -w / 2, 0, w / 2, 0.46);
    if (ctx.detail === "high") {
      b.box("brass", w, 1.4, 0.02, 0, 1.6, 0.01);
      b.box("oak", w, 0.04, 0.3, 0, 1.35, 0.15);
      b.box("oak", w, 0.04, 0.3, 0, 1.85, 0.15);
      for (const u of [-w / 3, w / 3]) {
        b.cyl("brass", 0.07, 0.04, 0.08, u, 0.89, 0.25);
        b.cyl("brass", 0.012, 0.012, 0.25, u, 1.0, 0.25, 8);
        b.sphere("glow", 0.025, u, 1.14, 0.25);
      }
      b.box("brass", 0.14, 0.22, 0.1, 0, 1.48, 0.15);
      b.cyl("fabricAccent", 0.35, 0.35, 0.02, 0, 0.03, 1.0, 24);
    }
  });
}

function lounge(b: Builder, plan: FloorPlan, room: Room, ctx: Ctx) {
  living(b, plan, room, ctx, true);
}

function media(b: Builder, plan: FloorPlan, room: Room, ctx: Ctx) {
  simpleAnchor(b, plan, room, ctx, (f) => {
    const sw = Math.min(2.8, f.len - 0.4);
    if (ctx.detail === "high") {
      b.box("black", sw, sw * 0.5, 0.05, 0, 1.55, 0.03);
      b.box("screen", sw - 0.06, sw * 0.5 - 0.06, 0.01, 0, 1.55, 0.06);
      for (const su of [-1, 1]) b.box("black", 0.22, 1.0, 0.25, su * (sw / 2 + 0.05 > f.len / 2 - 0.15 ? f.len / 2 - 0.15 : sw / 2 + 0.05), 0.5, 0.15);
    }
    b.box("walnut", Math.min(2.2, sw), 0.3, 0.4, 0, 0.3, 0.22);
    const dist = Math.max(2.0, Math.min(2.8, f.depth - 1.1));
    b.frame(0, 0, dist + 1.0, Math.PI, () => sofa(b, ctx, Math.min(2.6, f.len - 0.4), "fabricDark", "fabricAccent"));
    rug(b, Math.min(3.0, f.len - 0.4), dist - 0.4, 0, dist / 2 + 0.4, "fabricDark");
  });
}

function study(b: Builder, plan: FloorPlan, room: Room, ctx: Ctx) {
  simpleAnchor(b, plan, room, ctx, (f) => {
    const w = Math.min(1.5, f.len - 0.2);
    b.box("oak", w, 0.04, 0.65, 0, 0.75, 0.33);
    b.box("walnut", 0.04, 0.73, 0.6, -w / 2 + 0.03, 0.365, 0.32);
    b.box("walnut", 0.4, 0.6, 0.6, w / 2 - 0.22, 0.3, 0.32);
    solid(b, ctx, -w / 2, 0, w / 2, 0.66);
    b.frame(0, 0, 0.95, Math.PI, () => {
      b.rounded("leather", 0.5, 0.1, 0.5, 0.04, 0, 0.48, 0);
      b.rounded("leather", 0.48, 0.5, 0.08, 0.04, 0, 0.82, -0.22);
      b.cyl("black", 0.03, 0.03, 0.4, 0, 0.22, 0, 8);
      b.cyl("black", 0.28, 0.28, 0.03, 0, 0.03, 0, 5);
    });
    if (ctx.detail === "high") {
      b.box("oak", w, 0.03, 0.3, 0, 1.45, 0.15);
      b.box("oak", w, 0.03, 0.3, 0, 1.85, 0.15);
      for (let i = 0; i < 9; i++) b.box(i % 3 ? "fabricAccent" : "fabricDark", 0.04, 0.26, 0.2, -w / 2 + 0.15 + i * 0.06, 1.6, 0.13);
      tableLamp(b, w / 2 - 0.2, 0.77, 0.25);
      b.box("black", 0.5, 0.32, 0.02, -0.1, 0.95, 0.15);
    }
  });
}

function dress(b: Builder, plan: FloorPlan, room: Room, ctx: Ctx) {
  simpleAnchor(b, plan, room, ctx, (f) => {
    wardrobe(b, ctx, Math.min(f.len - 0.1, 2.4), 2.4);
    if (ctx.detail === "high" && f.depth > 1.6) {
      b.rounded("fabricAccent", 0.7, 0.42, 0.45, 0.06, 0, 0.21, Math.min(1.25, f.depth - 0.5));
    }
  });
}

function store(b: Builder, plan: FloorPlan, room: Room, ctx: Ctx) {
  simpleAnchor(b, plan, room, ctx, (f) => {
    const w = f.len - 0.1;
    for (const y of [0.4, 0.9, 1.4, 1.9]) b.box("oak", w, 0.03, 0.45, 0, y, 0.23);
    b.box("oak", 0.03, 2.0, 0.45, -w / 2, 1.0, 0.23);
    b.box("oak", 0.03, 2.0, 0.45, w / 2, 1.0, 0.23);
    solid(b, ctx, -w / 2, 0, w / 2, 0.46);
  });
}

function passage(b: Builder, plan: FloorPlan, room: Room, ctx: Ctx) {
  if (ctx.detail !== "high") return;
  const [x0, z0, x1, z1] = room.rect;
  const vertical = z1 - z0 > x1 - x0;
  const f = anchorFrame(plan, room, vertical ? "right" : "back", vertical ? [z0, z1] : [x0, x1]);
  inFrame(b, f, () => {
    art(b, 0.8, 1.1, 1.5, "art1");
  });
}

function outdoor(b: Builder, plan: FloorPlan, room: Room, ctx: Ctx) {
  const [x0, z0, x1, z1] = room.rect;
  const hw = plan.width / 2;
  const isFront = z0 >= plan.depth - EPS;
  const hi = ctx.detail === "high";
  if (room.type === "utility") {
    // washing machine at the far end
    const [cx] = roomCenter(room);
    b.frame(cx, 0, z1 - 0.45, Math.PI, () => {
      b.box("ceramic", 0.6, 0.85, 0.58, 0, 0.425, 0);
      if (hi) b.cyl("black", 0.18, 0.18, 0.02, 0, 0.5, 0.29);
      solid(b, ctx, -0.3, -0.3, 0.3, 0.3);
    });
    if (hi) b.frame(cx, 0, z0 + 0.4, 0, () => plant(b, 0.8));
    return;
  }
  if (isFront) {
    const w = x1 - x0;
    const cz = (z0 + z1) / 2;
    // lounge chairs facing out
    const n = w > 8 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const cx = x0 + (w * (i + 1)) / (n + 1) + (n === 1 ? -0.6 : 0);
      b.frame(cx - 0.65, 0, cz - 0.55, 0.15, () => armchair(b, ctx, "fabric"));
      b.frame(cx + 0.65, 0, cz - 0.55, -0.15, () => armchair(b, ctx, "fabric"));
      b.cyl("walnut", 0.2, 0.2, 0.45, cx, 0.225, cz + 0.1, 20);
      solid(b, ctx, cx - 0.2, cz - 0.1, cx + 0.2, cz + 0.3);
    }
    if (hi) {
      b.frame(x0 + 0.5, 0, z1 - 0.45, 0, () => plant(b, 1.2));
      b.frame(x1 - 0.5, 0, z1 - 0.45, 0, () => plant(b, 1.0));
    }
    return;
  }
  // narrow side balcony
  const cz = (z0 + z1) / 2;
  const outward = x1 <= -hw + EPS ? -1 : 1;
  const cx = (x0 + x1) / 2;
  b.frame(cx - outward * 0.42, 0, cz - 0.3, outward > 0 ? Math.PI / 2 : -Math.PI / 2, () => armchair(b, ctx, "fabric"));
  if (hi) b.frame(cx, 0, z1 - 0.4, 0, () => plant(b, 0.9));
}

export function furnishRoom(b: Builder, plan: FloorPlan, room: Room, ctx: Ctx) {
  switch (room.type) {
    case "living":
      return living(b, plan, room, ctx);
    case "dining":
      return dining(b, plan, room, ctx);
    case "kitchen":
      return kitchen(b, plan, room, ctx);
    case "master":
    case "bedroom":
      return bedroom(b, plan, room, ctx);
    case "bath":
      return bath(b, plan, room, ctx);
    case "powder":
      return bath(b, plan, room, ctx, true);
    case "foyer":
      return foyer(b, plan, room, ctx);
    case "pooja":
      return pooja(b, plan, room, ctx);
    case "lounge":
      return lounge(b, plan, room, ctx);
    case "media":
      return media(b, plan, room, ctx);
    case "study":
      return study(b, plan, room, ctx);
    case "dress":
      return dress(b, plan, room, ctx);
    case "store":
      return store(b, plan, room, ctx);
    case "passage":
      return passage(b, plan, room, ctx);
    case "balcony":
    case "utility":
      return outdoor(b, plan, room, ctx);
  }
}
