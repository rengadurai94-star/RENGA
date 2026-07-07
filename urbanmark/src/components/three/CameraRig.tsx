"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { useMousePosition } from "@/hooks/useMousePosition";

/** Wraps scene content in a group that eases toward the pointer position, giving a subtle parallax tilt. */
export function CameraRig({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<Group>(null);
  const pointer = useMousePosition();

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const targetY = pointer.current.x * 0.35;
    const targetX = pointer.current.y * -0.2;
    const lerpFactor = 1 - Math.pow(0.001, delta);

    group.rotation.y += (targetY - group.rotation.y) * lerpFactor;
    group.rotation.x += (targetX - group.rotation.x) * lerpFactor;
  });

  return <group ref={groupRef}>{children}</group>;
}
