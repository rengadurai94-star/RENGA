import { Html, useTexture } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { data, floorById, geometry, unitById, unitConfiguration, unitTypeOf } from '../data/project';
import {
  BUILDING_D,
  BUILDING_W,
  FLOOR_H,
  levelBase,
  planImageWorldRect,
  regionBounds,
  ROOF_Y,
  SLAB,
  UNIT_KEYS,
} from '../scenes/planGeometry';
import { facadeTextures, imageTexture, WALL_H } from '../scenes/textures';
import { goToFloor, hoverUnit, selectUnit } from '../utils/actions';
import { getState, useStore } from '../utils/store';
import { shared, type BoxSpec } from './sharedGeometry';

const LEVEL_FLOOR: Record<number, string> = { 0: 'stilt', 1: 'f1', 2: 'f2', 3: 'f3', 4: 'f4', 5: 'f5', 6: 'terrace' };
const FLOOR_LEVEL: Record<string, number> = Object.fromEntries(Object.entries(LEVEL_FLOOR).map(([l, f]) => [f, Number(l)]));
const TEAL = new THREE.Color('#008177');
const TEAL_2 = new THREE.Color('#32bcad');

/* ---------------------------------------------------------------- materials */

type MatSet = ReturnType<typeof makeMaterials>;
function makeMaterials() {
  const { map, emissive, rough } = facadeTextures();
  const facade = new THREE.MeshStandardMaterial({
    map,
    emissiveMap: emissive,
    emissive: new THREE.Color('#ffb46b'),
    emissiveIntensity: 0.14,
    roughnessMap: rough,
    roughness: 1,
    metalness: 0.05,
    envMapIntensity: 1.2,
  });
  const m = {
    facade,
    cap: new THREE.MeshStandardMaterial({ color: '#efebe4', roughness: 0.9 }),
    slab: new THREE.MeshStandardMaterial({ color: '#f8f6f1', roughness: 0.7 }),
    core: new THREE.MeshStandardMaterial({ color: '#bdb7ad', roughness: 0.85 }),
    frame: new THREE.MeshStandardMaterial({ color: '#f8f6f1', roughness: 0.55 }),
    louvre: new THREE.MeshStandardMaterial({ color: '#b06a3a', roughness: 0.42, metalness: 0.35 }),
    glass: new THREE.MeshStandardMaterial({ color: '#cfe0e2', roughness: 0.04, metalness: 0.5, transparent: true, opacity: 0.35, envMapIntensity: 1.5 }),
    green: new THREE.MeshStandardMaterial({ color: '#6c8f4f', roughness: 0.95 }),
    // terrace
    deck: new THREE.MeshStandardMaterial({ color: '#8f5f3d', roughness: 0.85 }),
    lawn: new THREE.MeshStandardMaterial({ color: '#7aa35a', roughness: 1 }),
    pavilion: new THREE.MeshStandardMaterial({ color: '#c9d7d8', roughness: 0.12, metalness: 0.55, emissive: new THREE.Color('#ffd7a0'), emissiveIntensity: 0.12, envMapIntensity: 1.4 }),
    pergola: new THREE.MeshStandardMaterial({ color: '#5a4a3c', roughness: 0.55, metalness: 0.2 }),
    emblem: new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false }),
  };
  for (const mat of Object.values(m)) mat.userData.baseOpacity = mat.opacity;
  return m;
}

function applyFade(set: MatSet, fade: number) {
  for (const mat of Object.values(set) as THREE.Material[]) {
    const base = (mat.userData.baseOpacity as number) ?? 1;
    const wantTransparent = fade < 0.995 || base < 1;
    if (mat.transparent !== wantTransparent) {
      mat.transparent = wantTransparent;
      mat.needsUpdate = true;
    }
    mat.opacity = base * fade;
    mat.depthWrite = fade > 0.98;
  }
}

/* ---------------------------------------------------------------- helpers */

