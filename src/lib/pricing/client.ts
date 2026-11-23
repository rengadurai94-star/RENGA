import type { CabinetConfig } from "@/lib/catalog/types";
import type { PriceResult } from "./engine";

export interface PricingResponse {
  items: PriceResult[];
  total: number;
  gst: number;
  currency: "INR";
}

/** Calls the server-side pricing engine. */
export async function fetchPrices(configs: CabinetConfig[], signal?: AbortSignal): Promise<PricingResponse> {
  const res = await fetch("/api/pricing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ configs }),
    signal,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.issues?.[0]?.message ?? json?.error ?? "Pricing failed");
  return json as PricingResponse;
}
