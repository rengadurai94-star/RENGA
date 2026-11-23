import { PricingRequestSchema } from "@/lib/catalog/schema";
import { priceCabinet } from "@/lib/pricing/engine";

/**
 * POST /api/pricing
 * Body: { configs: CabinetConfig[] }
 * Returns per-cabinet breakdowns and the combined total.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = PricingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid configuration", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
      { status: 400 },
    );
  }

  const items = parsed.data.configs.map(priceCabinet);
  const total = items.reduce((s, i) => s + i.total, 0);
  const gst = items.reduce((s, i) => s + i.gst, 0);
  return Response.json({ items, total, gst: Math.round(gst * 100) / 100, currency: "INR" });
}
