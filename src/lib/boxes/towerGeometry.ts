/**
 * Procedural tower: one storey "shell" (reused by all 8 floors), per-unit
 * cutaway models, the core, roof amenities, the stilt/lobby level and site.
 * Results are cached at module level so remounts are instant.
 */
import { floorPlans } from "@/config/floorplans";
import type { UnitId } from "@/config/project";
import { Builder, type Buckets } from "./builder";
import { UV_SCALE } from "./materials";
import {
  BUILDING_CENTER,
  BOUNDS,
  CORE,
  FLOOR_H,
  GROUND_H,
  ROOF_Y,
  SLAB,
  UNIT_IDS,
  unitPlacement,
} from "./layout";
import { EPS, outdoorRooms } from "./plan";
import { buildSlab, buildUnitCutaway, buildUnitShell } from "./unitGeometry";

export interface TowerGeometry {
  shell: Buckets;
  slab: Buckets;
  cut: Record<UnitId, Buckets>;
  coreCut: Buckets;
  roof: Buckets;
  podium: Buckets;
  site: Buckets;
}

let cache: TowerGeometry | null = null;

function inUnit(b: Builder, id: UnitId, fn: () => void) {
  const p = unitPlacement(id);
  b.frame(p.origin[0], 0, p.origin[1], p.angle, fn);
}

const HALF = CORE / 2;

/** Core walls for one storey (stone with glazed corners). */
function coreShell(b: Builder, height: number) {
  const t = 0.35;
  b.boxMinMax("stoneDark", -HALF, 0, -HALF, HALF, height, -HALF + t);
  b.boxMinMax("stoneDark", -HALF, 0, HALF - t, HALF, height, HALF);
  b.boxMinMax("stoneDark", -HALF, 0, -HALF, -HALF + t, height, HALF);
  b.boxMinMax("stoneDark", HALF - t, 0, -HALF, HALF, height, HALF);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const cx = sx * (HALF - 0.45);
      const cz = sz * (HALF - 0.45);
      b.box("glass", 1.0, height - 0.5, 1.0, cx + sx * 0.06, height / 2, cz + sz * 0.06);
      b.box("bronze", 1.06, 0.12, 1.06, cx + sx * 0.06, height - 0.25, cz + sz * 0.06);
    }
}

function coreCutaway(b: Builder) {
  const top = 1.15;
  b.boxMinMax("floorMarble", -HALF, 0, -HALF, HALF, 0.012, HALF);
  const t = 0.3;
  b.boxMinMax("stoneDark", -HALF, 0, -HALF, HALF, top, -HALF + t);
  b.boxMinMax("stoneDark", -HALF, 0, HALF - t, HALF, top, HALF);
  b.boxMinMax("stoneDark", -HALF, 0, -HALF, -HALF + t, top, HALF);
  b.boxMinMax("stoneDark", HALF - t, 0, -HALF, HALF, top, HALF);
  // three lifts
  for (let i = 0; i < 3; i++) {
    const x = -3 + i * 2.6;
    b.boxMinMax("metalDark", x - 1.15, 0, -1.6, x + 1.15, top + 0.4, 0.8);
    b.boxMinMax("brass", x - 0.5, 0, 0.8, x + 0.5, 1.0, 0.86);
  }
  // two staircases
  for (const sx of [-1, 1]) {
    const x0 = sx > 0 ? HALF - 4.4 : -HALF + 0.4;
    for (let s = 0; s < 8; s++) {
      b.boxMinMax("concrete", x0, 0, -HALF + 0.4 + s * 0.3, x0 + 2.0, 0.15 * (s + 1), -HALF + 0.7 + s * 0.3);
      b.boxMinMax("concrete", x0 + 2.0, 0, HALF - 0.7 - s * 0.3, x0 + 4.0, 0.15 * (s + 1), HALF - 0.4 - s * 0.3);
    }
  }
}

