"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Grid,
  Html,
  Lightformer,
  Line,
  OrbitControls,
} from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import {
  Box,
  DoorOpen,
  Layers,
  RotateCcw,
  Ruler,
  SquareStack,
} from "lucide-react";
import { CabinetModel } from "@/components/three/CabinetModel";
import { PRODUCT_MAP } from "@/lib/catalog/products";
import { FRONT_T, COUNTER_T } from "@/lib/geometry/cabinet";
import { configCode } from "@/lib/pricing/engine";
import { formatLength, type LengthUnit } from "@/lib/units";
import { cn } from "@/lib/utils";
import { useConfigurator, type ViewPreset } from "@/store/configurator";

const S = 0.001;

const VIEW_DIRS: Record<ViewPreset, THREE.Vector3Tuple> = {
  "3d": [0.78, 0.48, 1.25],
  front: [0, 0.04, 1],
  side: [1, 0.04, 0.02],
  top: [0, 1, 0.012],
};

/** Smoothly frames the cabinet whenever the product or view preset changes. */
function CameraFramer() {
  const frameKey = useConfigurator((s) => s.frameKey);
  const view = useConfigurator((s) => s.view);
  const controls = useThree(
    (s) => s.controls,
  ) as unknown as OrbitControlsImpl | null;
  const anim = useRef<{
    pos: THREE.Vector3;
    target: THREE.Vector3;
    active: boolean;
  }>({
    pos: new THREE.Vector3(),
    target: new THREE.Vector3(),
    active: false,
  });
  useEffect(() => {
    const c = useConfigurator.getState().config;
    const r = 0.5 * Math.hypot(c.width, c.height, c.depth + 200) * S;
    anim.current.target.set(0, (c.height * S) / 2, 0);
    anim.current.active = true;
    anim.current.pos.fromArray(VIEW_DIRS[view]).normalize();
    // fit distance is resolved per-frame with the live aspect ratio
    anim.current.pos.multiplyScalar(r);
  }, [frameKey, view]);

  useEffect(() => {
    if (!controls) return;
    const cancel = () => (anim.current.active = false);
    controls.addEventListener("start", cancel);
    return () => controls.removeEventListener("start", cancel);
  }, [controls]);

  useFrame((state, dt) => {
    const a = anim.current;
    if (!a.active || !controls) return;
    const cam = state.camera as THREE.PerspectiveCamera;
    const r = a.pos.length();
    const fov = THREE.MathUtils.degToRad(cam.fov);
    const fitV = r / Math.sin(fov / 2);
    const fitH = r / Math.sin(Math.atan(Math.tan(fov / 2) * cam.aspect));
    const dist = Math.max(fitV, fitH) * 1.18;
    const goal = a.pos.clone().normalize().multiplyScalar(dist).add(a.target);
    const k = 1 - Math.exp(-6 * dt);
    cam.position.lerp(goal, k);
    controls.target.lerp(a.target, k);
    controls.update();
    if (
      cam.position.distanceTo(goal) < 0.002 &&
      controls.target.distanceTo(a.target) < 0.002
    )
      a.active = false;
  });
  return null;
}

/**
 * drei <Html> creates its own React root; unmounting it mid-render throws under
 * React 19, so labels stay mounted and are hidden instead.
 */
function DimLabel({
  position,
  visible,
  children,
}: {
  position: THREE.Vector3Tuple;
  visible: boolean;
  children: React.ReactNode;
}) {
  return (
    <Html
      position={position}
      center
      zIndexRange={[20, 0]}
      style={{ display: visible ? undefined : "none" }}
    >
      <span className="pointer-events-none whitespace-nowrap rounded-full bg-charcoal px-2.5 py-1 text-[11px] font-semibold tabular-nums tracking-wide text-ivory shadow-sm">
        {children}
      </span>
    </Html>
  );
}

