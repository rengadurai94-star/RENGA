import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { BUILDING_D, BUILDING_W } from './planGeometry';
import { groundTexture, mulberry32 } from './textures';

/**
 * Stylised, procedural Madurai-inspired city massing used purely as atmosphere.
 * Nothing here represents real surrounding buildings or real landmark positions.
 * The gopuram-inspired silhouettes sit far away in the haze and make no geographic claim.
 */

const PALETTE = ['#ebe4d8', '#e4d8c4', '#efebe4', '#dccbb0', '#d2b79b', '#c9a98d', '#e3d3bf', '#d5cfc6', '#c4bbab', '#dfcdb4', '#b8c0bb', '#cfbfa4', '#e8e1d6', '#d9d3c9'];

interface CityProps {
  density: 'high' | 'low';
}

function useInstances(count: number, fill: (o: THREE.Object3D, c: THREE.Color, i: number) => void) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      fill(o, c, i);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, c);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [count, fill]);
  return ref;
}

export default function City({ density }: CityProps) {
  const layout = useMemo(() => {
    const rnd = mulberry32(2026);
    const blocks: { x: number; z: number; w: number; d: number; h: number; c: string }[] = [];
    const tanks: { x: number; y: number; z: number }[] = [];
    const trees: { x: number; z: number; s: number }[] = [];
    const palms: { x: number; z: number; h: number }[] = [];
    const BLOCK = 64;
    const STREET = 12;
    const R = density === 'high' ? 980 : 640;
    const clearX = BUILDING_W / 2 + 22;
    const clearZ = BUILDING_D / 2 + 26;
    for (let bx = -R; bx < R; bx += BLOCK) {
      for (let bz = -R; bz < R; bz += BLOCK) {
        const cx = bx + BLOCK / 2;
        const cz = bz + BLOCK / 2;
        const dist = Math.hypot(cx, cz);
        if (dist > R) continue;
        const inner = BLOCK - STREET;
        // occasional open ground / park block
        if (rnd() < 0.07) {
          for (let k = 0; k < 10; k++) trees.push({ x: cx + (rnd() - 0.5) * inner, z: cz + (rnd() - 0.5) * inner, s: 3 + rnd() * 3 });
          continue;
        }
        const keep = density === 'high' ? 1 : 0.7;
        const n = 6 + Math.floor(rnd() * 7);
        for (let k = 0; k < n; k++) {
          if (rnd() > keep) continue;
          const w = 11 + rnd() * 17;
          const d = 11 + rnd() * 17;
          const x = cx + (rnd() - 0.5) * (inner - w);
          const z = cz + (rnd() - 0.5) * (inner - d);
          if (Math.abs(x) < clearX + w / 2 && Math.abs(z) < clearZ + d / 2) continue;
          const tall = rnd() < 0.06;
          const floors = tall ? 5 + Math.floor(rnd() * 4) : 1 + Math.floor(Math.pow(rnd(), 1.6) * 4);
          const h = floors * 3.2 + rnd() * 1.2;
          blocks.push({ x, z, w, d, h, c: PALETTE[Math.floor(rnd() * PALETTE.length)] });
          if (rnd() < 0.35) tanks.push({ x: x + (rnd() - 0.5) * w * 0.5, y: h, z: z + (rnd() - 0.5) * d * 0.5 });
        }
        // street trees along the block edge
        const tn = density === 'high' ? 4 : 2;
        for (let k = 0; k < tn; k++) {
          const along = (rnd() - 0.5) * inner;
          const edge = rnd() < 0.5;
          const tx = edge ? cx + along : cx + (rnd() < 0.5 ? -1 : 1) * (inner / 2 + 2);
          const tz = edge ? cz + (rnd() < 0.5 ? -1 : 1) * (inner / 2 + 2) : cz + along;
          if (Math.abs(tx) < clearX && Math.abs(tz) < clearZ) continue;
          if (tx < 0 && tx > -140 && tz > 0 && tz < 150) continue; // keep the hero sight-line clear
          if (rnd() < 0.25) palms.push({ x: tx, z: tz, h: 9 + rnd() * 6 });
          else trees.push({ x: tx, z: tz, s: 2.5 + rnd() * 2.5 });
        }
      }
    }
    // a few trees behind the site (as in the brochure renders) - none in front of the hero view
    for (const [x, z] of [[-BUILDING_W / 2 - 9, -BUILDING_D / 2 - 6], [BUILDING_W / 2 + 10, -BUILDING_D / 2 + 2], [BUILDING_W / 2 + 9, 6]] as [number, number][]) {
      trees.push({ x, z, s: 3.4 });
    }
    return { blocks, tanks, trees, palms, R };
  }, [density]);

  const boxGeo = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    g.translate(0, 0.5, 0);
    return g;
  }, []);

  const blocksRef = useInstances(
    layout.blocks.length,
    useMemo(
      () => (o: THREE.Object3D, c: THREE.Color, i: number) => {
        const b = layout.blocks[i];
        o.position.set(b.x, 0, b.z);
        o.rotation.set(0, 0, 0);
        o.scale.set(b.w, b.h, b.d);
        c.set(b.c);
      },
      [layout],
    ),
  );
  const tankRef = useInstances(
    layout.tanks.length,
    useMemo(
      () => (o: THREE.Object3D, c: THREE.Color, i: number) => {
        const t = layout.tanks[i];
        o.position.set(t.x, t.y, t.z);
        o.scale.set(1, 1, 1);
        c.set(i % 3 === 0 ? '#2f4a6b' : '#262b2f');
      },
      [layout],
    ),
  );
  const treeRef = useInstances(
    layout.trees.length,
    useMemo(
      () => (o: THREE.Object3D, c: THREE.Color, i: number) => {
        const t = layout.trees[i];
        o.position.set(t.x, t.s * 1.1, t.z);
        o.scale.set(t.s, t.s * 0.9, t.s);
        c.setHSL(0.24 + (i % 7) * 0.01, 0.26, 0.22 + (i % 5) * 0.025);
      },
      [layout],
    ),
  );
  const palmTrunkRef = useInstances(
    layout.palms.length,
    useMemo(
      () => (o: THREE.Object3D, c: THREE.Color, i: number) => {
        const p = layout.palms[i];
        o.position.set(p.x, p.h / 2, p.z);
        o.scale.set(1, p.h, 1);
        c.set('#8a7a66');
      },
      [layout],
    ),
  );
  const palmCrownRef = useInstances(
    layout.palms.length,
    useMemo(
      () => (o: THREE.Object3D, c: THREE.Color, i: number) => {
        const p = layout.palms[i];
        o.position.set(p.x, p.h, p.z);
        o.rotation.set(0, i * 0.7, 0);
        o.scale.set(1, 1, 1);
        c.set('#5d7d45');
      },
      [layout],
    ),
  );

  const palmCrownGeo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 7; k++) {
      const leaf = new THREE.ConeGeometry(0.7, 4.2, 4, 1);
      leaf.rotateZ(Math.PI / 2 + 0.35);
      leaf.translate(2.0, -0.4, 0);
      leaf.rotateY((k / 7) * Math.PI * 2);
      parts.push(leaf.toNonIndexed());
    }
    return mergeGeometries(parts)!;
  }, []);

  const gopurams = useMemo(() => buildGopurams(), []);
  const cityMaterial = useMemo(() => windowedMaterial(), []);
  const ground = useMemo(() => groundTexture(), []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <circleGeometry args={[2600, 64]} />
        <meshStandardMaterial map={ground} color="#b9ad97" roughness={1} />
      </mesh>
      <Streets R={layout.R} />
      <instancedMesh ref={blocksRef} args={[boxGeo, cityMaterial, layout.blocks.length]} receiveShadow castShadow={false} />
      <instancedMesh ref={tankRef} args={[undefined, undefined, layout.tanks.length]}>
        <cylinderGeometry args={[0.8, 0.8, 1.6, 10]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={treeRef} args={[undefined, undefined, layout.trees.length]} castShadow={false}>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      <instancedMesh ref={palmTrunkRef} args={[undefined, undefined, layout.palms.length]}>
        <cylinderGeometry args={[0.18, 0.26, 1, 6]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      <instancedMesh ref={palmCrownRef} args={[palmCrownGeo, undefined, layout.palms.length]}>
        <meshStandardMaterial roughness={1} flatShading side={THREE.DoubleSide} />
      </instancedMesh>
      <mesh geometry={gopurams}>
        <meshStandardMaterial vertexColors roughness={0.95} />
      </mesh>
    </group>
  );
}

function Streets({ R }: { R: number }) {
  const geo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const BLOCK = 64;
    for (let v = -R; v <= R; v += BLOCK) {
      const a = new THREE.PlaneGeometry(R * 2, 10);
      a.rotateX(-Math.PI / 2);
      a.translate(0, 0.01, v);
      parts.push(a);
      const b = new THREE.PlaneGeometry(10, R * 2);
      b.rotateX(-Math.PI / 2);
      b.translate(v, 0.012, 0);
      parts.push(b);
    }
    // the main road in front (south) of the site
    const road = new THREE.PlaneGeometry(R * 2, 14);
    road.rotateX(-Math.PI / 2);
    road.translate(0, 0.02, BUILDING_D / 2 + 15);
    parts.push(road);
    return mergeGeometries(parts)!;
  }, [R]);
  const marks = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (let x = -260; x < 260; x += 9) {
      const m = new THREE.PlaneGeometry(4, 0.18);
      m.rotateX(-Math.PI / 2);
      m.translate(x, 0.03, BUILDING_D / 2 + 15);
      parts.push(m);
    }
    return mergeGeometries(parts)!;
  }, []);
  return (
    <group>
      <mesh geometry={geo} receiveShadow>
        <meshStandardMaterial color="#77777a" roughness={0.96} />
      </mesh>
      <mesh geometry={marks}>
        <meshBasicMaterial color="#e9e5dc" />
      </mesh>
    </group>
  );
}

