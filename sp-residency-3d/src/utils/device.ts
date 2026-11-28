/** True in the hosted-page build (claude.ai artifact): no iframes, downloads or dev-only editor. */
export const IS_HOSTED = import.meta.env.MODE === 'artifact';

import type { Quality } from './store';

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isTouch = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

const KEY_Q = 'spr.quality';
const KEY_INTRO = 'spr.introSeen';

function safeGet(k: string) {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return null;
  }
}
function safeSet(k: string, v: string) {
  try {
    window.localStorage.setItem(k, v);
  } catch {
    /* private mode - ignore */
  }
}

/** Start in performance mode on small / low-memory devices; remember the visitor's choice. */
export function initialQuality(): Quality {
  const saved = safeGet(KEY_Q);
  if (saved === 'high' || saved === 'low') return saved;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const lowCores = (navigator.hardwareConcurrency ?? 8) <= 4;
  const lowMem = (nav.deviceMemory ?? 8) <= 4;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  return lowCores || lowMem || small ? 'low' : 'high';
}
export const saveQuality = (q: Quality) => safeSet(KEY_Q, q);

export const introSeen = () => safeGet(KEY_INTRO) === '1';
export const markIntroSeen = () => safeSet(KEY_INTRO, '1');