function Dimensions({
  w,
  h,
  d,
  unit,
  onCounter,
  visible,
}: {
  w: number;
  h: number;
  d: number;
  unit: LengthUnit;
  onCounter: boolean;
  visible: boolean;
}) {
  const col = "#5e6344";
  const o = 90;
  const zf = d + FRONT_T;
  const tick = 40;
  const topY = h + (onCounter ? COUNTER_T : 0);
  return (
    <group visible={visible}>
      {/* width — along the front at floor level */}
      <Line
        points={[
          [0, 2, zf + o],
          [w, 2, zf + o],
        ]}
        color={col}
        lineWidth={1.4}
      />
      <Line
        points={[
          [0, 2, zf + o - tick],
          [0, 2, zf + o + tick],
        ]}
        color={col}
        lineWidth={1.4}
      />
      <Line
        points={[
          [w, 2, zf + o - tick],
          [w, 2, zf + o + tick],
        ]}
        color={col}
        lineWidth={1.4}
      />
      <DimLabel visible={visible} position={[w / 2, 2, zf + o + 70]}>
        W {formatLength(w, unit)}
      </DimLabel>
      {/* height — up the front-left edge */}
      <Line
        points={[
          [-o, 0, zf],
          [-o, topY, zf],
        ]}
        color={col}
        lineWidth={1.4}
      />
      <Line
        points={[
          [-o - tick, 0, zf],
          [-o + tick, 0, zf],
        ]}
        color={col}
        lineWidth={1.4}
      />
      <Line
        points={[
          [-o - tick, topY, zf],
          [-o + tick, topY, zf],
        ]}
        color={col}
        lineWidth={1.4}
      />
      <DimLabel visible={visible} position={[-o - 20, topY / 2, zf]}>
        H {formatLength(h, unit)}
      </DimLabel>
      {/* depth — along the right side at floor level */}
      <Line
        points={[
          [w + o, 2, 0],
          [w + o, 2, d],
        ]}
        color={col}
        lineWidth={1.4}
      />
      <Line
        points={[
          [w + o - tick, 2, 0],
          [w + o + tick, 2, 0],
        ]}
        color={col}
        lineWidth={1.4}
      />
      <Line
        points={[
          [w + o - tick, 2, d],
          [w + o + tick, 2, d],
        ]}
        color={col}
        lineWidth={1.4}
      />
      <DimLabel visible={visible} position={[w + o + 60, 2, d / 2]}>
        D {formatLength(d, unit)}
      </DimLabel>
    </group>
  );
}

function Stage() {
  const { config, open, explode, countertop, showDims, unit } =
    useConfigurator();
  const product = PRODUCT_MAP[config.sku];
  const canCounter = product.mount === "floor" && config.height <= 1000;
  return (
    <group scale={S}>
      <group position={[-config.width / 2, 0, -config.depth / 2]}>
        <CabinetModel
          config={config}
          open={open ? 1 : 0}
          explode={explode ? 1 : 0}
          countertop={countertop && canCounter}
        />
        <Dimensions
          visible={showDims && !explode}
          w={config.width}
          h={config.height}
          d={config.depth}
          unit={unit}
          onCounter={countertop && canCounter}
        />
      </group>
    </group>
  );
}

function ToolButton({
  active,
  disabled,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      title={label}
      className={cn(
        "flex h-9 items-center gap-2 rounded-full px-3 text-[12px] font-medium transition-colors disabled:opacity-35",
        active
          ? "bg-charcoal text-ivory"
          : "text-charcoal/75 hover:bg-charcoal/5 hover:text-charcoal",
      )}
    >
      {children}
      <span className="hidden @3xl:inline">{label}</span>
    </button>
  );
}

