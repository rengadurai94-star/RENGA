"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Line } from "@react-three/drei";
import type { MotionValue } from "framer-motion";
import * as THREE from "three";
import { PlacedCabinet, RoomShell } from "@/components/three/RoomShell";
import { LabelOverlay, LabelProjector, type ScreenLabel } from "@/components/three/ScreenLabels";
import { DEMO_HOOD, DEMO_PLACEMENTS, DEMO_ROOM } from "@/lib/room/demo-kitchen";
import { wallOrigin, wallRotation } from "@/lib/room/layout";

const S = 0.001; // mm → m
const BASE_IDS = new Set(["a-drawer", "a-sink", "a-dd", "a-1d", "b-corner", "b-hob", "b-drawer"]);
const FOCUS_ID = "a-drawer";

/** Camera keyframes per walkthrough step: [position, target] in metres. */
const KEYS: [THREE.Vector3Tuple, THREE.Vector3Tuple][] = [
  [[-2.1, 2.25, 6.7], [2.0, 1.15, 0.9]], // 0 hero
  [[-2.8, 3.7, 7.9], [2.0, 1.0, 1.0]], // 1 discover — modules spread
  [[2.3, 1.75, 3.1], [0.95, 0.6, 0.55]], // 2 components — exploded drawer unit
  [[2.15, 11.5, 1.62], [2.15, 0, 1.5]], // 3 plan — top view
  [[0.7, 1.7, 5.0], [2.6, 0.8, 0.5]], // 4 materials
  [[-1.7, 2.0, 5.9], [2.2, 1.1, 0.8]], // 5 visualise
];

function CameraRig({ progress, mobile }: { progress: MotionValue<number>; mobile: boolean }) {
  // Scratch vectors live in a ref: they are mutated every frame.
  const v = useRef({
    target: new THREE.Vector3(...KEYS[0][1]),
    pos: new THREE.Vector3(),
    tgt: new THREE.Vector3(),
    a: new THREE.Vector3(),
    b: new THREE.Vector3(),
  });

  useFrame((state, dt) => {
    const { target, pos, tgt, a, b } = v.current;
    const camera = state.camera;
    const p = THREE.MathUtils.clamp(progress.get(), 0, KEYS.length - 1);
    const i = Math.min(Math.floor(p), KEYS.length - 2);
    const f = THREE.MathUtils.smootherstep(p - i, 0, 1);
    pos.copy(a.fromArray(KEYS[i][0])).lerp(b.fromArray(KEYS[i + 1][0]), f);
    tgt.copy(a.fromArray(KEYS[i][1])).lerp(b.fromArray(KEYS[i + 1][1]), f);

    // Gentle life: drift on the hero, slow sway on the final step.
    const t = state.clock.elapsedTime;
    const drift = Math.max(0, 1 - Math.abs(p - 0) * 1.5) + Math.max(0, 1 - Math.abs(p - 5) * 1.5);
    pos.x += Math.sin(t * 0.25) * 0.35 * drift;
    pos.y += Math.sin(t * 0.18) * 0.08 * drift;
    // Portrait screens need the camera further back to fit the run.
    if (mobile) pos.sub(tgt).multiplyScalar(1.55).add(tgt);

    const k = 1 - Math.exp(-5 * dt);
    camera.position.lerp(pos, k);
    target.lerp(tgt, k);
    camera.lookAt(target);
  });
  return null;
}

/** Shift the rendered frame so the kitchen sits beside (desktop) or above (mobile) the copy. */
function ViewOffset({ mobile }: { mobile: boolean }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const ox = mobile ? 0 : -size.width * 0.17;
    const oy = mobile ? size.height * 0.16 : 0;
    cam.setViewOffset(size.width, size.height, ox, oy, size.width, size.height);
    cam.updateProjectionMatrix();
    return () => {
      cam.clearViewOffset();
    };
  }, [camera, size.width, size.height, mobile]);
  return null;
}

function Hood() {
  const origin = wallOrigin(DEMO_ROOM, DEMO_HOOD.wall, DEMO_HOOD.offset, 0);
  const rot = wallRotation(DEMO_HOOD.wall);
  const w = DEMO_HOOD.width;
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2e2e2b", metalness: 0.6, roughness: 0.35 }), []);
  return (
    <group position={origin} rotation={[0, rot, 0]}>
      <mesh material={mat} position={[w / 2, 1680, 250]} castShadow>
        <boxGeometry args={[w - 100, 70, 500]} />
      </mesh>
      <mesh material={mat} position={[w / 2, 2200, 150]} castShadow>
        <boxGeometry args={[300, 980, 300]} />
      </mesh>
    </group>
  );
}

function PlanOverlay({ visible }: { visible: boolean }) {
  const W = DEMO_ROOM.width;
  const L = DEMO_ROOM.length;
  const o = 260;
  const color = "#5e6344";
  return (
    <group visible={visible}>
      <Line points={[[0, 10, -o], [W, 10, -o]]} color={color} lineWidth={1.2} />
      <Line points={[[0, 10, -o - 80], [0, 10, -o + 80]]} color={color} lineWidth={1.2} />
      <Line points={[[W, 10, -o - 80], [W, 10, -o + 80]]} color={color} lineWidth={1.2} />
      <Line points={[[W + o, 10, 0], [W + o, 10, L]]} color={color} lineWidth={1.2} />
      <Line points={[[W + o - 80, 10, 0], [W + o + 80, 10, 0]]} color={color} lineWidth={1.2} />
      <Line points={[[W + o - 80, 10, L], [W + o + 80, 10, L]]} color={color} lineWidth={1.2} />
    </group>
  );
}

