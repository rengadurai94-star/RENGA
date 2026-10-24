import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { CHART } from "./chart";
import type { Transaction } from "./types";

const LlmResult = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      account: z.string(),
      confidence: z.number(),
      alternatives: z.array(z.string()),
      reason: z.string(),
    }),
  ),
});

export type LlmProposal = z.infer<typeof LlmResult>["results"][number];

const SYSTEM = `You are a careful junior bookkeeper. For each bank transaction, choose exactly one account from the chart of accounts provided.

Rules:
- "account" and every entry in "alternatives" must be copied exactly from the chart.
- Positive amounts are money in; negative amounts are money out.
- "confidence" is your probability (0 to 1) that the account is right. Be honest: a charge that depends on what the owner bought (a big-box store, a person-to-person payment) should be below 0.75 so the owner is asked.
- Give up to 2 alternatives, most likely first.
- "reason" is one short sentence an owner would understand.
- Return one result per transaction id given.`;

let client: Anthropic | null = null;

export function llmAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export async function categorizeWithClaude(
  txs: (Transaction & { merchant: string })[],
  businessProfile: string,
): Promise<LlmProposal[]> {
  client ??= new Anthropic();
  const chart = CHART.map((a) => `- ${a.name} (${a.type})`).join("\n");
  const rows = txs
    .map((t) => JSON.stringify({ id: t.id, date: t.date, description: t.description, merchant: t.merchant, amount: t.amount }))
    .join("\n");

  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(LlmResult) },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Business: ${businessProfile}\n\nChart of accounts:\n${chart}\n\nTransactions (one JSON object per line):\n${rows}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("The model declined this request.");
  }
  if (!response.parsed_output) {
    throw new Error(`No structured output (stop reason: ${response.stop_reason}).`);
  }
  return response.parsed_output.results;
}
