import { useMemo } from 'react';
import * as THREE from 'three';

export const SUN_DIR = new THREE.Vector3(-0.82, 0.42, -0.22).normalize();
export const HORIZON = new THREE.Color('#ead9c2');
export const ZENITH = new THREE.Color('#6f93b6');

/** Gradient sky dome with a soft golden-hour sun glow. Fully procedural (no HDR download). */
export default function Sky() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uHorizon: { value: HORIZON.clone() },
          uMid: { value: new THREE.Color('#c4d3df') },
          uZenith: { value: ZENITH.clone() },
          uSun: { value: SUN_DIR.clone() },
          uGround: { value: new THREE.Color('#d6c8b1') },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uHorizon, uMid, uZenith, uSun, uGround;
          varying vec3 vDir;
          void main() {
            float h = vDir.y;
            vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.18, h));
            col = mix(col, uZenith, smoothstep(0.18, 0.75, h));
            col = mix(col, uGround, smoothstep(0.0, -0.08, h));
            float s = max(dot(normalize(vDir), normalize(uSun)), 0.0);
            col += vec3(1.0, 0.78, 0.52) * (pow(s, 6.0) * 0.28 + pow(s, 120.0) * 0.9);
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  return (
    <mesh material={material} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[3000, 32, 16]} />
    </mesh>
  );
}
