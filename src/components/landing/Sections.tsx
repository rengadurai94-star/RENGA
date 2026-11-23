import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Swatch } from "@/components/catalog/Swatch";
import { BOARDS, COLOURS, HANDLES } from "@/lib/catalog/materials";
import { wallElevation } from "@/lib/drawing/elevation";
import { DEMO_PLACEMENTS, DEMO_ROOM } from "@/lib/room/demo-kitchen";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

/* ───────────────────────── 07 · How it works ───────────────────────── */

const HOW = [
  {
    n: "01",
    title: "Measure",
    body: "Enter your room’s width, length and height in feet, inches or millimetres. Mark doors, windows, columns and service points.",
    icon: (
      <path d="M4 28h40M4 24v8M44 24v8M12 26v4M20 26v4M28 26v4M36 26v4M10 16h28V6H10z" />
    ),
  },
  {
    n: "02",
    title: "Configure",
    body: "Pick modules from the 3D catalog. Set width, height and depth to the millimetre, then choose boards, finishes and hardware.",
    icon: <path d="M6 6h16v16H6zM26 6h16v16H26zM6 26h16v16H6zM26 26h16v16H26zM30 34h8M34 30v8" />,
  },
  {
    n: "03",
    title: "Visualise",
    body: "Review a synchronised top view, front and side elevations and a live 3D perspective. Every change updates all four.",
    icon: <path d="M24 4 42 14v20L24 44 6 34V14zM24 24 42 14M24 24 6 14M24 24v20" />,
  },
  {
    n: "04",
    title: "Order",
    body: "Get a cabinet-wise quotation with materials, hardware, labour and GST itemised. Order samples first, then confirm your purchase order.",
    icon: <path d="M10 6h22l6 6v30H10zM32 6v6h6M16 20h16M16 26h16M16 32h10" />,
  },
];

