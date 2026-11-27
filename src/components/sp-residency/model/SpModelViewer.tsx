"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import clsx from "clsx";
import type { SpModelData, SpModelUnit } from "./types";

// Asset base is "/" on the Next.js site; the static prototype build sets it to "" (relative paths).
const BASE = `${process.env.NEXT_PUBLIC_ASSET_BASE ?? "/"}models/sp-residency/`;
// The hosted prototype's sandbox blocks file downloads, so the button is hidden there.
const CAN_DOWNLOAD = process.env.NEXT_PUBLIC_PROTOTYPE !== "1";
// The prototype host cannot serve .glb, so its build ships the same models as embedded glTF JSON.
const MODEL_EXT = process.env.NEXT_PUBLIC_MODEL_EXT;
const modelUrl = (file: string) => BASE + (MODEL_EXT ? file.replace(/\.glb$/, MODEL_EXT) : file);
const LEVEL_GAP_M = 4.5; // extra spacing per level at full explode

const MATERIAL_COLORS: Record<string, string> = {
  wall_model_white: "#efe9df",
  slab_concrete: "#c9c2b6",
  parapet: "#e4ddd1",
  core_concrete: "#8a847b",
};

/** Restyle GLB materials for the site palette and enable shadows/anisotropy. */
function prepare(root: THREE.Object3D, maxAnisotropy: number) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (mat.name in MATERIAL_COLORS) mat.color = new THREE.Color(MATERIAL_COLORS[mat.name]);
    if (mat.name === "ghost_not_in_brochure") {
      mat.color = new THREE.Color("#c3a76a");
      mat.transparent = true;
      mat.opacity = 0.18;
      mat.depthWrite = false;
      mesh.castShadow = false;
    }
    if (mat.map) {
      mat.map.anisotropy = maxAnisotropy;
      mat.map.needsUpdate = true;
    }
  });
}

function levelIndex(name: string): number | null {
  const m = /^L0(\d)/.exec(name);
  return m ? Number(m[1]) : null;
}

type BuildingProps = {
  data: SpModelData;
  explode: number;
  cutaway: boolean;
  focus: number | null;
  hovered: string | null;
  selected: { unit: string; floor: number } | null;
  onHover: (key: string | null) => void;
  onSelect: (unit: string, floor: number) => void;
};

function Building({ data, explode, cutaway, focus, hovered, selected, onHover, onSelect }: BuildingProps) {
  const { scene } = useGLTF(modelUrl(data.buildingFile));
  const gl = useThree((s) => s.gl);
  const root = useMemo(() => {
    const r = scene.clone(true);
    r.children.forEach((c) => (c.userData.y0 = c.position.y));
    prepare(r, gl.capabilities.getMaxAnisotropy());
    return r;
  }, [scene, gl]);

  const wallScale = cutaway ? 0.42 : 1;

  useEffect(() => {
    root.children.forEach((node) => {
      const n = levelIndex(node.name);
      if (n === null) return;
      node.position.y = node.userData.y0 + explode * n * LEVEL_GAP_M;
      node.visible = focus === null || n <= focus;
      if (node.name.endsWith("_walls_from_plan")) node.scale.y = wallScale;
    });
  }, [root, explode, focus, wallScale]);

  const floors = [1, 2, 3, 4].filter((n) => focus === null || n <= focus);
  const level = (n: number) => data.levels.find((l) => l.id === `L0${n}`);

  return (
    <group>
      <primitive object={root} />

      {/* unit hit areas on every visible typical floor */}
      {floors.map((n) => {
        const y = (level(n)?.elevationM ?? 0) + explode * n * LEVEL_GAP_M;
        const h = data.wallHeightM * wallScale;
        return Object.entries(data.unitRegionsM).map(([key, rects]) =>
          rects.map(([x0, z0, x1, z1], i) => {
            const active = hovered === `${key}-${n}` || (selected?.unit === key && selected.floor === n);
            return (
              <mesh
                key={`${key}-${n}-${i}`}
                position={[(x0 + x1) / 2, y + h / 2 + 0.01, (z0 + z1) / 2]}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  onHover(`${key}-${n}`);
                }}
                onPointerOut={() => onHover(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(key, n);
                }}
              >
                <boxGeometry args={[x1 - x0, h + 0.02, z1 - z0]} />
                <meshBasicMaterial
                  color="#e2c98f"
                  transparent
                  opacity={active ? 0.28 : 0}
                  depthWrite={false}
                />
              </mesh>
            );
          })
        );
      })}

      {/* unit letter on hover / selection */}
      {floors.map((n) => {
        const y = (level(n)?.elevationM ?? 0) + explode * n * LEVEL_GAP_M + data.wallHeightM * wallScale + 0.6;
        return Object.entries(data.unitRegionsM).map(([key, rects]) => {
          const show = hovered === `${key}-${n}` || (selected?.unit === key && selected.floor === n);
          if (!show) return null;
          const [x0, z0, x1, z1] = rects[0];
          return (
            <Html key={`lbl-${key}-${n}`} position={[(x0 + x1) / 2, y, (z0 + z1) / 2]} center zIndexRange={[20, 0]}>
              <div className="pointer-events-none whitespace-nowrap rounded-full border border-gold/60 bg-black/80 px-3 py-1 text-[10px] uppercase tracking-editorial text-gold-bright">
                Unit {key} &middot; Floor {n}
              </div>
            </Html>
          );
        });
      })}

      {/* level labels along the west face */}
      {data.levels.map((l) => {
        const n = levelIndex(l.id) ?? 0;
        if (focus !== null && n > focus) return null;
        return (
          <Html
            key={l.id}
            position={[-data.footprintM[0] / 2 - 2.5, l.elevationM + explode * n * LEVEL_GAP_M + 1.2, 0]}
            center
            zIndexRange={[10, 0]}
          >
            <div className="pointer-events-none hidden whitespace-nowrap text-right text-[10px] uppercase tracking-editorial text-warm/60 md:block">
              {l.name}
              {l.id === "L05" && <span className="block text-[9px] normal-case tracking-normal text-gold/80">plan not in brochure</span>}
            </div>
          </Html>
        );
      })}
    </group>
  );
}