function roof(b: Builder) {
  // slabs + parapets for each unit arm
  for (const id of UNIT_IDS) {
    const plan = floorPlans[id];
    inUnit(b, id, () => {
      buildSlab(b, plan, "frame", false);
      const hw = plan.width / 2;
      const ph = 1.1;
      // parapet around the unit footprint (except where it meets the core)
      b.boxMinMax("frame", -hw, 0, 0, -hw + 0.22, ph, plan.depth);
      b.boxMinMax("frame", hw - 0.22, 0, 0, hw, ph, plan.depth);
      for (const r of outdoorRooms(plan)) {
        const [x0, z0, x1, z1] = r.rect;
        if (z0 >= plan.depth - EPS) {
          b.boxMinMax("frame", x0 - 0.35, 0, z1 - 0.22, x1 + 0.35, ph, z1 + 0.15);
          b.boxMinMax("frame", x0 - 0.35, 0, z0, x0, ph, z1);
          b.boxMinMax("frame", x1, 0, z0, x1 + 0.35, ph, z1);
        } else {
          const outerX = x1 <= -hw + EPS ? x0 : x1;
          b.boxMinMax("frame", outerX - 0.11, 0, z0, outerX + 0.11, ph, z1);
          b.boxMinMax("frame", x0, 0, z0 - 0.11, x1, ph, z0 + 0.11);
          b.boxMinMax("frame", x0, 0, z1 - 0.11, x1, ph, z1 + 0.11);
        }
      }
      if (!outdoorRooms(plan).some((r) => r.rect[1] >= plan.depth - EPS))
        b.boxMinMax("frame", -hw, 0, plan.depth - 0.22, hw, ph, plan.depth);

      const D = plan.depth;
      if (id === "D") {
        // rooftop lap pool with deck
        b.boxMinMax("deck", -hw + 0.6, 0.02, 2.2, hw - 0.6, 0.18, D - 1.0);
        b.boxMinMax("frame", -3.6, 0.18, 4.0, 3.6, 0.42, D - 3.0);
        b.boxMinMax("water", -3.2, 0.18, 4.4, 3.2, 0.38, D - 3.4);
        for (let i = 0; i < 4; i++) {
          const z = 5 + i * 2.6;
          b.boxMinMax("fabric", 4.4, 0.18, z, 5.2, 0.5, z + 1.9);
        }
      } else if (id === "C") {
        // shaded pergola terrace
        b.boxMinMax("deck", -hw + 0.6, 0.02, 1.5, hw - 0.6, 0.15, D - 1.0);
        for (let x = -hw + 1.5; x <= hw - 1.4; x += 3.6)
          for (const z of [3, D - 3]) b.boxMinMax("bronze", x - 0.08, 0.15, z - 0.08, x + 0.08, 3.0, z + 0.08);
        for (let z = 2.6; z <= D - 2.6; z += 0.55) b.boxMinMax("bronze", -hw + 1.2, 2.95, z - 0.04, hw - 1.2, 3.05, z + 0.04);
        for (const sx of [-1, 1]) {
          b.boxMinMax("render", sx * (hw - 1.3) - 0.5, 0.15, 2, sx * (hw - 1.3) + 0.5, 0.75, D - 2);
          for (let z = 2.6; z < D - 2.2; z += 1.6) b.sphere("foliage", 0.6, sx * (hw - 1.3), 1.0, z, 0.7, 6);
        }
      } else {
        // solar array
        for (let z = 1.8; z < D - 1.6; z += 2.2) {
          b.frame(0, 0.9, z, 0, () => {
            b.box("solar", plan.width - 2.4, 0.06, 1.5, 0, 0, 0);
          });
          b.boxMinMax("metalDark", -hw + 1.3, 0, z - 0.05, -hw + 1.45, 0.85, z + 0.05);
          b.boxMinMax("metalDark", hw - 1.45, 0, z - 0.05, hw - 1.3, 0.85, z + 0.05);
        }
      }
    });
  }
  // core slab + machine room
  b.boxMinMax("frame", -HALF, -SLAB, -HALF, HALF, 0, HALF);
  b.boxMinMax("stoneDark", -HALF + 0.5, 0, -HALF + 0.5, HALF - 0.5, 4.3, HALF - 0.5);
  b.boxMinMax("bronze", -HALF + 0.3, 4.3, -HALF + 0.3, HALF - 0.3, 4.55, HALF - 0.3);
}

