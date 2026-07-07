"use client";

import { ContactShadows, Environment, Lightformer } from "@react-three/drei";

/** Procedurally generated studio lighting — no HDRI network fetch required. */
export function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[4, 6, 4]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-4, -2, -4]} intensity={0.4} color="#c9a876" />

      <Environment resolution={256}>
        <group>
          <Lightformer form="rect" intensity={3} position={[0, 4, -4]} scale={[8, 4, 1]} color="#fff8ef" />
          <Lightformer form="rect" intensity={2} position={[-6, 0, 3]} scale={[4, 6, 1]} rotation-y={Math.PI / 3} color="#e7d7bd" />
          <Lightformer form="rect" intensity={2.2} position={[6, -1, 3]} scale={[4, 6, 1]} rotation-y={-Math.PI / 3} color="#ffffff" />
          <Lightformer form="rect" intensity={1.6} position={[0, -2, 5]} scale={[10, 6, 1]} color="#f6f2ec" />
          <Lightformer form="ring" intensity={1.2} position={[0, 2, 6]} scale={6} color="#ffffff" />
        </group>
      </Environment>

      <ContactShadows position={[0, -2.4, 0]} opacity={0.3} scale={12} blur={2.6} far={4} />
    </>
  );
}