function Boxes({ specs, material, castShadow = true }: { specs: BoxSpec[]; material: THREE.Material; castShadow?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    specs.forEach((s, i) => {
      o.position.set(s.cx, s.cy, s.cz);
      o.rotation.set(0, s.ry ?? 0, 0);
      o.scale.set(s.w, s.h, s.d);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [specs]);
  return <instancedMesh ref={ref} args={[geo, material, specs.length]} castShadow={castShadow} receiveShadow />;
}

const setCursor = (c: string) => {
  document.body.style.cursor = c;
};

/* ---------------------------------------------------------------- level */

interface LevelProps {
  level: number;
  mode: 'hero' | 'explore';
  focusLevel: number | null;
  shadows: boolean;
}

function Level({ level, mode, focusLevel, shadows }: LevelProps) {
  const S = shared();
  const group = useRef<THREE.Group>(null);
  const mats = useMemo(makeMaterials, []);
  const fadeRef = useRef(1);
  const liftRef = useRef(0);
  const isFocus = mode === 'explore' && focusLevel === level;
  const above = mode === 'explore' && focusLevel !== null && level > focusLevel;
  const base = levelBase(level);
  const floorId = LEVEL_FLOOR[level];
  const hoverLevel = useRef(false);

  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.25);
    const targetLift = above ? 24 + (level - (focusLevel ?? 0)) * 3.4 : 0;
    const targetFade = above ? 0.07 : 1;
    liftRef.current = THREE.MathUtils.damp(liftRef.current, targetLift, 4, dt);
    const nf = THREE.MathUtils.damp(fadeRef.current, targetFade, 5, dt);
    if (Math.abs(nf - fadeRef.current) > 0.0005 || (nf !== targetFade && Math.abs(nf - targetFade) < 0.001)) {
      fadeRef.current = Math.abs(nf - targetFade) < 0.001 ? targetFade : nf;
      applyFade(mats, fadeRef.current);
    }
    if (group.current) group.current.position.y = base + liftRef.current;
    // gentle glow on the hovered (non-focused) level
    const glow = hoverLevel.current && !isFocus ? 0.06 : 0;
    mats.slab.emissive.copy(TEAL);
    mats.slab.emissiveIntensity = THREE.MathUtils.damp(mats.slab.emissiveIntensity, glow, 6, dt);
  });

  const interactive = mode === 'explore' && !isFocus;
  const onOver = (e: ThreeEvent<PointerEvent>) => {
    if (!interactive) return;
    e.stopPropagation();
    hoverLevel.current = true;
    setCursor('pointer');
  };
  const onOut = () => {
    hoverLevel.current = false;
    if (interactive) setCursor('auto');
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!interactive || e.delta > 6) return;
    e.stopPropagation();
    setCursor('auto');
    goToFloor(floorId);
  };

  const residential = level >= 1 && level <= 5;
  const showShell = !(isFocus && residential);

  return (
    <group ref={group} position={[0, base, 0]} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
      {level > 0 && level < 6 && (
        <>
          <mesh geometry={S.slab} material={mats.slab} receiveShadow castShadow={shadows} />
          <Boxes specs={S.balconySlabs} material={mats.slab} castShadow={shadows} />
          <Boxes specs={S.railings} material={mats.glass} castShadow={false} />
          {showShell && <Boxes specs={S.frames} material={mats.frame} castShadow={shadows} />}
          {showShell && <Boxes specs={S.louvres} material={mats.louvre} castShadow={shadows} />}
          {S.lightwells.map((l, i) => (
            <mesh key={i} position={[l.cx, SLAB + 0.25, l.cz]} material={mats.green} receiveShadow>
              <boxGeometry args={[l.w * 0.9, 0.5, Math.min(l.d * 0.35, 1.6)]} />
            </mesh>
          ))}
        </>
      )}
      {level > 0 && level < 6 && (
        <group position={[0, SLAB, 0]}>
          {S.core.map((g, i) => (
            <mesh key={i} geometry={g} material={mats.core} castShadow={shadows} receiveShadow />
          ))}
          {showShell && (
            <>
              {UNIT_KEYS.map((k) => (
                <mesh key={k} geometry={S.units[k]} material={[mats.cap, mats.facade]} castShadow={shadows} receiveShadow />
              ))}
              <mesh geometry={S.corridor} material={[mats.cap, mats.facade]} receiveShadow />
            </>
          )}
        </group>
      )}
      {isFocus && level >= 1 && level <= 4 && (
        <Suspense fallback={null}>
          <TypicalFocus level={level} />
        </Suspense>
      )}
      {isFocus && level === 5 && <FifthFocus />}
      {level === 0 && <Stilt mats={mats} shadows={shadows} />}
      {level === 6 && <Terrace mats={mats} shadows={shadows} />}
      {mode === 'explore' && focusLevel === null && <FloorTag level={level} />}
    </group>
  );
}

