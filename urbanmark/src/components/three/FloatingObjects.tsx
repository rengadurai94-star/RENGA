"use client";

import { Float } from "@react-three/drei";

/** Abstract stand-ins for furniture materials — timber, brass, glass — kept small and offset right so they never sit under the hero copy. */
export function FloatingObjects() {
  return (
    <group position={[1, -0.2, 0]} scale={0.75}>
      <Float speed={1.4} rotationIntensity={0.5} floatIntensity={1.1}>
        <mesh position={[-0.7, 0.9, -0.6]} rotation={[0.3, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial color="#a9764f" roughness={0.55} metalness={0.05} />
        </mesh>
      </Float>

      <Float speed={1.8} rotationIntensity={0.8} floatIntensity={1.5}>
        <mesh position={[1.6, 1.4, -1.2]} rotation={[Math.PI / 2.4, 0, 0]} castShadow>
          <torusGeometry args={[0.7, 0.15, 32, 100]} />
          <meshPhysicalMaterial color="#c9a876" roughness={0.25} metalness={1} clearcoat={0.4} envMapIntensity={1.4} />
        </mesh>
      </Float>

      <Float speed={1.1} rotationIntensity={0.3} floatIntensity={0.9}>
        <mesh position={[0.2, -1, 0.3]} castShadow>
          <sphereGeometry args={[0.85, 64, 64]} />
          <meshPhysicalMaterial
            color="#f6f2ec"
            roughness={0.15}
            transmission={0.95}
            thickness={0.8}
            ior={1.3}
            envMapIntensity={1.2}
          />
        </mesh>
      </Float>
    </group>
  );
}
