"use client";

import { CanvasWrapper } from "./CanvasWrapper";
import { SceneLighting } from "./SceneLighting";
import { FloatingObjects } from "./FloatingObjects";
import { CameraRig } from "./CameraRig";

export function HeroScene() {
  return (
    <CanvasWrapper className="h-full w-full" camera={{ position: [0, 0, 8.5], fov: 32 }}>
      <SceneLighting />
      <CameraRig>
        <FloatingObjects />
      </CameraRig>
    </CanvasWrapper>
  );
}

export default HeroScene;
