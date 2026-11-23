"use client";

import gsap from "gsap";
import { AnimatePresence, motion } from "framer-motion";
import { orbit, useBoxes } from "@/lib/boxes/store";

function zoom(f: number) {
  gsap.to(orbit, { zoom: Math.min(1.8, Math.max(0.45, orbit.zoom * f)), duration: 0.7, ease: "power2.out" });
}
function rotate(d: number) {
  gsap.to(orbit, { az: Math.max(-150, Math.min(150, orbit.az + d)), duration: 0.9, ease: "power2.out" });
}
function reset() {
  gsap.to(orbit, { az: 0, el: 0, zoom: 1, duration: 0.9, ease: "power2.out" });
}

/** Orbit / zoom buttons for the exterior views (also keyboard accessible). */
export default function ViewControls() {
  const visible = useBoxes(
    (s) => s.entered && !s.transitioning && s.webgl !== "unsupported" && ((s.mode === "explore" && s.inJourney && !s.pastJourney) || s.mode === "unit"),
  );
  const mode = useBoxes((s) => s.mode);
  const btn = "flex h-9 w-9 items-center justify-center rounded-full text-ash transition-colors hover:bg-bone hover:text-charcoal";
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="view-controls"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={`boxes-panel fixed z-30 hidden items-center gap-0.5 rounded-full p-1 md:flex ${
            mode === "unit" ? "bottom-6 left-8" : "bottom-8 right-8"
          }`}
          role="toolbar"
          aria-label="3D view controls"
        >
          <button type="button" className={btn} onClick={() => rotate(-30)} aria-label="Rotate left">
            ↺
          </button>
          <button type="button" className={btn} onClick={() => rotate(30)} aria-label="Rotate right">
            ↻
          </button>
          <span className="mx-1 h-4 w-px bg-stone" />
          <button type="button" className={btn} onClick={() => zoom(0.82)} aria-label="Zoom in">
            +
          </button>
          <button type="button" className={btn} onClick={() => zoom(1.22)} aria-label="Zoom out">
            −
          </button>
          <span className="mx-1 h-4 w-px bg-stone" />
          <button type="button" className={`${btn} w-auto px-3 text-[10px] uppercase tracking-label`} onClick={reset}>
            Reset
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
