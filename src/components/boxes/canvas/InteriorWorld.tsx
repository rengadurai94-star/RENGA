"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { floorPlans, type FloorPlan } from "@/config/floorplans";
import { getInteriorGeometry, pointBlocked, segmentBlocked, type InteriorGeometry } from "@/lib/boxes/interiorGeometry";
import { getMaterials, type MatKey } from "@/lib/boxes/materials";
import { floorY, sunDirection, unitPlacement, worldDirToLocal } from "@/lib/boxes/layout";
import { navigableRooms, roomAt, roomCenter, roomViewpoint, type Viewpoint } from "@/lib/boxes/plan";
import { useBoxes, walker } from "@/lib/boxes/store";
import { requestRoom, setInteriorView } from "@/lib/boxes/director";
import { SkyDome } from "./Atmosphere";
import { Site } from "./Site";
import type { Buckets } from "@/lib/boxes/builder";
import { project } from "@/config/project";
import { ModelSlot } from "./ModelSlot";

const EYE = 1.6;
const RADIUS = 0.26;
const FADER = "#boxes-fader";

function Meshes({ buckets, cast = true }: { buckets: Buckets; cast?: boolean }) {
  const mats = getMaterials();
  return (
    <>
      {[...buckets.entries()].map(([k, g]) => (
        <mesh
          key={k}
          geometry={g}
          material={mats[k as MatKey]}
          castShadow={cast && k !== "glassInterior" && k !== "railGlass" && k !== "glow"}
          receiveShadow
        />
      ))}
    </>
  );
}

function yawTo(from: [number, number], to: [number, number]) {
  return Math.atan2(to[0] - from[0], to[1] - from[1]);
}

