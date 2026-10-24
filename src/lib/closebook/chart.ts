import type { Account } from "./types";

/** Default small-business chart of accounts. A real client's chart is synced from QuickBooks or Xero. */
export const CHART: Account[] = [
  { name: "Sales", type: "income" },
  { name: "Refunds & returns", type: "income" },
  { name: "Cost of goods sold", type: "cogs" },
  { name: "Shipping & postage", type: "cogs" },
  { name: "Merchant fees", type: "cogs" },
  { name: "Advertising & marketing", type: "expense" },
  { name: "Software & subscriptions", type: "expense" },
  { name: "Payroll", type: "expense" },
  { name: "Contractors", type: "expense" },
  { name: "Rent", type: "expense" },
  { name: "Utilities & internet", type: "expense" },
  { name: "Office supplies", type: "expense" },
  { name: "Materials & supplies", type: "expense" },
  { name: "Meals", type: "expense" },
  { name: "Travel", type: "expense" },
  { name: "Professional fees", type: "expense" },
  { name: "Insurance", type: "expense" },
  { name: "Bank fees", type: "expense" },
  { name: "Owner draw", type: "other", reviewOnly: true },
  { name: "Loan payment", type: "other", reviewOnly: true },
  { name: "Taxes", type: "other", reviewOnly: true },
  { name: "Transfer", type: "other" },
];

export const ACCOUNT_NAMES = CHART.map((a) => a.name);

export function findAccount(name: string | null | undefined): Account | undefined {
  return CHART.find((a) => a.name === name);
}