export default function Viewport() {
  const { config, open, explode, countertop, showDims, view, toggle, setView } =
    useConfigurator();
  const product = PRODUCT_MAP[config.sku];
  const canCounter = product.mount === "floor" && config.height <= 1000;

  return (
    <div className="@container relative h-full w-full overflow-hidden bg-[#efeae0]">
      <Canvas
        shadows="percentage"
        dpr={[1, 2]}
        camera={{ fov: 32, position: [1.6, 1.3, 2.6], near: 0.02, far: 60 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        aria-label={`3D model of ${product.name}`}
      >
        <color attach="background" args={["#efeae0"]} />
        <hemisphereLight args={["#fffaf0", "#b9a283", 0.6]} />
        <directionalLight
          position={[2.5, 4.5, 3.5]}
          intensity={2.2}
          color="#fff4e2"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0003}
          shadow-normalBias={0.015}
          shadow-camera-left={-3}
          shadow-camera-right={3}
          shadow-camera-top={3}
          shadow-camera-bottom={-3}
        />
        <Environment resolution={128} frames={1}>
          <Lightformer
            intensity={1.8}
            position={[0, 4, 4]}
            scale={[8, 3, 1]}
            color="#fff6e8"
          />
          <Lightformer
            intensity={0.8}
            position={[-5, 2, 0]}
            rotation-y={Math.PI / 2}
            scale={[6, 3, 1]}
          />
          <Lightformer
            intensity={0.6}
            position={[5, 2, 2]}
            rotation-y={-Math.PI / 2}
            scale={[6, 3, 1]}
            color="#f1e6d4"
          />
        </Environment>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <shadowMaterial opacity={0.16} />
        </mesh>
        <Grid
          position={[0, -0.001, 0]}
          infiniteGrid
          cellSize={0.1}
          sectionSize={0.5}
          cellThickness={0.6}
          sectionThickness={1}
          cellColor="#d8d1c3"
          sectionColor="#c9c0ae"
          fadeDistance={14}
          fadeStrength={2}
        />
        <Stage />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={0.5}
          maxDistance={12}
          maxPolarAngle={Math.PI / 2 - 0.01}
        />
        <CameraFramer />
      </Canvas>

      {/* Toolbars — wrap onto two rows in narrow viewports */}
      <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2 md:inset-x-4 md:top-4">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-charcoal/10 bg-paper/90 p-1 shadow-sm backdrop-blur">
          <ToolButton
            active={open}
            onClick={() => toggle("open")}
            label={open ? "Close fronts" : "Open fronts"}
          >
            <DoorOpen className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            active={explode}
            onClick={() => toggle("explode")}
            label="Explode"
          >
            <Layers className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            active={countertop && canCounter}
            disabled={!canCounter}
            onClick={() => toggle("countertop")}
            label="Countertop"
          >
            <SquareStack className="h-4 w-4" />
          </ToolButton>
          <ToolButton
            active={showDims}
            onClick={() => toggle("showDims")}
            label="Dimensions"
          >
            <Ruler className="h-4 w-4" />
          </ToolButton>
        </div>

        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-charcoal/10 bg-paper/90 p-1 shadow-sm backdrop-blur">
          {(["3d", "front", "side", "top"] as ViewPreset[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={cn(
                "h-9 rounded-full px-2.5 text-[12px] font-medium capitalize transition-colors @md:px-3",
                view === v
                  ? "bg-charcoal text-ivory"
                  : "text-charcoal/75 hover:bg-charcoal/5",
              )}
            >
              {v === "3d" ? (
                <span className="flex items-center gap-1.5">
                  <Box className="h-3.5 w-3.5" /> 3D
                </span>
              ) : (
                v
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setView(view)}
            title="Reset view"
            aria-label="Reset view"
            className="flex h-9 w-9 items-center justify-center rounded-full text-charcoal/70 hover:bg-charcoal/5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-wrap items-end justify-between gap-2 md:bottom-4 md:left-4 md:right-4">
        <span className="rounded-md bg-charcoal/90 px-2.5 py-1.5 font-mono text-[11px] tracking-wide text-ivory">
          {configCode(config)}
        </span>
        <span className="hidden text-[11px] text-charcoal/50 @2xl:block">
          Drag to orbit · Scroll to zoom · Right-drag to pan
        </span>
      </div>
    </div>
  );
}
