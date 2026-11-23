"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { intro } from "@/lib/boxes/store";
import { makeCloudTexture } from "@/lib/boxes/materials";
import { BUILDING_CENTER, bearingOffset } from "@/lib/boxes/layout";

export const SKY = {
  zenith: new THREE.Color("#b9c3c9"),
  horizon: new THREE.Color("#efebe4"),
  ground: new THREE.Color("#e6e0d6"),
};

/** Large gradient sphere — a calm, slightly warm architectural sky. */
export function SkyDome({ radius = 1800 }: { radius?: number }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uZenith: { value: SKY.zenith },
          uHorizon: { value: SKY.horizon },
          uGround: { value: SKY.ground },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            vec4 p = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * p;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uZenith; uniform vec3 uHorizon; uniform vec3 uGround;
          varying vec3 vDir;
          void main() {
            float h = vDir.y;
            vec3 col = h > 0.0 ? mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.55)) : mix(uHorizon, uGround, clamp(-h * 6.0, 0.0, 1.0));
            // subtle warm glow around the sun side
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <mesh material={mat} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[radius, 48, 24]} />
    </mesh>
  );
}

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Cloud bank for the cinematic intro: puffs fill the space between the camera
 * and the tower, then drift apart and fade as `intro.clouds` goes 0 -> 1.
 * A few high clouds remain in the sky afterwards.
 */
export function Clouds({ bearing }: { bearing: number }) {
  const tex = useMemo(() => makeCloudTexture(), []);
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const puffs = useMemo(() => {
    const r = rng(42);
    const center = new THREE.Vector3(BUILDING_CENTER[0], 0, BUILDING_CENTER[1]);
    const [ox, , oz] = bearingOffset(bearing, 0, 1);
    const dir = new THREE.Vector3(ox, 0, oz).normalize();
    const side = new THREE.Vector3(-dir.z, 0, dir.x);
    const list: {
      base: THREE.Vector3;
      push: THREE.Vector3;
      scale: number;
      opacity: number;
      intro: boolean;
      speed: number;
    }[] = [];
    // dense intro bank
    for (let i = 0; i < 64; i++) {
      const d = 70 + r() * 360;
      const lat = (r() - 0.5) * (120 + d * 0.6);
      const y = 10 + r() * 120 + d * 0.12;
      const base = center.clone().addScaledVector(dir, d).addScaledVector(side, lat).setY(y);
      const away = side.clone().multiplyScalar(lat >= 0 ? 1 : -1);
      const push = away.multiplyScalar(160 + r() * 220).add(new THREE.Vector3(0, (r() - 0.3) * 60, 0));
      list.push({ base, push, scale: 70 + r() * 110, opacity: 0.55 + r() * 0.4, intro: true, speed: 0.6 + r() });
    }
    // high, distant clouds that stay
    for (let i = 0; i < 26; i++) {
      const a = r() * Math.PI * 2;
      const d = 420 + r() * 700;
      const base = new THREE.Vector3(center.x + Math.cos(a) * d, 150 + r() * 170, center.z + Math.sin(a) * d);
      list.push({ base, push: new THREE.Vector3(), scale: 160 + r() * 220, opacity: 0.35 + r() * 0.3, intro: false, speed: 0.3 + r() * 0.5 });
    }
    return list;
  }, [bearing]);

  const sprites = useMemo(
    () =>
      puffs.map((p) => {
        const m = new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          depthWrite: false,
          opacity: p.opacity,
          color: "#ffffff",
          fog: true,
        });
        const s = new THREE.Sprite(m);
        s.scale.setScalar(p.scale);
        s.position.copy(p.base);
        s.renderOrder = 2;
        return s;
      }),
    [puffs, tex],
  );

  useEffect(
    () => () => {
      sprites.forEach((s) => s.material.dispose());
      tex.dispose();
    },
    [sprites, tex],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const k = intro.clouds;
    const ease = k * k * (3 - 2 * k);
    sprites.forEach((s, i) => {
      const p = puffs[i];
      if (p.intro) {
        s.position.copy(p.base).addScaledVector(p.push, ease);
        s.position.x += Math.sin(t * 0.05 * p.speed + i) * 6;
        const fade = 1 - Math.min(1, ease * 1.25);
        s.material.opacity = p.opacity * fade;
        s.visible = fade > 0.01;
      } else {
        s.position.x = p.base.x + Math.sin(t * 0.01 * p.speed + i) * 40;
        s.material.opacity = p.opacity * (0.35 + 0.65 * ease);
      }
    });
    if (group.current) group.current.visible = camera.position.y < 5000;
  });

  return (
    <group ref={group}>
      {sprites.map((s, i) => (
        <primitive key={i} object={s} />
      ))}
    </group>
  );
}
