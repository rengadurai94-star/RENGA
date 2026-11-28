import * as THREE from 'three';
import { geometry } from '../data/project';
import {
  BUILDING_D,
  BUILDING_W,
  extrude,
  FLOOR_H,
  outlineEdges,
  PARAPET_H,
  polygonToShape,
  rectToWorld,
  regionBounds,
  regionCentroid,
  SLAB,
  toWorld,
  UNIT_KEYS,
} from '../scenes/planGeometry';
import { WALL_H } from '../scenes/textures';

/** Geometry shared by all typical floors - built once from plan-geometry.json. */
export interface BoxSpec {
  cx: number;
  cy: number;
  cz: number;
  w: number;
  h: number;
  d: number;
  ry?: number;
}

export interface Shared {
  units: Record<string, THREE.ExtrudeGeometry>;
  unitEdges: Record<string, THREE.EdgesGeometry>;
  unitCentroids: Record<string, [number, number]>;
  corridor: THREE.ExtrudeGeometry;
  core: THREE.ExtrudeGeometry[];
  coreTall: THREE.ExtrudeGeometry[];
  slab: THREE.ExtrudeGeometry;
  outlineFull: THREE.ExtrudeGeometry;
  outlinePoints: THREE.Vector3[];
  balconySlabs: BoxSpec[];
  railings: BoxSpec[];
  frames: BoxSpec[];
  louvres: BoxSpec[];
  parapets: BoxSpec[];
  lightwells: { cx: number; cz: number; w: number; d: number }[];
  columns: [number, number][];
}

let cache: Shared | null = null;

function pointInPolygon(x: number, z: number, poly: [number, number][]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

export function shared(): Shared {
  if (cache) return cache;
  const R = geometry.regions;
  const units: Shared['units'] = {};
  const unitEdges: Shared['unitEdges'] = {};
  const unitCentroids: Shared['unitCentroids'] = {};
  for (const k of UNIT_KEYS) {
    units[k] = extrude(polygonToShape(R[k].polygon_px, R[k].holes_px), WALL_H);
    unitEdges[k] = new THREE.EdgesGeometry(units[k], 25);
    unitCentroids[k] = regionCentroid(k);
  }
  const corridor = extrude(polygonToShape(R.corridor.polygon_px), WALL_H);
  const core = [extrude(polygonToShape(R.stair.polygon_px), WALL_H), extrude(polygonToShape(R.lift.polygon_px), WALL_H)];
  const coreTall = [extrude(polygonToShape(R.stair.polygon_px), 3.2), extrude(polygonToShape(R.lift.polygon_px), 3.8)];
  const outlineShape = polygonToShape(R.outline.polygon_px, R.outline.holes_px);
  const slab = extrude(outlineShape, SLAB);
  const outlineFull = extrude(outlineShape, WALL_H);
  const outlineWorld = R.outline.polygon_px.map((p) => toWorld(p[0], p[1]));
  const outlinePoints = outlineWorld.map(([x, z]) => new THREE.Vector3(x, 0, z));

  // balconies: slab + railing on the sides that face outwards
  const balconySlabs: BoxSpec[] = [];
  const railings: BoxSpec[] = [];
  for (const list of Object.values(geometry.balconies)) {
    for (const b of list) {
      const r = rectToWorld(b.rect_px);
      balconySlabs.push({ cx: r.cx, cy: SLAB / 2, cz: r.cz, w: r.w, h: SLAB, d: r.d });
      const sides = [
        { x: r.cx, z: r.z0, w: r.w, d: 0.05, nx: 0, nz: -1 },
        { x: r.cx, z: r.z1, w: r.w, d: 0.05, nx: 0, nz: 1 },
        { x: r.x0, z: r.cz, w: 0.05, d: r.d, nx: -1, nz: 0 },
        { x: r.x1, z: r.cz, w: 0.05, d: r.d, nx: 1, nz: 0 },
      ];
      for (const s of sides) {
        // skip the side that is against the building wall
        if (pointInPolygon(s.x + s.nx * 0.35, s.z + s.nz * 0.35, outlineWorld)) continue;
        railings.push({ cx: s.x, cy: SLAB + 0.55, cz: s.z, w: s.w, h: 1.05, d: s.d });
      }
    }
  }

  const frames: BoxSpec[] = [];
  for (const list of Object.values(geometry.frames)) {
    for (const f of list) {
      const r = rectToWorld(f);
      frames.push({ cx: r.cx, cy: FLOOR_H / 2, cz: r.cz, w: Math.max(r.w, 0.25), h: FLOOR_H, d: Math.max(r.d, 0.25) });
    }
  }

  // Facade louvres (timber-tone vertical fins), after the brochure renders p.4 / p.26 - approximate placement.
  const louvres: BoxSpec[] = [];
  const corridorB = regionBounds('corridor');
  for (const e of outlineEdges()) {
    if (e.len < 3.2) continue;
    const [mx, mz] = e.mid;
    const southOrNorth = Math.abs(e.nz) > 0.9;
    const eastOrWest = Math.abs(e.nx) > 0.9;
    let use = false;
    if (southOrNorth) use = Math.abs(mx) > corridorB.maxx - corridorB.cx + 0.5 && Math.abs(mx) < BUILDING_W * 0.34;
    if (eastOrWest) use = Math.abs(mz) < BUILDING_D * 0.22 && e.len > 4;
    if (!use) continue;
    const n = Math.floor(e.len / 0.26);
    const dirx = (e.b[0] - e.a[0]) / e.len;
    const dirz = (e.b[1] - e.a[1]) / e.len;
    for (let i = 1; i < n; i++) {
      const t = (i / n) * e.len;
      louvres.push({
        cx: e.a[0] + dirx * t + e.nx * 0.42,
        cy: FLOOR_H / 2,
        cz: e.a[1] + dirz * t + e.nz * 0.42,
        w: southOrNorth ? 0.055 : 0.24,
        h: FLOOR_H,
        d: southOrNorth ? 0.24 : 0.055,
      });
    }
  }

  const parapets: BoxSpec[] = outlineEdges().map((e) => ({
    cx: e.mid[0] - e.nx * 0.1,
    cy: SLAB + PARAPET_H / 2,
    cz: e.mid[1] - e.nz * 0.1,
    w: e.horizontal ? e.len + 0.2 : 0.2,
    h: PARAPET_H,
    d: e.horizontal ? 0.2 : e.len + 0.2,
  }));

  const lightwells = ['lightwell_n', 'lightwell_s'].map((k) => {
    const b = regionBounds(k);
    return { cx: b.cx, cz: b.cz, w: b.maxx - b.minx, d: b.maxz - b.minz };
  });

  // Indicative stilt column grid (the brochure has no structural drawings).
  const columns: [number, number][] = [];
  const xs = [-BUILDING_W / 2 + 0.6, -BUILDING_W / 4, corridorB.minx - 0.3, corridorB.maxx + 0.3, BUILDING_W / 4, BUILDING_W / 2 - 0.6];
  for (let z = -BUILDING_D / 2 + 0.8; z <= BUILDING_D / 2 - 0.5; z += 5.4) {
    for (const x of xs) if (pointInPolygon(x, z, outlineWorld)) columns.push([x, z]);
  }

  cache = { units, unitEdges, unitCentroids, corridor, core, coreTall, slab, outlineFull, outlinePoints, balconySlabs, railings, frames, louvres, parapets, lightwells, columns };
  return cache;
}
