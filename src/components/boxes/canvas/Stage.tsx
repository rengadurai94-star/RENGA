"use client";

import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor, Bvh } from "@react-three/drei";
import * as THREE from "three";
import { useBoxes } from "@/lib/boxes/store";
import { BUILDING_CENTER, sunDirection } from "@/lib/boxes/layout";
import { BASE_BEARING } from "@/lib/boxes/camera";
import { getTowerGeometry } from "@/lib/boxes/towerGeometry";
import { getMaterials } from "@/lib/boxes/materials";
import { SkyDome, Clouds } from "./Atmosphere";
import { CameraRig, OrbitInput } from "./CameraRig";
import { Tower } from "./Tower";
import { Site } from "./Site";
import { InteriorWorld } from "./InteriorWorld";

function SunLight() {
  const ref = useRef<THREE.DirectionalLight>(null);
  const lowPower = useBoxes((s) => s.lowPower);
  const [sx, sy, sz] = sunDirection();
  const c = useMemo(() => new THREE.Vector3(BUILDING_CENTER[0], 16, BUILDING_CENTER[1]), []);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.target.position.copy(c);
    ref.current.target.updateMatrixWorld();
  }, [c]);
  const map = lowPower ? 1024 : 2048;
  return (
    <directionalLight
      ref={ref}
      key={map}
      position={[c.x + sx * 180, c.y + sy * 180, c.z + sz * 180]}
      intensity={3.6}
      color="#fff3e2"
      castShadow
      shadow-mapSize={[map, map]}
      shadow-bias={-0.0005}
      shadow-normalBias={0.05}
      shadow-camera-left={-52}
      shadow-camera-right={52}
      shadow-camera-top={52}
      shadow-camera-bottom={-52}
      shadow-camera-near={60}
      shadow-camera-far={340}
    />
  );
}

function ExteriorWorld() {
  return (
    <>
      <SkyDome />
      <fog attach="fog" args={["#efebe4", 260, 1500]} />
      <hemisphereLight args={["#f3f1ec", "#b9a98f", 0.42]} />
      <SunLight />
      <Clouds bearing={BASE_BEARING} />
      <Bvh firstHitOnly>
        <Tower />
      </Bvh>
      <Site />
      <CameraRig />
      <OrbitInput />
    </>
  );
}

/** Reports readiness once the first frames have rendered. */
function ReadySignal() {
  const frames = useRef(0);
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    useBoxes.setState((s) => ({ progress: Math.max(s.progress, 0.7) }));
    try {
      gl.compile(scene, camera);
    } catch {
      /* compile is best-effort */
    }
  }, [gl, scene, camera]);
  useFrame(() => {
    frames.current += 1;
    if (frames.current === 4) useBoxes.setState({ progress: 1, ready: true });
  });
  return null;
}

class StageErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    useBoxes.setState({ webgl: "error", errorMessage: error.message, ready: true, progress: 1 });
  }
  render() {
    if (this.state.error) return null;
    return this.props.children;
  }
}

export default function Stage() {
  const mode = useBoxes((s) => s.mode);
  const inJourney = useBoxes((s) => s.inJourney);
  const [dpr, setDpr] = useState<number>(() => Math.min(window.devicePixelRatio || 1, 1.75));

  useEffect(() => {
    // Build heavy procedural geometry up-front so the first frame is quick.
    useBoxes.setState((s) => ({ progress: Math.max(s.progress, 0.25) }));
    const id = window.setTimeout(() => {
      getMaterials();
      getTowerGeometry();
      useBoxes.setState((s) => ({ progress: Math.max(s.progress, 0.55) }));
    }, 30);
    return () => window.clearTimeout(id);
  }, []);

  const paused = !inJourney && mode !== "interior" && mode !== "unit";

  return (
    <StageErrorBoundary>
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        dpr={dpr}
        frameloop={paused ? "never" : "always"}
        gl={{ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: false }}
        camera={{ fov: 30, near: 0.5, far: 4000, position: [-300, 140, 500] }}
        onCreated={({ gl, scene }) => {
          if (process.env.NODE_ENV !== "production") (window as unknown as { __boxes: unknown }).__boxes = { gl, scene };
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.02;
          useBoxes.setState((s) => ({ webgl: "ok", progress: Math.max(s.progress, 0.45) }));
        }}
        style={{ touchAction: mode === "interior" || mode === "unit" ? "none" : "pan-y" }}
        aria-label="Interactive 3D model of the BOXES apartment tower"
      >
        <PerformanceMonitor
          onDecline={() => {
            setDpr(1);
            useBoxes.setState({ lowPower: true });
          }}
          flipflops={3}
        />
        <Suspense fallback={null}>
          <Environment resolution={256} frames={1} environmentIntensity={0.7}>
            <Lightformer form="rect" intensity={2.2} color="#fff4e6" position={[0, 30, -60]} scale={[140, 40, 1]} />
            <Lightformer form="rect" intensity={1.1} color="#e4ecf2" position={[0, 90, 0]} rotation-x={Math.PI / 2} scale={[200, 200, 1]} />
            <Lightformer form="rect" intensity={0.9} color="#f2ebe0" position={[-80, 20, 40]} rotation-y={Math.PI / 2} scale={[120, 30, 1]} />
            <Lightformer form="rect" intensity={0.6} color="#d9cfc2" position={[80, 10, 40]} rotation-y={-Math.PI / 2} scale={[120, 20, 1]} />
            <mesh scale={600}>
              <sphereGeometry args={[1, 32, 16]} />
              <meshBasicMaterial color="#d8d3cb" side={THREE.BackSide} />
            </mesh>
          </Environment>
          {mode === "interior" ? <InteriorWorld /> : <ExteriorWorld />}
          <ReadySignal />
        </Suspense>
      </Canvas>
    </StageErrorBoundary>
  );
}
