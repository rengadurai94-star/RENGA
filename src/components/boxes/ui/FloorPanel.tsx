"use client";

import { AnimatePresence, motion } from "framer-motion";
import { formatArea, project, unitNumber } from "@/config/project";
import { useBoxes, useJourneyHud } from "@/lib/boxes/store";
import { selectUnit } from "@/lib/boxes/director";

const ease = [0.16, 1, 0.3, 1] as const;

function Overview() {
  const total = project.building.floors * project.building.unitsPerFloor;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-label text-bronze-dark">The tower</p>
      <h2 className="mt-3 font-display text-4xl font-light leading-[1.05] text-charcoal md:text-5xl">
        Eight floors.
        <br />
        <span className="italic text-ash">{total} homes.</span>
      </h2>
      <p className="mt-4 max-w-xs text-sm leading-relaxed text-ash">
        Four residences per floor, each facing its own direction around a shared core.
      </p>
      <div className="mt-6 grid grid-cols-4 gap-2">
        {project.units.map((u) => (
          <div key={u.id} className="border-t hairline pt-2">
            <p className="text-[10px] uppercase tracking-label text-taupe">{u.facing}</p>
            <p className="mt-1 text-sm text-charcoal">{u.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 hidden text-[10px] uppercase tracking-label text-taupe md:block">Scroll, or pick a floor →</p>
    </div>
  );
}

function FloorDetail({ floor }: { floor: number }) {
  const hovered = useBoxes((s) => s.hoveredUnit);
  return (
    <div>
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-label text-bronze-dark">Floor</p>
          <p className="font-display text-7xl font-light leading-none text-charcoal md:text-8xl">{String(floor).padStart(2, "0")}</p>
        </div>
        <p className="pb-2 text-right text-[10px] uppercase leading-relaxed tracking-label text-taupe">
          Residences
          <br />
          {unitNumber(floor, "A")} – {unitNumber(floor, "D")}
        </p>
      </div>
      <ul className="no-scrollbar mt-6 flex snap-x gap-2 overflow-x-auto md:block md:space-y-1 md:overflow-visible" role="list">
        {project.units.map((u) => {
          const active = hovered === u.id;
          return (
            <li key={u.id} className="min-w-[78%] snap-start sm:min-w-[46%] md:min-w-0">
              <button
                type="button"
                onPointerEnter={() => useBoxes.setState({ hoveredUnit: u.id })}
                onPointerLeave={() => useBoxes.getState().hoveredUnit === u.id && useBoxes.setState({ hoveredUnit: null })}
                onFocus={() => useBoxes.setState({ hoveredUnit: u.id })}
                onBlur={() => useBoxes.setState({ hoveredUnit: null })}
                onClick={() => selectUnit(floor, u.id)}
                className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-500 md:rounded-xl ${
                  active ? "border-charcoal bg-charcoal text-paper" : "hairline bg-paper/40 hover:border-charcoal/40"
                }`}
              >
                <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: u.accent }} aria-hidden />
                <span className="flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">
                      {unitNumber(floor, u.id)} <span className={active ? "text-paper/60" : "text-taupe"}>· {u.name}</span>
                    </span>
                    <span className="text-sm">{u.label}</span>
                  </span>
                  <span className={`mt-0.5 flex justify-between text-[11px] ${active ? "text-paper/70" : "text-ash"}`}>
                    <span>{u.facing} facing</span>
                    <span>
                      {formatArea(u)}
                      <sup>*</sup>
                    </span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-[10px] leading-relaxed text-taupe">
        Hover a residence to highlight it in 3D, click to open it. *Indicative placeholder areas.
      </p>
    </div>
  );
}

export default function FloorPanel() {
  const visible = useJourneyHud();
  const floor = useBoxes((s) => s.activeFloor);
  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          key="floor-panel"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.8, ease }}
          className="boxes-panel fixed inset-x-3 bottom-3 z-30 rounded-3xl p-5 md:inset-x-auto md:bottom-auto md:left-8 md:top-1/2 md:w-[23rem] md:-translate-y-1/2 md:p-7"
          aria-live="polite"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={floor}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease }}
            >
              {floor === 0 ? <Overview /> : <FloorDetail floor={floor} />}
            </motion.div>
          </AnimatePresence>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
