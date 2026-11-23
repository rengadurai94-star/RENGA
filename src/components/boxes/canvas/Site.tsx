"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { getTowerGeometry } from "@/lib/boxes/towerGeometry";
import { getMaterials, type MatKey } from "@/lib/boxes/materials";
import { BOUNDS, BUILDING_CENTER } from "@/lib/boxes/layout";

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Low-rise neighbourhood massing around the plot (instanced boxes). */
export function Context({ offset = [0, 0, 0] as [number, number, number], rotation = 0 }) {
  const mesh = useMemo(() => {
    const r = rng(99);
    const [bx0, bz0, bx1, bz1] = BOUNDS;
    const cx = BUILDING_CENTER[0];
    const cz = BUILDING_CENTER[1];
    const items: THREE.Matrix4[] = [];
    const colors: THREE.Color[] = [];
    const palette = ["#ece7df", "#e2dcd2", "#f1ede7", "#d9d2c6", "#e8e0d2"];
    let tries = 0;
    while (items.length < 260 && tries < 4000) {
      tries++;
      const a = r() * Math.PI * 2;
      const d = 95 + Math.pow(r(), 0.7) * 520;
      const x = cx + Math.cos(a) * d;
      const z = cz + Math.sin(a) * d;
      // keep the plot, its streets and the hero sightline clear
      if (x > bx0 - 45 && x < bx1 + 45 && z > bz0 - 45 && z < bz1 + 50) continue;
      if (Math.abs(z - (bz1 + 43)) < 12 || Math.abs(x - (bx1 + 43)) < 12) continue;
      const w = 10 + r() * 22;
      const dd = 10 + r() * 22;
      const h = 4 + Math.pow(r(), 2.2) * (d > 250 ? 34 : 18);
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(x, h / 2, z),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.round(r() * 3) * 0.08),
        new THREE.Vector3(w, h, dd),
      );
      items.push(m);
      colors.push(new THREE.Color(palette[Math.floor(r() * palette.length)]));
    }
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = getMaterials().context;
    const inst = new THREE.InstancedMesh(geo, mat, items.length);
    items.forEach((m, i) => {
      inst.setMatrixAt(i, m);
      inst.setColorAt(i, colors[i]);
    });
    inst.castShadow = true;
    inst.receiveShadow = true;
    inst.instanceMatrix.needsUpdate = true;
    return inst;
  }, []);
  useEffect(() => () => mesh.geometry.dispose(), [mesh]);
  return (
    <group position={offset} rotation={[0, rotation, 0]}>
      <primitive object={mesh} />
    </group>
  );
}

export function Ground({ y = -0.05, radius = 2400 }: { y?: number; radius?: number }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ddd6ca", roughness: 1 }), []);
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[BUILDING_CENTER[0], y, BUILDING_CENTER[1]]} receiveShadow material={mat}>
      <circleGeometry args={[radius, 64]} />
    </mesh>
  );
}

export function Site() {
  const geo = useMemo(() => getTowerGeometry().site, []);
  const mats = getMaterials();
  return (
    <group>
      <Ground />
      {[...geo.entries()].map(([k, g]) => (
        <mesh key={k} geometry={g} material={mats[k as MatKey]} castShadow={k === "trunk" || k.startsWith("foliage") || k === "render"} receiveShadow />
      ))}
      <Context />
    </group>
  );
}
