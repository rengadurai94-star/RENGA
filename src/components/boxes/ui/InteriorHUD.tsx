"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { floorPlans } from "@/config/floorplans";
import { getUnit, unitNumber } from "@/config/project";
import { navigableRooms } from "@/lib/boxes/plan";
import { useBoxes, walker } from "@/lib/boxes/store";
import { exitApartment, requestRoom, setInteriorView } from "@/lib/boxes/director";
import FloorPlanSVG, { planToSvg } from "./FloorPlanSVG";

const ease = [0.16, 1, 0.3, 1] as const;

function Minimap({ unitId, room }: { unitId: "A" | "B" | "C" | "D"; room: string | null }) {
  const marker = useRef<SVGGElement>(null);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (marker.current) {
        const [x, y] = planToSvg(unitId, walker.x, walker.z);
        const ang = (Math.atan2(-Math.cos(walker.yaw), -Math.sin(walker.yaw)) * 180) / Math.PI;
        marker.current.setAttribute("transform", `translate(${x} ${y}) rotate(${ang})`);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [unitId]);
  return (
    <FloorPlanSVG
      unitId={unitId}
      className="h-full w-full"
      activeRoom={room}
      labels="none"
      markerRef={marker}
      onRoomClick={(id) => requestRoom(id)}
    />
  );
}

export default function InteriorHUD() {
  const mode = useBoxes((s) => s.mode);
  const selected = useBoxes((s) => s.selected);
  const transitioning = useBoxes((s) => s.transitioning);
  const visible = mode === "interior" && !!selected;
  return (
    <AnimatePresence>
      {visible && selected && (
        <motion.div
          key="interior-hud"
          initial={{ opacity: 0 }}
          animate={{ opacity: transitioning ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease }}
          className="pointer-events-none fixed inset-0 z-40"
        >
          <HudBody floor={selected.floor} unitId={selected.unit} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function HudBody({ floor, unitId }: { floor: number; unitId: "A" | "B" | "C" | "D" }) {
  const room = useBoxes((s) => s.room);
  const view = useBoxes((s) => s.interiorView);
  const [help, setHelp] = useState(true);
  const [mapOpen, setMapOpen] = useState(() => window.innerWidth >= 768);
  const plan = floorPlans[unitId];
  const rooms = useMemo(() => navigableRooms(plan), [plan]);
  const current = plan.rooms.find((r) => r.id === room);
  const selected = { floor, unit: unitId };
  const u = getUnit(unitId);

  useEffect(() => {
    const id = window.setTimeout(() => setHelp(false), 9000);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <>
      {/* header */}
      <div className="pointer-events-auto absolute left-3 right-3 top-3 flex items-start justify-between gap-3 md:left-6 md:right-6 md:top-6">
        <div className="boxes-panel rounded-2xl px-4 py-3 md:px-5">
          <p className="text-[10px] uppercase tracking-label text-bronze-dark">
            Residence {unitNumber(selected.floor, selected.unit)} · {u.label} · {u.facing} facing
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={current?.id ?? "none"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
              className="font-display text-2xl font-light text-charcoal md:text-3xl"
            >
              {view === "dollhouse" ? "Dollhouse view" : (current?.name ?? "Walkthrough")}
            </motion.p>
          </AnimatePresence>
          <p className="mt-0.5 text-[10px] uppercase tracking-label text-taupe">Conceptual demo · procedural interior</p>
        </div>
        <button type="button" onClick={exitApartment} className="btn-primary shrink-0">
          Exit apartment
        </button>
      </div>

      {/* view toggle + help */}
      <div className="pointer-events-auto absolute bottom-[5.5rem] left-3 flex flex-col items-start gap-2 md:bottom-28 md:left-6">
        <div className="boxes-panel flex rounded-full p-1">
          {(["walk", "dollhouse"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setInteriorView(v)}
              aria-pressed={view === v}
              className={`rounded-full px-4 py-2 text-[10px] uppercase tracking-label transition-colors duration-300 ${
                view === v ? "bg-charcoal text-paper" : "text-ash hover:text-charcoal"
              }`}
            >
              {v === "walk" ? "Walk" : "Dollhouse"}
            </button>
          ))}
        </div>
        <AnimatePresence>
          {help && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="boxes-panel max-w-[18rem] rounded-2xl px-4 py-3 text-[11px] leading-relaxed text-ash"
            >
              {view === "walk" ? (
                <>
                  <b className="font-medium text-charcoal">Drag</b> to look around · <b className="font-medium text-charcoal">W A S D</b> /
                  arrows to walk · <b className="font-medium text-charcoal">scroll</b> to zoom · click the floor rings or the rooms below to
                  move.
                </>
              ) : (
                <>
                  <b className="font-medium text-charcoal">Drag</b> to orbit · <b className="font-medium text-charcoal">scroll</b> to zoom ·
                  click a room marker to step inside.
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        {!help && (
          <button
            type="button"
            onClick={() => setHelp(true)}
            className="boxes-panel h-8 w-8 rounded-full text-xs text-ash"
            aria-label="Show controls"
          >
            ?
          </button>
        )}
      </div>

      {/* minimap */}
      <div className="pointer-events-auto absolute bottom-[5.5rem] right-3 md:bottom-28 md:right-6">
        {mapOpen ? (
          <div className="boxes-panel w-44 rounded-2xl p-2 md:w-56">
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-[9px] uppercase tracking-label text-taupe">Plan · you are here</span>
              <button
                type="button"
                onClick={() => setMapOpen(false)}
                className="text-xs text-taupe hover:text-charcoal"
                aria-label="Hide plan"
              >
                –
              </button>
            </div>
            <div className="aspect-square">
              <Minimap unitId={selected.unit} room={room} />
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setMapOpen(true)}
            className="boxes-panel rounded-full px-4 py-2 text-[10px] uppercase tracking-label text-ash"
          >
            Plan
          </button>
        )}
      </div>

      {/* rooms */}
      <nav
        aria-label="Rooms"
        className="pointer-events-auto absolute inset-x-3 bottom-3 md:inset-x-auto md:bottom-6 md:left-1/2 md:max-w-[min(64rem,calc(100vw-3rem))] md:-translate-x-1/2"
      >
        <div className="boxes-panel no-scrollbar flex gap-1 overflow-x-auto rounded-full p-1.5" data-lenis-prevent>
          {rooms.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                if (view === "dollhouse") {
                  useBoxes.setState({ room: r.id });
                  setInteriorView("walk");
                } else requestRoom(r.id);
              }}
              aria-current={room === r.id ? "true" : undefined}
              className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-[11px] transition-colors duration-300 ${
                room === r.id ? "bg-charcoal text-paper" : "text-ash hover:bg-bone hover:text-charcoal"
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