/** Tiered, tapering temple-tower silhouettes (generic, gopuram-inspired). */
function buildGopurams() {
  const parts: THREE.BufferGeometry[] = [];
  const colorize = (g: THREE.BufferGeometry, col: THREE.Color) => {
    const n = g.getAttribute('position').count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) arr.set([col.r, col.g, col.b], i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    return g;
  };
  const sites: [number, number, number, number][] = [
    // x, z, height scale, rotation - far north-east, behind the hero view, in the haze
    [520, -1080, 1, 0.1],
    [640, -1180, 0.86, 0.12],
    [430, -1200, 0.78, 0.05],
    [700, -1010, 0.7, 0.18],
  ];
  const stone = new THREE.Color('#c9a37b');
  const light = new THREE.Color('#d9b893');
  const dark = new THREE.Color('#ad8661');
  for (const [x, z, sc, rot] of sites) {
    const W = 30 * sc;
    const D = 19 * sc;
    const base = new THREE.BoxGeometry(W, 9 * sc, D).toNonIndexed();
    base.translate(0, 4.5 * sc, 0);
    parts.push(colorize(base, dark));
    let y = 9 * sc;
    const tiers = 9;
    for (let i = 0; i < tiers; i++) {
      const k = 1 - (i / tiers) * 0.62;
      const kd = 1 - (i / tiers) * 0.45;
      const h = 5.2 * sc;
      const tier = new THREE.BoxGeometry(W * k, h, D * kd).toNonIndexed();
      tier.translate(0, y + h / 2, 0);
      parts.push(colorize(tier, i % 2 ? light : stone));
      const cornice = new THREE.BoxGeometry(W * k + 1.2 * sc, 0.6 * sc, D * kd + 1.2 * sc).toNonIndexed();
      cornice.translate(0, y + h, 0);
      parts.push(colorize(cornice, dark));
      y += h;
    }
    const topW = W * 0.38;
    const vault = new THREE.CylinderGeometry(3.4 * sc, 3.4 * sc, topW, 12, 1, false, 0, Math.PI).toNonIndexed();
    vault.rotateZ(Math.PI / 2);
    vault.rotateX(-Math.PI / 2);
    vault.translate(0, y + 0.3, 0);
    parts.push(colorize(vault, light));
    for (let k = 0; k < 5; k++) {
      const kal = new THREE.ConeGeometry(0.6 * sc, 3 * sc, 8).toNonIndexed();
      kal.translate(-topW / 2 + (topW * (k + 0.5)) / 5, y + 3.4 * sc + 1.4 * sc, 0);
      parts.push(colorize(kal, new THREE.Color('#c49a52')));
    }
    const group = mergeGeometries(parts.splice(parts.length - (2 + tiers * 2 + 5), 2 + tiers * 2 + 5))!;
    group.rotateY(rot);
    group.translate(x, 0, z);
    parts.push(group);
  }
  return mergeGeometries(parts)!;
}

