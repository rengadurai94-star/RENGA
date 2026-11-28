import * as THREE from 'three';

/**
 * Shared, mutable clock for the cinematic intro. GSAP (DOM side) tweens these
 * values; the 3D scene reads them every frame. Keeping it outside React avoids
 * re-rendering 60 times a second.
 */
export const introClock = {
  /** 0 -> 1 over the whole intro */
  t: 0,
  /** 0 -> 1 cloud parting */
  part: 0,
};

export const INTRO_DURATION = 13;

/** Camera flight path: inside the cloud layer -> through it -> aerial city -> building. */
const path = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-70, 300, 1020),
    new THREE.Vector3(-62, 288, 800),
    new THREE.Vector3(-58, 214, 560),
    new THREE.Vector3(-64, 118, 330),
    new THREE.Vector3(-74, 66, 170),
    new THREE.Vector3(-74, 34, 105),
    new THREE.Vector3(-66, 21, 74),
  ],
  false,
  'centripetal',
);

export const BUILDING_FOCUS = new THREE.Vector3(0, 9.5, 0);
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Pose of the camera for intro progress t (0..1). */
export function introPose(t: number, outPos: THREE.Vector3, outTarget: THREE.Vector3) {
  // ease: slow drift in the clouds, faster descent, gentle arrival
  const u = t < 0.3 ? t * 0.55 : 0.165 + (1 - Math.pow(1 - (t - 0.3) / 0.7, 2.6)) * 0.835;
  path.getPointAt(Math.min(1, u), outPos);
  path.getPointAt(Math.min(1, u + 0.06), tmpA);
  tmpA.y -= 6 + 52 * smooth(0.22, 0.52, t);
  const k = smooth(0.42, 0.88, t);
  tmpB.copy(tmpA).lerp(BUILDING_FOCUS, k);
  outTarget.copy(tmpB);
}

export const HERO_START = new THREE.Vector3();
introPose(1, HERO_START, new THREE.Vector3());
