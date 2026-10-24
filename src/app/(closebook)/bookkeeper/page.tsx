import Link from "next/link";

const CONTACT = "mailto:hello@closebook.example?subject=Free%20Books%20Health%20Check";

const steps = [
  {
    n: "01",
    title: "Connect in 20 minutes",
    body: "Link your bank, cards, QuickBooks or Xero, Stripe, Shopify and Gmail. Read-only bank access, always.",
  },
  {
    n: "02",
    title: "Juno learns your books",
    body: "Juno reads 12 months of history and learns how you categorize. You get a free Books Health Report on day one.",
  },
  {
    n: "03",
    title: "Daily bookkeeping, done",
    body: "Transactions categorized every morning. Receipts pulled from email. Anything unclear becomes a one-tap question in Slack or SMS.",
  },
  {
    n: "04",
    title: "Closed by day 5",
    body: "Accounts reconciled, a CPA reviews the close, and you get a plain-English summary of how the month went.",
  },
];

const duties = [
  ["Categorize bank & card transactions", "Daily"],
  ["Match receipts and invoices", "Daily"],
  ["Ask you about unclear charges", "As needed"],
  ["Enter bills, track who owes you", "Weekly"],
  ["Reconcile every account", "Monthly"],
  ["Month-end close, CPA-reviewed", "By day 5"],
  ["P&L, balance sheet, cash flow", "Monthly"],
  ["1099 tracking & sales tax prep", "Quarterly"],
];

const plans = [
  {
    name: "Starter",
    price: "$299",
    for: "Up to 200 transactions / month, 1 entity",
    features: ["Daily categorization", "Receipt matching", "Monthly close by day 5", "CPA-reviewed reports"],
  },
  {
    name: "Growth",
    price: "$499",
    for: "Up to 750 transactions / month",
    features: ["Everything in Starter", "Bills & invoices (AP/AR)", "Stripe & Shopify reconciliation", "Slack channel with Juno"],
    featured: true,
  },
  {
    name: "Pro",
    price: "$899",
    for: "Multi-entity and higher volume",
    features: ["Everything in Growth", "Sales tax prep", "1099 prep", "Priority review"],
  },
];

const faqs = [
  {
    q: "Is a robot doing my books?",
    a: "An AI does the repetitive work: categorizing, matching, reconciling. A human CPA reviews every month-end close before you see it, and every entry carries an audit trail showing why it was made.",
  },
  {
    q: "Do I have to leave QuickBooks or Xero?",
    a: "No. Closebook writes to your own QuickBooks Online or Xero file. If you ever leave, your books stay exactly where they are.",
  },
  {
    q: "What if my books are months behind?",
    a: "We offer one-time catch-up bookkeeping to bring past months current, then move you onto a monthly plan.",
  },
  {
    q: "What businesses is this for?",
    a: "US small businesses doing roughly $250K–$5M in revenue: e-commerce sellers, agencies, consultancies and home services. We don't yet support inventory-heavy, construction job-costing or nonprofit fund accounting.",
  },
  {
    q: "How is my data protected?",
    a: "Read-only bank connections, encryption in transit and at rest, and access limited to your assigned reviewer.",
  },
];

const sampleQueue = [
  { vendor: "Shopify Payouts", amount: "+$4,218.40", cat: "Sales · Shopify", status: "auto" },
  { vendor: "Google Workspace", amount: "−$72.00", cat: "Software subscriptions", status: "auto" },
  { vendor: "Home Depot #4471", amount: "−$412.18", cat: "Needs your answer", status: "ask" },
  { vendor: "Meta Ads", amount: "−$1,350.00", cat: "Advertising", status: "auto" },
  { vendor: "Gusto Payroll", amount: "−$9,804.55", cat: "Payroll · Wages", status: "auto" },
];

function Check({ className = "text-green" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={`h-4 w-4 flex-none ${className}`} aria-hidden="true">
      <path
        fill="currentColor"
        d="M8.1 13.6 4.5 10l-1.2 1.2 4.8 4.8L17 7.1l-1.2-1.2z"
      />
    </svg>
  );
}