/* ---------------------------------------------------------------- focus: typical floor (1st-4th) */

function TypicalFocus({ level }: { level: number }) {
  const S = shared();
  const tex = useTexture(`./${geometry.image.src}`);
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
  }, [tex]);
  const rect = planImageWorldRect();
  const hovered = useStore((s) => s.hoveredUnit);
  const selected = useStore((s) => s.selectedUnit);
  const ring = useRef<THREE.LineLoop>(null);

  const mats = useMemo(
    () => ({
      cut: new THREE.MeshStandardMaterial({ color: '#f7f4ee', roughness: 0.85, side: THREE.DoubleSide }),
      none: new THREE.MeshBasicMaterial({ visible: false }),
      edge: new THREE.LineBasicMaterial({ color: '#1d1c1a', transparent: true, opacity: 0.55 }),
      hit: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
      hl: new THREE.MeshStandardMaterial({ color: TEAL, transparent: true, opacity: 0.28, depthWrite: false, roughness: 0.3, emissive: TEAL, emissiveIntensity: 0.25 }),
      hlEdge: new THREE.LineBasicMaterial({ color: TEAL_2 }),
      hlCap: new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.22, depthWrite: false }),
      ring: new THREE.LineBasicMaterial({ color: TEAL_2, transparent: true, opacity: 0.9 }),
    }),
    [],
  );
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats]);

  const ringGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(S.outlinePoints), [S]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    mats.ring.opacity = 0.55 + Math.sin(t * 2.4) * 0.35;
    mats.hl.opacity = 0.2 + Math.sin(t * 3) * 0.05;
    mats.hlCap.opacity = 0.2 + Math.sin(t * 3) * 0.06;
  });

  const cutH = 1.05 / WALL_H;

  return (
    <group position={[0, SLAB, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[rect.cx, 0.03, rect.cz]} receiveShadow>
        <planeGeometry args={[rect.w, rect.d]} />
        <meshStandardMaterial map={tex} transparent roughness={0.9} />
      </mesh>
      <lineLoop ref={ring} geometry={ringGeo} material={mats.ring} position={[0, 0.06, 0]} />
      {UNIT_KEYS.map((k) => {
        const id = `${level}${k}`;
        const isHover = hovered === id;
        const isSel = selected === id;
        const [cx, cz] = S.unitCentroids[k];
        return (
          <group key={k}>
            {/* cutaway: boundary walls only (caps hidden) so the original plan stays fully visible */}
            <mesh geometry={S.units[k]} material={[mats.none, mats.cut]} scale={[1, cutH, 1]} castShadow />
            <lineSegments geometry={S.unitEdges[k]} material={mats.edge} scale={[1, cutH, 1]} />
            {(isHover || isSel) && (
              <>
                <mesh geometry={S.units[k]} material={[mats.none, mats.hl]} />
                <mesh geometry={S.units[k]} material={[mats.hlCap, mats.none]} position={[0, 0.02, 0]} scale={[1, 0.01, 1]} />
                <lineSegments geometry={S.unitEdges[k]} material={mats.hlEdge} />
              </>
            )}
            <mesh
              geometry={S.units[k]}
              material={mats.hit}
              onPointerOver={(e) => {
                e.stopPropagation();
                hoverUnit(id);
                setCursor('pointer');
              }}
              onPointerOut={() => {
                if (getState().hoveredUnit === id) hoverUnit(null);
                setCursor('auto');
              }}
              onClick={(e) => {
                if (e.delta > 6) return;
                e.stopPropagation();
                setCursor('auto');
                selectUnit(id);
              }}
            />
            <Html position={[cx, WALL_H + 0.6, cz]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
              <div className="unit-label-3d" aria-hidden>
                {k}
              </div>
            </Html>
            {isHover && <UnitTip id={id} position={[cx, WALL_H + 2.2, cz]} />}
          </group>
        );
      })}
    </group>
  );
}

function UnitTip({ id, position }: { id: string; position: [number, number, number] }) {
  const u = unitById(id);
  if (!u) return null;
  const t = unitTypeOf(u);
  return (
    <Html position={position} zIndexRange={[30, 0]} style={{ pointerEvents: 'none' }}>
      <div className="unit-tip" role="tooltip">
        <em>{floorById(u.floor)?.label}</em>
        <b>
          Type {u.type} · {unitConfiguration(u)}
        </b>
        {t?.carpetAreaSqft != null && <span>Carpet {t.carpetAreaSqft} sq.ft. · {t.vastu}</span>}
        <span style={{ display: 'block', marginTop: 4 }}>Ref. {u.id} · click for details</span>
      </div>
    </Html>
  );
}

/* ---------------------------------------------------------------- focus: 5th floor (plan not published) */

function FifthFocus() {
  const S = shared();
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#f3efe7', transparent: true, opacity: 0.55, roughness: 0.9, depthWrite: false }),
    [],
  );
  const edge = useMemo(() => new THREE.LineBasicMaterial({ color: TEAL_2 }), []);
  const ringGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(S.outlinePoints), [S]);
  const units = data.units.filter((u) => u.floor === 'f5');
  return (
    <group position={[0, SLAB, 0]}>
      <mesh geometry={S.outlineFull} material={mat} />
      <lineLoop geometry={ringGeo} material={edge} position={[0, 0.05, 0]} />
      <lineLoop geometry={ringGeo} material={edge} position={[0, WALL_H, 0]} />
      <Html position={[0, WALL_H + 1.5, 0]} center zIndexRange={[30, 0]} style={{ pointerEvents: 'none' }}>
        <div className="unit-tip" style={{ transform: 'none' }}>
          <em>5th Floor</em>
          <b>{units.length} residences</b>
          <span>{units.map((u) => unitConfiguration(u)).join(' + ')}</span>
          <span style={{ display: 'block', marginTop: 4 }}>Layout not published in the brochure</span>
        </div>
      </Html>
    </group>
  );
}

