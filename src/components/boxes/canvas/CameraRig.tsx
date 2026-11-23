"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { dive, intro, journey, orbit, useBoxes, view } from "@/lib/boxes/store";
import { introPose, journeyPose, unitPose, type Pose } from "@/lib/boxes/camera";
import { bearingOffset } from "@/lib/boxes/layout";

const damp = THREE.MathUtils.damp;

/**
 * Scripted camera for the exterior experience. Each frame it computes the
 * desired pose for the current state (intro / scroll journey / unit / dive),
 * adds the visitor's orbit + zoom offsets and eases towards it.
 */
export function CameraRig() {
  const { camera, size } = useThree();
  const cur = useRef<Pose | null>(null);

  useFrame((_, rawDt) => {
    const s = useBoxes.getState();
    if (s.mode === "interior") return;
    const dt = Math.min(rawDt, 0.1);
    const cam = camera as THREE.PerspectiveCamera;
    const vp = { aspect: size.width / Math.max(1, size.height), wide: size.width >= 900, centered: view.centered };

    let d: Pose;
    if (!s.entered) d = introPose(intro.t, vp);
    else if ((s.mode === "unit" || s.transitioning) && s.selected) d = unitPose(s.selected, vp, dive.t);
    else d = journeyPose(journey.floor, vp);

    if (s.entered && dive.t === 0) {
      d.bearing += orbit.az;
      d.elevation = THREE.MathUtils.clamp(d.elevation + orbit.el, 3, 82);
      d.dist *= orbit.zoom;
    }

    if (!cur.current) cur.current = { ...d, target: d.target.clone() };
    const c = cur.current;
    const k = !s.entered ? 8 : dive.t > 0 ? 10 : 3.4;
    let db = d.bearing - c.bearing;
    db = ((((db + 180) % 360) + 360) % 360) - 180;
    c.bearing += db * (1 - Math.exp(-k * dt));
    c.elevation = damp(c.elevation, d.elevation, k, dt);
    c.dist = damp(c.dist, d.dist, k, dt);
    c.fov = damp(c.fov, d.fov, k, dt);
    c.target.lerp(d.target, 1 - Math.exp(-k * dt));

    const [ox, oy, oz] = bearingOffset(c.bearing, c.elevation, c.dist);
    cam.position.set(c.target.x + ox, c.target.y + oy, c.target.z + oz);
    cam.lookAt(c.target);
    if (Math.abs(cam.fov - c.fov) > 0.01) {
      cam.fov = c.fov;
      cam.updateProjectionMatrix();
    }
    if (cam.near !== 0.5) {
      cam.near = 0.5;
      cam.far = 4000;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}

/**
 * Drag-to-orbit and wheel/pinch zoom on the canvas, layered over the
 * scripted camera. Vertical swipes on touch devices still scroll the page.
 */
export function OrbitInput() {
  const { gl } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let touch = false;
    const down = (e: PointerEvent) => {
      const s = useBoxes.getState();
      if (!s.entered || s.mode === "interior" || s.transitioning) return;
      dragging = true;
      touch = e.pointerType === "touch";
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      orbit.az = THREE.MathUtils.clamp(orbit.az - dx * 0.22, -150, 150);
      if (!touch) orbit.el = THREE.MathUtils.clamp(orbit.el + dy * 0.12, -25, 35);
    };
    const up = () => {
      dragging = false;
    };
    const wheel = (e: WheelEvent) => {
      const s = useBoxes.getState();
      // In the scroll journey the wheel moves between floors; zoom needs ctrl/⌘ (trackpad pinch).
      if (s.mode === "unit" || e.ctrlKey) {
        e.preventDefault();
        orbit.zoom = THREE.MathUtils.clamp(orbit.zoom * Math.exp(e.deltaY * 0.0012), 0.45, 1.8);
      }
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
    };
  }, [gl]);
  return null;
}