function UnitModel({ unit, cutaway }: { unit: SpModelUnit; cutaway: boolean }) {
  const { scene } = useGLTF(modelUrl(unit.file));
  const gl = useThree((s) => s.gl);
  const root = useMemo(() => {
    const r = scene.clone(true);
    prepare(r, gl.capabilities.getMaxAnisotropy());
    return r;
  }, [scene, gl]);
  useEffect(() => {
    root.children.forEach((n) => {
      if (n.name.endsWith("_walls_from_plan")) n.scale.y = cutaway ? 0.42 : 1;
    });
  }, [root, cutaway]);
  return <primitive object={root} />;
}

function CameraRig({ view, data, unit }: { view: string; data: SpModelData; unit?: SpModelUnit }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const aspect = useThree((s) => s.size.width / s.size.height);
  // portrait screens need the camera further back to fit the same width
  const k = Math.round((aspect < 1 ? Math.min(2.4, 1.2 / aspect) : 1) * 10) / 10;
  useEffect(() => {
    if (view === "building") {
      const [w, d] = data.footprintM;
      const h = data.heightToTerraceM + 0.25 * 6 * LEVEL_GAP_M; // height at the default explode
      const ty = h * 0.42;
      camera.position.set(w * 2.3 * k, ty + (h * 1.45 - ty) * k, d * 2.05 * k);
      controls?.target.set(0, ty, 0);
    } else if (unit) {
      const [w, d] = unit.sizeM;
      camera.position.set(w * 0.75 * k, Math.max(w, d) * 1.25 * k, d * 1.15 * k);
      controls?.target.set(0, 0, 0);
    }
    controls?.update();
  }, [view, data, unit, camera, controls, k]);
  return null;
}

function LoadingOverlay() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <p className="text-[10px] uppercase tracking-editorial text-warm/60">Loading model… {Math.round(progress)}%</p>
    </div>
  );
}