function podium(b: Builder) {
  const colH = GROUND_H - SLAB;
  // core continues to the ground, wrapped in a glass lobby
  coreShell(b, colH);
  const L = HALF + 1.6;
  const lobbyH = colH;
  for (const [x0, z0, x1, z1] of [
    [-L, -L, L, -L + 0.06],
    [-L, L - 0.06, L, L],
    [-L, -L, -L + 0.06, L],
    [L - 0.06, -L, L, L],
  ] as const) {
    b.boxMinMax("glass", x0, 0.3, z0, x1, lobbyH, z1);
  }
  for (let i = -L; i <= L + 0.01; i += 2.4) {
    for (const z of [-L, L]) b.boxMinMax("bronze", i - 0.04, 0.3, z - 0.06, i + 0.04, lobbyH, z + 0.06);
    for (const x of [-L, L]) b.boxMinMax("bronze", x - 0.06, 0.3, i - 0.04, x + 0.06, lobbyH, i + 0.04);
  }
  b.boxMinMax("frame", -L - 0.2, lobbyH - 0.3, -L - 0.2, L + 0.2, lobbyH, L + 0.2);
  // columns + soffits under each arm
  for (const id of UNIT_IDS) {
    const plan = floorPlans[id];
    inUnit(b, id, () => {
      const hw = plan.width / 2;
      const zs: number[] = [];
      for (let z = 4.5; z < plan.depth - 0.5; z += 5) zs.push(z);
      zs.push(plan.depth - 0.4);
      for (const z of zs)
        for (const x of [-hw + 0.45, hw - 0.45]) b.boxMinMax("frame", x - 0.3, 0.3, z - 0.3, x + 0.3, colH, z + 0.3);
      b.boxMinMax("soffit", -hw + 0.1, colH - 0.04, 0.1, hw - 0.1, colH, plan.depth - 0.1);
      // parking bays (painted lines)
      for (let x = -hw + 1.2; x < hw - 1; x += 2.6) b.boxMinMax("frame", x, 0.3, plan.depth - 5.6, x + 0.08, 0.315, plan.depth - 0.8);
    });
  }
  // plinth under the whole footprint
  const [bx0, bz0, bx1, bz1] = BOUNDS;
  b.boxMinMax("paving", bx0 - 3, 0, bz0 - 3, bx1 + 3, 0.3, bz1 + 3);
  // entrance canopy towards the south-west
  b.boxMinMax("frame", -L - 6, lobbyH - 0.5, L - 3, -L, lobbyH - 0.2, L + 6);
  b.boxMinMax("bronze", -L - 5.8, 0.3, L + 5.6, -L - 5.6, lobbyH - 0.5, L + 5.8);
}

