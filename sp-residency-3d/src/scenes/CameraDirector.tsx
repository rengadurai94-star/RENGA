import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { BUILDING_FOCUS, HERO_START, introClock, introPose } from '../animations/introClock';
import { explorerSteps } from '../data/project';
import { zoomBy } from '../utils/actions';
import { getState, subscribe } from '../utils/store';
import { levelBase, ROOF_Y } from './planGeometry';

const LEVEL_OF: Record<string, number> = { stilt: 0, f1: 1, f2: 2, f3: 3, f4: 4, f5: 5, terrace: 6 };
const DEFAULT_THETA = -0.66; // from the south-west: front (road) facade + west side

/** Survives a canvas remount (quality switch) so the camera does not restart from the clouds. */
const lastPose = { valid: false, pos: new THREE.Vector3() };

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * One camera, three behaviours:
 *  - intro:   follows the GSAP-driven flight path (animations/introClock.ts)
 *  - hero:    slow cinematic orbit around the building
 *  - explore: floor-by-floor framing, drag to rotate, buttons / pinch / ctrl+wheel to zoom
 * All transitions are critically damped so nothing snaps.
 */
export default function CameraDirector() {
  const { camera, gl, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const s = useRef({
    initialized: false,
    target: new THREE.Vector3().copy(BUILDING_FOCUS),
    theta: DEFAULT_THETA,
    phi: 1.45,
    radius: 100,
    heroTheta: DEFAULT_THETA,
    userTheta: DEFAULT_THETA,
    userPhi: 0,
    shiftX: 0,
    shiftY: 0,
    dragging: false,
    pinchDist: 0,
    tmpPos: new THREE.Vector3(),
    tmpTarget: new THREE.Vector3(),
    desiredTarget: new THREE.Vector3(),
  });

  // reset view
  useEffect(() => {
    let token = getState().resetToken;
    return subscribe(() => {
      const st = getState();
      if (st.resetToken !== token) {
        token = st.resetToken;
        s.current.userTheta = DEFAULT_THETA;
        s.current.userPhi = 0;
      }
    });
  }, []);

  // pointer / touch / wheel input on the canvas
  useEffect(() => {
    const el = gl.domElement;
    let lx = 0;
    let ly = 0;
    const pointers = new Map<number, { x: number; y: number }>();
    const active = () => getState().introDone && getState().section === 'explore';
    const down = (e: PointerEvent) => {
      if (!active()) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        s.current.dragging = true;
        lx = e.clientX;
        ly = e.clientY;
      }
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        s.current.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      }
    };
    const move = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (s.current.pinchDist > 0) zoomBy(d / s.current.pinchDist);
        s.current.pinchDist = d;
        return;
      }
      if (!s.current.dragging) return;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
      s.current.userTheta -= dx * 0.0055;
      if (e.pointerType === 'mouse') s.current.userPhi = THREE.MathUtils.clamp(s.current.userPhi - dy * 0.0035, -0.55, 0.45);
    };
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) s.current.pinchDist = 0;
      if (pointers.size === 0) s.current.dragging = false;
    };
    const wheel = (e: WheelEvent) => {
      // plain wheel scrolls the page (floor by floor); ctrl/cmd + wheel or trackpad pinch zooms
      if (!active() || !(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      zoomBy(Math.exp(-e.deltaY * 0.0022));
    };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
    };
  }, [gl]);

  useFrame((_, rawDt) => {
    // generous clamp: slow devices still finish transitions on time, tab switches don't jump
    const dt = Math.min(rawDt, 0.25);
    const st = getState();
    const r = s.current;
    const aspect = size.width / Math.max(1, size.height);
    const portrait = aspect < 0.85;
    const fit = portrait ? Math.min(2.1, 0.95 / aspect) : aspect < 1.25 ? 1.15 : 1;
    const wantFov = portrait ? 40 : 32;
    if (Math.abs(cam.fov - wantFov) > 0.01) {
      cam.fov = THREE.MathUtils.damp(cam.fov, wantFov, 4, dt);
    }

    let shiftX = 0;
    let shiftY = 0;

    if (!st.introDone) {
      introPose(introClock.t, r.tmpPos, r.tmpTarget);
      cam.position.copy(r.tmpPos);
      cam.lookAt(r.tmpTarget);
      const k = smooth(0.72, 1, introClock.t);
      shiftX = (portrait ? 0 : -0.16 * size.width) * k;
      r.shiftX = shiftX;
      r.shiftY = 0;
      applyShift(cam, size, r.shiftX, r.shiftY);
      r.initialized = false;
      return;
    }

    if (!r.initialized) {
      // hand over from the intro (or from a previous canvas) without a jump
      // intro skipped before the first frame (return visit) -> start at the hero framing
      cam.position.copy(lastPose.valid ? lastPose.pos : HERO_START);
      r.target.copy(BUILDING_FOCUS);
      const off = cam.position.clone().sub(r.target);
      const sph = new THREE.Spherical().setFromVector3(off);
      r.theta = sph.theta;
      r.phi = sph.phi;
      r.radius = sph.radius;
      r.heroTheta = sph.theta;
      r.initialized = true;
    }

    let dTheta: number;
    let dPhi: number;
    let dRadius: number;
    const dTarget = r.desiredTarget;
    let lambda = 2.2;

    if (st.section === 'explore') {
      const floor = explorerSteps[st.step];
      const zoom = st.zoom;
      if (!floor) {
        dTarget.set(0, 10, 0);
        dRadius = 84 * fit;
        dPhi = 1.27 + r.userPhi;
      } else {
        const L = LEVEL_OF[floor.id] ?? 0;
        const y = L === 6 ? ROOF_Y + 1 : levelBase(L) + 1.3;
        dTarget.set(0, y, 0);
        dRadius = (L === 0 ? 74 : 72) * fit;
        dPhi = (L === 0 ? 1.18 : L === 6 ? 0.86 : 0.93) + r.userPhi;
      }
      dRadius /= zoom;
      dPhi = THREE.MathUtils.clamp(dPhi, 0.32, 1.5);
      dTheta = r.userTheta;
      lambda = r.dragging ? 9 : 2.6;
      if (!portrait) shiftX = size.width > 900 ? 0.12 * size.width : 0;
      else shiftY = 0.13 * size.height;
    } else {
      // hero orbit
      r.heroTheta -= dt * 0.016;
      r.userTheta = r.heroTheta;
      dTarget.copy(BUILDING_FOCUS);
      dRadius = 100 * fit;
      dPhi = 1.45;
      dTheta = r.heroTheta;
      shiftX = portrait ? 0 : -0.16 * size.width;
      if (portrait) shiftY = -0.06 * size.height;
    }

    // shortest-path angle damping
    let diff = dTheta - r.theta;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    r.theta = r.theta + diff * (1 - Math.exp(-lambda * dt));
    r.phi = THREE.MathUtils.damp(r.phi, dPhi, lambda, dt);
    r.radius = THREE.MathUtils.damp(r.radius, dRadius, 2.4, dt);
    r.target.x = THREE.MathUtils.damp(r.target.x, dTarget.x, 2.4, dt);
    r.target.y = THREE.MathUtils.damp(r.target.y, dTarget.y, 2.4, dt);
    r.target.z = THREE.MathUtils.damp(r.target.z, dTarget.z, 2.4, dt);
    r.shiftX = THREE.MathUtils.damp(r.shiftX, shiftX, 3, dt);
    r.shiftY = THREE.MathUtils.damp(r.shiftY, shiftY, 3, dt);

    const sp = new THREE.Spherical(r.radius, r.phi, r.theta);
    cam.position.setFromSpherical(sp).add(r.target);
    cam.lookAt(r.target);
    applyShift(cam, size, r.shiftX, r.shiftY);
    lastPose.pos.copy(cam.position);
    lastPose.valid = true;
  });

  return null;
}

function applyShift(cam: THREE.PerspectiveCamera, size: { width: number; height: number }, x: number, y: number) {
  const w = size.width;
  const h = size.height;
  if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5) {
    if (cam.view) {
      cam.clearViewOffset();
    }
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
    return;
  }
  cam.aspect = w / h;
  cam.setViewOffset(w, h, x, y, w, h);
}
