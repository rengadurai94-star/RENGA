"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { project } from "@/config/project";
import { useBoxes } from "@/lib/boxes/store";
import { backToFloor, goToFloor } from "@/lib/boxes/director";
import { scrollToSelector } from "@/lib/boxes/scroll";

export const NAV = [
  { id: "explore", label: "Explore" },
  { id: "overview", label: "Overview" },
  { id: "location", label: "Location" },
  { id: "amenities", label: "Amenities" },
  { id: "residences", label: "Residences" },
  { id: "specifications", label: "Specifications" },
  { id: "gallery", label: "Gallery" },
];

export function navigate(id: string) {
  const s = useBoxes.getState();
  if (s.mode === "interior") return;
  if (s.mode === "unit") backToFloor(false);
  if (id === "explore") {
    goToFloor(0);
    return;
  }
  window.setTimeout(() => scrollToSelector(`#${id}`), 30);
}

export default function TopBar() {
  const entered = useBoxes((s) => s.entered);
  const mode = useBoxes((s) => s.mode);
  const solid = useBoxes((s) => s.pastJourney);
  const [open, setOpen] = useState(false);
  const visible = entered && mode !== "interior";

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.header
            key="topbar"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 py-4 md:px-10 md:py-6"
          >
            <div
              className={`pointer-events-none absolute inset-x-0 top-0 -z-10 transition-all duration-700 ${
                solid ? "h-full border-b hairline bg-paper/85 backdrop-blur-md" : "h-28 bg-gradient-to-b from-paper/80 via-paper/40 to-transparent"
              }`}
              aria-hidden
            />
            <button type="button" onClick={() => navigate("explore")} className="group flex items-baseline gap-4 text-left" aria-label={`${project.name} — back to the tower`}>
              <span className="font-sans text-lg font-light tracking-brand text-charcoal md:text-xl">{project.name}</span>
              <span className="hidden text-[10px] uppercase tracking-label text-taupe sm:inline">
                {project.location.area}, {project.location.city}
              </span>
            </button>
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
              {NAV.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => navigate(n.id)}
                  className="rounded-full px-3 py-2 text-[11px] uppercase tracking-label text-ash transition-colors duration-300 hover:text-charcoal"
                >
                  {n.label}
                </button>
              ))}
              <button type="button" onClick={() => navigate("enquire")} className="btn-primary ml-3 !px-5 !py-3">
                Enquire
              </button>
            </nav>
            <button
              type="button"
              className="boxes-panel flex h-11 w-11 items-center justify-center rounded-full lg:hidden"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <span className="flex flex-col gap-1.5">
                <span className="block h-px w-5 bg-charcoal" />
                <span className="block h-px w-3.5 bg-charcoal" />
              </span>
            </button>
          </motion.header>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <motion.div
            key="menu"
            className="fixed inset-0 z-[80] flex flex-col bg-paper px-6 py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="flex items-center justify-between">
              <span className="font-sans text-lg font-light tracking-brand">{project.name}</span>
              <button type="button" onClick={() => setOpen(false)} className="h-11 w-11 text-2xl font-light" aria-label="Close menu">
                ×
              </button>
            </div>
            <nav className="mt-12 flex flex-col gap-2" aria-label="Mobile">
              {[...NAV, { id: "enquire", label: "Enquire" }].map((n, i) => (
                <motion.button
                  key={n.id}
                  type="button"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => {
                    setOpen(false);
                    navigate(n.id);
                  }}
                  className="text-left font-display text-4xl font-light text-charcoal"
                >
                  {n.label}
                </motion.button>
              ))}
            </nav>
            <p className="mt-auto text-[11px] uppercase tracking-label text-taupe">Conceptual prototype</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