function shortestYaw(from: number, to: number) {
  let d = to - from;
  d = ((((d + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
  return from + d;
}

/** Moves the walker to a viewpoint: glides if there is line of sight, otherwise a soft fade-cut. */
function moveWalker(geo: InteriorGeometry, vp: Viewpoint, opts: { instant?: boolean } = {}) {
  const [x, z] = vp.pos;
  const yaw = yawTo(vp.pos, vp.look);
  gsap.killTweensOf(walker);
  if (opts.instant) {
    Object.assign(walker, { x, z, yaw, pitch: -0.04, busy: false });
    return;
  }
  const dist = Math.hypot(x - walker.x, z - walker.z);
  const blocked = segmentBlocked(geo.walls, walker.x, walker.z, x, z, 0.02);
  walker.busy = true;
  if (!blocked) {
    gsap.to(walker, {
      x,
      z,
      yaw: shortestYaw(walker.yaw, yaw),
      pitch: -0.04,
      duration: Math.min(2.6, 0.9 + dist * 0.2),
      ease: "power2.inOut",
      onComplete: () => void (walker.busy = false),
    });
    return;
  }
  const back = 0.7;
  const tl = gsap.timeline({ onComplete: () => void (walker.busy = false) });
  tl.to(FADER, { opacity: 1, duration: 0.28, ease: "power1.in" });
  tl.add(() => {
    walker.x = x - Math.sin(yaw) * back;
    walker.z = z - Math.cos(yaw) * back;
    walker.yaw = yaw;
    walker.pitch = -0.04;
  });
  tl.to(FADER, { opacity: 0, duration: 0.5, ease: "power2.out" });
  tl.to(walker, { x, z, duration: 0.9, ease: "power2.out" }, "<");
}

let lastUnitKey = "";

function WalkControls({ plan, geo, unitKey }: { plan: FloorPlan; geo: InteriorGeometry; unitKey: string }) {
  const { camera, gl } = useThree();
  const keys = useRef(new Set<string>());
  const lastRoomCheck = useRef(0);
  const allCols = useMemo(() => [...geo.walls, ...geo.furniture], [geo]);

  // Arrival / re-entry placement
  useEffect(() => {
    const rooms = navigableRooms(plan);
    const living = plan.rooms.find((r) => r.type === "living") ?? rooms[0];
    const preset = plan.rooms.find((r) => r.id === useBoxes.getState().room);
    if (lastUnitKey !== unitKey && preset) {
      // deep link straight into a room
      lastUnitKey = unitKey;
      moveWalker(geo, roomViewpoint(plan, preset), { instant: true });
      return;
    }
    if (lastUnitKey !== unitKey) {
      lastUnitKey = unitKey;
      // start on the front balcony, looking in, then walk into the living room
      const slider = plan.windows.find((w) => w.side === "front" && w.kind === "slider");
      const sx = slider ? (slider.from + slider.to) / 2 : 0;
      Object.assign(walker, { x: sx, z: plan.depth + 0.9, yaw: Math.PI, pitch: -0.02, fov: 62, busy: true });
      const [cx, cz] = roomCenter(living);
      const target: Viewpoint = { pos: [cx * 0.85 + sx * 0.15, cz + (plan.depth - cz) * 0.25], look: [0, plan.depth * 0.3] };
      const id = window.setTimeout(() => {
        moveWalker(geo, target);
        useBoxes.setState({ room: living.id });
      }, 650);
      return () => window.clearTimeout(id);
    }
    const current = useBoxes.getState().room;
    const room = plan.rooms.find((r) => r.id === current);
    if (room) {
      const vp = roomViewpoint(plan, room);
      moveWalker(geo, vp, { instant: true });
    }
  }, [plan, geo, unitKey]);

  // Room requests from the HUD / hotspots
  useEffect(() => {
    const onRoom = (e: Event) => {
      const { roomId } = (e as CustomEvent<{ roomId: string }>).detail;
      const room = plan.rooms.find((r) => r.id === roomId);
      if (room) moveWalker(geo, roomViewpoint(plan, room));
    };
    window.addEventListener("boxes:room", onRoom);
    return () => window.removeEventListener("boxes:room", onRoom);
  }, [plan, geo]);

  // Input: drag to look, wheel to zoom, WASD / arrows to walk
  useEffect(() => {
    const el = gl.domElement;
    let drag = false;
    let lx = 0;
    let ly = 0;
    const down = (e: PointerEvent) => {
      drag = true;
      lx = e.clientX;
      ly = e.clientY;
    };
    const move = (e: PointerEvent) => {
      if (!drag || walker.busy) {
        lx = e.clientX;
        ly = e.clientY;
        return;
      }
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
      const k = e.pointerType === "touch" ? 0.006 : 0.0042;
      walker.yaw += dx * k;
      walker.pitch = THREE.MathUtils.clamp(walker.pitch + dy * k * 0.8, -1.1, 1.0);
    };
    const up = () => void (drag = false);
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      walker.fov = THREE.MathUtils.clamp(walker.fov + e.deltaY * 0.03, 34, 78);
    };
    const kd = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input, textarea, select")) return;
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "q", "e", "shift"].includes(k)) {
        keys.current.add(k);
        if (k.startsWith("arrow")) e.preventDefault();
      }
    };
    const ku = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    const blur = () => keys.current.clear();
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    window.addEventListener("blur", blur);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("blur", blur);
    };
  }, [gl]);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const k = keys.current;
    if (!walker.busy && k.size) {
      const fwd = (k.has("w") || k.has("arrowup") ? 1 : 0) - (k.has("s") || k.has("arrowdown") ? 1 : 0);
      const str = (k.has("d") ? 1 : 0) - (k.has("a") ? 1 : 0);
      const turn = (k.has("arrowleft") || k.has("q") ? 1 : 0) - (k.has("arrowright") || k.has("e") ? 1 : 0);
      walker.yaw += turn * dt * 1.6;
      const speed = (k.has("shift") ? 3.6 : 1.9) * dt;
      const fx = Math.sin(walker.yaw);
      const fz = Math.cos(walker.yaw);
      const rx = -Math.cos(walker.yaw);
      const rz = Math.sin(walker.yaw);
      const mx = (fx * fwd + rx * str) * speed;
      const mz = (fz * fwd + rz * str) * speed;
      if (mx && !pointBlocked(allCols, walker.x + mx, walker.z, RADIUS)) walker.x += mx;
      if (mz && !pointBlocked(allCols, walker.x, walker.z + mz, RADIUS)) walker.z += mz;
    }
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.set(walker.x, EYE, walker.z);
    const cp = Math.cos(walker.pitch);
    cam.lookAt(walker.x + Math.sin(walker.yaw) * cp, EYE + Math.sin(walker.pitch), walker.z + Math.cos(walker.yaw) * cp);
    if (Math.abs(cam.fov - walker.fov) > 0.01 || cam.near !== 0.05) {
      cam.fov = walker.fov;
      cam.near = 0.05;
      cam.far = 3000;
      cam.updateProjectionMatrix();
    }
    if (state.clock.elapsedTime - lastRoomCheck.current > 0.25) {
      lastRoomCheck.current = state.clock.elapsedTime;
      const r = roomAt(plan, walker.x, walker.z);
      if (r && useBoxes.getState().room !== r.id && !walker.busy) useBoxes.setState({ room: r.id });
    }
  });

  return null;
}