export function HowItWorks() {
  return (
    <section className="arch-grid-dark relative bg-charcoal text-ivory">
      <div className="mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-36">
        <Reveal className="grid gap-8 md:grid-cols-[1fr_1fr] md:items-end">
          <div>
            <p className="mb-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-olive-3">
              <span className="text-ivory">06</span>
              <span className="h-px w-8 bg-olive-3/50" />
              How the platform works
            </p>
            <h2 className="font-display text-[2.3rem] font-semibold leading-[1.02] tracking-[-0.035em] md:text-[3.8rem]">
              From empty room to installed kitchen in four steps.
            </h2>
          </div>
          <p className="max-w-md text-[15px] leading-relaxed text-ivory/60 md:justify-self-end">
            One parametric model runs the whole journey — the same geometry draws your plans, renders your 3D view and
            prices every board, hinge and hour of labour.
          </p>
        </Reveal>

        <ol className="mt-16 grid gap-px overflow-hidden rounded-2xl bg-ivory/10 md:mt-24 md:grid-cols-4">
          {HOW.map((s, i) => (
            <li key={s.n} className="bg-charcoal">
              <Reveal delay={i * 0.08} className="flex h-full flex-col p-7 md:p-9">
                <div className="flex items-start justify-between">
                  <svg viewBox="0 0 48 48" className="h-11 w-11 fill-none stroke-ivory/80" strokeWidth={1.2} strokeLinejoin="round" aria-hidden>
                    {s.icon}
                  </svg>
                  <span className="font-display text-sm font-semibold text-ivory/30">{s.n}</span>
                </div>
                <h3 className="mt-14 font-display text-2xl font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ivory/55">{s.body}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ───────────────────────── 08 · Sample ordering ───────────────────────── */

export function SampleTeaser() {
  const decors = ["oak", "walnut", "olive", "ivory", "carrara", "charcoal", "sage", "teak"]
    .map((id) => COLOURS.find((c) => c.id === id)!)
    .filter(Boolean);

  return (
    <section className="relative overflow-hidden bg-paper">
      <div className="mx-auto grid max-w-[1600px] gap-14 px-5 py-24 md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-20 md:px-10 md:py-36">
        <Reveal>
          <p className="mb-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-olive">
            <span className="text-charcoal">07</span>
            <span className="h-px w-8 bg-olive/50" />
            Sample ordering
          </p>
          <h2 className="font-display text-[2.3rem] font-semibold leading-[1.02] tracking-[-0.035em] md:text-[3.8rem]">
            Touch it before you choose it.
          </h2>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-charcoal/65">
            Screens can’t carry texture. Order physical laminate chips, board cross-sections, wood finishes and hardware
            samples — delivered to your door in a BOXES sample kit.
          </p>
          <ul className="mt-8 grid max-w-md grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              `${COLOURS.length} colours & decors`,
              `${BOARDS.length} board cross-sections`,
              "Wood & stone finishes",
              `${HANDLES.length} handle samples`,
            ].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-olive" />
                {t}
              </li>
            ))}
          </ul>
          <Link href="/sample-orders" className={cn(buttonVariants({ size: "lg" }), "mt-10")}>
            Browse Sample Orders <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        <Reveal delay={0.1} className="grid grid-cols-4 gap-3 md:gap-4">
          {decors.map((c, i) => (
            <figure
              key={c.id}
              className={cn("group relative", i % 2 === 1 && "translate-y-8")}
            >
              <Swatch
                colour={c}
                className="aspect-[3/4] w-full rounded-lg shadow-[0_1px_0_rgba(0,0,0,0.04),0_18px_40px_-24px_rgba(29,29,27,0.45)] transition-transform duration-700 ease-[var(--ease-arch)] group-hover:-translate-y-1.5"
              />
              <figcaption className="mt-2.5">
                <span className="block text-[12px] font-semibold leading-tight">{c.name}</span>
                <span className="text-[11px] text-grey">{c.code}</span>
              </figcaption>
            </figure>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── 09 · Final CTA ───────────────────────── */

function ElevationDrawing() {
  const rects = wallElevation(DEMO_PLACEMENTS, "A");
  const W = DEMO_ROOM.width;
  const H = DEMO_ROOM.height;
  return (
    <svg viewBox={`-200 -120 ${W + 400} ${H + 420}`} className="h-full w-full" aria-hidden preserveAspectRatio="xMidYMid meet">
      <g fill="none" stroke="currentColor" strokeWidth={1} vectorEffect="non-scaling-stroke">
        <rect x={0} y={0} width={W} height={H} strokeDasharray="6 6" opacity={0.5} vectorEffect="non-scaling-stroke" />
        {rects.map((r) => (
          <rect
            key={r.id}
            x={r.x}
            y={H - r.y - r.h}
            width={r.w}
            height={r.h}
            vectorEffect="non-scaling-stroke"
            opacity={r.kind === "carcass" ? 0.35 : 0.85}
            fill={r.kind === "countertop" ? "currentColor" : r.kind === "appliance" ? "currentColor" : "none"}
            fillOpacity={r.kind === "countertop" ? 0.5 : r.kind === "appliance" ? 0.12 : 0}
          />
        ))}
        <line x1={0} y1={H + 160} x2={W} y2={H + 160} vectorEffect="non-scaling-stroke" />
        <line x1={0} y1={H + 110} x2={0} y2={H + 210} vectorEffect="non-scaling-stroke" />
        <line x1={W} y1={H + 110} x2={W} y2={H + 210} vectorEffect="non-scaling-stroke" />
      </g>
      <text x={W / 2} y={H + 270} textAnchor="middle" fill="currentColor" fontSize={70} fontFamily="var(--font-inter)" opacity={0.7}>
        WALL A · FRONT ELEVATION · {W} MM
      </text>
    </svg>
  );
}

export function FinalCta() {
  return (
    <section className="arch-grid relative overflow-hidden bg-ivory">
      <div className="pointer-events-none absolute inset-y-0 right-[-10%] hidden w-[62%] items-center text-olive md:flex">
        <ElevationDrawing />
      </div>
      <div className="relative mx-auto max-w-[1600px] px-5 py-28 md:px-10 md:py-44">
        <Reveal className="max-w-2xl">
          <p className="mb-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-olive">
            <span className="text-charcoal">08</span>
            <span className="h-px w-8 bg-olive/50" />
            Begin
          </p>
          <h2 className="font-display text-[2.6rem] font-bold leading-[0.98] tracking-[-0.045em] md:text-[5rem]">
            Design Your Space.
            <span className="block text-olive">Down to Every Detail.</span>
          </h2>
          <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-charcoal/65 md:text-base">
            Start with a single cabinet or a whole kitchen. Everything you configure is priced live and ready to quote.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/3d-catalog" className={buttonVariants({ size: "lg" })}>
              Explore 3D Catalog <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/3d-catalog" className={buttonVariants({ size: "lg", variant: "secondary" })}>
              Start Designing <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
        <div className="mt-16 aspect-[4/3] text-olive md:hidden">
          <ElevationDrawing />
        </div>
      </div>
    </section>
  );
}
