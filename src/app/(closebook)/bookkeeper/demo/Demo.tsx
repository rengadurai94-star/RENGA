"use client";

import { useEffect, useMemo, useState } from "react";
import { ACCOUNT_NAMES, findAccount } from "@/lib/closebook/chart";
import type { CategorizeResponse, Decision, Rule, Transaction } from "@/lib/closebook/types";
import { SAMPLE_CSV, SAMPLE_PROFILE } from "./sample";

const RULES_KEY = "closebook.rules";

type Effective = Decision & { by: "engine" | "owner" | "rule" | "cpa" };

function parseCsv(text: string): { txs: Transaction[]; errors: string[] } {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const errors: string[] = [];
  const txs: Transaction[] = [];
  const split = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let quoted = false;
    for (const ch of line) {
      if (ch === '"') quoted = !quoted;
      else if (ch === "," && !quoted) {
        out.push(cur);
        cur = "";
      } else cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const header = split(lines[0] ?? "").map((h) => h.toLowerCase());
  const di = header.indexOf("date");
  const de = header.indexOf("description");
  const am = header.indexOf("amount");
  if (di < 0 || de < 0 || am < 0) return { txs, errors: ["The first row must name the columns date, description and amount."] };
  lines.slice(1).forEach((line, i) => {
    const cells = split(line);
    const amount = Number(cells[am]?.replace(/[$,]/g, ""));
    const date = cells[di];
    if (!date || !cells[de] || !Number.isFinite(amount) || Number.isNaN(Date.parse(date))) {
      errors.push(`Row ${i + 2} skipped: "${line}"`);
      return;
    }
    txs.push({ id: `t${i + 1}`, date, description: cells[de], amount });
  });
  return { txs, errors };
}

const money = (n: number) =>
  (n < 0 ? "−$" : "$") + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ROUTE_STYLE: Record<string, string> = {
  auto: "bg-mint text-green-deep",
  review: "bg-[#fdf1dc] text-amber",
  ask: "bg-[#fde4e1] text-[#a23b2a]",
  excluded: "bg-line text-ink-soft",
};
const ROUTE_LABEL: Record<string, string> = {
  auto: "Auto-posted",
  review: "CPA review",
  ask: "Ask owner",
  excluded: "Transfer",
};

export default function Demo() {
  const [csv, setCsv] = useState(SAMPLE_CSV);
  const [profile, setProfile] = useState(SAMPLE_PROFILE);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [result, setResult] = useState<CategorizeResponse | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [answers, setAnswers] = useState<Record<string, { account: string; by: "owner" | "cpa" }>>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(RULES_KEY);
      if (saved) setRules(JSON.parse(saved));
    } catch {}
  }, []);

  function saveRules(next: Rule[]) {
    setRules(next);
    try {
      localStorage.setItem(RULES_KEY, JSON.stringify(next));
    } catch {}
  }

  async function run() {
    const parsed = parseCsv(csv);
    setErrors(parsed.errors);
    if (!parsed.txs.length) return;
    setLoading(true);
    setAnswers({});
    setTxs(parsed.txs);
    try {
      const res = await fetch("/bookkeeper/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: parsed.txs, rules, businessProfile: profile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      setResult(data);
    } catch (err) {
      setErrors((e) => [...e, err instanceof Error ? err.message : String(err)]);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  // Owner answers and rules learned in this session apply on top of the engine's decisions.
  const effective: Effective[] = useMemo(() => {
    if (!result) return [];
    return result.decisions.map((d) => {
      const answer = answers[d.id];
      if (answer) return { ...d, account: answer.account, route: "auto", confidence: 1, by: answer.by };
      const rule = d.route !== "excluded" && d.layer !== "rule" ? rules.find((r) => r.merchant === d.merchant) : undefined;
      if (rule && d.route === "ask") return { ...d, account: rule.account, route: "auto", confidence: 0.99, by: "rule" };
      return { ...d, by: "engine" };
    });
  }, [result, answers, rules]);

  const txById = useMemo(() => new Map(txs.map((t) => [t.id, t])), [txs]);

  function answer(d: Decision, account: string, always: boolean) {
    setAnswers((a) => ({ ...a, [d.id]: { account, by: "owner" } }));
    if (always && d.merchant) {
      saveRules([...rules.filter((r) => r.merchant !== d.merchant), { merchant: d.merchant, account }]);
    }
  }

  const stats = useMemo(() => {
    if (!result) return null;
    const counted = result.decisions.filter((d) => d.route !== "excluded");
    const auto = counted.filter((d) => d.route === "auto").length;
    return {
      total: result.decisions.length,
      autoRate: counted.length ? auto / counted.length : 0,
      review: effective.filter((d) => d.route === "review").length,
      ask: effective.filter((d) => d.route === "ask").length,
      transfers: result.decisions.length - counted.length,
    };
  }, [result, effective]);

  const pnl = useMemo(() => {
    const sums = new Map<string, number>();
    let pending = 0;
    for (const d of effective) {
      const t = txById.get(d.id);
      if (!t || !d.account || d.route === "excluded") continue;
      if (d.route !== "auto") {
        pending += 1;
        continue;
      }
      sums.set(d.account, (sums.get(d.account) ?? 0) + t.amount);
    }
    const group = (type: string) =>
      [...sums.entries()].filter(([a]) => findAccount(a)?.type === type).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    const total = (rows: [string, number][]) => rows.reduce((s, [, v]) => s + v, 0);
    const income = group("income");
    const cogs = group("cogs");
    const expense = group("expense");
    const other = group("other");
    const gross = total(income) + total(cogs);
    return { income, cogs, expense, other, gross, net: gross + total(expense), pending, total };
  }, [effective, txById]);

  const questions = effective.filter((d) => d.route === "ask");
  const reviews = effective.filter((d) => d.route === "review");

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      {/* Input */}
      <section className="grid gap-6 rounded-2xl border border-line bg-card p-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0">
          <label htmlFor="csv" className="text-sm font-semibold">
            Bank transactions (CSV: date, description, amount)
          </label>
          <textarea
            id="csv"
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            spellCheck={false}
            className="mt-2 h-56 w-full rounded-lg border border-line bg-paper p-3 font-mono text-xs leading-relaxed outline-none focus:border-green"
          />
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <label className="cursor-pointer rounded-lg border border-line px-3 py-1.5 hover:border-ink-soft">
              Upload CSV
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) setCsv(await f.text());
                }}
              />
            </label>
            <button onClick={() => setCsv(SAMPLE_CSV)} className="rounded-lg border border-line px-3 py-1.5 hover:border-ink-soft">
              Load sample month
            </button>
          </div>
        </div>
        <div className="flex flex-col">
          <label htmlFor="profile" className="text-sm font-semibold">
            About the business
          </label>
          <textarea
            id="profile"
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            className="mt-2 h-24 w-full rounded-lg border border-line bg-paper p-3 text-sm outline-none focus:border-green"
          />
          <p className="mt-2 text-xs text-ink-soft">
            Juno uses this to judge ambiguous charges. Rules you create are saved in this browser.
          </p>
          <div className="mt-auto pt-4">
            <button
              onClick={run}
              disabled={loading}
              className="w-full rounded-lg bg-green px-5 py-3 font-medium text-white hover:bg-green-deep disabled:opacity-60"
            >
              {loading ? "Juno is working…" : "Run Juno on these transactions"}
            </button>
          </div>
        </div>
      </section>

      {errors.length > 0 && (
        <div className="mt-4 rounded-lg border border-[#f3c2bb] bg-[#fdf0ee] p-4 text-sm text-[#a23b2a]">
          {errors.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}

      {result && result.llm !== "used" && result.llm !== "not-needed" && (
        <div className="mt-4 rounded-lg border border-[#f1dcb4] bg-[#fdf6e8] p-4 text-sm text-[#7a5410]">
          {result.llm === "skipped-no-key"
            ? "Claude was skipped because ANTHROPIC_API_KEY is not set on the server. Rules, the vendor table and the keyword classifier still ran; the rest went to the owner."
            : `The Claude call failed (${result.llmError}). Results come from the cheaper layers only.`}
        </div>
      )}

      {stats && (
        <>
          {/* Stats */}
          <section className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
            {[
              ["Auto-posted", `${Math.round(stats.autoRate * 100)}%`, "of non-transfer transactions"],
              ["Questions for you", String(stats.ask), "one tap each"],
              ["CPA review", String(stats.review), "checked before month-end"],
              ["Transfers excluded", String(stats.transfers), "not income or expense"],
            ].map(([label, value, note]) => (
              <div key={label} className="bg-card p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-ink-soft">{label}</p>
                <p className="tabular mt-1 text-3xl font-semibold">{value}</p>
                <p className="text-xs text-ink-soft">{note}</p>
              </div>
            ))}
          </section>

          {/* Questions */}
          {questions.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-semibold">Juno has {questions.length} question{questions.length > 1 ? "s" : ""} for you</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {questions.map((d) => (
                  <QuestionCard key={d.id} d={d} tx={txById.get(d.id)!} onAnswer={answer} />
                ))}
              </div>
            </section>
          )}

          {/* CPA queue */}
          {reviews.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl font-semibold">CPA review queue</h2>
              <p className="mt-1 text-sm text-ink-soft">Sorted by dollar impact. Approve to post.</p>
              <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-card">
                {[...reviews]
                  .sort((a, b) => Math.abs(txById.get(b.id)!.amount) - Math.abs(txById.get(a.id)!.amount))
                  .map((d) => {
                    const t = txById.get(d.id)!;
                    return (
                      <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                        <div className="min-w-0">
                          <p className="font-medium">{t.description}</p>
                          <p className="text-xs text-ink-soft">
                            {d.account} · {Math.round(d.confidence * 100)}% · {d.reason}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="tabular font-mono">{money(t.amount)}</span>
                          <button
                            onClick={() => setAnswers((a) => ({ ...a, [d.id]: { account: d.account!, by: "cpa" } }))}
                            className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white"
                          >
                            Approve
                          </button>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </section>
          )}

          {/* Ledger + P&L */}
          <section className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold">All transactions</h2>
              <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-card">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-line text-xs uppercase tracking-wider text-ink-soft">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 text-right font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Account</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {effective.map((d) => {
                      const t = txById.get(d.id)!;
                      return (
                        <tr key={d.id} className="align-top">
                          <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{t.date.slice(5)}</td>
                          <td className="px-4 py-3">
                            <p>{t.description}</p>
                            <p className="text-xs text-ink-soft" title={d.reason}>
                              {d.by === "engine" ? `${d.layer} · ${Math.round(d.confidence * 100)}%` : `by ${d.by}`}
                            </p>
                          </td>
                          <td className="tabular whitespace-nowrap px-4 py-3 text-right font-mono">{money(t.amount)}</td>
                          <td className="px-4 py-3">{d.account ?? "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${ROUTE_STYLE[d.route]}`}>
                              {ROUTE_LABEL[d.route]}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold">Profit &amp; loss (posted)</h2>
              <div className="mt-4 rounded-2xl border border-line bg-card p-5 text-sm">
                <PnlGroup title="Income" rows={pnl.income} />
                <PnlGroup title="Cost of goods sold" rows={pnl.cogs} />
                <PnlLine label="Gross profit" value={pnl.gross} strong />
                <PnlGroup title="Operating expenses" rows={pnl.expense} />
                <PnlLine label="Net income" value={pnl.net} strong />
                {pnl.other.length > 0 && <PnlGroup title="Balance sheet items (not in net income)" rows={pnl.other} />}
                {pnl.pending > 0 && (
                  <p className="mt-4 rounded-lg bg-paper p-3 text-xs text-ink-soft">
                    {pnl.pending} transaction{pnl.pending > 1 ? "s" : ""} not included yet: waiting for your answer or CPA approval.
                  </p>
                )}
              </div>

              {rules.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold">Rules Juno has learned</h3>
                  <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-card text-sm">
                    {rules.map((r) => (
                      <li key={r.merchant} className="flex items-center justify-between gap-2 px-4 py-2">
                        <span>
                          <span className="font-medium">{r.merchant}</span> → {r.account}
                        </span>
                        <button
                          onClick={() => saveRules(rules.filter((x) => x.merchant !== r.merchant))}
                          className="text-xs text-ink-soft hover:text-ink"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function QuestionCard({
  d,
  tx,
  onAnswer,
}: {
  d: Decision;
  tx: Transaction;
  onAnswer: (d: Decision, account: string, always: boolean) => void;
}) {
  const [always, setAlways] = useState(true);
  const [other, setOther] = useState("");
  const options = [d.account, ...d.alternatives].filter((a): a is string => Boolean(a)).filter((a, i, all) => all.indexOf(a) === i);
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">{tx.description}</p>
          <p className="text-xs text-ink-soft">{tx.date}</p>
        </div>
        <span className="tabular font-mono text-sm">{money(tx.amount)}</span>
      </div>
      <p className="mt-3 text-sm text-ink-soft">{d.reason}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((a) => (
          <button
            key={a}
            onClick={() => onAnswer(d, a, always)}
            className="rounded-lg border border-line px-3 py-1.5 text-sm hover:border-green hover:bg-mint"
          >
            {a}
          </button>
        ))}
        <select
          value={other}
          onChange={(e) => {
            setOther(e.target.value);
            if (e.target.value) onAnswer(d, e.target.value, always);
          }}
          className="rounded-lg border border-line bg-card px-2 py-1.5 text-sm"
          aria-label="Something else"
        >
          <option value="">Something else…</option>
          {ACCOUNT_NAMES.filter((a) => a !== "Transfer").map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
      <label className="mt-3 flex items-center gap-2 text-xs text-ink-soft">
        <input type="checkbox" checked={always} onChange={(e) => setAlways(e.target.checked)} />
        Always categorize “{d.merchant}” this way
      </label>
    </div>
  );
}

function PnlLine({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={`flex justify-between py-1.5 ${strong ? "mt-1 border-t border-line pt-2 font-semibold" : ""}`}>
      <span>{label}</span>
      <span className="tabular font-mono">{money(value)}</span>
    </div>
  );
}

function PnlGroup({ title, rows }: { title: string; rows: [string, number][] }) {
  if (!rows.length) return null;
  return (
    <div className="mt-3 first:mt-0">
      <p className="text-xs font-medium uppercase tracking-wider text-ink-soft">{title}</p>
      {rows.map(([a, v]) => (
        <PnlLine key={a} label={a} value={v} />
      ))}
    </div>
  );
}
