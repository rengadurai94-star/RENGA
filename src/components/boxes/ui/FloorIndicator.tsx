"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { floorsList } from "@/config/project";
import { FLOORS } from "@/lib/boxes/layout";
import { journey, useBoxes, useJourneyHud } from "@/lib/boxes/store";
import { goToFloor } from "@/lib/boxes/director";

/** Elevator-style floor navigator on the right edge. */
export default function FloorIndicator() {
  const visible = useJourneyHud();
  const active = useBoxes((s) => s.activeFloor);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (bar.current) bar.current.style.transform = `scaleY(${journey.floor / FLOORS})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const stops = [...floorsList].reverse();
  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          key="floors"
          aria-label="Floors"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="fixed right-3 top-20 z-30 md:right-8 md:top-1/2 md:-translate-y-1/2"
        >
          <div className="boxes-panel relative flex flex-col items-center rounded-full px-1.5 py-3 md:px-2 md:py-4">
            <div className="absolute bottom-12 top-4 left-1/2 w-px -translate-x-1/2 bg-stone/70 md:bottom-14">
              <div ref={bar} className="h-full w-full origin-bottom bg-bronze" style={{ transform: "scaleY(0)" }} />
            </div>
            {stops.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => goToFloor(f)}
                aria-label={`Go to floor ${f}`}
                aria-current={active === f ? "true" : undefined}
                className={`relative z-10 my-px flex h-7 w-7 items-center justify-center rounded-full text-[11px] tabular-nums transition-all duration-500 md:h-9 md:w-9 ${
                  active === f ? "bg-charcoal text-paper" : "text-ash hover:bg-bone hover:text-charcoal"
                }`}
              >
                {String(f).padStart(2, "0")}
              </button>
            ))}
            <button
              type="button"
              onClick={() => goToFloor(0)}
              aria-label="View the whole building"
              aria-current={active === 0 ? "true" : undefined}
              className={`relative z-10 mt-1 flex h-7 w-7 items-center justify-center rounded-full transition-all duration-500 md:h-9 md:w-9 ${
                active === 0 ? "bg-charcoal text-paper" : "text-ash hover:bg-bone"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                <rect x="3" y="1" width="8" height="12" fill="none" stroke="currentColor" strokeWidth="1.1" />
                <path d="M3 4.5h8M3 7h8M3 9.5h8" stroke="currentColor" strokeWidth="0.8" />
              </svg>
            </button>
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
