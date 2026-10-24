import { categorize } from "@/lib/closebook/categorize";
import type { CategorizeRequest } from "@/lib/closebook/types";

const MAX_TRANSACTIONS = 500;

export async function POST(request: Request) {
  let body: CategorizeRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON." }, { status: 400 });
  }
  if (!Array.isArray(body.transactions) || !Array.isArray(body.rules)) {
    return Response.json({ error: "Expected transactions and rules arrays." }, { status: 400 });
  }
  if (body.transactions.length > MAX_TRANSACTIONS) {
    return Response.json({ error: `At most ${MAX_TRANSACTIONS} transactions per request.` }, { status: 400 });
  }
  const result = await categorize({
    transactions: body.transactions,
    rules: body.rules,
    businessProfile: String(body.businessProfile ?? "").slice(0, 500) || "A small US business.",
  });
  return Response.json(result);
}
