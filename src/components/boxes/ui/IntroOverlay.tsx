"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { project } from "@/config/project";
import { useBoxes } from "@/lib/boxes/store";
import { enterExperience } from "@/lib/boxes/director";

const ease = [0.16, 1, 0.3, 1] as const;

export default function IntroOverlay() {
  const ready = useBoxes((s) => s.ready);
  const entered = useBoxes((s) => s.entered);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const id = window.setTimeout(() => setShowText(true), 2300);
    return () => window.clearTimeout(id);
  }, [ready]);

  useEffect(() => {
    if (!ready || entered) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && showText) enterExperience();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready, entered, showText]);

  return (
    <AnimatePresence>
      {ready && !entered && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-40"
          exit={{ opacity: 0, transition: { duration: 0.9, ease } }}
        >
          {/* mist that burns off as the clouds part */}
          <motion.div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-paper via-paper/90 to-paper/60"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 3.2, ease: "easeInOut", delay: 0.2 }}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-paper/85 via-paper/30 to-transparent md:inset-y-0 md:left-0 md:h-auto md:w-[60%] md:bg-gradient-to-r" />

          <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-6 py-6 md:px-12 md:py-8">
            <motion.span
              className="text-[11px] uppercase tracking-label text-ash"
              initial={{ opacity: 0 }}
              animate={{ opacity: showText ? 1 : 0 }}
              transition={{ duration: 1, ease }}
            >
              A conceptual residential tower
            </motion.span>
            <motion.span
              className="hidden text-[11px] uppercase tracking-label text-ash md:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: showText ? 1 : 0 }}
              transition={{ duration: 1, delay: 0.2, ease }}
            >
              {project.location.state}, {project.location.country}
            </motion.span>
          </div>

          <div className="absolute bottom-10 left-6 right-6 md:bottom-16 md:left-12 md:right-auto md:max-w-[52rem]">
            <AnimatePresence>
              {showText && (
                <motion.div key="copy" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.12 } } }}>
                  <motion.p variants={item} className="mb-5 text-[11px] uppercase tracking-label text-bronze-dark">
                    {project.location.area} · {project.location.city}
                  </motion.p>
                  <h1 className="flex font-sans text-[22vw] font-extralight leading-[0.85] tracking-[0.06em] text-charcoal md:text-[11.5rem]">
                    {project.name.split("").map((l, i) => (
                      <motion.span key={i} variants={letter} className="inline-block">
                        {l}
                      </motion.span>
                    ))}
                  </h1>
                  <motion.p variants={item} className="mt-6 max-w-md font-display text-2xl italic leading-snug text-ash md:text-3xl">
                    {project.tagline}
                  </motion.p>
                  <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-5">
                    <button type="button" onClick={enterExperience} className="btn-primary group pointer-events-auto">
                      Enter experience
                      <span className="inline-block h-px w-6 bg-paper transition-all duration-500 group-hover:w-10" />
                    </button>
                    <span className="text-[11px] uppercase tracking-label text-taupe">
                      {project.building.floors} floors · {project.building.floors * project.building.unitsPerFloor} residences · 2–5 BHK
                    </span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 1.1, ease } },
};
const letter = {
  hidden: { opacity: 0, y: "40%", filter: "blur(8px)" },
  show: { opacity: 1, y: "0%", filter: "blur(0px)", transition: { duration: 1.4, ease } },
};
