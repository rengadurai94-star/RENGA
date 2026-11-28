import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { introClock } from '../animations/introClock';
import { HORIZON, SUN_DIR } from './Sky';
import { cloudTexture, mulberry32 } from './textures';

/**
 * Procedural cumulus layer: instanced camera-facing billboards with soft lighting,
 * depth fade near the camera (so the camera can fly through), and a "parting"
 * uniform that pushes clouds away from the intro flight path to reveal the city.
 */
export default function Clouds({ count = 220 }: { count?: number }) {
  const { geometry, material } = useMemo(() => {
    const rnd = mulberry32(11);
    const base = new THREE.PlaneGeometry(1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index;
    g.setAttribute('position', base.getAttribute('position'));
    g.setAttribute('uv', base.getAttribute('uv'));
    const offsets = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const rots = new Float32Array(count);
    const alphas = new Float32Array(count);
    const pathFactor = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // two populations: a dense layer along the intro corridor and a wider sky layer
      const corridor = i < count * 0.72;
      let x: number, z: number, y: number;
      if (corridor) {
        z = 60 + rnd() * 1150;
        x = -60 + (rnd() - 0.5) * 820;
        y = 168 + rnd() * 52;
      } else {
        const a = rnd() * Math.PI * 2;
        const r = 650 + rnd() * 1300;
        x = Math.cos(a) * r;
        z = Math.sin(a) * r;
        y = 210 + rnd() * 160;
      }
      offsets.set([x, y, z], i * 3);
      scales[i] = corridor ? 110 + rnd() * 170 : 180 + rnd() * 280;
      rots[i] = (rnd() - 0.5) * 0.5;
      alphas[i] = corridor ? 0.78 + rnd() * 0.22 : 0.5 + rnd() * 0.4;
      pathFactor[i] = corridor ? 1 : 0.15;
    }
    g.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3));
    g.setAttribute('aScale', new THREE.InstancedBufferAttribute(scales, 1));
    g.setAttribute('aRot', new THREE.InstancedBufferAttribute(rots, 1));
    g.setAttribute('aAlpha', new THREE.InstancedBufferAttribute(alphas, 1));
    g.setAttribute('aPath', new THREE.InstancedBufferAttribute(pathFactor, 1));
    g.instanceCount = count;

    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      fog: false,
      uniforms: {
        uMap: { value: cloudTexture() },
        uPart: { value: 0 },
        uTime: { value: 0 },
        uOpacity: { value: 1 },
        uSun: { value: SUN_DIR.clone() },
        uHaze: { value: HORIZON.clone() },
      },
      vertexShader: /* glsl */ `
        attribute vec3 aOffset; attribute float aScale; attribute float aRot; attribute float aAlpha; attribute float aPath;
        uniform float uPart; uniform float uTime;
        varying vec2 vUv; varying float vAlpha; varying float vDepth; varying float vY;
        void main() {
          vUv = uv;
          vec3 o = aOffset;
          // drift
          o.x += sin(uTime * 0.03 + aRot * 3.0) * 6.0;
          // part away from the flight corridor (x ~ -55)
          float side = sign(o.x + 55.0 + 0.001);
          o.x += side * uPart * aPath * (220.0 + aScale * 1.2);
          o.y += uPart * aPath * 40.0;
          vec4 mv = modelViewMatrix * vec4(o, 1.0);
          float c = cos(aRot), s = sin(aRot);
          // flattened puffs: a deck seen from above, not a wall of billboards
          vec2 p = mat2(c, -s, s, c) * (position.xy * vec2(1.0, 0.42)) * aScale;
          mv.xy += p;
          vDepth = -mv.z;
          vAlpha = aAlpha * (1.0 - uPart * aPath * 0.85);
          vY = position.y + 0.5;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap; uniform float uOpacity; uniform vec3 uHaze;
        varying vec2 vUv; varying float vAlpha; varying float vDepth; varying float vY;
        void main() {
          vec4 t = texture2D(uMap, vUv);
          float a = t.a * vAlpha * uOpacity;
          a *= smoothstep(4.0, 45.0, vDepth);           // fade when the camera passes through
          a *= 1.0 - smoothstep(1800.0, 2600.0, vDepth);  // fade far away
          if (a < 0.004) discard;
          vec3 lit = vec3(1.0, 0.975, 0.94);
          vec3 shade = vec3(0.70, 0.75, 0.82);
          vec3 col = mix(shade, lit, clamp(vY * 0.85 + t.r * 0.35 - 0.1, 0.0, 1.0));
          col = mix(col, uHaze, smoothstep(600.0, 2400.0, vDepth) * 0.6);
          gl_FragColor = vec4(col, a);
          #include <colorspace_fragment>
        }`,
    });
    return { geometry: g, material: m };
  }, [count]);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uPart.value = introClock.part;
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={5} />;
}
