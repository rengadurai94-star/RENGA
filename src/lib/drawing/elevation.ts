import { HANDLE_MAP } from "@/lib/catalog/materials";
import { PRODUCT_MAP } from "@/lib/catalog/products";
import type { CabinetConfig } from "@/lib/catalog/types";
import { buildCabinet, COUNTER_T, inputFromProduct } from "@/lib/geometry/cabinet";
import type { Placement, WallId } from "@/lib/room/layout";

export interface ElevationRect {
  id: string;
  kind: "carcass" | "front" | "countertop" | "plinth" | "appliance" | "handle";
  x: number;
  y: number; // bottom, mm above the reference
  w: number;
  h: number;
}

/** Front-elevation rectangles of one cabinet in its own coordinates (x from left, y from floor). */
export function cabinetElevation(config: CabinetConfig, opts: { mirror?: boolean; countertop?: boolean; handles?: boolean } = {}) {
  const out: ElevationRect[] = [];
  const product = PRODUCT_MAP[config.sku];
  if (!product) return out;
  const g = buildCabinet(
    inputFromProduct(product, { width: config.width, height: config.height, depth: config.depth }, HANDLE_MAP[config.handle]),
  );
  const mx = (x: number, w: number) => (opts.mirror ? config.width - x - w : x);
  out.push({ id: "carcass", kind: "carcass", x: 0, y: g.plinth, w: g.width, h: g.height - g.plinth });
  if (g.plinth > 0) out.push({ id: "plinth", kind: "plinth", x: 0, y: 0, w: g.width, h: g.plinth });

  const faces = [
    ...g.fronts.flatMap((f) => (opts.handles ? f.parts.filter((p) => p.role !== "drawer-box") : [f.parts[0]])),
    ...g.parts.filter((p) => p.role === "blind-panel" || p.role === "appliance"),
  ];
  for (const part of faces) {
    const isCyl = part.shape === "cylinder";
    const w = isCyl ? (part.axis === "x" ? part.size[0] : part.size[1]) : part.size[0];
    const h = isCyl ? (part.axis === "y" ? part.size[0] : part.size[1]) : part.size[1];
    out.push({
      id: part.id,
      kind: part.role === "appliance" ? "appliance" : part.role === "handle" ? "handle" : "front",
      x: mx(part.pos[0] - w / 2, w),
      y: part.pos[1] - h / 2,
      w,
      h,
    });
  }
  if (opts.countertop && product.mount === "floor" && config.height <= 1000) {
    out.push({ id: "ct", kind: "countertop", x: 0, y: config.height, w: config.width, h: COUNTER_T });
  }
  return out;
}

/** Front-elevation rectangles for every cabinet on one wall, in wall coordinates. */
export function wallElevation(placements: Placement[], wall: WallId) {
  return placements
    .filter((p) => p.wall === wall)
    .flatMap((p) =>
      cabinetElevation(p.config, { mirror: p.mirror, countertop: true }).map((r) => ({
        ...r,
        id: `${p.id}-${r.id}`,
        x: p.offset + r.x,
        y: p.elevation + r.y,
        placementId: p.id,
      })),
    );
}
