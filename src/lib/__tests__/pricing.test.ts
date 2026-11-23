import { describe, expect, it } from "vitest";
import { defaultConfig, PRODUCTS, PRODUCT_MAP } from "@/lib/catalog/products";
import { CabinetConfigSchema, PricingRequestSchema } from "@/lib/catalog/schema";
import { configCode, priceCabinet, PRICING_RULES } from "@/lib/pricing/engine";

const cfg = (sku: string, over: Record<string, unknown> = {}) => ({ ...defaultConfig(PRODUCT_MAP[sku]), ...over });

describe("pricing engine", () => {
  it.each(PRODUCTS.map((p) => p.sku))("prices %s with its default configuration", (sku) => {
    const r = priceCabinet(cfg(sku));
    expect(r.total).toBeGreaterThan(5000);
    expect(r.total).toBeLessThan(400000);
    expect(r.lines.every((l) => Number.isFinite(l.amount))).toBe(true);
  });

  it("applies overhead, margin and GST in order", () => {
    const r = priceCabinet(cfg("BX-KB-2D"));
    expect(r.overhead).toBeCloseTo(r.cost * PRICING_RULES.overheadPct, 1);
    expect(r.margin).toBeCloseTo((r.cost + r.overhead) * PRICING_RULES.marginPct, 1);
    expect(r.gst).toBeCloseTo(r.preTax * PRICING_RULES.gstPct, 1);
    expect(Math.abs(r.total - (r.preTax + r.gst))).toBeLessThanOrEqual(0.5);
  });

  it("gets more expensive as the cabinet grows", () => {
    const small = priceCabinet(cfg("BX-KB-2D", { width: 600 }));
    const large = priceCabinet(cfg("BX-KB-2D", { width: 1200 }));
    expect(large.total).toBeGreaterThan(small.total);
    expect(large.quantities.boardSqm).toBeGreaterThan(small.quantities.boardSqm);
  });

  it("charges more for acrylic than matte laminate", () => {
    const matte = priceCabinet(cfg("BX-KB-2D", { finish: "lam-matte", colour: "ivory" }));
    const acrylic = priceCabinet(cfg("BX-KB-2D", { finish: "acrylic", colour: "ivory" }));
    expect(acrylic.total).toBeGreaterThan(matte.total);
  });

  it("counts hardware from geometry", () => {
    const r = priceCabinet(cfg("BX-DR-3"));
    expect(r.quantities.channels).toBe(3);
    expect(r.quantities.handles).toBe(3);
    expect(r.quantities.hinges).toBe(0);
  });

  it("builds readable configuration codes", () => {
    expect(configCode(cfg("BX-KB-2D", { width: 800, colour: "olive" }))).toBe("BX-KB-2D-0800x0820x0560-OL04");
  });
});

describe("configuration validation", () => {
  it("accepts every default configuration", () => {
    for (const p of PRODUCTS) expect(CabinetConfigSchema.safeParse(defaultConfig(p)).success, p.sku).toBe(true);
  });
  it("rejects out-of-range dimensions", () => {
    expect(CabinetConfigSchema.safeParse(cfg("BX-KB-2D", { width: 5000 })).success).toBe(false);
  });
  it("rejects a colour that is not offered in the chosen finish", () => {
    expect(CabinetConfigSchema.safeParse(cfg("BX-KB-2D", { finish: "acrylic", colour: "oak" })).success).toBe(false);
  });
  it("rejects particle board as a shutter", () => {
    expect(CabinetConfigSchema.safeParse(cfg("BX-KB-2D", { shutter: "particle" })).success).toBe(false);
  });
  it("requires at least one config in a pricing request", () => {
    expect(PricingRequestSchema.safeParse({ configs: [] }).success).toBe(false);
  });
});
