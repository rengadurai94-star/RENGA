"use client";

import * as THREE from "three";
import { BOARD_MAP, COLOUR_MAP, FINISH_MAP, HANDLE_MAP, STONE_MAP } from "@/lib/catalog/materials";
import type { MaterialSelection } from "@/lib/catalog/types";
import type { Surface } from "@/lib/geometry/cabinet";
import { stoneTexture, woodTexture } from "./textures";

/**
 * Shared material cache so a kitchen of 30 cabinets with the same finish
 * reuses one GPU material per surface.
 */
const cache = new Map<string, THREE.Material>();

function cached<T extends THREE.Material>(key: string, make: () => T): T {
  const hit = cache.get(key);
  if (hit) return hit as T;
  const m = make();
  cache.set(key, m);
  return m;
}

export function frontMaterial(finishId: string, colourId: string) {
  return cached(`front:${finishId}:${colourId}`, () => {
    const finish = FINISH_MAP[finishId] ?? FINISH_MAP["lam-matte"];
    const colour = COLOUR_MAP[colourId] ?? COLOUR_MAP["ivory"];
    const m = new THREE.MeshPhysicalMaterial({
      color: colour.pattern === "solid" ? colour.hex : "#ffffff",
      roughness: finish.roughness,
      clearcoat: finish.clearcoat,
      clearcoatRoughness: 0.12,
      metalness: 0,
    });
    if (colour.pattern === "wood") m.map = woodTexture(colour.hex, colour.code.charCodeAt(3));
    if (colour.pattern === "stone") m.map = stoneTexture(colour.hex, colour.hex === "#4a4946" ? "#77756f" : "#a8a6a0");
    return m;
  });
}

export function carcassMaterial(boardId: string, variant: "carcass" | "back" | "drawerbox" = "carcass") {
  return cached(`carcass:${boardId}:${variant}`, () => {
    const board = BOARD_MAP[boardId] ?? BOARD_MAP["bwp-ply"];
    const c = new THREE.Color(board.interiorHex);
    if (variant === "back") c.multiplyScalar(0.93);
    if (variant === "drawerbox") c.offsetHSL(0, 0, -0.02);
    return new THREE.MeshStandardMaterial({ color: c, roughness: 0.72 });
  });
}

export function metalMaterial(handleId: string) {
  return cached(`metal:${handleId}`, () => {
    const h = HANDLE_MAP[handleId];
    const useDefault = !h || h.style === "none";
    return new THREE.MeshStandardMaterial({
      color: useDefault ? "#c4c3be" : h.metalHex,
      metalness: 1,
      roughness: useDefault ? 0.32 : h.roughness,
    });
  });
}

export function stoneMaterial(stoneId: string) {
  return cached(`stone:${stoneId}`, () => {
    const s = STONE_MAP[stoneId] ?? STONE_MAP["quartz-snow"];
    return new THREE.MeshPhysicalMaterial({
      map: stoneTexture(s.hex, s.veinHex),
      roughness: 0.28,
      clearcoat: 0.4,
      clearcoatRoughness: 0.2,
    });
  });
}

const staticMaterials = {
  plinth: () => cached("plinth", () => new THREE.MeshStandardMaterial({ color: "#3a3936", roughness: 0.55, metalness: 0.2 })),
  appliance: () => cached("appliance", () => new THREE.MeshStandardMaterial({ color: "#1b1b1b", roughness: 0.4, metalness: 0.5 })),
  glass: () =>
    cached(
      "glass",
      () => new THREE.MeshPhysicalMaterial({ color: "#0c0c0d", roughness: 0.06, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03 }),
    ),
  basin: () => cached("basin", () => new THREE.MeshStandardMaterial({ color: "#d3d3cf", roughness: 0.22, metalness: 1 })),
};

export function materialFor(surface: Surface, sel: MaterialSelection, stoneId = "quartz-snow"): THREE.Material {
  switch (surface) {
    case "front":
      return frontMaterial(sel.finish, sel.colour);
    case "carcass":
      return carcassMaterial(sel.carcass);
    case "back":
      return carcassMaterial(sel.carcass, "back");
    case "drawerbox":
      return carcassMaterial(sel.carcass, "drawerbox");
    case "metal":
      return metalMaterial(sel.handle);
    case "stone":
      return stoneMaterial(stoneId);
    case "plinth":
      return staticMaterials.plinth();
    case "appliance":
      return staticMaterials.appliance();
    case "glass":
      return staticMaterials.glass();
    case "basin":
      return staticMaterials.basin();
  }
}

/* Shared unit geometries — every panel is a scaled unit box. */
let unitBox: THREE.BoxGeometry | null = null;
let unitCyl: THREE.CylinderGeometry | null = null;
export function getUnitBox() {
  return (unitBox ??= new THREE.BoxGeometry(1, 1, 1));
}
export function getUnitCylinder() {
  return (unitCyl ??= new THREE.CylinderGeometry(0.5, 0.5, 1, 28));
}
