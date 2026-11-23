"use client";

import { memo, type Ref } from "react";
import { floorPlans, type RoomType } from "@/config/floorplans";
import { getUnit, type UnitId } from "@/config/project";
import { FACING_BEARING } from "@/lib/boxes/layout";
import {
  WINDOW_SPEC,
  doors,
  formatFeet,
  interiorWalls,
  planBounds,
  roomCenter,
  roomSize,
  sideLine,
  windowsOn,
  type ExtSide,
} from "@/lib/boxes/plan";

const TONE: Partial<Record<RoomType, string>> = {
  living: "#f1ece3",
  dining: "#f1ece3",
  foyer: "#f1ece3",
  lounge: "#efe9df",
  media: "#e9e3d9",
  passage: "#f1ece3",
  master: "#eadfcf",
  bedroom: "#ede4d6",
  dress: "#e6dccd",
  study: "#e9e0d2",
  bath: "#e4e7e6",
  powder: "#e4e7e6",
  kitchen: "#ece8e1",
  utility: "#ece8e1",
  store: "#e8e4dd",
  pooja: "#f0e4cf",
  balcony: "#f7f4ef",
};

export interface FloorPlanSVGProps {
  unitId: UnitId;
  className?: string;
  activeRoom?: string | null;
  onRoomClick?: (roomId: string) => void;
  labels?: "full" | "names" | "none";
  markerRef?: Ref<SVGGElement>;
  title?: string;
}