function Dollhouse({ plan }: { plan: FloorPlan }) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(0, 0, plan.depth / 2), [plan]);
  const size = Math.max(plan.width, plan.depth);
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = 40;
    cam.near = 0.1;
    cam.updateProjectionMatrix();
    const end = new THREE.Vector3(-size * 0.35, size * 1.25, plan.depth / 2 + size * 1.05);
    const tw = gsap.to(cam.position, { x: end.x, y: end.y, z: end.z, duration: 1.4, ease: "power2.inOut" });
    return () => void tw.kill();
  }, [camera, plan, size]);
  return (
    <OrbitControls
      makeDefault
      target={target}
      enableDamping
      dampingFactor={0.08}
      minDistance={size * 0.6}
      maxDistance={size * 3}
      maxPolarAngle={1.25}
      enablePan={false}
    />
  );
}

function Hotspots({ plan, view }: { plan: FloorPlan; view: "walk" | "dollhouse" }) {
  const room = useBoxes((s) => s.room);
  const [hover, setHover] = useState<string | null>(null);
  const ringGeo = useMemo(() => new THREE.RingGeometry(0.2, 0.3, 40), []);
  const dotGeo = useMemo(() => new THREE.CircleGeometry(0.08, 24), []);
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#c9a27a", transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }),
    [],
  );
  const group = useRef<THREE.Group>(null);
  useEffect(
    () => () => {
      ringGeo.dispose();
      dotGeo.dispose();
      mat.dispose();
    },
    [ringGeo, dotGeo, mat],
  );
  useFrame(({ clock }) => {
    mat.opacity = 0.55 + Math.sin(clock.elapsedTime * 2.4) * 0.25;
  });
  const rooms = navigableRooms(plan);
  const go = (id: string) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return;
    if (view === "dollhouse") {
      useBoxes.setState({ room: id });
      setInteriorView("walk");
    } else requestRoom(id);
  };
  return (
    <group ref={group}>
      {rooms.map((r) => {
        const vp = roomViewpoint(plan, r);
        const [cx, cz] = roomCenter(r);
        const pos: [number, number, number] = view === "walk" ? [vp.pos[0], 0.04, vp.pos[1]] : [cx, 0.05, cz];
        if (view === "walk" && r.id === room) return null;
        const s = hover === r.id ? 1.35 : 1;
        return (
          <group key={r.id} position={pos}>
            <mesh
              geometry={ringGeo}
              material={mat}
              rotation={[-Math.PI / 2, 0, 0]}
              scale={view === "dollhouse" ? s * 2 : s}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHover(r.id);
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                setHover(null);
                document.body.style.cursor = "";
              }}
              onClick={go(r.id)}
            />
            <mesh geometry={dotGeo} material={mat} rotation={[-Math.PI / 2, 0, 0]} scale={view === "dollhouse" ? 2 : 1} />
            {(hover === r.id || view === "dollhouse") && (
              <Html position={[0, view === "dollhouse" ? 1.2 : 0.5, 0]} center zIndexRange={[30, 10]} style={{ pointerEvents: "none" }}>
                <span className="boxes-pill whitespace-nowrap">{r.name}</span>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

export function InteriorWorld() {
  const selected = useBoxes((s) => s.selected);
  const view = useBoxes((s) => s.interiorView);
  const unit = selected?.unit ?? "A";
  const plan = floorPlans[unit];
  const geo = useMemo(() => getInteriorGeometry(unit), [unit]);
  const floor = selected?.floor ?? 1;
  const place = unitPlacement(unit);

  // Sun direction expressed in the unit's local frame (true orientation).
  const sun = useMemo(() => {
    const [sx, sy, sz] = sunDirection();
    const [lx, lz] = worldDirToLocal(unit, sx, sz);
    return new THREE.Vector3(lx, sy, lz).normalize();
  }, [unit]);
  const center = useMemo(() => new THREE.Vector3(0, 1.5, plan.depth / 2), [plan]);
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const size = Math.max(plan.width, plan.depth) / 2 + 3;

  useEffect(() => {
    const l = lightRef.current;
    if (!l) return;
    l.target.position.copy(center);
    l.target.updateMatrixWorld();
  }, [center]);

  // A fresh visit replays the arrival walk-in
  useEffect(
    () => () => {
      lastUnitKey = "";
    },
    [],
  );

  // Fade when switching walk <-> dollhouse
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    gsap.fromTo(FADER, { opacity: 0.9 }, { opacity: 0, duration: 0.6, ease: "power2.out" });
  }, [view]);

  // Outside world expressed in local unit coordinates (so windows frame the real neighbourhood)
  const inv = useMemo(() => {
    const a = -place.angle;
    const [ox, oz] = place.origin;
    const px = -(ox * Math.cos(a) + oz * Math.sin(a));
    const pz = -(-ox * Math.sin(a) + oz * Math.cos(a));
    return { rot: a, pos: [px, -floorY(floor), pz] as [number, number, number] };
  }, [place, floor]);

  return (
    <>
      <SkyDome radius={1500} />
      <fog attach="fog" args={["#efebe4", 120, 1100]} />
      <hemisphereLight args={["#f4f1ea", "#b9ad9c", 0.55]} />
      <directionalLight
        ref={lightRef}
        position={[center.x + sun.x * 40, center.y + sun.y * 40, center.z + sun.z * 40]}
        intensity={3.2}
        color="#fff1df"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-size}
        shadow-camera-right={size}
        shadow-camera-top={size}
        shadow-camera-bottom={-size}
        shadow-camera-near={1}
        shadow-camera-far={120}
      />
      {/* warm accent lights */}
      {plan.rooms
        .filter((r) => r.type === "living" || r.type === "dining" || r.type === "master")
        .map((r) => {
          const [cx, cz] = roomCenter(r);
          return <pointLight key={r.id} position={[cx, 2.5, cz]} intensity={2.2} distance={7} decay={1.6} color="#ffd9a8" />;
        })}
      {/* A GLB interior (if configured) replaces the procedural geometry; navigation still uses the plan. */}
      <ModelSlot
        url={project.models.interiors[unit]}
        fallback={
          <group>
            <Meshes buckets={geo.main} />
            <group visible={view === "walk"}>
              <Meshes buckets={geo.overhead} />
            </group>
          </group>
        }
      />
      <group position={inv.pos} rotation={[0, inv.rot, 0]}>
        <Site />
      </group>
      <Hotspots plan={plan} view={view} />
      {view === "walk" ? (
        <WalkControls plan={plan} geo={geo} unitKey={`${floor}-${unit}`} />
      ) : (
        <Dollhouse plan={plan} />
      )}
    </>
  );
}

