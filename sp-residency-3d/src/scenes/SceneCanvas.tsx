import { Environment, Lightformer, PerformanceMonitor, useTexture } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, N8AO, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';
import Building from '../building/Building';
import { geometry } from '../data/project';
import { getState, setState, useStore } from '../utils/store';
import CameraDirector from './CameraDirector';
import City from './City';
import Clouds from './Clouds';
import Sky, { HORIZON, SUN_DIR } from './Sky';

useTexture.preload(`./${geometry.image.src}`);

function Lights({ shadows }: { shadows: boolean }) {
  const sun = useRef<THREE.DirectionalLight>(null);
  return (
    <>
      <hemisphereLight args={['#dbe5ee', '#a8987d', 0.62]} />
      <directionalLight
        ref={sun}
        position={[SUN_DIR.x * 140, SUN_DIR.y * 140, SUN_DIR.z * 140]}
        intensity={3.1}
        color="#ffe2bd"
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-48}
        shadow-camera-right={48}
        shadow-camera-top={48}
        shadow-camera-bottom={-48}
        shadow-camera-near={10}
        shadow-camera-far={320}
      />
      <directionalLight position={[70, 50, 90]} intensity={0.45} color="#c3d5ea" />
    </>
  );
}

const CLOUD_WHITE = new THREE.Color('#eef0f0');
/** While the camera is inside the cloud deck during the intro, the fog closes in (white-out). */
function FogController() {
  const { scene, camera } = useThree();
  useFrame(() => {
    const fog = scene.fog as THREE.Fog | null;
    if (!fog) return;
    let imm = 0;
    if (!getState().introDone) {
      const y = camera.position.y;
      imm = THREE.MathUtils.smoothstep(y, 122, 165) * (1 - THREE.MathUtils.smoothstep(y, 238, 272));
    }
    fog.near = THREE.MathUtils.lerp(200, 1, imm);
    fog.far = THREE.MathUtils.lerp(1750, 115, imm);
    fog.color.copy(HORIZON).lerp(CLOUD_WHITE, imm);
  });
  return null;
}

function ReadyNotifier() {
  const frames = useRef(0);
  useFrame(() => {
    frames.current++;
    if (frames.current === 3) setState({ sceneReady: true });
  });
  return null;
}

/** The single fixed WebGL stage shared by the intro, the hero and the floor explorer. */
export default function SceneCanvas() {
  const quality = useStore((s) => s.quality);
  const section = useStore((s) => s.section);
  const introDone = useStore((s) => s.introDone);
  const visible = !introDone || section !== 'other';
  const high = quality === 'high';
  const locked = useStore((s) => s.qualityLocked);
  return (
    <div className={`stage${visible ? '' : ' hidden'}`} data-testid="stage">
      <Canvas
        key={quality}
        frameloop={visible ? 'always' : 'never'}
        dpr={high ? [1, 1.75] : [0.75, 1]}
        shadows={high}
        camera={{ fov: 32, near: 0.5, far: 6500, position: [-70, 232, 900] }}
        gl={{ antialias: !high, powerPreference: 'high-performance', preserveDrawingBuffer: false }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
        aria-label="Interactive 3D model of Shan Poornam Residence"
      >
        {high && !locked && (
          <PerformanceMonitor
            ms={400}
            iterations={6}
            threshold={0.75}
            bounds={() => [24, 60]}
            onDecline={() => {
              // keep the experience smooth on modest hardware: drop to performance mode automatically
              if (getState().quality === 'high') setState({ quality: 'low', autoLowered: true });
            }}
          />
        )}
        <fog attach="fog" args={[HORIZON, 200, 1750]} />
        <FogController />
        <Sky />
        <Lights shadows={high} />
        <Environment resolution={high ? 128 : 64} frames={1}>
          <Lightformer form="rect" intensity={2.2} color="#fff4e4" position={[-40, 30, 40]} scale={[60, 30, 1]} target={[0, 0, 0]} />
          <Lightformer form="rect" intensity={1.2} color="#cfe0ef" position={[40, 50, -30]} scale={[80, 30, 1]} target={[0, 0, 0]} />
          <Lightformer form="ring" intensity={0.8} color="#ffffff" position={[0, 80, 0]} scale={40} target={[0, 0, 0]} />
        </Environment>
        <Suspense fallback={null}>
          <Building shadows={high} />
        </Suspense>
        <City density={high ? 'high' : 'low'} />
        <Clouds count={high ? 320 : 150} />
        <CameraDirector />
        <ReadyNotifier />
        {high && (
          <EffectComposer multisampling={4} enableNormalPass={false}>
            <N8AO aoRadius={3} distanceFalloff={1.2} intensity={2.4} halfRes quality="performance" color="#2a2420" />
            <Vignette offset={0.32} darkness={0.42} />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