function FloorTag({ level }: { level: number }) {
  const f = floorById(LEVEL_FLOOR[level]);
  const h = level === 6 ? 0.8 : FLOOR_H / 2;
  return (
    <Html position={[-BUILDING_W / 2 - 1.2, h, BUILDING_D / 2 + 0.5]} zIndexRange={[15, 0]} style={{ pointerEvents: 'none' }}>
      <div className="floor-label-3d" style={{ transform: 'translate(-100%, -50%)' }}>
        {f?.label}
      </div>
    </Html>
  );
}

/* ---------------------------------------------------------------- stilt (indicative, after brochure p.10) */

function Stilt({ mats, shadows }: { mats: MatSet; shadows: boolean }) {
  const S = shared();
  const local = useMemo(
    () => ({
      asphalt: new THREE.MeshStandardMaterial({ color: '#5b5f63', roughness: 0.95 }),
      paving: new THREE.MeshStandardMaterial({ color: '#d9d1c3', roughness: 0.9 }),
      wall: new THREE.MeshStandardMaterial({ color: '#8f5a36', roughness: 0.55, metalness: 0.2 }),
      stripe: new THREE.MeshBasicMaterial({ color: '#f1efe9' }),
      lobby: new THREE.MeshStandardMaterial({ color: '#f2d7ad', emissive: new THREE.Color('#ffcf8f'), emissiveIntensity: 0.5, roughness: 0.4 }),
    }),
    [],
  );
  const plotW = BUILDING_W + 9;
  const plotD = BUILDING_D + 12;
  const corridor = regionBounds('corridor');
  const columns = useMemo<BoxSpec[]>(() => S.columns.map(([x, z]) => ({ cx: x, cy: FLOOR_H / 2, cz: z, w: 0.45, h: FLOOR_H, d: 0.6 })), [S]);
  const stripes = useMemo<BoxSpec[]>(() => {
    const out: BoxSpec[] = [];
    for (let z = -BUILDING_D / 2 + 3; z < BUILDING_D / 2 - 4; z += 2.6) {
      out.push({ cx: corridor.maxx + 2.4, cy: 0.03, cz: z, w: 4.6, h: 0.01, d: 0.1 });
      out.push({ cx: corridor.minx - 2.4, cy: 0.03, cz: z, w: 4.6, h: 0.01, d: 0.1 });
    }
    return out;
  }, [corridor]);
  const cars = useMemo(() => {
    const colors = ['#f4f4f2', '#b3261e', '#e3b43c', '#9aa1a8', '#1f2a33', '#f4f4f2'];
    return [-11, -6.5, -2, 3.2, 8.4, 12.6].map((z, i) => ({ x: corridor.maxx + 2.4, z: z * (BUILDING_D / 33), c: colors[i] }));
  }, [corridor]);
  return (
    <group>
      {/* plot paving + driveway */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 1]} receiveShadow material={local.paving}>
        <planeGeometry args={[plotW, plotD]} />
      </mesh>
      <mesh geometry={S.slab} material={local.asphalt} position={[0, -0.18, 0]} receiveShadow />
      <Boxes specs={stripes} material={local.stripe} castShadow={false} />
      <Boxes specs={columns} material={mats.frame} castShadow={shadows} />
      {S.core.map((g, i) => (
        <mesh key={i} geometry={g} material={mats.core} scale={[1, FLOOR_H / WALL_H, 1]} castShadow={shadows} />
      ))}
      {/* enclosed lobby / office / co-working block (indicative position) */}
      <mesh position={[(corridor.minx - BUILDING_W / 2) / 2 + 0.6, 1.45, 0.5]} material={local.lobby} castShadow={shadows}>
        <boxGeometry args={[Math.abs(corridor.minx + BUILDING_W / 2) - 2.2, 2.9, 9]} />
      </mesh>
      {cars.map((c, i) => (
        <group key={i} position={[c.x, 0, c.z]}>
          <mesh position={[0, 0.55, 0]} castShadow={shadows}>
            <boxGeometry args={[4.2, 0.75, 1.8]} />
            <meshStandardMaterial color={c.c} roughness={0.35} metalness={0.4} />
          </mesh>
          <mesh position={[-0.2, 1.1, 0]} castShadow={shadows}>
            <boxGeometry args={[2.2, 0.55, 1.6]} />
            <meshStandardMaterial color="#26313a" roughness={0.2} metalness={0.5} />
          </mesh>
        </group>
      ))}
      {/* compound wall (copper tone, as in the brochure renders) with the entry on the south */}
      <Boxes
        specs={[
          { cx: 0, cy: 0.75, cz: -plotD / 2 + 1, w: plotW, h: 1.5, d: 0.25 },
          { cx: -plotW / 2, cy: 0.75, cz: 1, w: 0.25, h: 1.5, d: plotD },
          { cx: plotW / 2, cy: 0.75, cz: 1, w: 0.25, h: 1.5, d: plotD },
          { cx: -plotW / 2 + 4.5, cy: 0.75, cz: plotD / 2 + 1, w: 9, h: 1.5, d: 0.25 },
          { cx: plotW / 2 - 4.5, cy: 0.75, cz: plotD / 2 + 1, w: 9, h: 1.5, d: 0.25 },
          { cx: 0, cy: 0.75, cz: plotD / 2 + 1, w: 6, h: 1.5, d: 0.25 },
        ]}
        material={local.wall}
        castShadow={shadows}
      />
      {/* security cabin near the entry */}
      <mesh position={[plotW / 2 - 3, 1.3, BUILDING_D / 2 + 3]} castShadow={shadows}>
        <boxGeometry args={[2.6, 2.6, 2.6]} />
        <meshStandardMaterial color="#2b3238" roughness={0.5} emissive="#ffcf8f" emissiveIntensity={0.15} />
      </mesh>
      {/* garden strips */}
      <mesh position={[-plotW / 2 + 1.6, 0.25, 0]} material={mats.green} receiveShadow>
        <boxGeometry args={[2.4, 0.5, plotD - 8]} />
      </mesh>
      <mesh position={[0, 0.25, -plotD / 2 + 2.6]} material={mats.green} receiveShadow>
        <boxGeometry args={[plotW - 6, 0.5, 2.4]} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- terrace (indicative, after brochure p.13) */

function Terrace({ mats, shadows }: { mats: MatSet; shadows: boolean }) {
  const S = shared();
  const corridor = regionBounds('corridor');
  useMemo(() => {
    mats.emblem.map = imageTexture('./brand/emblem-on-light.svg');
    mats.emblem.needsUpdate = true;
  }, [mats]);
  const local = { deck: mats.deck, lawn: mats.lawn, roofGlass: mats.pavilion, pergola: mats.pergola };
  const pergola = useMemo<BoxSpec[]>(() => {
    const out: BoxSpec[] = [];
    const x0 = -BUILDING_W / 2 + 1.5;
    const x1 = corridor.minx - 0.8;
    for (let z = -6; z <= 6; z += 0.7) out.push({ cx: (x0 + x1) / 2, cy: 3.1, cz: z, w: x1 - x0, h: 0.22, d: 0.12 });
    for (const x of [x0, x1]) for (const z of [-6.2, 6.2]) out.push({ cx: x, cy: 1.55, cz: z, w: 0.28, h: 3.1, d: 0.28 });
    out.push({ cx: (x0 + x1) / 2, cy: 2.95, cz: -6.2, w: x1 - x0, h: 0.3, d: 0.3 });
    out.push({ cx: (x0 + x1) / 2, cy: 2.95, cz: 6.2, w: x1 - x0, h: 0.3, d: 0.3 });
    return out;
  }, [corridor]);
  const gymW = BUILDING_W / 2 - corridor.maxx - 1;
  return (
    <group>
      <mesh geometry={S.slab} material={mats.slab} receiveShadow castShadow={shadows} />
      <Boxes specs={S.parapets} material={mats.frame} castShadow={shadows} />
      {S.coreTall.map((g, i) => (
        <mesh key={i} geometry={g} material={mats.core} position={[0, SLAB, 0]} castShadow={shadows} />
      ))}
      {/* gym / games block (north-east, indicative) */}
      <mesh position={[corridor.maxx + 0.5 + gymW / 2, SLAB + 1.6, -BUILDING_D / 2 + 7.5]} material={local.roofGlass} castShadow={shadows}>
        <boxGeometry args={[gymW, 3.2, 13]} />
      </mesh>
      {/* deck + rooftop lounge pergola (west, indicative) */}
      <mesh position={[(corridor.minx - BUILDING_W / 2) / 2, SLAB + 0.05, 0]} material={local.deck} receiveShadow>
        <boxGeometry args={[Math.abs(corridor.minx + BUILDING_W / 2) - 1.4, 0.1, BUILDING_D * 0.6]} />
      </mesh>
      <Boxes specs={pergola} material={local.pergola} castShadow={shadows} />
      {/* yoga lawn (south-east, indicative) */}
      <mesh position={[corridor.maxx + 0.5 + gymW / 2, SLAB + 0.06, BUILDING_D / 2 - 8]} material={local.lawn} receiveShadow>
        <boxGeometry args={[gymW, 0.12, 12]} />
      </mesh>
      {/* planters along the west parapet */}
      <mesh position={[-BUILDING_W / 2 + 0.9, SLAB + 0.4, 0]} material={mats.green} castShadow={shadows}>
        <boxGeometry args={[1.2, 0.8, BUILDING_D * 0.8]} />
      </mesh>
      {/* brand blade above the south light well (as in brochure renders p.4, p.26) */}
      <group position={[corridor.cx, 0, BUILDING_D / 2 - 1.2]}>
        <mesh position={[0, 3, 0]} material={mats.louvre} castShadow={shadows}>
          <boxGeometry args={[0.75, 6, 0.3]} />
        </mesh>
        <mesh position={[0, 4.9, 0.16]} material={mats.emblem}>
          <planeGeometry args={[0.9, 0.9]} />
        </mesh>
        <mesh position={[0, 4.9, -0.16]} rotation={[0, Math.PI, 0]} material={mats.emblem}>
          <planeGeometry args={[0.9, 0.9]} />
        </mesh>
      </group>
      {/* pavilion roof slab */}
      <mesh position={[corridor.maxx + 0.5 + gymW / 2, SLAB + 3.3, -BUILDING_D / 2 + 7.5]} material={mats.slab} castShadow={shadows}>
        <boxGeometry args={[gymW + 0.6, 0.22, 13.6]} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- building */

export default function Building({ shadows }: { shadows: boolean }) {
  const section = useStore((s) => s.section);
  const introDone = useStore((s) => s.introDone);
  const floorId = useStore((s) => s.floorId);
  const mode: 'hero' | 'explore' = introDone && section === 'explore' ? 'explore' : 'hero';
  const focusLevel = mode === 'explore' && floorId ? FLOOR_LEVEL[floorId] ?? null : null;
  useEffect(() => () => setCursor('auto'), []);
  return (
    <group name="building">
      {[0, 1, 2, 3, 4, 5, 6].map((l) => (
        <Level key={l} level={l} mode={mode} focusLevel={focusLevel} shadows={shadows} />
      ))}
    </group>
  );
}

export { ROOF_Y };
