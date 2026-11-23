"use client";

import { create } from "zustand";
import { COLOUR_MAP, coloursForFinish } from "@/lib/catalog/materials";
import { defaultConfig, PRODUCT_MAP } from "@/lib/catalog/products";
import type { CabinetConfig, MaterialSelection } from "@/lib/catalog/types";
import type { LengthUnit } from "@/lib/units";

export type ViewPreset = "3d" | "front" | "side" | "top";

interface ConfiguratorState {
  config: CabinetConfig;
  open: boolean;
  explode: boolean;
  countertop: boolean;
  showDims: boolean;
  unit: LengthUnit;
  view: ViewPreset;
  /** Bumped to ask the viewport to re-frame the camera. */
  frameKey: number;
  selectProduct: (sku: string) => void;
  loadConfig: (config: CabinetConfig) => void;
  setDim: (dim: "width" | "height" | "depth", value: number) => void;
  setMaterial: <K extends keyof MaterialSelection>(key: K, value: MaterialSelection[K]) => void;
  toggle: (key: "open" | "explode" | "countertop" | "showDims") => void;
  setUnit: (u: LengthUnit) => void;
  setView: (v: ViewPreset) => void;
}

const clampToRange = (sku: string, dim: "width" | "height" | "depth", v: number) => {
  const r = PRODUCT_MAP[sku][dim];
  if (!Number.isFinite(v)) return r.default;
  return Math.round(Math.min(r.max, Math.max(r.min, v)));
};

export const useConfigurator = create<ConfiguratorState>((set) => ({
  config: defaultConfig(PRODUCT_MAP["BX-KB-2D"]),
  open: false,
  explode: false,
  countertop: true,
  showDims: true,
  unit: "mm",
  view: "3d",
  frameKey: 0,
  selectProduct: (sku) =>
    set((s) =>
      PRODUCT_MAP[sku]
        ? { config: defaultConfig(PRODUCT_MAP[sku]), open: false, explode: false, view: "3d", frameKey: s.frameKey + 1 }
        : s,
    ),
  loadConfig: (config) => set((s) => (PRODUCT_MAP[config.sku] ? { config, view: "3d", frameKey: s.frameKey + 1 } : s)),
  setDim: (dim, value) => set((s) => ({ config: { ...s.config, [dim]: clampToRange(s.config.sku, dim, value) } })),
  setMaterial: (key, value) =>
    set((s) => {
      const next = { ...s.config, [key]: value };
      // Keep the colour valid for the chosen finish.
      if (key === "finish" && !COLOUR_MAP[next.colour]?.finishes.includes(next.finish)) {
        next.colour = coloursForFinish(next.finish)[0]?.id ?? next.colour;
      }
      return { config: next };
    }),
  toggle: (key) => set((s) => ({ [key]: !s[key] }) as Partial<ConfiguratorState>),
  setUnit: (unit) => set({ unit }),
  setView: (view) => set((s) => ({ view, frameKey: s.frameKey + 1 })),
}));
