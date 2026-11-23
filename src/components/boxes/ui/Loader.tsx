"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { project } from "@/config/project";
import { useBoxes } from "@/lib/boxes/store";

const STAGES = ["Preparing the site", "Raising the structure", "Glazing the facade", "Setting the light"];

export default function Loader() {
  const progress = useBoxes((s) => s.progress);
  const ready = useBoxes((s) => s.ready);
  const [shown, setShown] = useState(0);
  const [done, setDone] = useState(false);
  const start = useRef(0);
  const target = useRef(0);
  useEffect(() => {
    target.current = progress;
  }, [progress]);

  useEffect(() => {
    start.current = performance.now();
    // Time-based easing (independent of frame rate, which can be very low on slow GPUs).
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.5, (now - last) / 1000);
      last = now;
      setShown((v) => {
        const t = target.current * 100;
        const next = v + (t - v) * (1 - Math.exp(-dt * 5)) + (v < t ? dt * 8 : 0);
        return Math.min(t, next);
      });
    }, 50);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!ready || shown < 99.4 || done) return;
    const elapsed = performance.now() - start.current;
    const id = window.setTimeout(() => setDone(true), Math.max(250, 1500 - elapsed));
    return () => window.clearTimeout(id);
  }, [ready, shown, done]);

  const stage = STAGES[Math.min(STAGES.length - 1, Math.floor((shown / 100) * STAGES.length))];

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-paper"
          exit={{ opacity: 0, transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] } }}
          role="status"
          aria-live="polite"
          aria-label={`Loading ${project.name}: ${Math.round(shown)} percent`}
        >
          <div className="flex items-center gap-[0.42em] font-sans text-3xl font-light tracking-brand text-charcoal md:text-5xl">
            {project.name.split("").map((l, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.09, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                {l}
              </motion.span>
            ))}
          </div>
          <motion.p
            className="mt-5 text-[11px] uppercase tracking-label text-taupe"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            {project.location.area} · {project.location.city}
          </motion.p>
          <div className="mt-12 h-px w-56 overflow-hidden bg-stone/60 md:w-72">
            <div className="h-full bg-charcoal transition-[width] duration-150" style={{ width: `${shown}%` }} />
          </div>
          <div className="mt-4 flex w-56 justify-between text-[10px] uppercase tracking-label text-taupe md:w-72">
            <span>{stage}</span>
            <span className="tabular-nums">{String(Math.round(shown)).padStart(2, "0")}%</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
