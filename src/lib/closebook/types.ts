export type AccountType = "income" | "cogs" | "expense" | "other";

export interface Account {
  name: string;
  type: AccountType;
  /** Never posted automatically, whatever the confidence. */
  reviewOnly?: boolean;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // positive = money in, negative = money out
}

/** A client rule learned from an owner answer. */
export interface Rule {
  merchant: string; // normalized merchant key
  account: string;
}

export type Layer = "transfer" | "rule" | "vendor" | "classifier" | "llm" | "none";
export type Route = "auto" | "review" | "ask" | "excluded";

export interface Decision {
  id: string;
  merchant: string;
  account: string | null;
  alternatives: string[];
  confidence: number;
  layer: Layer;
  route: Route;
  reason: string;
}

export interface CategorizeRequest {
  transactions: Transaction[];
  rules: Rule[];
  businessProfile: string;
}

export interface CategorizeResponse {
  decisions: Decision[];
  llm: "used" | "skipped-no-key" | "not-needed" | "failed";
  llmError?: string;
}
