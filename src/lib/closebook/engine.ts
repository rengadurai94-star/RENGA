import { findAccount } from "./chart";
import type { Decision, Layer, Route, Rule, Transaction } from "./types";

export const AUTO_POST_MIN = 0.95;
export const REVIEW_MIN = 0.75;
export const MATERIALITY = 2500;
export const AUTO_POST_CEILING = 10000;

/** Strip processor prefixes, store numbers and card suffixes so one vendor gets one key. */
export function normalizeMerchant(description: string): string {
  return description
    .toLowerCase()
    .replace(/^(sq \*|tst\* |paypal \*|pp\*|pos |dd \*|ach )/, "")
    .replace(/#\s*\d+/g, "")
    .replace(/\b(x{2,}|\*{2,})\d+\b/g, "")
    .replace(/\b\d{3,}\b/g, "")
    .replace(/\b(inc|llc|ltd|co|com)\b\.?/g, "")
    .replace(/[^a-z& ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Global vendor table: vendors whose category rarely depends on the business. */
const VENDORS: [RegExp, string][] = [
  [/shopify payout|stripe payout|stripe transfer|square deposit/, "Sales"],
  [/shopify subscription|google workspace|gsuite|adobe|canva|slack|zoom|quickbooks|xero|notion|github/, "Software & subscriptions"],
  [/meta ads|facebook ads|facebk|google ads|tiktok ads|pinterest ads/, "Advertising & marketing"],
  [/gusto|adp payroll|rippling/, "Payroll"],
  [/upwork|fiverr/, "Contractors"],
  [/usps|ups |^ups$|fedex|dhl|shippo|pirate ship/, "Shipping & postage"],
  [/comcast|xfinity|verizon|at&t|spectrum/, "Utilities & internet"],
  [/state farm|geico|hiscox|next insurance/, "Insurance"],
  [/uber|lyft|delta air|united air|american air|airbnb|marriott/, "Travel"],
  [/starbucks|doordash|grubhub|chipotle/, "Meals"],
  [/service fee|monthly maintenance fee|wire fee|overdraft/, "Bank fees"],
  [/irs|franchise tax|dept of revenue/, "Taxes"],
];

/** Keyword classifier: the cheap model that runs before the LLM. Weaker evidence than the vendor table. */
const KEYWORDS: [RegExp, string, number][] = [
  [/supplier|wholesale|alibaba|inventory|manufactur/, "Cost of goods sold", 0.8],
  [/refund|return/, "Refunds & returns", 0.75],
  [/rent|lease|property/, "Rent", 0.8],
  [/cpa|legal|attorney|law|accounting/, "Professional fees", 0.75],
  [/loan|lending|kabbage|ondeck/, "Loan payment", 0.75],
  [/staples|office depot/, "Office supplies", 0.8],
  [/home depot|lowe|hardware/, "Materials & supplies", 0.6],
  [/amazon|amzn|walmart|target|costco/, "Office supplies", 0.5],
  [/venmo|zelle|cash app/, "Contractors", 0.4],
];

type Proposal = { account: string; confidence: number; layer: Layer; reason: string };

export function proposeWithoutLLM(tx: Transaction, merchant: string, rules: Rule[]): Proposal | null {
  const rule = rules.find((r) => r.merchant === merchant);
  if (rule && findAccount(rule.account)) {
    return { account: rule.account, confidence: 0.99, layer: "rule", reason: `Your rule: "${merchant}" → ${rule.account}.` };
  }
  for (const [pattern, account] of VENDORS) {
    if (pattern.test(merchant)) {
      // Money in from a vendor we know as an expense is likely a refund, not a match.
      const signFits = account === "Sales" ? tx.amount > 0 : tx.amount < 0;
      if (signFits) {
        return { account, confidence: 0.97, layer: "vendor", reason: `Known vendor: ${account}.` };
      }
    }
  }
  for (const [pattern, account, confidence] of KEYWORDS) {
    if (pattern.test(merchant)) {
      return { account, confidence, layer: "classifier", reason: `Description suggests ${account}.` };
    }
  }
  return null;
}

/** Pair opposite-signed equal amounts within 3 days whose descriptions say "transfer". */
export function detectTransfers(txs: Transaction[]): Set<string> {
  const ids = new Set<string>();
  const candidates = txs.filter((t) => /transfer/i.test(t.description));
  for (const a of candidates) {
    const match = candidates.find(
      (b) =>
        b.id !== a.id &&
        !ids.has(b.id) &&
        Math.abs(a.amount + b.amount) < 0.005 &&
        Math.abs(Date.parse(a.date) - Date.parse(b.date)) <= 3 * 864e5,
    );
    if (match && !ids.has(a.id)) {
      ids.add(a.id);
      ids.add(match.id);
    }
  }
  return ids;
}

/**
 * Apply materiality to model guesses (not to rules or known vendors), then route by confidence.
 * Review-only accounts and large amounts never auto-post.
 */
export function route(tx: Transaction, account: string | null, confidence: number, layer: Layer): { route: Route; confidence: number } {
  if (!account) return { route: "ask", confidence: 0 };
  const guessed = layer === "classifier" || layer === "llm";
  const adjusted = guessed && Math.abs(tx.amount) >= MATERIALITY ? confidence * 0.8 : confidence;
  const acct = findAccount(account);
  if (acct?.reviewOnly || Math.abs(tx.amount) >= AUTO_POST_CEILING) {
    return { route: "review", confidence: adjusted };
  }
  if (adjusted >= AUTO_POST_MIN) return { route: "auto", confidence: adjusted };
  if (adjusted >= REVIEW_MIN) return { route: "review", confidence: adjusted };
  return { route: "ask", confidence: adjusted };
}

export function buildDecision(
  tx: Transaction,
  merchant: string,
  p: { account: string | null; confidence: number; layer: Layer; reason: string; alternatives?: string[] },
): Decision {
  const r = route(tx, p.account, p.confidence, p.layer);
  return {
    id: tx.id,
    merchant,
    account: p.account,
    alternatives: p.alternatives ?? [],
    confidence: Math.round(r.confidence * 100) / 100,
    layer: p.layer,
    route: r.route,
    reason: p.reason,
  };
}
