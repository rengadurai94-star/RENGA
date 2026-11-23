"use client";

import { AnimatePresence, motion } from "framer-motion";
import { formatArea, getUnit, project, unitNumber, type UnitId } from "@/config/project";
import { useBoxes } from "@/lib/boxes/store";
import { backToFloor, enterApartment, selectUnit } from "@/lib/boxes/director";
import FloorPlanSVG from "./FloorPlanSVG";

const ease = [0.16, 1, 0.3, 1] as const;

function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="border-t hairline pt-2.5">
      <p className="text-[10px] uppercase tracking-label text-taupe">{label}</p>
      <p className="mt-1 text-lg font-light text-charcoal">
        {value}
        {note && <span className="ml-1 text-[11px] text-taupe">{note}</span>}
      </p>
    </div>
  );
}

export default function UnitPanel() {
  const mode = useBoxes((s) => s.mode);
  const selected = useBoxes((s) => s.selected);
  const transitioning = useBoxes((s) => s.transitioning);
  const visible = mode === "unit" && !!selected && !transitioning;
  const ids = project.units.map((u) => u.id);

  const cycle = (dir: number) => {
    if (!selected) return;
    const i = ids.indexOf(selected.unit);
    selectUnit(selected.floor, ids[(i + dir + ids.length) % ids.length] as UnitId);
  };

  return (
    <AnimatePresence>
      {visible && selected && (
        <motion.aside
          key="unit-panel"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }}
          transition={{ duration: 0.8, ease }}
          className="boxes-panel fixed inset-x-3 bottom-3 z-30 flex max-h-[64vh] flex-col overflow-hidden rounded-3xl md:inset-x-auto md:bottom-6 md:right-6 md:top-24 md:max-h-none md:w-[25rem]"
          aria-label="Residence details"
          data-lenis-prevent
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selected.floor}-${selected.unit}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <Detail floor={selected.floor} unitId={selected.unit} onCycle={cycle} />
            </motion.div>
          </AnimatePresence>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function Detail({ floor, unitId, onCycle }: { floor: number; unitId: UnitId; onCycle: (d: number) => void }) {
  const u = getUnit(unitId);
  return (
    <>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-5 md:p-7">
        <div className="flex items-start justify-between">
          <button type="button" onClick={() => backToFloor()} className="text-[10px] uppercase tracking-label text-ash hover:text-charcoal">
            ← Floor {String(floor).padStart(2, "0")}
          </button>
          <div className="flex gap-1">
            <button
              type="button"
              aria-label="Previous residence"
              onClick={() => onCycle(-1)}
              className="h-8 w-8 rounded-full border hairline text-sm hover:border-charcoal"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next residence"
              onClick={() => onCycle(1)}
              className="h-8 w-8 rounded-full border hairline text-sm hover:border-charcoal"
            >
              ›
            </button>
          </div>
        </div>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-label text-bronze-dark">Residence {unitNumber(floor, unitId)}</p>
            <h2 className="mt-1 font-display text-5xl font-light leading-none text-charcoal">{u.label}</h2>
          </div>
          <span className="mb-1 flex items-center gap-2 rounded-full border hairline px-3 py-1.5 text-[11px] text-ash">
            <span className="h-2 w-2 rounded-full" style={{ background: u.accent }} />
            {u.facing} facing
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ash">{u.summary}</p>

        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
          <Stat label="Area*" value={formatArea(u)} />
          <Stat label="Bedrooms" value={u.bedrooms} />
          <Stat label="Bathrooms" value={u.bathrooms} note={u.bathroomNote} />
          <Stat label="Balconies" value={u.balconies} />
        </div>
        <p className="mt-2 text-[11px] text-ash">{u.balconyNote}</p>

        <div className="mt-5 rounded-2xl bg-bone/70 p-3">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-label text-taupe">Conceptual floor plan</p>
            <p className="text-[10px] uppercase tracking-label text-taupe">Not to scale</p>
          </div>
          <FloorPlanSVG unitId={unitId} className="mx-auto h-56 w-full md:h-64" labels="names" />
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {u.highlights.map((h) => (
            <span key={h} className="rounded-full border hairline px-3 py-1 text-[11px] text-ash">
              {h}
            </span>
          ))}
        </div>

        <p className="mt-5 text-[10px] leading-relaxed text-taupe">
          *Areas, dimensions and layouts are illustrative placeholders for this prototype and are not approved project information.
        </p>
      </div>
      <div className="flex gap-2 border-t hairline bg-paper/70 px-5 py-4 md:px-7">
        <button type="button" onClick={enterApartment} className="btn-primary flex-1">
          Enter apartment
        </button>
        <button type="button" onClick={() => backToFloor()} className="btn-ghost !px-4">
          Back
        </button>
      </div>
    </>
  );
}
