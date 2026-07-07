"use client";

import type { RefObject } from "react";
import { CanvasWrapper } from "./CanvasWrapper";
import { SceneLighting } from "./SceneLighting";
import { FloatingObjects } from "./FloatingObjects";
import { CameraRig, type ScrollProgress } from "./CameraRig";
import { PostFX } from "./PostFX";

export function HeroScene({ scrollProgress }: { scrollProgress?: RefObject<ScrollProgress> }) {
  return (
    <CanvasWrapper className="h-full w-full" camera={{ position: [0, 0, 8.5], fov: 32 }}>
      <SceneLighting />
      <CameraRig scrollProgress={scrollProgress}>
        <FloatingObjects />
      </CameraRig>
      <PostFX />
    </CanvasWrapper>
  );
}

export default HeroScene;
