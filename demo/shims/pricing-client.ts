import type { CabinetConfig } from "@/lib/catalog/types";
import { CabinetConfigSchema } from "@/lib/catalog/schema";
import { priceCabinet } from "@/lib/pricing/engine";
import type { PricingResponse } from "@/lib/pricing/client";

/**
 * Demo build: hosted demo pages cannot reach the /api/pricing route, so the
 * same engine and validation run in the browser.
 */
export async function fetchPrices(configs: CabinetConfig[]): Promise<PricingResponse> {
  for (const c of configs) {
    const r = CabinetConfigSchema.safeParse(c);
    if (!r.success) throw new Error(r.error.issues[0]?.message ?? "Invalid configuration");
  }
  const items = configs.map(priceCabinet);
  return {
    items,
    total: items.reduce((s, i) => s + i.total, 0),
    gst: Math.round(items.reduce((s, i) => s + i.gst, 0) * 100) / 100,
    currency: "INR",
  };
}
