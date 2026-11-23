/**
 * Camera "poses" for each experience state. A pose is a look-at target plus
 * spherical parameters (compass bearing, elevation, distance) so the rig can
 * interpolate as an orbit rather than a straight line.
 */
import * as THREE from "three";
import { floorPlans } from "@/config/floorplans";
import { getUnit } from "@/config/project";
import type { Selection } from "./store";
import {
  BUILDING_CENTER,
  FACING_BEARING,
  FLOORS,
  GROUND_H,
  ROOF_Y,
  floorY,
  localToWorld,
  unitCenterWorld,
} from "./layout";

export interface Pose {
  target: THREE.Vector3;
  bearing: number;
  elevation: number;
  dist: number;
  fov: number;
}

export const BASE_BEARING = 212;
const DEG = Math.PI / 180;

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function fitDistance(w: number, h: number, aspect: number, fov: number) {
  const v = (fov * DEG) / 2;
  const hf = Math.atan(Math.tan(v) * aspect);
  return Math.max(h / 2 / Math.tan(v), w / 2 / Math.tan(hf));
}

export interface Viewport {
  aspect: number;
  /** true when side panels sit beside the 3D view (wide screens). */
  wide: boolean;
  /** capture mode: keep the subject centred (no room for panels). */
  centered?: boolean;
}

const fovFor = (vp: Viewport) => (vp.aspect < 0.8 ? 42 : vp.aspect < 1.2 ? 36 : 30);

/** Horizontal "screen right" unit vector for a camera at a given bearing. */
export function screenRight(bearing: number): [number, number] {
  const b = bearing * DEG;
  return [-Math.cos(b), -Math.sin(b)];
}

function shifted(target: THREE.Vector3, bearing: number, amount: number) {
  // positive amount moves the subject to the right of the screen
  const [rx, rz] = screenRight(bearing);
  return target.clone().add(new THREE.Vector3(-rx * amount, 0, -rz * amount));
}

export function overviewPose(vp: Viewport): Pose {
  const fov = fovFor(vp);
  const height = ROOF_Y + 6;
  const dist = vp.wide ? fitDistance(66 / 0.6, height / 0.72, vp.aspect, fov) : fitDistance(66 / 0.95, height / 0.55, vp.aspect, fov);
  const base = new THREE.Vector3(BUILDING_CENTER[0], height * 0.46, BUILDING_CENTER[1]);
  const target = vp.wide ? shifted(base, BASE_BEARING, vp.centered ? 0 : dist * 0.075) : base.setY(height * 0.46 - dist * 0.07);
  return { target, bearing: BASE_BEARING, elevation: 11, dist, fov };
}

export function floorPose(f: number, vp: Viewport): Pose {
  const fov = fovFor(vp);
  const fl = Math.max(1, Math.min(FLOORS, f));
  const dist = vp.wide ? fitDistance(66 / 0.66, 30 / 0.72, vp.aspect, fov) : fitDistance(62 / 0.98, 30 / 0.5, vp.aspect, fov);
  const bearing = BASE_BEARING + (fl - 1) * 6;
  const base = new THREE.Vector3(BUILDING_CENTER[0], floorY(fl) + 1.0, BUILDING_CENTER[1]);
  const target = vp.wide ? shifted(base, bearing, vp.centered ? 0 : dist * 0.1) : base.setY(base.y - dist * 0.1);
  return { target, bearing, elevation: 34, dist, fov };
}

/** Continuous pose along the scroll journey (0 = whole building, 1..8 floors). */
export function journeyPose(f: number, vp: Viewport): Pose {
  if (f <= 1) {
    const a = overviewPose(vp);
    const b = floorPose(1, vp);
    const t = smooth(clamp01(f));
    return {
      target: a.target.clone().lerp(b.target, t),
      bearing: lerp(a.bearing, b.bearing, t),
      elevation: lerp(a.elevation, b.elevation, t),
      dist: lerp(a.dist, b.dist, t),
      fov: lerp(a.fov, b.fov, t),
    };
  }
  return floorPose(f, vp);
}

export function introPose(t: number, vp: Viewport): Pose {
  const end = overviewPose(vp);
  const k = smooth(clamp01(t));
  return {
    target: end.target.clone().add(new THREE.Vector3(0, (1 - k) * 22, 0)),
    bearing: end.bearing - (1 - k) * 28,
    elevation: lerp(24, end.elevation, k),
    dist: lerp(end.dist * 4.2, end.dist, k),
    fov: end.fov,
  };
}

/** Close view of one apartment on its floor; `diveT` pushes into the facade. */
export function unitPose(sel: Selection, vp: Viewport, diveT: number): Pose {
  const unit = getUnit(sel.unit);
  const plan = floorPlans[sel.unit];
  const fov = fovFor(vp);
  const [cx, cz] = unitCenterWorld(sel.unit);
  const size = Math.max(plan.width, plan.depth) + 6;
  const dist = vp.wide ? fitDistance(size / 0.44, size / 0.62, vp.aspect, fov) : fitDistance(size / 0.9, size / 0.4, vp.aspect, fov);
  const bearing = FACING_BEARING[unit.facing] + 32;
  const base = new THREE.Vector3(cx, floorY(sel.floor) + 0.8, cz);
  let target = vp.wide ? shifted(base, bearing, vp.centered ? 0 : -dist * 0.13) : base.setY(base.y - dist * 0.12);
  let elevation = 52;
  let d = dist;
  if (diveT > 0) {
    // dive towards the living-room balcony at eye level
    const k = smooth(diveT);
    const [bx, bz] = localToWorld(sel.unit, 0, plan.depth + 0.8);
    const entry = new THREE.Vector3(bx, floorY(sel.floor) + 1.6, bz);
    target = target.clone().lerp(entry, k);
    elevation = lerp(elevation, 8, k);
    d = lerp(dist, 3, k);
    return { target, bearing: lerp(bearing, FACING_BEARING[unit.facing], k), elevation, dist: d, fov: lerp(fov, 55, k) };
  }
  return { target, bearing, elevation, dist: d, fov };
}

export const GROUND_LEVEL = GROUND_H;
