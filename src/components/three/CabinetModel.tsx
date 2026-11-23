"use client";

import { useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { HANDLE_MAP } from "@/lib/catalog/materials";
import { PRODUCT_MAP } from "@/lib/catalog/products";
import type { CabinetConfig } from "@/lib/catalog/types";
import { buildCabinet, buildCountertop, inputFromProduct, type Part } from "@/lib/geometry/cabinet";
import { getUnitBox, getUnitCylinder, materialFor } from "./materials";

export interface CabinetModelProps {
  config: CabinetConfig;
  /** 0 = closed, 1 = fully open (doors swing, drawers slide). */
  open?: number;
  /** 0 = assembled, 1 = exploded panels. */
  explode?: number;
  countertop?: boolean;
  stoneId?: string;
  /** Mirror left/right (used for corner units). */
  mirror?: boolean;
  castShadow?: boolean;
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
}

const damp = THREE.MathUtils.damp;

/**
 * Renders a parametric cabinet in millimetres (wrap in a 0.001 scale group).
 * Origin: bottom-left-back corner.
 */
export function CabinetModel({
  config,
  open = 0,
  explode = 0,
  countertop = false,
  stoneId,
  mirror = false,
  castShadow = true,
  onPointerDown,
  onPointerOver,
  onPointerOut,
}: CabinetModelProps) {
  const product = PRODUCT_MAP[config.sku];
  const handle = HANDLE_MAP[config.handle];

  const geo = useMemo(
    () =>
      product
        ? buildCabinet(inputFromProduct(product, { width: config.width, height: config.height, depth: config.depth }, handle))
        : null,
    [product, handle, config.width, config.height, config.depth],
  );

  const counter = useMemo(
    () =>
      product && countertop && product.mount === "floor" && config.height <= 1000
        ? buildCountertop({ width: config.width, depth: config.depth, height: config.height, sink: product.sink, hob: product.hob })
        : [],
    [product, countertop, config.width, config.depth, config.height],
  );

  const frontRefs = useRef<(THREE.Group | null)[]>([]);
  const partRefs = useRef<Map<string, THREE.Object3D>>(new Map());
  const state = useRef<{ open: number; explode: number; geo: unknown }>({ open: 0, explode: 0, geo: null });

  useFrame((_, dt) => {
    if (!geo) return;
    const s = state.current;
    const settled = Math.abs(s.open - open) < 1e-4 && Math.abs(s.explode - explode) < 1e-4;
    // Skip work once settled — unless the geometry was just rebuilt.
    if (settled && s.open === open && s.explode === explode && s.geo === geo) return;
    s.geo = geo;
    s.open = settled ? open : damp(s.open, open, 6, dt);
    s.explode = settled ? explode : damp(s.explode, explode, 5, dt);

    geo.fronts.forEach((f, i) => {
      const g = frontRefs.current[i];
      if (!g) return;
      const [px, py, pz] = f.pivot;
      const fx = s.explode * 160;
      if (f.hinge === "slide") {
        g.position.set(px, py, pz + f.travel * s.open + fx);
      } else if (f.hinge === "top") {
        g.position.set(px, py, pz + fx);
        g.rotation.x = f.travel * s.open;
      } else {
        g.position.set(px, py, pz + fx);
        g.rotation.y = f.travel * s.open;
      }
    });

    // Exploded view: push carcass panels away from the centre.
    const cx = geo.width / 2;
    const cy = geo.height / 2;
    const cz = geo.depth / 2;
    for (const p of geo.parts) {
      const o = partRefs.current.get(p.id);
      if (!o) continue;
      const k = s.explode * 0.55;
      o.position.set(p.pos[0] + (p.pos[0] - cx) * k, p.pos[1] + (p.pos[1] - cy) * k, p.pos[2] + (p.pos[2] - cz) * k);
    }
  });

  if (!product || !geo) return null;

  const renderPart = (p: Part, offset?: [number, number, number], track = false) => {
    const mat = materialFor(p.surface, config, stoneId);
    const pos: [number, number, number] = offset ? [p.pos[0] - offset[0], p.pos[1] - offset[1], p.pos[2] - offset[2]] : p.pos;
    const isCyl = p.shape === "cylinder";
    const rotation: [number, number, number] =
      isCyl && p.axis === "x" ? [0, 0, Math.PI / 2] : isCyl && p.axis === "z" ? [Math.PI / 2, 0, 0] : [0, 0, 0];
    const scale: [number, number, number] = isCyl ? [p.size[1], p.size[0], p.size[2]] : p.size;
    return (
      <mesh
        key={p.id}
        ref={
          track
            ? (o) => {
                if (o) partRefs.current.set(p.id, o);
                else partRefs.current.delete(p.id);
              }
            : undefined
        }
        geometry={isCyl ? getUnitCylinder() : getUnitBox()}
        material={mat}
        position={pos}
        rotation={rotation}
        scale={scale}
        castShadow={castShadow}
        receiveShadow
      />
    );
  };

  return (
    <group
      scale={mirror ? [-1, 1, 1] : [1, 1, 1]}
      position={mirror ? [config.width, 0, 0] : [0, 0, 0]}
      onPointerDown={onPointerDown}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {geo.parts.map((p) => renderPart(p, undefined, true))}
      {geo.fronts.map((f, i) => (
        <group
          key={f.id}
          ref={(g) => {
            frontRefs.current[i] = g;
          }}
          position={f.pivot}
        >
          {f.parts.map((p) => renderPart(p, f.pivot))}
        </group>
      ))}
      {counter.map((p) => renderPart(p))}
    </group>
  );
}
