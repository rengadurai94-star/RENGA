"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { parseUnitNumber } from "@/config/project";
import { FLOORS } from "@/lib/boxes/layout";
import { dive, useBoxes, view } from "@/lib/boxes/store";
import { scrollToFloor } from "@/lib/boxes/scroll";
import { selectUnit, setInteriorView, skipIntro } from "@/lib/boxes/director";

/**
 * Shareable deep links:
 *   ?floor=3                    jump to a floor
 *   ?unit=302                   open a residence on its floor
 *   ?unit=302&enter=1           walk inside
 *   ?unit=302&room=kitchen      walk inside, straight to a room
 *   ?unit=302&view=dollhouse    inside, in dollhouse view
 */
export function useDeepLink() {
  const ready = useBoxes((s) => s.ready);
  useEffect(() => {
    if (!ready) return;
    const q = new URLSearchParams(window.location.search);
    if (q.has("capture")) {
      view.centered = true;
      document.documentElement.classList.add("boxes-capture");
    }
    const unitParam = q.get("unit");
    const floorParam = q.get("floor");
    if (!unitParam && !floorParam && !q.has("skip")) return;
    skipIntro();
    const t = window.setTimeout(() => {
      if (unitParam) {
        const sel = parseUnitNumber(unitParam);
        if (!sel) return;
        scrollToFloor(sel.floor, { immediate: true });
        window.setTimeout(() => {
          selectUnit(sel.floor, sel.unitId);
          const room = q.get("room");
          const view = q.get("view");
          if (room || view || q.get("enter")) {
            window.setTimeout(() => {
              gsap.set("#boxes-fader", { opacity: 0 });
              dive.t = 0;
              useBoxes.setState({ mode: "interior", room: room ?? null, interiorView: view === "dollhouse" ? "dollhouse" : "walk" });
              if (view === "dollhouse") setInteriorView("dollhouse");
            }, 300);
          }
        }, 120);
      } else if (floorParam) {
        const f = Math.max(0, Math.min(FLOORS, Number(floorParam) || 0));
        scrollToFloor(f, { immediate: true });
      }
    }, 60);
    return () => window.clearTimeout(t);
  }, [ready]);
}
