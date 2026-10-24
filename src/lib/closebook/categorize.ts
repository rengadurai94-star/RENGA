import { findAccount } from "./chart";
import { buildDecision, detectTransfers, normalizeMerchant, proposeWithoutLLM, AUTO_POST_MIN } from "./engine";
import { categorizeWithClaude, llmAvailable } from "./llm";
import type { CategorizeRequest, CategorizeResponse, Decision } from "./types";

const LLM_BATCH = 40;

/** The cascade: transfers → rules → vendor table → keyword classifier → Claude for what is left. */
export async function categorize(req: CategorizeRequest): Promise<CategorizeResponse> {
  const transfers = detectTransfers(req.transactions);
  const decisions = new Map<string, Decision>();
  const forLlm: (CategorizeRequest["transactions"][number] & { merchant: string; prior: ReturnType<typeof proposeWithoutLLM> })[] = [];

  for (const tx of req.transactions) {
    const merchant = normalizeMerchant(tx.description);
    if (transfers.has(tx.id)) {
      decisions.set(tx.id, {
        id: tx.id,
        merchant,
        account: "Transfer",
        alternatives: [],
        confidence: 1,
        layer: "transfer",
        route: "excluded",
        reason: "Matched an equal and opposite transfer between your own accounts.",
      });
      continue;
    }
    const prior = proposeWithoutLLM(tx, merchant, req.rules);
    const decision = buildDecision(tx, merchant, prior ?? { account: null, confidence: 0, layer: "none", reason: "No rule or known vendor matched." });
    decisions.set(tx.id, decision);
    // Stop at the first confident layer; everything else goes to Claude.
    if (!prior || (prior.layer === "classifier" && prior.confidence < AUTO_POST_MIN)) {
      forLlm.push({ ...tx, merchant, prior });
    }
  }

  let llm: CategorizeResponse["llm"] = forLlm.length ? "used" : "not-needed";
  let llmError: string | undefined;

  if (forLlm.length && !llmAvailable()) {
    llm = "skipped-no-key";
  } else if (forLlm.length) {
    try {
      for (let i = 0; i < forLlm.length; i += LLM_BATCH) {
        const batch = forLlm.slice(i, i + LLM_BATCH);
        const results = await categorizeWithClaude(batch, req.businessProfile);
        for (const tx of batch) {
          const r = results.find((x) => x.id === tx.id);
          if (!r || !findAccount(r.account)) continue; // invalid answer: keep the cheaper layer's result
          let confidence = Math.min(Math.max(r.confidence, 0), 1);
          // A cheaper layer that disagrees lowers confidence.
          if (tx.prior && tx.prior.account !== r.account) confidence *= 0.7;
          decisions.set(
            tx.id,
            buildDecision(tx, tx.merchant, {
              account: r.account,
              confidence,
              layer: "llm",
              reason: r.reason,
              alternatives: r.alternatives.filter((a) => findAccount(a) && a !== r.account).slice(0, 2),
            }),
          );
        }
      }
    } catch (err) {
      llm = "failed";
      llmError = err instanceof Error ? err.message : String(err);
    }
  }

  return {
    decisions: req.transactions.map((t) => decisions.get(t.id)!),
    llm,
    llmError,
  };
}
