"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CabinetConfig } from "@/lib/catalog/types";

export interface SavedConfiguration {
  id: string;
  name: string;
  config: CabinetConfig;
  price: number | null;
  savedAt: string;
}

export interface DesignItem {
  id: string;
  config: CabinetConfig;
  price: number | null;
  addedAt: string;
}

interface DesignState {
  saved: SavedConfiguration[];
  design: DesignItem[];
  saveConfiguration: (name: string, config: CabinetConfig, price: number | null) => SavedConfiguration;
  removeSaved: (id: string) => void;
  addToDesign: (config: CabinetConfig, price: number | null) => DesignItem;
  removeFromDesign: (id: string) => void;
  clearDesign: () => void;
}

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);

/**
 * Saved configurations and the working design. Persisted on this device until
 * customer accounts (Supabase) take over storage.
 */
export const useDesign = create<DesignState>()(
  persist(
    (set) => ({
      saved: [],
      design: [],
      saveConfiguration: (name, config, price) => {
        const item = { id: uid(), name, config, price, savedAt: new Date().toISOString() };
        set((s) => ({ saved: [item, ...s.saved] }));
        return item;
      },
      removeSaved: (id) => set((s) => ({ saved: s.saved.filter((x) => x.id !== id) })),
      addToDesign: (config, price) => {
        const item = { id: uid(), config, price, addedAt: new Date().toISOString() };
        set((s) => ({ design: [...s.design, item] }));
        return item;
      },
      removeFromDesign: (id) => set((s) => ({ design: s.design.filter((x) => x.id !== id) })),
      clearDesign: () => set({ design: [] }),
    }),
    { name: "boxes-design-v1", storage: createJSONStorage(() => localStorage), version: 1, skipHydration: true },
  ),
);
