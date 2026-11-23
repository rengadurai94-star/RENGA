"use client";

import { useEffect, useRef } from "react";
import { unitNumber } from "@/config/project";
import { useBoxes } from "@/lib/boxes/store";

/** Small label that follows the cursor when hovering a floor in the overview. */
export default function FloorTooltip() {
  const floor = useBoxes((s) => s.hoveredFloor);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (ref.current) ref.current.style.transform = `translate(${e.clientX + 18}px, ${e.clientY + 14}px)`;
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return (
    <div ref={ref} className="pointer-events-none fixed left-0 top-0 z-50" aria-hidden>
      {floor !== null && (
        <span className="boxes-pill">
          <b className="font-medium">Floor {String(floor).padStart(2, "0")}</b>
          <span className="text-taupe">
            {unitNumber(floor, "A")}–{unitNumber(floor, "D")} · click to explore
          </span>
        </span>
      )}
    </div>
  );
}