/** City massing material with a procedural window grid in world space (no textures, no UV stretching). */
function windowedMaterial() {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.9 });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNrm;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec4 wpI = modelMatrix * instanceMatrix * vec4(position, 1.0);
          vWNrm = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        #else
          vec4 wpI = modelMatrix * vec4(position, 1.0);
          vWNrm = normalize(mat3(modelMatrix) * normal);
        #endif
        vWPos = wpI.xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNrm;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float side = 1.0 - step(0.5, abs(vWNrm.y));
        float u = abs(vWNrm.x) > 0.5 ? vWPos.z : vWPos.x;
        vec2 cell = fract(vec2(u / 3.1, (vWPos.y - 0.4) / 3.2));
        float win = step(0.22, cell.x) * step(cell.x, 0.74) * step(0.3, cell.y) * step(cell.y, 0.8);
        win *= side * step(1.2, vWPos.y);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.38 + vec3(0.03, 0.04, 0.05), win * 0.8);
        // darker roofs and a soft ground-contact gradient
        diffuseColor.rgb *= mix(1.0, 0.86, step(0.5, vWNrm.y));
        diffuseColor.rgb *= mix(0.78, 1.0, clamp(vWPos.y / 6.0, 0.0, 1.0));`,
      );
  };
  return m;
}
