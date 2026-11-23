/**
 * Scroll plumbing: one Lenis instance driven by the GSAP ticker, synced with
 * ScrollTrigger. The 3D journey ScrollTrigger is registered here so UI can
 * jump to any floor.
 */
import type Lenis from "lenis";
import type { ScrollTrigger } from "gsap/ScrollTrigger";
import { FLOORS } from "./layout";

let lenis: Lenis | null = null;
/** Timestamp until which an app-initiated scroll animation is running. */
let autoUntil = 0;
export const isAutoScrolling = () => performance.now() < autoUntil;
export const markAutoScroll = (seconds: number) => {
  autoUntil = Math.max(autoUntil, performance.now() + seconds * 1000 + 250);
};
export const clearAutoScroll = () => {
  autoUntil = 0;
};
let journeyST: ScrollTrigger | null = null;

export const setLenis = (l: Lenis | null) => {
  lenis = l;
};
export const getLenis = () => lenis;
export const setJourneyTrigger = (st: ScrollTrigger | null) => {
  journeyST = st;
};
export const getJourneyTrigger = () => journeyST;

export function lockScroll() {
  lenis?.stop();
  document.documentElement.classList.add("boxes-locked");
}

export function unlockScroll() {
  document.documentElement.classList.remove("boxes-locked");
  lenis?.start();
}

/** vh of scroll per floor stop, and the free tail after the last stop. */
export const STOP_VH = 70;
export const TAIL_VH = 45;

const stopPx = () => (STOP_VH * window.innerHeight) / 100;

/** Scroll position (px) for a floor stop (0 = overview). */
export function floorScrollY(floor: number): number | null {
  if (!journeyST) return null;
  return journeyST.start + Math.max(0, Math.min(FLOORS, floor)) * stopPx();
}

export function scrollToFloor(
  floor: number,
  opts: { immediate?: boolean; duration?: number; onComplete?: () => void } = {},
) {
  const y = floorScrollY(floor);
  if (y === null) return;
  if (lenis) {
    const duration = opts.duration ?? 1.2 + Math.min(1.2, Math.abs(floor - currentFloorFromScroll()) * 0.18);
    if (!opts.immediate) markAutoScroll(duration);
    lenis.scrollTo(y, {
      immediate: opts.immediate,
      duration,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      force: true,
      onComplete: () => {
        clearAutoScroll();
        opts.onComplete?.();
      },
    });
    if (opts.immediate) opts.onComplete?.();
  } else {
    window.scrollTo({ top: y, behavior: opts.immediate ? "auto" : "smooth" });
    if (opts.onComplete) window.setTimeout(opts.onComplete, opts.immediate ? 0 : 900);
  }
}

function currentFloorFromScroll() {
  if (!journeyST) return 0;
  return Math.min(FLOORS, Math.max(0, (window.scrollY - journeyST.start) / stopPx()));
}

export function scrollToSelector(selector: string) {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return;
  if (lenis) {
    markAutoScroll(1.6);
    lenis.scrollTo(el, { duration: 1.6, force: true, offset: 0, onComplete: clearAutoScroll });
  }
  else el.scrollIntoView({ behavior: "smooth" });
}
