"use client";

import { Suspense, useState } from "react";
import { Canvas, type CanvasProps } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { cn } from "@/lib/utils";

interface CanvasWrapperProps extends Pick<CanvasProps, "camera"> {
  children: React.ReactNode;
  className?: string;
  fallback?: React.ReactNode;
}

/** Shared R3F canvas shell: quality auto-degrades on weak devices, dpr capped, no external asset fetches. */
export function CanvasWrapper({
  children,
  className,
  fallback = null,
  camera = { position: [0, 0, 8], fov: 35 },
}: CanvasWrapperProps) {
  const [dpr, setDpr] = useState(1.5);

  return (
    <Canvas
      className={cn(className)}
      camera={camera}
      dpr={dpr}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      shadows="soft"
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
      <Suspense fallback={fallback}>{children}</Suspense>
    </Canvas>
  );
}