function FloorPlanSVGInner({ unitId, className, activeRoom, onRoomClick, labels = "full", markerRef, title }: FloorPlanSVGProps) {
  const plan = floorPlans[unitId];
  const unit = getUnit(unitId);
  const [bx0, bz0, bx1, bz1] = planBounds(plan);
  const m = 1.6;
  const X = (x: number) => bx1 - x; // viewed from above with the facade at the top
  const Y = (z: number) => bz1 - z;
  const W = bx1 - bx0;
  const H = bz1 - bz0;
  const vb = `${-m} ${-m} ${W + m * 2} ${H + m * 2}`;
  const north = -FACING_BEARING[unit.facing];

  const segLine = (orient: "h" | "v", at: number, a: number, b: number) =>
    orient === "h" ? { x1: X(a), y1: Y(at), x2: X(b), y2: Y(at) } : { x1: X(at), y1: Y(a), x2: X(at), y2: Y(b) };

  const extSides: ExtSide[] = ["front", "left", "right", "back"];

  return (
    <svg viewBox={vb} className={className} role="img" aria-label={title ?? `${unit.name} conceptual floor plan`}>
      <title>{title ?? `${unit.name} — conceptual floor plan`}</title>
      {/* rooms */}
      {plan.rooms.map((r) => {
        const [x0, z0, x1, z1] = r.rect;
        const active = activeRoom === r.id;
        return (
          <rect
            key={r.id}
            x={X(x1)}
            y={Y(z1)}
            width={x1 - x0}
            height={z1 - z0}
            fill={active ? "#d9c3a3" : TONE[r.type] ?? "#eee"}
            stroke={r.outdoor ? "#9d968c" : "none"}
            strokeWidth={r.outdoor ? 0.05 : 0}
            strokeDasharray={r.outdoor ? "0.18 0.12" : undefined}
            className={onRoomClick && r.type !== "store" && r.type !== "passage" ? "cursor-pointer transition-[fill] duration-300 hover:fill-[#e2d2bb]" : undefined}
            onClick={onRoomClick ? () => onRoomClick(r.id) : undefined}
          />
        );
      })}
      {/* interior walls */}
      {interiorWalls(plan).map((s, i) => (
        <line key={i} {...segLine(s.orient, s.at, s.from - 0.06, s.to + 0.06)} stroke="#2b2a28" strokeWidth={0.13} strokeLinecap="square" />
      ))}
      {/* exterior walls with window gaps */}
      {extSides.map((side) => {
        const line = sideLine(plan, side);
        const gaps = windowsOn(plan, side).map((w) => ({ from: w.from, to: w.to, kind: w.kind }));
        if (side === "back") gaps.push({ from: plan.entry[0], to: plan.entry[1], kind: "window" as const });
        gaps.sort((a, b) => a.from - b.from);
        const solids: [number, number][] = [];
        let c = line.from;
        for (const g of gaps) {
          solids.push([c, g.from]);
          c = g.to;
        }
        solids.push([c, line.to]);
        const inset = 0.11;
        const at = side === "front" ? line.at - inset : side === "back" ? line.at + inset : side === "left" ? line.at + inset : line.at - inset;
        return (
          <g key={side}>
            {solids.map(([a, b], i) => (
              <line key={i} {...segLine(line.orient, at, a - (i === 0 ? 0.11 : 0), b + (i === solids.length - 1 ? 0.11 : 0))} stroke="#2b2a28" strokeWidth={0.24} />
            ))}
            {side !== "back" &&
              windowsOn(plan, side).map((w, i) => (
                <g key={`w${i}`}>
                  <line {...segLine(line.orient, at - 0.08, w.from, w.to)} stroke="#6f6a64" strokeWidth={0.035} />
                  <line {...segLine(line.orient, at + 0.08, w.from, w.to)} stroke="#6f6a64" strokeWidth={0.035} />
                  {WINDOW_SPEC[w.kind].sill === 0 && <line {...segLine(line.orient, at, w.from, w.to)} stroke="#a27b52" strokeWidth={0.05} />}
                </g>
              ))}
          </g>
        );
      })}
      {/* door swings */}
      {doors(plan)
        .filter((d) => d.kind !== "open")
        .map((d, i) => {
          const w = d.to - d.from;
          const sign = d.kind === "entry" ? 1 : 1;
          if (d.orient === "h") {
            const hx = X(d.from);
            const hy = Y(d.at);
            const ex = X(d.to);
            const ty = hy - sign * w;
            return (
              <g key={i}>
                <line x1={hx} y1={hy} x2={hx} y2={ty} stroke="#6f6a64" strokeWidth={0.04} />
                <path d={`M ${hx} ${ty} A ${w} ${w} 0 0 ${ex < hx ? 0 : 1} ${ex} ${hy}`} fill="none" stroke="#9d968c" strokeWidth={0.025} />
              </g>
            );
          }
          const hx = X(d.at);
          const hy = Y(d.from);
          const ey = Y(d.to);
          const tx = hx + w;
          return (
            <g key={i}>
              <line x1={hx} y1={hy} x2={tx} y2={hy} stroke="#6f6a64" strokeWidth={0.04} />
              <path d={`M ${tx} ${hy} A ${w} ${w} 0 0 ${ey < hy ? 0 : 1} ${hx} ${ey}`} fill="none" stroke="#9d968c" strokeWidth={0.025} />
            </g>
          );
        })}
      {/* labels */}
      {labels !== "none" &&
        plan.rooms
          .filter((r) => r.type !== "store" && r.type !== "passage")
          .map((r) => {
            const [cx, cz] = roomCenter(r);
            const [w, d] = roomSize(r);
            const small = Math.min(w, d) < 2.3;
            const name = small ? r.name.replace("Bedroom", "Bed").replace("Master ", "M. ").replace(" Room", "").replace("Balcony", "Balc.") : r.name;
            return (
              <g key={r.id} pointerEvents="none">
                <text
                  x={X(cx)}
                  y={Y(cz) - (labels === "full" && !small ? 0.12 : -0.12)}
                  textAnchor="middle"
                  fontSize={small ? 0.3 : 0.42}
                  fill="#2b2a28"
                  style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.02em" }}
                >
                  {name}
                </text>
                {labels === "full" && !small && (
                  <text x={X(cx)} y={Y(cz) + 0.42} textAnchor="middle" fontSize={0.3} fill="#7a7570" style={{ fontFamily: "var(--font-sans)" }}>
                    {formatFeet(w)} × {formatFeet(d)}
                  </text>
                )}
              </g>
            );
          })}
      {/* entry marker */}
      <g transform={`translate(${X((plan.entry[0] + plan.entry[1]) / 2)} ${Y(0) + 0.9})`} pointerEvents="none">
        <path d="M 0 0.25 L 0 -0.45 M -0.22 -0.2 L 0 -0.45 L 0.22 -0.2" stroke="#a27b52" strokeWidth={0.07} fill="none" />
        <text y={0.75} textAnchor="middle" fontSize={0.28} fill="#a27b52" style={{ fontFamily: "var(--font-sans)", letterSpacing: "0.15em" }}>
          ENTRY
        </text>
      </g>
      {/* north arrow */}
      <g transform={`translate(${W + m * 0.35} ${-m * 0.2}) rotate(${north})`} pointerEvents="none">
        <circle r={0.62} fill="none" stroke="#9d968c" strokeWidth={0.03} />
        <path d="M 0 -0.5 L 0.2 0.25 L 0 0.1 L -0.2 0.25 Z" fill="#2b2a28" />
        <text y={-0.72} textAnchor="middle" fontSize={0.34} fill="#2b2a28" transform={`rotate(${-north} 0 -0.85)`} style={{ fontFamily: "var(--font-sans)" }}>
          N
        </text>
      </g>
      {/* live position marker (walkthrough minimap) */}
      {markerRef && (
        <g ref={markerRef} style={{ transition: "none" }}>
          <path d="M 0 0 L 2.2 -1.0 A 2.4 2.4 0 0 1 2.2 1.0 Z" fill="#a27b52" opacity={0.28} />
          <circle r={0.32} fill="#a27b52" stroke="#fbfaf7" strokeWidth={0.1} />
        </g>
      )}
    </svg>
  );
}

const FloorPlanSVG = memo(FloorPlanSVGInner);
export default FloorPlanSVG;

/** Map plan coords to SVG coords for a unit's plan (used by the live minimap). */
export function planToSvg(unitId: UnitId, x: number, z: number): [number, number] {
  const [, , bx1, bz1] = planBounds(floorPlans[unitId]);
  return [bx1 - x, bz1 - z];
}
