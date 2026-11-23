"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Placement, Room, WallId } from "@/lib/room/layout";
import { wallOrigin, wallRotation } from "@/lib/room/layout";
import { CabinetModel } from "./CabinetModel";
import { floorTexture } from "./textures";

/** Floor + selected walls of a room (millimetre space). */
export function RoomShell({
  room,
  walls = ["A", "B"],
  wallColor = "#ece6da",
  floorColor = "#cfc2aa",
}: {
  room: Room;
  walls?: WallId[];
  wallColor?: string;
  floorColor?: string;
}) {
  const floorMat = useMemo(() => {
    const tex = floorTexture(floorColor).clone();
    tex.needsUpdate = true;
    tex.repeat.set(room.width / 1600, room.length / 1600);
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.62 });
  }, [floorColor, room.width, room.length]);
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.95 }), [wallColor]);
  const T = 60;

  return (
    <group>
      <mesh material={floorMat} position={[room.width / 2, -T / 2, room.length / 2]} receiveShadow>
        <boxGeometry args={[room.width + 2 * T, T, room.length + 2 * T]} />
      </mesh>
      {walls.includes("A") && (
        <mesh material={wallMat} position={[room.width / 2, room.height / 2, -T / 2]} receiveShadow>
          <boxGeometry args={[room.width + 2 * T, room.height, T]} />
        </mesh>
      )}
      {walls.includes("B") && (
        <mesh material={wallMat} position={[room.width + T / 2, room.height / 2, room.length / 2]} receiveShadow>
          <boxGeometry args={[T, room.height, room.length + 2 * T]} />
        </mesh>
      )}
      {walls.includes("C") && (
        <mesh material={wallMat} position={[room.width / 2, room.height / 2, room.length + T / 2]} receiveShadow>
          <boxGeometry args={[room.width + 2 * T, room.height, T]} />
        </mesh>
      )}
      {walls.includes("D") && (
        <mesh material={wallMat} position={[-T / 2, room.height / 2, room.length / 2]} receiveShadow>
          <boxGeometry args={[T, room.height, room.length + 2 * T]} />
        </mesh>
      )}
    </group>
  );
}

/**
 * A cabinet placed on a wall. `shift` (mm, cabinet-local) is damped so modules
 * can glide apart and back together.
 */
export function PlacedCabinet({
  room,
  placement,
  shift = [0, 0, 0],
  open,
  explode,
  countertop = true,
  colourOverride,
}: {
  room: Room;
  placement: Placement;
  shift?: [number, number, number];
  open?: number;
  explode?: number;
  countertop?: boolean;
  colourOverride?: string | null;
}) {
  const inner = useRef<THREE.Group>(null);
  const origin = wallOrigin(room, placement.wall, placement.offset, placement.elevation);
  const rot = wallRotation(placement.wall);

  useFrame((_, dt) => {
    const g = inner.current;
    if (!g) return;
    g.position.x = THREE.MathUtils.damp(g.position.x, shift[0], 4, dt);
    g.position.y = THREE.MathUtils.damp(g.position.y, shift[1], 4, dt);
    g.position.z = THREE.MathUtils.damp(g.position.z, shift[2], 4, dt);
  });

  const config = colourOverride ? { ...placement.config, colour: colourOverride } : placement.config;

  return (
    <group position={origin} rotation={[0, rot, 0]}>
      <group ref={inner}>
        <CabinetModel config={config} open={open} explode={explode} countertop={countertop} mirror={placement.mirror} />
      </group>
    </group>
  );
}
