import { HANDLE_MAP } from "@/lib/catalog/materials";
import { PRODUCT_MAP } from "@/lib/catalog/products";
import { buildCabinet, COUNTER_T, inputFromProduct } from "@/lib/geometry/cabinet";
import type { Placement, WallId } from "@/lib/room/layout";

export interface ElevationRect {
  id: string;
  kind: "carcass" | "front" | "countertop" | "plinth" | "appliance";
  x: number;
  y: number; // bottom, mm above floor
  w: number;
  h: number;
  placementId: string;
}

/**
 * Front-elevation rectangles for every cabinet on one wall, in wall
 * coordinates (x = offset along the wall, y = height above floor).
 */
export function wallElevation(placements: Placement[], wall: WallId): ElevationRect[] {
  const out: ElevationRect[] = [];
  for (const p of placements) {
    if (p.wall !== wall) continue;
    const product = PRODUCT_MAP[p.config.sku];
    if (!product) continue;
    const g = buildCabinet(
      inputFromProduct(product, { width: p.config.width, height: p.config.height, depth: p.config.depth }, HANDLE_MAP[p.config.handle]),
    );
    const mx = (x: number, w: number) => (p.mirror ? p.config.width - x - w : x);
    out.push({ id: `${p.id}-c`, kind: "carcass", x: p.offset, y: p.elevation + g.plinth, w: g.width, h: g.height - g.plinth, placementId: p.id });
    if (g.plinth > 0) out.push({ id: `${p.id}-pl`, kind: "plinth", x: p.offset, y: p.elevation, w: g.width, h: g.plinth, placementId: p.id });
    const fronts = [
      ...g.fronts.map((f) => f.parts[0]),
      ...g.parts.filter((pt) => pt.role === "blind-panel" || pt.role === "appliance"),
    ];
    for (const part of fronts) {
      const [w, h] = part.size;
      const x0 = part.pos[0] - w / 2;
      out.push({
        id: `${p.id}-${part.id}`,
        kind: part.role === "appliance" ? "appliance" : "front",
        x: p.offset + mx(x0, w),
        y: p.elevation + part.pos[1] - h / 2,
        w,
        h,
        placementId: p.id,
      });
    }
    if (product.mount === "floor" && p.config.height <= 1000) {
      out.push({ id: `${p.id}-ct`, kind: "countertop", x: p.offset, y: p.elevation + p.config.height, w: p.config.width, h: COUNTER_T, placementId: p.id });
    }
  }
  return out;
}
