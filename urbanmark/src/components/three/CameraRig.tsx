"use client";

import { type RefObject, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { useMousePosition } from "@/hooks/useMousePosition";

export interface ScrollProgress {
  value: number;
}

/** Wraps scene content in a group that eases toward the pointer position and drifts forward with scroll, giving a walk-in parallax feel. */
export function CameraRig({
  children,
  scrollProgress,
}: {
  children: React.ReactNode;
  scrollProgress?: RefObject<ScrollProgress>;
}) {
  const groupRef = useRef<Group>(null);
  const pointer = useMousePosition();

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const scroll = scrollProgress?.current.value ?? 0;
    const targetY = pointer.current.x * 0.35 + scroll * 0.5;
    const targetX = pointer.current.y * -0.2;
    const targetZ = scroll * 1.6;
    const lerpFactor = 1 - Math.pow(0.001, delta);

    group.rotation.y += (targetY - group.rotation.y) * lerpFactor;
    group.rotation.x += (targetX - group.rotation.x) * lerpFactor;
    group.position.z += (targetZ - group.position.z) * lerpFactor;
  });

  return <group ref={groupRef}>{children}</group>;
}
