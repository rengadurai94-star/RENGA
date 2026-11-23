"use client";

import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { floorPlans } from "@/config/floorplans";
import { floorsList, getUnit, project, unitNumber, type UnitId } from "@/config/project";
import { getTowerGeometry } from "@/lib/boxes/towerGeometry";
import { cloneForFloor, getMaterials, makeTextTexture, type MatKey, type MaterialSet } from "@/lib/boxes/materials";
import type { Buckets } from "@/lib/boxes/builder";
import { CORE, FLOORS, GROUND_H, ROOF_Y, UNIT_IDS, floorY, unitPlacement } from "@/lib/boxes/layout";
import { planBounds } from "@/lib/boxes/plan";
import { journey, useBoxes } from "@/lib/boxes/store";
import { goToFloor, selectUnit } from "@/lib/boxes/director";
import { ModelSlot } from "./ModelSlot";

const GAP = 9; // vertical opening above the focused floor (m)
const SLIDE = 3.2; // how far the focused floor slides towards the viewer (m)
const WHITE = new THREE.Color("#f6f3ee");

const smooth = (t: number) => t * t * (3 - 2 * t);

function BucketMeshes({
  buckets,
  mats,
  cast = true,
  receive = true,
}: {
  buckets: Buckets;
  mats: Partial<MaterialSet>;
  cast?: boolean;
  receive?: boolean;
}) {
  const base = getMaterials();
  return (
    <>
      {[...buckets.entries()].map(([key, geo]) => (
        <mesh
          key={key}
          geometry={geo}
          material={mats[key as MatKey] ?? base[key as MatKey]}
          castShadow={cast && key !== "railGlass" && key !== "glassInterior" && key !== "glow"}
          receiveShadow={receive}
        />
      ))}
    </>
  );
}

/** Invisible hit-volume material shared by all pickers. */
const hitMat = new THREE.MeshBasicMaterial({ visible: false });

interface FloorRefs {
  group: THREE.Group | null;
  slab: THREE.Group | null;
  shell: THREE.Group | null;
  cut: THREE.Group | null;
  units: Partial<Record<UnitId, THREE.Group | null>>;
}

const Floor = memo(function Floor({
  floor,
  refs,
  mats,
}: {
  floor: number;
  refs: FloorRefs;
  mats: Partial<MaterialSet>;
}) {
  const geo = getTowerGeometry();

  const onUnitOver = (unit: UnitId) => (e: ThreeEvent<PointerEvent>) => {
    const s = useBoxes.getState();
    const focused = s.mode === "unit" ? s.selected?.floor === floor : s.activeFloor === floor && Math.abs(journey.floor - floor) < 0.35;
    if (!focused || s.transitioning) return;
    e.stopPropagation();
    if (s.hoveredUnit !== unit) useBoxes.setState({ hoveredUnit: unit });
    document.body.style.cursor = "pointer";
  };
  const onUnitOut = (unit: UnitId) => () => {
    if (useBoxes.getState().hoveredUnit === unit) useBoxes.setState({ hoveredUnit: null });
    document.body.style.cursor = "";
  };
  const onUnitClick = (unit: UnitId) => (e: ThreeEvent<MouseEvent>) => {
    const s = useBoxes.getState();
    const focused = s.mode === "unit" ? s.selected?.floor === floor : s.activeFloor === floor && Math.abs(journey.floor - floor) < 0.35;
    if (!focused || s.transitioning || e.delta > 6) return;
    e.stopPropagation();
    selectUnit(floor, unit);
  };
  const onFloorOver = (e: ThreeEvent<PointerEvent>) => {
    const s = useBoxes.getState();
    if (s.mode !== "explore" || journey.floor > 0.4) return;
    e.stopPropagation();
    if (s.hoveredFloor !== floor) useBoxes.setState({ hoveredFloor: floor });
    document.body.style.cursor = "pointer";
  };
  const onFloorOut = () => {
    if (useBoxes.getState().hoveredFloor === floor) useBoxes.setState({ hoveredFloor: null });
    document.body.style.cursor = "";
  };
  const onFloorClick = (e: ThreeEvent<MouseEvent>) => {
    const s = useBoxes.getState();
    if (s.mode !== "explore" || journey.floor > 0.4 || e.delta > 6) return;
    e.stopPropagation();
    useBoxes.setState({ hoveredFloor: null });
    document.body.style.cursor = "";
    goToFloor(floor);
  };

  return (
    <group ref={(g) => void (refs.group = g)} position={[0, floorY(floor), 0]}>
      <group ref={(g) => void (refs.slab = g)}>
        <BucketMeshes buckets={geo.slab} mats={mats} />
      </group>
      <group ref={(g) => void (refs.shell = g)}>
        <BucketMeshes buckets={geo.shell} mats={mats} />
      </group>
      <group ref={(g) => void (refs.cut = g)} visible={false}>
        <BucketMeshes buckets={geo.coreCut} mats={{}} cast={false} />
        {UNIT_IDS.map((id) => {
          const p = unitPlacement(id);
          return (
            <group key={id} position={[p.origin[0], 0, p.origin[1]]} rotation={[0, p.angle, 0]}>
              <group ref={(g) => void (refs.units[id] = g)}>
                <BucketMeshes buckets={geo.cut[id]} mats={{}} cast={false} />
              </group>
            </group>
          );
        })}
      </group>
      {/* pickers: unit volumes (cutaway) and floor volumes (overview) */}
      {UNIT_IDS.map((id) => {
        const p = unitPlacement(id);
        const [x0, z0, x1, z1] = planBounds(floorPlans[id]);
        return (
          <group key={id} position={[p.origin[0], 0, p.origin[1]]} rotation={[0, p.angle, 0]}>
            <mesh
              material={hitMat}
              position={[(x0 + x1) / 2, 1.2, (z0 + z1) / 2]}
              onPointerOver={(e) => {
                onUnitOver(id)(e);
                onFloorOver(e);
              }}
              onPointerOut={() => {
                onUnitOut(id)();
                onFloorOut();
              }}
              onClick={(e) => {
                onUnitClick(id)(e);
                onFloorClick(e);
              }}
            >
              <boxGeometry args={[x1 - x0, 2.6, z1 - z0]} />
            </mesh>
          </group>
        );
      })}
      <mesh material={hitMat} position={[0, 1.5, 0]} onPointerOver={onFloorOver} onPointerOut={onFloorOut} onClick={onFloorClick}>
        <boxGeometry args={[CORE, 3, CORE]} />
      </mesh>
    </group>
  );
});

