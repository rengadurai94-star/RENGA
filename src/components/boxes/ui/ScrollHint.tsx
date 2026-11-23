"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useBoxes, useJourneyHud } from "@/lib/boxes/store";

export default function ScrollHint() {
  const hud = useJourneyHud();
  const floor = useBoxes((s) => s.activeFloor);
  const visible = hud && floor === 0;
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 1.2, duration: 1 } }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed bottom-8 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex"
        >
          <span className="text-[10px] uppercase tracking-label text-ash">Scroll to rise through the floors</span>
          <span className="relative block h-10 w-px overflow-hidden bg-stone/50">
            <span className="animate-scroll-line absolute inset-0 bg-charcoal" />
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
