import { create } from "zustand";
import type { UnitId } from "@/config/project";

export type Mode = "intro" | "explore" | "unit" | "interior";

export interface Selection {
  floor: number;
  unit: UnitId;
}

interface State {
  /** Loader progress 0..1 and readiness. */
  progress: number;
  ready: boolean;
  webgl: "unknown" | "ok" | "unsupported" | "error";
  errorMessage: string | null;

  mode: Mode;
  entered: boolean;
  /** Nearest floor stop to the scroll position (0 = whole building). */
  activeFloor: number;
  hoveredUnit: UnitId | null;
  hoveredFloor: number | null;
  selected: Selection | null;
  room: string | null;
  interiorView: "walk" | "dollhouse";
  transitioning: boolean;
  /** Whether the 3D journey section is on screen (pauses rendering otherwise). */
  inJourney: boolean;
  /** Scrolled past the last floor stop (content sections take over). */
  pastJourney: boolean;
  lowPower: boolean;

  set: (p: Partial<State>) => void;
}

export const useBoxes = create<State>((set) => ({
  progress: 0,
  ready: false,
  webgl: "unknown",
  errorMessage: null,
  mode: "intro",
  entered: false,
  activeFloor: 0,
  hoveredUnit: null,
  hoveredFloor: null,
  selected: null,
  room: null,
  interiorView: "walk",
  transitioning: false,
  inJourney: true,
  pastJourney: false,
  lowPower: false,
  set: (p) => set(p),
}));

/** HUD for the scroll journey is visible. */
export const useJourneyHud = () =>
  useBoxes((s) => s.entered && s.mode === "explore" && s.inJourney && !s.pastJourney && s.webgl !== "unsupported");

/* ------------------------------------------------------------------ */
/* Non-reactive, per-frame values written by GSAP / input handlers.     */
/* ------------------------------------------------------------------ */

/** Screenshot/capture mode: UI hidden, subject centred. */
export const view = { centered: false };

/** Continuous floor position driven by ScrollTrigger (0..floors). */
export const journey = { floor: 0 };

/** Intro timeline progress 0..1 (clouds part, camera approaches). */
export const intro = { t: 0, clouds: 0 };

/** User camera offsets on top of the scripted rig. */
export const orbit = { az: 0, el: 0, zoom: 1 };

/** Dive progress into a unit (0..1) during the enter-apartment transition. */
export const dive = { t: 0 };

/** First-person walker state in the interior (plan coords, radians). */
export const walker = {
  x: 0,
  z: 0,
  yaw: 0,
  pitch: 0,
  fov: 62,
  busy: false,
};