function Kitchen({ step, colour }: { step: number; colour: string | null }) {
  const spread = step === 1;
  const focus = step === 2;
  const counts: Record<string, number> = {};

  return (
    <group scale={S}>
      <RoomShell room={DEMO_ROOM} walls={["A", "B"]} />
      {DEMO_PLACEMENTS.map((p) => {
        const idx = (counts[p.wall + p.elevation] = (counts[p.wall + p.elevation] ?? -1) + 1);
        const shift: [number, number, number] = spread
          ? [(idx - 2) * 70, p.elevation > 0 ? 140 : 0, 120 + (p.elevation > 1500 ? 140 : 0)]
          : [0, 0, 0];
        const isFocus = p.id === FOCUS_ID;
        return (
          <PlacedCabinet
            key={p.id}
            room={DEMO_ROOM}
            placement={p}
            shift={focus && isFocus ? [0, 0, 260] : shift}
            open={focus && isFocus ? 1 : 0}
            explode={focus && isFocus ? 0.7 : 0}
            countertop={!(focus && isFocus)}
            colourOverride={BASE_IDS.has(p.id) ? colour : null}
          />
        );
      })}
      <Hood />
      <PlanOverlay visible={step === 3} />
    </group>
  );
}

const pill = "whitespace-nowrap rounded-full bg-charcoal px-3 py-1 text-[11px] font-semibold tracking-wide text-ivory";

/** Plan dimensions (step 3) and component callouts (step 2), positioned in metres. */
function sceneLabels(step: number, mobile: boolean): ScreenLabel[] {
  const W = DEMO_ROOM.width;
  const L = DEMO_ROOM.length;
  const o = 260;
  const plan = step === 3;
  const focus = step === 2;
  const m = (x: number, y: number, z: number): THREE.Vector3Tuple => [x * S, y * S, z * S];
  const callout = (label: string, detail: string) => (
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full bg-olive ring-4 ring-olive/20" />
      <span className="whitespace-nowrap rounded-md bg-ivory/95 px-2.5 py-1.5 text-[11px] leading-tight shadow-sm">
        <b className="block font-display text-[12px] text-charcoal">{label}</b>
        <span className="text-grey">{detail}</span>
      </span>
    </div>
  );
  return [
    { id: "wall-a", position: m(W / 2, 10, -o - 120), visible: plan, content: <span className={pill}>Wall A · {W} mm</span> },
    { id: "wall-b", position: m(W + o + 120, 10, L / 2), visible: plan, content: <span className={pill}>Wall B · {L} mm</span> },
    {
      id: "remaining",
      position: m(W / 2, 10, L * 0.72),
      visible: plan,
      content: (
        <span className="whitespace-nowrap rounded-full border border-olive/40 bg-ivory/90 px-3 py-1 text-[11px] font-medium text-olive">
          Wall A remaining: 0 mm · Wall B remaining: 500 mm
        </span>
      ),
    },
    { id: "carcass", position: m(900, 1010, 380), anchor: "left", visible: focus, content: callout("Carcass", "18mm BWP plywood") },
    { id: "shutter", position: m(1180, 640, 1330), anchor: "left", visible: focus && !mobile, content: callout("Shutter", "HDHMR + matte laminate") },
    { id: "runners", position: m(640, 330, 1050), anchor: "left", visible: focus && !mobile, content: callout("Runners", "Soft-close, full extension") },
  ];
}

export default function KitchenScene({
  progress,
  step,
  colour,
  mobile,
  active,
}: {
  progress: MotionValue<number>;
  step: number;
  colour: string | null;
  mobile: boolean;
  active: boolean;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const labels = sceneLabels(step, mobile);
  return (
    <>
    <Canvas
      shadows="percentage"
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "never"}
      camera={{ fov: mobile ? 50 : 30, position: KEYS[0][0], near: 0.05, far: 80 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      aria-label="Interactive 3D kitchen built from BOXES modules"
    >
      <color attach="background" args={["#f4f0e8"]} />
      <fog attach="fog" args={["#f4f0e8", 9, 22]} />
      <hemisphereLight args={["#fffaf0", "#b9a283", 0.55]} />
      <directionalLight
        position={[-2.5, 5.5, 4.5]}
        intensity={2.1}
        color="#fff4e2"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-4}
        shadow-camera-right={6}
        shadow-camera-top={5}
        shadow-camera-bottom={-3}
        shadow-camera-near={0.5}
        shadow-camera-far={16}
      />
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={1.6} position={[0, 4, 4]} scale={[8, 3, 1]} color="#fff6e8" />
        <Lightformer intensity={0.8} position={[-5, 2, 0]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer intensity={0.5} position={[5, 2, 2]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} color="#f1e6d4" />
      </Environment>
      <Kitchen step={step} colour={colour} />
      <CameraRig progress={progress} mobile={mobile} />
      <ViewOffset mobile={mobile} />
      <LabelProjector labels={labels} overlayRef={overlayRef} />
    </Canvas>
    <LabelOverlay labels={labels} overlayRef={overlayRef} />
    </>
  );
}
