/**
 * Room & wall coordinate system shared by every view (top, elevations, 3D).
 *
 * Plan view, millimetres. The room interior spans x ∈ [0, width], z ∈ [0, length].
 *   Wall A — back wall   z = 0       runs x: 0 → width   (faces +z)
 *   Wall B — right wall  x = width   runs z: 0 → length  (faces −x)
 *   Wall C — front wall  z = length  runs x: width → 0   (faces −z)
 *   Wall D — left wall   x = 0       runs z: length → 0  (faces +x)
 * Walls run clockwise, so "offset" is measured left → right as you face the wall.
 */
import type { CabinetConfig } from "@/lib/catalog/types";

export type WallId = "A" | "B" | "C" | "D";

export interface Room {
  width: number; // along wall A
  length: number; // along wall B
  height: number;
}

export interface Placement {
  id: string;
  wall: WallId;
  /** Distance from the wall's start to the cabinet's left edge (mm). */
  offset: number;
  /** Bottom of the cabinet above the floor (mm). */
  elevation: number;
  config: CabinetConfig;
  mirror?: boolean;
}

export function wallLength(room: Room, wall: WallId) {
  return wall === "A" || wall === "C" ? room.width : room.length;
}

/** Rotation about +y (radians) that maps cabinet-local axes onto a wall. */
export function wallRotation(wall: WallId) {
  switch (wall) {
    case "A":
      return 0;
    case "B":
      return -Math.PI / 2;
    case "C":
      return Math.PI;
    case "D":
      return Math.PI / 2;
  }
}

/** World position (mm) of a cabinet's local origin (bottom-left-back). */
export function wallOrigin(room: Room, wall: WallId, offset: number, elevation: number): [number, number, number] {
  switch (wall) {
    case "A":
      return [offset, elevation, 0];
    case "B":
      return [room.width, elevation, offset];
    case "C":
      return [room.width - offset, elevation, room.length];
    case "D":
      return [0, elevation, room.length - offset];
  }
}

/** Convert a local cabinet point to world plan coordinates. */
export function localToWorld(room: Room, p: Placement, local: [number, number, number]): [number, number, number] {
  const [ox, oy, oz] = wallOrigin(room, p.wall, p.offset, p.elevation);
  const t = wallRotation(p.wall);
  const c = Math.round(Math.cos(t));
  const s = Math.round(Math.sin(t));
  const [x, y, z] = local;
  return [ox + x * c + z * s, oy + y, oz - x * s + z * c];
}
