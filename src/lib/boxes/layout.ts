/**
 * Building layout math: floor levels, unit placement around the core and
 * local <-> world transforms. Everything derives from the project config.
 */
import { project, getUnit, type Facing, type UnitId } from "@/config/project";
import { floorPlans } from "@/config/floorplans";
import { planBounds } from "./plan";

export const FLOORS = project.building.floors;
export const FLOOR_H = project.building.floorToFloor;
export const GROUND_H = project.building.groundLevelHeight;
export const CORE = project.building.coreSize;
export const SLAB = 0.25;
export const UNIT_IDS: UnitId[] = project.units.map((u) => u.id);

/** Finished floor level (top of slab) for a residential floor (1-based). */
export const floorY = (floor: number) => GROUND_H + (floor - 1) * FLOOR_H;
export const ROOF_Y = floorY(FLOORS + 1);

/** rotation.y so that local +z points to the facing direction. North = -Z, East = +X. */
export const FACING_ANGLE: Record<Facing, number> = {
  South: 0,
  East: Math.PI / 2,
  North: Math.PI,
  West: -Math.PI / 2,
};
export const FACING_DIR: Record<Facing, [number, number]> = {
  South: [0, 1],
  East: [1, 0],
  North: [0, -1],
  West: [-1, 0],
};
/** Compass bearing (deg, clockwise from north) of each facing. */
export const FACING_BEARING: Record<Facing, number> = { North: 0, East: 90, South: 180, West: 270 };

export interface UnitPlacement {
  id: UnitId;
  angle: number;
  origin: [number, number];
  facing: Facing;
}

export function unitPlacement(id: UnitId): UnitPlacement {
  const unit = getUnit(id);
  const [dx, dz] = FACING_DIR[unit.facing];
  return { id, angle: FACING_ANGLE[unit.facing], origin: [(dx * CORE) / 2, (dz * CORE) / 2], facing: unit.facing };
}

export function localToWorld(id: UnitId, x: number, z: number): [number, number] {
  const { angle, origin } = unitPlacement(id);
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [origin[0] + x * c + z * s, origin[1] - x * s + z * c];
}

export function worldDirToLocal(id: UnitId, dx: number, dz: number): [number, number] {
  const { angle } = unitPlacement(id);
  const c = Math.cos(-angle);
  const s = Math.sin(-angle);
  return [dx * c + dz * s, -dx * s + dz * c];
}

export function unitCenterWorld(id: UnitId): [number, number] {
  const plan = floorPlans[id];
  return localToWorld(id, 0, plan.depth / 2);
}

/** World-space XZ bounds of the whole tower (incl. balconies). */
export function buildingBounds(): [number, number, number, number] {
  let b: [number, number, number, number] = [-CORE / 2, -CORE / 2, CORE / 2, CORE / 2];
  for (const id of UNIT_IDS) {
    const [x0, z0, x1, z1] = planBounds(floorPlans[id]);
    for (const [x, z] of [
      [x0, z0],
      [x1, z0],
      [x0, z1],
      [x1, z1],
    ]) {
      const [wx, wz] = localToWorld(id, x, z);
      b = [Math.min(b[0], wx), Math.min(b[1], wz), Math.max(b[2], wx), Math.max(b[3], wz)];
    }
  }
  return b;
}

export const BOUNDS = buildingBounds();
export const BUILDING_CENTER: [number, number] = [(BOUNDS[0] + BOUNDS[2]) / 2, (BOUNDS[1] + BOUNDS[3]) / 2];

/** Unit vector pointing TOWARDS the sun (world space). */
export function sunDirection(): [number, number, number] {
  const az = (project.environment.sunAzimuth * Math.PI) / 180;
  const el = (project.environment.sunElevation * Math.PI) / 180;
  return [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)];
}

/** Camera offset for a compass bearing (deg) and elevation (deg). */
export function bearingOffset(bearingDeg: number, elevationDeg: number, dist: number): [number, number, number] {
  const b = (bearingDeg * Math.PI) / 180;
  const e = (elevationDeg * Math.PI) / 180;
  return [Math.sin(b) * Math.cos(e) * dist, Math.sin(e) * dist, -Math.cos(b) * Math.cos(e) * dist];
}