function rngFrom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function site(b: Builder) {
  const [bx0, bz0, bx1, bz1] = BOUNDS;
  const cx = BUILDING_CENTER[0];
  const px0 = bx0 - 26;
  const px1 = bx1 + 26;
  const pz0 = bz0 - 22;
  const pz1 = bz1 + 28;
  // plot lawn + driveway ring
  b.boxMinMax("grass", px0, -0.02, pz0, px1, 0.04, pz1);
  b.boxMinMax("road", bx0 - 12, 0.04, bz0 - 12, bx1 + 12, 0.08, bz0 - 5);
  b.boxMinMax("road", bx0 - 12, 0.04, bz1 + 5, bx1 + 12, 0.08, bz1 + 12);
  b.boxMinMax("road", bx0 - 12, 0.04, bz0 - 12, bx0 - 5, 0.08, bz1 + 12);
  b.boxMinMax("road", bx1 + 5, 0.04, bz0 - 12, bx1 + 12, 0.08, bz1 + 12);
  b.boxMinMax("paving", bx0 - 5, 0.04, bz0 - 5, bx1 + 5, 0.1, bz1 + 5);
  // entrance drive to the south boundary
  b.boxMinMax("road", cx - 5, 0.04, bz1 + 12, cx + 5, 0.08, pz1);
  // reflecting pool near the entrance
  b.boxMinMax("frame", cx - 16, 0.04, bz1 + 14.5, cx - 6.5, 0.5, bz1 + 22.5);
  b.boxMinMax("water", cx - 15.6, 0.1, bz1 + 14.9, cx - 6.9, 0.46, bz1 + 22.1);
  // boundary wall with gate
  const wh = 2.0;
  b.boxMinMax("render", px0, 0, pz0, px1, wh, pz0 + 0.3);
  b.boxMinMax("render", px0, 0, pz0, px0 + 0.3, wh, pz1);
  b.boxMinMax("render", px1 - 0.3, 0, pz0, px1, wh, pz1);
  b.boxMinMax("render", px0, 0, pz1 - 0.3, cx - 7, wh, pz1);
  b.boxMinMax("render", cx + 7, 0, pz1 - 0.3, px1, wh, pz1);
  b.boxMinMax("bronze", cx - 7.4, 0, pz1 - 0.5, cx - 6.6, 3.2, pz1 + 0.2);
  b.boxMinMax("bronze", cx + 6.6, 0, pz1 - 0.5, cx + 7.4, 3.2, pz1 + 0.2);
  // streets around the plot
  b.boxMinMax("road", px0 - 400, -0.01, pz1 + 1, px1 + 400, 0.02, pz1 + 15);
  b.boxMinMax("road", px1 + 1, -0.01, pz0 - 400, px1 + 15, 0.02, pz1 + 400);
  // trees
  const r = rngFrom(7);
  const tree = (x: number, z: number, s: number) => {
    b.cyl("trunk", 0.18 * s, 0.25 * s, 3.2 * s, x, 1.6 * s, z, 7);
    b.sphere(r() > 0.5 ? "foliage" : "foliageDark", 2.2 * s, x, 4.4 * s, z, 0.85, 7);
    b.sphere("foliage", 1.5 * s, x + 0.9 * s, 5.4 * s, z - 0.5 * s, 0.85, 6);
  };
  for (let x = px0 + 4; x < px1 - 3; x += 7) {
    tree(x, pz0 + 4 + r() * 2, 0.8 + r() * 0.4);
    if (Math.abs(x - cx) > 10) tree(x, pz1 - 4 - r() * 2, 0.8 + r() * 0.4);
  }
  for (let z = pz0 + 11; z < pz1 - 8; z += 7.5) {
    tree(px0 + 4 + r() * 2, z, 0.8 + r() * 0.4);
    tree(px1 - 4 - r() * 2, z, 0.8 + r() * 0.4);
  }
  // street trees
  for (let x = px0 - 120; x < px1 + 120; x += 12) tree(x, pz1 + 17.5, 0.9);
  for (let z = pz0 - 120; z < pz1 + 120; z += 12) tree(px1 + 17.5, z, 0.9);
}

export function getTowerGeometry(): TowerGeometry {
  if (cache) return cache;
  const sb = new Builder();
  const slab = new Builder();
  for (const id of UNIT_IDS) {
    const plan = floorPlans[id];
    inUnit(sb, id, () => buildUnitShell(sb, plan));
    inUnit(slab, id, () => buildSlab(slab, plan, "frame", true));
  }
  coreShell(sb, FLOOR_H - SLAB);
  slab.boxMinMax("frame", -HALF, -SLAB, -HALF, HALF, 0, HALF);

  const cut = {} as Record<UnitId, Buckets>;
  for (const id of UNIT_IDS) {
    const cb = new Builder();
    buildUnitCutaway(cb, floorPlans[id]);
    cut[id] = cb.build(UV_SCALE);
  }
  const cc = new Builder();
  coreCutaway(cc);
  const rb = new Builder();
  roof(rb);
  const pb = new Builder();
  podium(pb);
  const st = new Builder();
  site(st);

  cache = {
    shell: sb.build(UV_SCALE),
    slab: slab.build(UV_SCALE),
    cut,
    coreCut: cc.build(UV_SCALE),
    roof: rb.build(UV_SCALE),
    podium: pb.build(UV_SCALE),
    site: st.build(UV_SCALE),
  };
  return cache;
}

export { ROOF_Y };
