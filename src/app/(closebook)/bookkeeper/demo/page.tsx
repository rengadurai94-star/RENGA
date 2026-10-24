import type { Metadata } from "next";
import Link from "next/link";
import Demo from "./Demo";

export const metadata: Metadata = {
  title: "Closebook — Live demo",
  description: "Paste a month of bank transactions and watch Juno, the AI junior bookkeeper, categorize them.",
};

export default function DemoPage() {
  return (
    <main>
      <header className="border-b border-line/70 bg-paper/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/bookkeeper" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-ink text-xs text-white">C</span>
            Closebook
          </Link>
          <span className="rounded-full bg-mint px-3 py-1 text-xs font-medium text-green-deep">Working prototype</span>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-12 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Give Juno a month of transactions</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Juno runs the categorization cascade: transfer detection, your rules, a known-vendor table, a keyword
          classifier, then Claude for the hard cases. Confident results post; the rest become questions or go to CPA
          review.
        </p>
      </div>
      <Demo />
    </main>
  );
}