function ProductMock() {
  return (
    <div className="rounded-2xl border border-line bg-card shadow-[0_30px_60px_-30px_rgba(15,31,26,0.35)]">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-green text-xs font-semibold text-white">
            J
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Juno · Junior Bookkeeper</p>
            <p className="text-xs text-ink-soft">This morning&apos;s work</p>
          </div>
        </div>
        <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-medium text-green-deep">
          Sample data
        </span>
      </div>
      <ul className="divide-y divide-line">
        {sampleQueue.map((t) => (
          <li key={t.vendor} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">{t.vendor}</p>
              <p
                className={
                  t.status === "ask" ? "text-xs font-medium text-amber" : "text-xs text-ink-soft"
                }
              >
                {t.cat}
              </p>
            </div>
            <span className="tabular font-mono text-sm">{t.amount}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-line bg-paper/60 px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-soft">Question for you</p>
        <p className="mt-1 text-sm">
          $412.18 at Home Depot — office supplies, or materials for a client job?
        </p>
        <div className="mt-3 flex gap-2">
          <span className="rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-medium">
            Office supplies
          </span>
          <span className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white">
            Client job
          </span>
        </div>
      </div>
    </div>
  );
}

export default function BookkeeperPage() {
  return (
    <main>
      <header className="sticky top-0 z-20 border-b border-line/70 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <a href="#" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-ink text-xs text-white">C</span>
            Closebook
          </a>
          <nav className="hidden gap-8 text-sm text-ink-soft md:flex">
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#duties" className="hover:text-ink">What Juno does</a>
            <a href="#pricing" className="hover:text-ink">Pricing</a>
            <a href="#faq" className="hover:text-ink">FAQ</a>
            <Link href="/bookkeeper/demo" className="hover:text-ink">Demo</Link>
          </nav>
          <a
            href={CONTACT}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-green-deep"
          >
            Free health check
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs font-medium text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-green" />
            AI-powered · CPA-reviewed
          </p>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Hire a bookkeeper
            <br />
            <span className="text-green">that never falls behind.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-soft">
            Meet Juno, your AI junior bookkeeper. Transactions categorized every day, books closed by
            day 5, and every close reviewed by a CPA — for less than a part-time hire.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={CONTACT}
              className="rounded-lg bg-green px-6 py-3 text-center font-medium text-white hover:bg-green-deep"
            >
              Get a free Books Health Check
            </a>
            <Link
              href="/bookkeeper/demo"
              className="rounded-lg border border-line bg-card px-6 py-3 text-center font-medium hover:border-ink-soft"
            >
              Try the live demo
            </Link>
          </div>
          <p className="mt-4 text-sm text-ink-soft">Works with QuickBooks Online and Xero.</p>
        </div>
        <ProductMock />
      </section>

      {/* Comparison strip */}
      <section className="border-y border-line bg-card">
        <div className="mx-auto grid max-w-6xl gap-px bg-line sm:grid-cols-3">
          {[
            ["Books closed", "Day 5", "vs. 3–6 weeks with a typical part-time bookkeeper"],
            ["Starting at", "$299/mo", "vs. $800–$2,000/mo for a human bookkeeper"],
            ["Every close", "CPA-reviewed", "AI does the work, a human signs off"],
          ].map(([label, value, note]) => (
            <div key={label} className="bg-card px-6 py-8">
              <p className="text-xs font-medium uppercase tracking-wider text-ink-soft">{label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
              <p className="mt-1 text-sm text-ink-soft">{note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
        <p className="mt-3 max-w-2xl text-ink-soft">
          No new software to learn. Juno works inside the accounting system you already use.
        </p>
        <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li key={s.n} className="rounded-2xl border border-line bg-card p-6">
              <span className="font-mono text-sm text-green">{s.n}</span>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Duties */}
      <section id="duties" className="scroll-mt-20 bg-ink text-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              A full job description,
              <br />
              not a feature list.
            </h2>
            <p className="mt-4 max-w-md text-white/70">
              Juno is trained for one role and does all of it. You don&apos;t operate a tool — you get
              finished books, and a short note when Juno needs you.
            </p>
          </div>
          <ul className="divide-y divide-white/10 rounded-2xl border border-white/10">
            {duties.map(([task, cadence]) => (
              <li key={task} className="flex items-center justify-between gap-4 px-5 py-4">
                <span className="flex items-center gap-3 text-sm">
                  <Check className="text-mint" />
                  {task}
                </span>
                <span className="font-mono text-xs text-white/60">{cadence}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Simple monthly pricing</h2>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Behind on your books? Catch-up bookkeeping is available as a one-time add-on.
        </p>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`flex flex-col rounded-2xl border p-7 ${
                p.featured ? "border-green bg-card ring-1 ring-green" : "border-line bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{p.name}</h3>
                {p.featured && (
                  <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-medium text-green-deep">
                    Most popular
                  </span>
                )}
              </div>
              <p className="mt-4 text-4xl font-semibold tracking-tight">
                {p.price}
                <span className="text-base font-normal text-ink-soft">/mo</span>
              </p>
              <p className="mt-1 text-sm text-ink-soft">{p.for}</p>
              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={CONTACT}
                className={`mt-8 rounded-lg px-4 py-2.5 text-center text-sm font-medium ${
                  p.featured
                    ? "bg-green text-white hover:bg-green-deep"
                    : "border border-line hover:border-ink-soft"
                }`}
              >
                Start with a free health check
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-t border-line bg-card">
        <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Questions</h2>
          <div className="mt-10 divide-y divide-line border-y border-line">
            {faqs.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {f.q}
                  <span className="text-ink-soft transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="rounded-3xl bg-green px-6 py-16 text-center text-white sm:px-12">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Find out what&apos;s wrong with your books — free.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">
            Connect QuickBooks or Xero and get a Books Health Report: uncategorized items,
            unreconciled accounts and likely errors. No commitment.
          </p>
          <a
            href={CONTACT}
            className="mt-8 inline-block rounded-lg bg-white px-6 py-3 font-medium text-green-deep hover:bg-mint"
          >
            Get my free health check
          </a>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-ink-soft sm:flex-row sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Closebook. Concept landing page.</p>
          <p>QuickBooks and Xero are trademarks of their respective owners.</p>
        </div>
      </footer>
    </main>
  );
}
