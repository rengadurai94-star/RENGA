import { cabinetElevation } from "@/lib/drawing/elevation";
import type { CabinetConfig } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

/** Tiny front-elevation drawing of a cabinet, generated from its geometry. */
export function CabinetThumb({ config, className }: { config: CabinetConfig; className?: string }) {
  const rects = cabinetElevation(config, { handles: true });
  const pad = Math.max(config.width, config.height) * 0.06;
  const W = config.width;
  const H = config.height;
  return (
    <svg
      viewBox={`${-pad} ${-pad} ${W + 2 * pad} ${H + 2 * pad}`}
      className={cn("h-full w-full", className)}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      {rects.map((r) => (
        <rect
          key={r.id}
          x={r.x}
          y={H - r.y - r.h}
          width={r.w}
          height={r.h}
          vectorEffect="non-scaling-stroke"
          strokeWidth={1}
          stroke="currentColor"
          fill={r.kind === "handle" || r.kind === "plinth" ? "currentColor" : r.kind === "appliance" ? "currentColor" : "none"}
          fillOpacity={r.kind === "appliance" ? 0.15 : r.kind === "plinth" ? 0.25 : 1}
          strokeOpacity={r.kind === "carcass" ? 0.4 : 0.9}
        />
      ))}
    </svg>
  );
}
