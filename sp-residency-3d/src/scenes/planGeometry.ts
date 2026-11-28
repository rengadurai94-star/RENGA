import * as THREE from 'three';
import { geometry } from '../data/project';

/**
 * Converts the traced brochure plan (pixel space of the typical-floor image) into
 * world space (metres). +X = east, +Z = south (road side), +Y = up.
 * Scale: geometry.px_per_ft (calibrated on the printed 28'4" halls). DERIVED, not printed.
 */
export const FT = 0.3048;
export const PX_TO_M = FT / geometry.px_per_ft;
export const FLOOR_H = 10 * FT; // printed: floor-to-floor 10' incl. slab (p.22)
export const STILT_H = 10 * FT; // ASSUMED - stilt height is not printed
export const SLAB = 0.2;
export const PARAPET_H = 1.1;
export const LEVELS = 7; // 0 stilt, 1-5 residential, 6 terrace

const [bx0, by0, bx1, by1] = geometry.building_bbox_px;
export const PLAN_CX = (bx0 + bx1) / 2;
export const PLAN_CY = (by0 + by1) / 2;
export const BUILDING_W = (bx1 - bx0) * PX_TO_M;
export const BUILDING_D = (by1 - by0) * PX_TO_M;

export const toWorld = (px: number, py: number): [number, number] => [(px - PLAN_CX) * PX_TO_M, (py - PLAN_CY) * PX_TO_M];

export const levelBase = (level: number) => (level === 0 ? 0 : STILT_H + (level - 1) * FLOOR_H);
export const ROOF_Y = levelBase(6);

/** THREE.Shape in the XY plane; after rotation -PI/2 about X it lies in XZ with +Y up. */
export function polygonToShape(poly: [number, number][], holes: [number, number][][] = []): THREE.Shape {
  const toShape = (p: [number, number]) => {
    const [x, z] = toWorld(p[0], p[1]);
    return new THREE.Vector2(x, -z);
  };
  const pts = poly.map(toShape);
  if (THREE.ShapeUtils.isClockWise(pts)) pts.reverse();
  const shape = new THREE.Shape(pts);
  for (const h of holes) {
    const hp = h.map(toShape);
    if (!THREE.ShapeUtils.isClockWise(hp)) hp.reverse();
    shape.holes.push(new THREE.Path(hp));
  }
  return shape;
}

export function extrude(shape: THREE.Shape, depth: number): THREE.ExtrudeGeometry {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 });
  g.rotateX(-Math.PI / 2);
  return g;
}

export function rectToWorld(r: [number, number, number, number]) {
  const [x0, z0] = toWorld(r[0], r[1]);
  const [x1, z1] = toWorld(r[2], r[3]);
  return { cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, w: Math.abs(x1 - x0), d: Math.abs(z1 - z0), x0, x1, z0, z1 };
}

export function regionBounds(key: string) {
  const r = geometry.regions[key];
  let minx = Infinity, maxx = -Infinity, minz = Infinity, maxz = -Infinity;
  for (const p of r.polygon_px) {
    const [x, z] = toWorld(p[0], p[1]);
    minx = Math.min(minx, x); maxx = Math.max(maxx, x);
    minz = Math.min(minz, z); maxz = Math.max(maxz, z);
  }
  return { minx, maxx, minz, maxz, cx: (minx + maxx) / 2, cz: (minz + maxz) / 2 };
}

/** Area-weighted centroid of a unit polygon (world XZ) - used for labels. */
export function regionCentroid(key: string): [number, number] {
  const poly = geometry.regions[key].polygon_px.map((p) => toWorld(p[0], p[1]));
  let a = 0, cx = 0, cz = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, z0] = poly[i];
    const [x1, z1] = poly[(i + 1) % poly.length];
    const f = x0 * z1 - x1 * z0;
    a += f; cx += (x0 + x1) * f; cz += (z0 + z1) * f;
  }
  a *= 0.5;
  return [cx / (6 * a), cz / (6 * a)];
}

/** Outline edges in world space with outward normals (for parapets and facade elements). */
export function outlineEdges() {
  const poly = geometry.regions.outline.polygon_px.map((p) => toWorld(p[0], p[1]));
  // signed area to know winding
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, z0] = poly[i];
    const [x1, z1] = poly[(i + 1) % poly.length];
    area += x0 * z1 - x1 * z0;
  }
  const sign = area > 0 ? 1 : -1;
  return poly.map((p, i) => {
    const q = poly[(i + 1) % poly.length];
    const dx = q[0] - p[0];
    const dz = q[1] - p[1];
    const len = Math.hypot(dx, dz);
    // outward normal for this winding (XZ plane, +Z south)
    const nx = (-dz / len) * -sign;
    const nz = (dx / len) * -sign;
    return { a: p, b: q, len, mid: [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2] as [number, number], nx, nz, horizontal: Math.abs(dz) < 1e-6 };
  });
}

export const UNIT_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

/** Plan image placement in world space (the original plan texture laid on a floor). */
export function planImageWorldRect() {
  const { width, height } = geometry.image;
  const [x0, z0] = toWorld(0, 0);
  const [x1, z1] = toWorld(width, height);
  return { cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0 };
}
