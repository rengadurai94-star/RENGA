import { useSyncExternalStore } from 'react';

/**
 * Tiny global store (no extra dependency). It is the single place where the
 * 3D building, the 2D plans and the UI panels read and write the current
 * floor / apartment, which is what keeps them synchronised.
 */
export type Quality = 'high' | 'low';
export type Section = 'hero' | 'explore' | 'other';

export interface AppState {
  introDone: boolean;
  introSkipped: boolean;
  section: Section;
  /** Explorer step: 0 = whole building, 1.. = floors bottom-up. */
  step: number;
  floorId: string | null;
  hoveredUnit: string | null;
  selectedUnit: string | null;
  detailOpen: boolean;
  quality: Quality;
  webgl: boolean;
  zoom: number;
  resetToken: number;
  sceneReady: boolean;
  /** Incremented by "Replay intro" to play the intro even on return visits. */
  introRun: number;
  /** True when the site switched itself to performance mode because frame rate was low. */
  autoLowered: boolean;
  /** Quality forced via ?quality=high|low - disables automatic lowering. */
  qualityLocked: boolean;
}

type Listener = () => void;

const listeners = new Set<Listener>();
let state: AppState = {
  introDone: false,
  introSkipped: false,
  section: 'hero',
  step: 0,
  floorId: null,
  hoveredUnit: null,
  selectedUnit: null,
  detailOpen: false,
  quality: 'high',
  webgl: true,
  zoom: 1,
  resetToken: 0,
  sceneReady: false,
  introRun: 0,
  autoLowered: false,
  qualityLocked: false,
};

export const getState = () => state;

export function setState(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
  const p = typeof patch === 'function' ? patch(state) : patch;
  let changed = false;
  for (const k in p) {
    if ((p as Record<string, unknown>)[k] !== (state as unknown as Record<string, unknown>)[k]) {
      changed = true;
      break;
    }
  }
  if (!changed) return;
  state = { ...state, ...p };
  listeners.forEach((l) => l());
}

export function subscribe(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}
