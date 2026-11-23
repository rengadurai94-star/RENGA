import { describe, expect, it } from "vitest";
import { PRODUCTS, PRODUCT_MAP } from "@/lib/catalog/products";
import { HANDLE_MAP } from "@/lib/catalog/materials";
import {
  BOARD_T,
  FRONT_T,
  autoDoorCount,
  buildCabinet,
  buildCountertop,
  hingesPerDoor,
  inputFromProduct,
  resolveZoneHeights,
  type Part,
} from "@/lib/geometry/cabinet";

const build = (sku: string, dims?: Partial<{ width: number; height: number; depth: number }>, handle = "bar-steel") => {
  const p = PRODUCT_MAP[sku];
  return buildCabinet(
    inputFromProduct(
      p,
      { width: dims?.width ?? p.width.default, height: dims?.height ?? p.height.default, depth: dims?.depth ?? p.depth.default },
      HANDLE_MAP[handle],
    ),
  );
};

const bounds = (p: Part) => p.pos.map((c, i) => [c - p.size[i] / 2, c + p.size[i] / 2]);

describe("zone heights", () => {
  it("fills the carcass exactly", () => {
    const h = resolveZoneHeights([{ kind: "doors" }, { kind: "drawers", mm: 170 }], 720);
    expect(h[1]).toBeCloseTo(170);
    expect(h[0] + h[1]).toBeCloseTo(720);
  });
  it("scales fixed zones down when they overflow", () => {
    const h = resolveZoneHeights([{ kind: "drawers", mm: 700 }, { kind: "niche", mm: 600 }], 1000);
    expect(h.reduce((a, b) => a + b, 0)).toBeCloseTo(1000);
  });
});

describe("door and hinge rules", () => {
  it("picks door counts by width", () => {
    expect(autoDoorCount(450)).toBe(1);
    expect(autoDoorCount(600)).toBe(1);
    expect(autoDoorCount(900)).toBe(2);
    expect(autoDoorCount(1500)).toBe(3);
    expect(autoDoorCount(2000)).toBe(4);
  });
  it("adds hinges as doors get taller", () => {
    expect(hingesPerDoor(700)).toBe(2);
    expect(hingesPerDoor(1200)).toBe(3);
    expect(hingesPerDoor(2000)).toBe(4);
  });
});

describe("buildCabinet", () => {
  it.each(PRODUCTS.map((p) => p.sku))("%s stays inside its envelope at min/default/max sizes", (sku) => {
    const p = PRODUCT_MAP[sku];
    for (const pick of ["min", "default", "max"] as const) {
      const g = build(sku, { width: p.width[pick], height: p.height[pick], depth: p.depth[pick] });
      const all = [...g.parts, ...g.fronts.flatMap((f) => f.parts)];
      for (const part of all) {
        expect(part.size.every((s) => s > 0), `${part.id} has a non-positive size`).toBe(true);
        const [[x0, x1], [y0, y1], [z0]] = bounds(part);
        expect(x0).toBeGreaterThanOrEqual(-0.001);
        expect(x1).toBeLessThanOrEqual(g.width + 0.001);
        expect(y0).toBeGreaterThanOrEqual(-0.001);
        expect(y1).toBeLessThanOrEqual(g.height + 0.001);
        expect(z0).toBeGreaterThanOrEqual(-0.001);
      }
    }
  });

  it("builds a 2-door base with correct carcass and fronts", () => {
    const g = build("BX-KB-2D", { width: 800, height: 820, depth: 560 });
    expect(g.counts.doors).toBe(2);
    expect(g.counts.hinges).toBe(4);
    expect(g.parts.filter((p) => p.role === "side")).toHaveLength(2);
    expect(g.parts.filter((p) => p.role === "rail")).toHaveLength(2); // base units carry a countertop
    const doors = g.fronts.map((f) => f.parts[0]);
    // Two doors + 3mm gaps span the full width.
    const covered = doors.reduce((s, d) => s + d.size[0], 0);
    expect(covered).toBeCloseTo(800 - 2 * 3);
    expect(doors[0].size[2]).toBe(FRONT_T);
    // Doors hinge on opposite sides.
    expect(g.fronts.map((f) => f.hinge)).toEqual(["left", "right"]);
  });

  it("drawer fronts stack without overlap", () => {
    const g = build("BX-DR-3");
    const fronts = g.fronts.map((f) => bounds(f.parts[0])[1]).sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < fronts.length; i++) expect(fronts[i][0]).toBeGreaterThanOrEqual(fronts[i - 1][1] - 1e-6);
    expect(g.counts.drawers).toBe(3);
    expect(g.counts.channels).toBe(3);
  });

  it("wall units have a full top and no plinth", () => {
    const g = build("BX-KW-2D");
    expect(g.plinth).toBe(0);
    expect(g.parts.some((p) => p.role === "top")).toBe(true);
    expect(g.parts.some((p) => p.role === "plinth")).toBe(false);
  });

  it("wardrobe divider leaves shelves on one side and a rod on the other", () => {
    const g = build("BX-WD-3D");
    expect(g.parts.some((p) => p.role === "divider")).toBe(true);
    expect(g.parts.some((p) => p.role === "rod")).toBe(true);
    expect(g.counts.doors).toBe(3);
  });

  it("carcass side panels are board-thick", () => {
    const g = build("BX-TL-PAN");
    for (const s of g.parts.filter((p) => p.role === "side")) expect(s.size[0]).toBe(BOARD_T);
  });

  it("push-to-open adds no handle geometry", () => {
    const g = build("BX-KB-2D", {}, "push");
    expect(g.fronts.flatMap((f) => f.parts).some((p) => p.role === "handle")).toBe(false);
  });
});

describe("countertop", () => {
  it("cuts a sink opening and adds a basin", () => {
    const parts = buildCountertop({ width: 900, depth: 560, height: 820, sink: true });
    expect(parts.filter((p) => p.role === "countertop")).toHaveLength(4);
    expect(parts.some((p) => p.role === "basin")).toBe(true);
  });
  it("is a single slab without a sink", () => {
    expect(buildCountertop({ width: 600, depth: 560, height: 820 }).filter((p) => p.role === "countertop")).toHaveLength(1);
  });
});