/** Coloured overlays + outline for unit hover / selection on the focused floor. */
function UnitHighlights({ refs }: { refs: React.RefObject<FloorRefs[]> }) {
  const mats = useMemo(
    () =>
      Object.fromEntries(
        UNIT_IDS.map((id) => [
          id,
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(getUnit(id).accent).lerp(new THREE.Color("#c08a52"), 0.55),
            transparent: true,
            opacity: 0,
            depthWrite: false,
            side: THREE.DoubleSide,
            toneMapped: false,
          }),
        ]),
      ) as Record<UnitId, THREE.MeshBasicMaterial>,
    [],
  );
  const edgeMats = useMemo(
    () =>
      Object.fromEntries(
        UNIT_IDS.map((id) => [
          id,
          new THREE.MeshBasicMaterial({ color: "#c08a52", transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
        ]),
      ) as Record<UnitId, THREE.MeshBasicMaterial>,
    [],
  );
  const group = useRef<THREE.Group>(null);
  const pops = useRef<Record<string, number>>({});

  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => m.dispose());
      Object.values(edgeMats).forEach((m) => m.dispose());
    },
    [mats, edgeMats],
  );

  useFrame((_, dt) => {
    const s = useBoxes.getState();
    const floor = s.mode === "unit" || s.mode === "interior" ? s.selected?.floor ?? 0 : s.activeFloor;
    const fr = refs.current?.[floor - 1];
    if (!group.current) return;
    if (!fr?.group || floor < 1) {
      group.current.visible = false;
      return;
    }
    group.current.visible = true;
    group.current.position.copy(fr.group.position);
    for (const id of UNIT_IDS) {
      const sel = s.selected?.unit === id && s.mode !== "explore";
      const hov = s.hoveredUnit === id;
      const target = hov ? 0.55 : sel ? 0.32 : s.mode === "unit" ? 0.0 : 0.06;
      mats[id].opacity = THREE.MathUtils.damp(mats[id].opacity, target, 10, dt);
      edgeMats[id].opacity = THREE.MathUtils.damp(edgeMats[id].opacity, hov ? 0.4 : sel ? 0.22 : 0, 10, dt);
      const popTarget = hov ? 0.45 : 0;
      pops.current[id] = THREE.MathUtils.damp(pops.current[id] ?? 0, popTarget, 9, dt);
      const ug = fr.units[id];
      if (ug) ug.position.y = pops.current[id];
    }
    // unused floors keep their unit groups grounded
    refs.current?.forEach((r, i) => {
      if (i === floor - 1) return;
      for (const id of UNIT_IDS) {
        const ug = r.units[id];
        if (ug && ug.position.y !== 0) ug.position.y = 0;
      }
    });
  });

  return (
    <group ref={group} visible={false}>
      {UNIT_IDS.map((id) => {
        const p = unitPlacement(id);
        const [x0, z0, x1, z1] = planBounds(floorPlans[id]);
        const w = x1 - x0;
        const d = z1 - z0;
        const t = 0.18;
        return (
          <group key={id} position={[p.origin[0], 0, p.origin[1]]} rotation={[0, p.angle, 0]}>
            <mesh material={mats[id]} position={[(x0 + x1) / 2, 0.06, (z0 + z1) / 2]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
              <planeGeometry args={[w, d]} />
            </mesh>
            {[
              [w + t, t, (x0 + x1) / 2, z0],
              [w + t, t, (x0 + x1) / 2, z1],
              [t, d + t, x0, (z0 + z1) / 2],
              [t, d + t, x1, (z0 + z1) / 2],
            ].map(([sw, sd, cx, cz], i) => (
              <mesh key={i} material={edgeMats[id]} position={[cx, 0.6, cz]}>
                <boxGeometry args={[sw, 1.2, sd]} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

/** Floating unit labels for the focused floor. */
function UnitLabels() {
  const mode = useBoxes((s) => s.mode);
  const activeFloor = useBoxes((s) => s.activeFloor);
  const selected = useBoxes((s) => s.selected);
  const hovered = useBoxes((s) => s.hoveredUnit);
  const transitioning = useBoxes((s) => s.transitioning);
  const floor = mode === "unit" ? selected?.floor ?? 0 : activeFloor;
  const group = useRef<THREE.Group>(null);
  const visible = floor > 0 && (mode === "explore" || mode === "unit") && !transitioning;

  useFrame(() => {
    if (!group.current) return;
    const f = mode === "unit" ? floor : journey.floor;
    const near = Math.abs(f - floor) < 0.3;
    group.current.visible = visible && near;
  });

  if (!visible) return null;
  return (
    <group ref={group} position={[0, floorY(floor) + 2.4, 0]}>
      {UNIT_IDS.map((id) => {
        const p = unitPlacement(id);
        const plan = floorPlans[id];
        const u = getUnit(id);
        const c = [
          p.origin[0] + Math.sin(p.angle) * plan.depth * 0.55,
          0,
          p.origin[1] + Math.cos(p.angle) * plan.depth * 0.55,
        ] as [number, number, number];
        const active = hovered === id || (mode === "unit" && selected?.unit === id);
        return (
          <Html key={id} position={c} center zIndexRange={[30, 10]} style={{ pointerEvents: mode === "unit" ? "none" : "auto" }}>
            <button
              type="button"
              onPointerEnter={() => useBoxes.setState({ hoveredUnit: id })}
              onPointerLeave={() => useBoxes.getState().hoveredUnit === id && useBoxes.setState({ hoveredUnit: null })}
              onClick={() => selectUnit(floor, id)}
              className={`boxes-pill whitespace-nowrap transition-all duration-300 ${active ? "boxes-pill-active" : ""}`}
            >
              <span className="font-medium">{unitNumber(floor, id)}</span>
              <span className="opacity-60">·</span>
              <span>{u.label}</span>
            </button>
          </Html>
        );
      })}
    </group>
  );
}

/** Rooftop signage: the project name on the core crown. */
function Signage() {
  const tex = useMemo(() => {
    const family = getComputedStyle(document.documentElement).getPropertyValue("--font-inter-tight") || "sans-serif";
    return makeTextTexture(project.name, `300 150px ${family}, sans-serif`);
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  const half = CORE / 2 - 0.5;
  return (
    <group position={[0, 2.25, 0]}>
      {[
        [0, half + 0.02, 0],
        [-half - 0.02, 0, -Math.PI / 2],
        [half + 0.02, 0, Math.PI / 2],
        [0, -half - 0.02, Math.PI],
      ].map(([x, z, r], i) => (
        <mesh key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
          <planeGeometry args={[12, 3]} />
          <meshBasicMaterial map={tex} transparent toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

export function Tower() {
  const geo = useMemo(() => getTowerGeometry(), []);
  const base = useMemo(() => getMaterials(), []);
  const floorMats = useMemo(() => floorsList.map(() => cloneForFloor(base)), [base]);
  const roofMats = useMemo(() => cloneForFloor(base), [base]);
  const refs = useRef<FloorRefs[]>(floorsList.map(() => ({ group: null, slab: null, shell: null, cut: null, units: {} })));
  const roofRef = useRef<THREE.Group>(null);
  const procRoofRef = useRef<THREE.Group>(null);
  // Optional GLB building: nodes named Floor_01..Floor_08 and Roof follow the floor animation.
  const glb = useRef<{ floors: (THREE.Object3D | null)[]; roof: THREE.Object3D | null; base: number[]; roofBase: number } | null>(null);
  const onModel = useCallback((scene: THREE.Object3D) => {
    const floors = floorsList.map((f) => scene.getObjectByName(`Floor_${String(f).padStart(2, "0")}`) ?? null);
    const roof = scene.getObjectByName("Roof") ?? null;
    glb.current = { floors, roof, base: floors.map((n) => n?.position.y ?? 0), roofBase: roof?.position.y ?? 0 };
  }, []);
  const slideDir = useRef(new THREE.Vector3());

  useEffect(
    () => () => {
      floorMats.forEach((set) => Object.values(set).forEach((m) => m?.dispose()));
      Object.values(roofMats).forEach((m) => m?.dispose());
    },
    [floorMats, roofMats],
  );

  useFrame(({ camera }, dt) => {
    const s = useBoxes.getState();
    const fcur = s.mode === "unit" || s.mode === "interior" || s.transitioning ? s.selected?.floor ?? journey.floor : journey.floor;
    const weights = floorsList.map((i) => smooth(THREE.MathUtils.clamp(1 - Math.abs(fcur - i), 0, 1)));
    const W = Math.max(...weights);
    slideDir.current.set(camera.position.x, 0, camera.position.z).normalize();
    let below = 0;
    refs.current.forEach((r, idx) => {
      const i = idx + 1;
      const w = weights[idx];
      if (r.group) {
        r.group.position.y = floorY(i) + GAP * below;
        r.group.position.x = slideDir.current.x * SLIDE * w;
        r.group.position.z = slideDir.current.z * SLIDE * w;
      }
      below += w;
      const model = glb.current;
      if (r.shell) {
        r.shell.scale.y = Math.max(0.001, 1 - w);
        r.shell.visible = w < 0.985 && !model;
      }
      if (r.slab) r.slab.visible = !model;
      const node = model?.floors[idx];
      if (node) {
        node.position.y = model.base[idx] + GAP * (below - w);
        node.visible = w < 0.985;
      }
      if (r.cut) {
        r.cut.visible = w > 0.015;
        r.cut.scale.y = Math.max(0.001, w);
      }
      const above = i > fcur + 0.01;
      const ghost = W * (1 - w);
      const opacity = above ? 1 - 0.93 * ghost : 1;
      const lighten = ghost * (above ? 0.25 : 0.38);
      const hovered = s.hoveredFloor === i && s.mode === "explore" && W < 0.4;
      const set = floorMats[idx];
      for (const m of Object.values(set)) {
        if (!m) continue;
        m.opacity = (m.userData.baseOpacity as number) * opacity;
        m.depthWrite = opacity > 0.7 && m.name !== "railGlass";
        m.color.copy(m.userData.baseColor as THREE.Color).lerp(WHITE, lighten);
        const e = hovered ? 0.22 : 0;
        m.emissive.setRGB(0.66 * e, 0.5 * e, 0.33 * e);
      }
    });
    if (roofRef.current) roofRef.current.position.y = ROOF_Y + GAP * below;
    if (procRoofRef.current) procRoofRef.current.visible = !glb.current;
    if (glb.current?.roof) glb.current.roof.position.y = glb.current.roofBase + GAP * below;
    const roofGhost = W;
    for (const m of Object.values(roofMats)) {
      if (!m) continue;
      m.opacity = (m.userData.baseOpacity as number) * (1 - 0.93 * roofGhost);
      m.depthWrite = roofGhost < 0.3 && m.name !== "railGlass";
    }
    void dt;
  });

  return (
    <group>
      <group position={[0, 0, 0]}>
        <BucketMeshes buckets={geo.podium} mats={{}} />
      </group>
      {floorsList.map((f, idx) => (
        <Floor key={f} floor={f} refs={refs.current[idx]} mats={floorMats[idx]} />
      ))}
      <group ref={roofRef} position={[0, ROOF_Y, 0]}>
        <group ref={procRoofRef}>
          <BucketMeshes buckets={geo.roof} mats={roofMats} />
          <Signage />
        </group>
      </group>
      <ModelSlot url={project.models.building} fallback={null} onLoaded={onModel} />
      <UnitHighlights refs={refs} />
      <UnitLabels />
    </group>
  );
}

export const TOWER_TOP = ROOF_Y + 4.5;
export const TOWER_FLOORS = FLOORS;
export const TOWER_GROUND = GROUND_H;