export default function SpModelViewer({ data }: { data: SpModelData }) {
  const [view, setView] = useState<string>("building"); // "building" | unit key
  const [explode, setExplode] = useState(0.25);
  const [cutaway, setCutaway] = useState(true);
  const [focus, setFocus] = useState<number | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ unit: string; floor: number } | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const unit = data.units.find((u) => u.key === view);
  const selectedUnit = data.units.find((u) => u.key === (unit?.key ?? selected?.unit));

  // warm the cache so switching to a unit does not suspend the scene
  useEffect(() => {
    data.units.forEach((u) => useGLTF.preload(modelUrl(u.file)));
  }, [data.units]);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered]);

  return (
    <div className="fixed inset-0 bg-[#0b0b0c]" data-lenis-prevent>
      <Canvas
        shadows="percentage"
        dpr={[1, 2]}
        camera={{ fov: 35, near: 0.1, far: 600, position: [60, 45, 70] }}
        onPointerMissed={() => setSelected(null)}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.15;
        }}
      >
        <color attach="background" args={["#0b0b0c"]} />
        <fog attach="fog" args={["#0b0b0c", 150, 360]} />
        <ambientLight intensity={0.35} />
        <hemisphereLight args={["#fff6ea", "#2a2622", 1.35]} />
        <directionalLight
          position={[28, 46, 22]}
          intensity={1.8}
          color="#fff1dc"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-40}
          shadow-camera-right={40}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
          shadow-bias={-0.0004}
        />
        <directionalLight position={[-30, 24, -25]} intensity={0.8} color="#dfe6ff" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.16, 0]} receiveShadow>
          <planeGeometry args={[400, 400]} />
          <meshStandardMaterial color="#141312" roughness={1} />
        </mesh>

        {/* keyed: switching views unmounts the old scene instead of hiding it (drei Html cleanup) */}
        <Suspense key={view} fallback={null}>
          {view === "building" ? (
            <Building
              data={data}
              explode={explode}
              cutaway={cutaway}
              focus={focus}
              hovered={hovered}
              selected={selected}
              onHover={setHovered}
              onSelect={(u, f) => setSelected({ unit: u, floor: f })}
            />
          ) : (
            unit && <UnitModel unit={unit} cutaway={cutaway} />
          )}
        </Suspense>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={4}
          maxDistance={180}
        />
        <CameraRig view={view} data={data} unit={unit} />
      </Canvas>

      <LoadingOverlay />

      {/* ---------------------------------------------------------------- top-left title */}
      <div className="pointer-events-none absolute left-6 top-24 max-w-xs md:left-12 md:top-28">
        <p className="text-[10px] uppercase tracking-editorial text-gold-bright">Conceptual 3D model</p>
        <h1 className="font-display mt-2 text-2xl italic leading-tight text-warm md:text-4xl">
          {unit ? `Unit ${unit.key} · ${unit.configuration}` : "Shan Poornam Residence"}
        </h1>
        <p className="mt-2 hidden text-xs text-warm/50 md:block">
          {unit
            ? "Walls extruded from the brochure plan; the floor is the plan itself."
            : "Stilt · floors 1–4 from the typical plan · 5th floor ghosted · terrace"}
        </p>
      </div>

      {/* ---------------------------------------------------------------- view switcher */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 bg-gradient-to-t from-black via-black/80 to-transparent px-6 pb-6 pt-12 md:px-12 md:pb-8">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {[{ key: "building", label: "Building" }, ...data.units.map((u) => ({ key: u.key, label: `Unit ${u.key}` }))].map(
            (t) => (
              <button
                key={t.key}
                onClick={() => {
                  setView(t.key);
                  setSelected(null);
                  setHovered(null);
                }}
                className={clsx(
                  "shrink-0 rounded-full border px-4 py-2 text-[10px] uppercase tracking-editorial transition-colors",
                  view === t.key
                    ? "border-gold bg-gold-bright/10 text-gold-bright"
                    : "border-warm/15 text-warm/60 hover:border-gold/50 hover:text-warm"
                )}
              >
                {t.label}
              </button>
            )
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[10px] uppercase tracking-editorial text-warm/60">
          {view === "building" && (
            <>
              <label className="flex items-center gap-3">
                Explode
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={explode}
                  onChange={(e) => setExplode(Number(e.target.value))}
                  className="w-28 accent-[#c3a76a]"
                  aria-label="Explode floors"
                />
              </label>
              <div className="flex items-center gap-1">
                <span className="mr-2">Floors</span>
                {[null, 1, 2, 3, 4].map((f) => (
                  <button
                    key={String(f)}
                    onClick={() => setFocus(f)}
                    className={clsx(
                      "min-w-8 rounded-full border px-2.5 py-1",
                      focus === f ? "border-gold text-gold-bright" : "border-warm/15 hover:text-warm"
                    )}
                  >
                    {f === null ? "All" : f}
                  </button>
                ))}
              </div>
            </>
          )}
          <button
            onClick={() => setCutaway((c) => !c)}
            className="rounded-full border border-warm/15 px-3 py-1 hover:text-warm"
          >
            Walls: {cutaway ? "Cut-away" : "Full height"}
          </button>
          {CAN_DOWNLOAD && (
            <a
              href={BASE + (unit ? unit.file : data.buildingFile)}
              download
              className="rounded-full border border-warm/15 px-3 py-1 hover:text-warm"
            >
              Download .glb
            </a>
          )}
          <button onClick={() => setShowInfo((s) => !s)} className="rounded-full border border-warm/15 px-3 py-1 hover:text-warm">
            About this model
          </button>
          <span className="hidden text-warm/35 lg:inline">Drag to orbit · scroll to zoom · right-drag to pan</span>
        </div>
      </div>

      {/* ---------------------------------------------------------------- unit card */}
      {selectedUnit && (
        <aside className="absolute right-4 top-24 w-[min(22rem,calc(100vw-2rem))] border border-warm/10 bg-black/85 p-6 backdrop-blur md:right-12 md:top-28">
          <p className="text-[10px] uppercase tracking-editorial text-gold-bright">
            {selected ? `Floor ${selected.floor} · ` : ""}
            {selectedUnit.facing}
          </p>
          <h2 className="font-display mt-2 text-3xl italic text-warm">
            Unit {selectedUnit.key} <span className="text-warm/50">&middot; {selectedUnit.configuration}</span>
          </h2>
          <dl className="mt-4 grid grid-cols-3 gap-3 border-y border-warm/10 py-4">
            {[
              ["Carpet", selectedUnit.carpetSqft],
              ["Balcony", selectedUnit.balconySqft],
              ["SBU", selectedUnit.sbuSqft],
            ].map(([k, v]) => (
              <div key={String(k)}>
                <dt className="text-[9px] uppercase tracking-editorial text-warm/45">{k}</dt>
                <dd className="font-display text-lg italic text-warm">
                  {v}
                  <span className="ml-1 font-sans text-[9px] not-italic text-warm/40">sq.ft</span>
                </dd>
              </div>
            ))}
          </dl>
          <ul className="no-scrollbar mt-4 max-h-44 space-y-1.5 overflow-y-auto text-xs">
            {selectedUnit.rooms.map((r, i) => (
              <li key={`${r.name}-${i}`} className="flex justify-between gap-3 text-warm/70">
                <span>{r.name}</span>
                <span className="shrink-0 tabular-nums text-warm/40">{r.dims}</span>
              </li>
            ))}
          </ul>
          {view === "building" && (
            <button
              onClick={() => {
                setView(selectedUnit.key);
                setSelected(null);
              }}
              className="mt-5 w-full rounded-full border border-gold bg-gold-bright/10 py-2.5 text-[10px] uppercase tracking-editorial text-gold-bright hover:bg-gold-bright/20"
            >
              Enter unit {selectedUnit.key} in 3D
            </button>
          )}
        </aside>
      )}

      {/* ---------------------------------------------------------------- about panel */}
      {showInfo && (
        <div className="absolute inset-x-4 bottom-36 max-h-[60vh] overflow-y-auto border border-warm/10 bg-black/90 p-6 text-xs leading-relaxed text-warm/70 backdrop-blur md:left-12 md:right-auto md:w-[30rem]">
          <p className="text-[10px] uppercase tracking-editorial text-gold-bright">How this model was made</p>
          <p className="mt-3">
            Walls are the walls drawn in the brochure floor plans, extracted and extruded; each floor carries the
            brochure plan as its surface. Scale comes from the printed carpet areas and hall sizes. Footprint about{" "}
            {data.footprintFt[0]} × {data.footprintFt[1]} ft; 10′ floor-to-floor (printed).
          </p>
          <p className="mt-4 text-[10px] uppercase tracking-editorial text-warm/50">Assumed (not in brochure)</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            {data.assumed.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <p className="mt-4 text-[10px] uppercase tracking-editorial text-warm/50">Limitations</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            {data.limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <p className="mt-4 text-warm/40">Conceptual model for presentation — not to scale, not for construction.</p>
        </div>
      )}
    </div>
  );
}

useGLTF.preload(modelUrl("SPR_building_conceptual.glb"));
