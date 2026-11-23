import { floorPlans } from "@/config/floorplans";
import type { UnitId } from "@/config/project";
import { Builder, type Buckets } from "./builder";
import { UV_SCALE } from "./materials";
import { buildUnitInterior, type Collider } from "./unitGeometry";

export interface InteriorGeometry {
  main: Buckets;
  overhead: Buckets;
  walls: Collider[];
  furniture: Collider[];
}

const cache = new Map<UnitId, InteriorGeometry>();

export function getInteriorGeometry(id: UnitId): InteriorGeometry {
  const hit = cache.get(id);
  if (hit) return hit;
  const b = new Builder();
  const o = new Builder();
  const walls: Collider[] = [];
  const furniture: Collider[] = [];
  buildUnitInterior(b, o, floorPlans[id], walls, furniture);
  const g = { main: b.build(UV_SCALE), overhead: o.build(UV_SCALE), walls, furniture };
  cache.set(id, g);
  return g;
}

/** True if the segment (x0,z0)->(x1,z1) crosses any collider box. */
export function segmentBlocked(cols: Collider[], x0: number, z0: number, x1: number, z1: number, pad = 0) {
  for (const [ax, az, bx, bz] of cols) {
    const minx = ax - pad;
    const minz = az - pad;
    const maxx = bx + pad;
    const maxz = bz + pad;
    // slab test
    let tmin = 0;
    let tmax = 1;
    const dx = x1 - x0;
    const dz = z1 - z0;
    let hit = true;
    for (const [o, d, lo, hi] of [
      [x0, dx, minx, maxx],
      [z0, dz, minz, maxz],
    ] as const) {
      if (Math.abs(d) < 1e-9) {
        if (o < lo || o > hi) {
          hit = false;
          break;
        }
      } else {
        let t1 = (lo - o) / d;
        let t2 = (hi - o) / d;
        if (t1 > t2) [t1, t2] = [t2, t1];
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
        if (tmin > tmax) {
          hit = false;
          break;
        }
      }
    }
    if (hit) return true;
  }
  return false;
}

export function pointBlocked(cols: Collider[], x: number, z: number, r: number) {
  for (const [ax, az, bx, bz] of cols) {
    if (x > ax - r && x < bx + r && z > az - r && z < bz + r) return true;
  }
  return false;
}
