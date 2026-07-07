"use client";

import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";

export function PostFX() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={0.5} luminanceThreshold={0.35} luminanceSmoothing={0.2} mipmapBlur radius={0.6} />
      <Vignette eskil={false} offset={0.15} darkness={0.6} />
    </EffectComposer>
  );
}
