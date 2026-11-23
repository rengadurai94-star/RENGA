"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function Preloader() {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const start = performance.now();
    const duration = 1800;

    let raf = 0;
    const tick = (t: number) => {
      const elapsed = t - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);
      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          setDone(true);
          document.body.style.overflow = "";
        }, 350);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black"
        >
          <p className="font-display text-2xl italic text-warm md:text-3xl">
            Urban Mark Interior
          </p>
          <div className="mt-8 flex items-center gap-4">
            <div className="h-px w-40 bg-warm/20 md:w-56">
              <motion.div
                className="h-px bg-gold-bright"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="w-10 text-xs tabular-nums text-gold-bright">{progress}%</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
