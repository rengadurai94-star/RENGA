"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { COLOUR_MAP } from "@/lib/catalog/materials";
import { CATEGORIES, PRODUCTS } from "@/lib/catalog/products";
import { cn } from "@/lib/utils";

const KitchenScene = dynamic(() => import("./KitchenScene"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 animate-pulse bg-ivory-2/40" />,
});

const STEPS = ["Intro", "Discover", "Components", "Plan", "Materials", "Visualise"];
const PALETTE = ["olive", "ivory", "oak", "charcoal", "sage", "walnut"];
const ease = [0.22, 1, 0.36, 1] as const;

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mobile;
}

export function Walkthrough() {
  const ref = useRef<HTMLDivElement>(null);
  const mobile = useIsMobile();
  const [step, setStep] = useState(0);
  const [autoColour, setAutoColour] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [active, setActive] = useState(true);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const progress = useTransform(scrollYProgress, (v) => v * (STEPS.length - 1));

  useMotionValueEvent(progress, "change", (p) => {
    const s = Math.round(p);
    setStep((prev) => (prev === s ? prev : s));
    if (s === 4) {
      const sub = Math.min(0.999, Math.max(0, p - 3.5));
      setAutoColour(Math.floor(sub * PALETTE.length));
    }
  });

  // Pause rendering when the walkthrough is off-screen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const colour = picked ?? (step === 4 ? PALETTE[autoColour] : null);
  const scrollToStep = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const top = el.offsetTop + (i / (STEPS.length - 1)) * (el.offsetHeight - window.innerHeight);
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <section ref={ref} aria-label="BOXES walkthrough" className="relative -mt-16" style={{ height: `${STEPS.length * 100}svh` }}>
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <KitchenScene progress={progress} step={step} colour={colour} mobile={mobile} active={active} />
        </div>

        {/* Readability wash */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ivory from-25% via-ivory/60 to-transparent to-60% md:bg-[linear-gradient(to_right,var(--ivory)_0%,rgb(244_240_232/0.85)_55%,transparent_100%)] md:[background-size:44%_100%] md:bg-no-repeat" />

        {/* Copy */}
        <div className="pointer-events-none absolute inset-0 mx-auto flex max-w-[1600px] items-end px-5 pb-10 md:items-center md:px-10 md:pb-0">
          <div className="pointer-events-auto w-full max-w-[34rem]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease }}
              >
                <StepCopy step={step} colour={colour} onPick={setPicked} onNext={() => scrollToStep(1)} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Step rail */}
        <nav aria-label="Walkthrough steps" className="absolute right-5 top-1/2 hidden -translate-y-1/2 flex-col gap-3 md:right-10 md:flex">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => scrollToStep(i)}
              className="group flex items-center justify-end gap-3"
              aria-current={i === step ? "step" : undefined}
            >
              <span
                className={cn(
                  "text-[11px] font-medium tracking-wide transition-all duration-500",
                  i === step ? "text-charcoal opacity-100" : "text-grey opacity-0 group-hover:opacity-100",
                )}
              >
                {s}
              </span>
              <span className={cn("block h-px transition-all duration-500", i === step ? "w-10 bg-charcoal" : "w-5 bg-charcoal/25")} />
            </button>
          ))}
        </nav>

        {/* Mobile progress */}
        <div className="absolute inset-x-5 top-20 flex gap-1.5 md:hidden">
          {STEPS.map((s, i) => (
            <span key={s} className={cn("h-0.5 flex-1 rounded-full transition-colors duration-500", i <= step ? "bg-charcoal" : "bg-charcoal/15")} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Eyebrow({ n, children }: { n?: string; children: React.ReactNode }) {
  return (
    <p className="mb-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-olive">
      {n && <span className="text-charcoal">{n}</span>}
      <span className="h-px w-8 bg-olive/50" />
      {children}
    </p>
  );
}

function StepCopy({
  step,
  colour,
  onPick,
  onNext,
}: {
  step: number;
  colour: string | null;
  onPick: (c: string) => void;
  onNext: () => void;
}) {
  const h2 = "font-display text-[2.1rem] font-semibold leading-[1.02] tracking-[-0.035em] md:text-[3.4rem]";
  const body = "mt-5 max-w-md text-[15px] leading-relaxed text-charcoal/70 md:text-base";

  switch (step) {
    case 0:
      return (
        <div>
          <Eyebrow>Modular kitchens &amp; furniture</Eyebrow>
          <h1 className="font-display text-[2.9rem] font-bold leading-[0.95] tracking-[-0.045em] md:text-[5.2rem]">
            Design Your Kitchen.
            <span className="block text-olive">Your Way.</span>
          </h1>
          <p className={body}>
            Explore modular components, customize every detail and visualize your space in 3D before you order.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/3d-catalog" className={buttonVariants({ size: "lg" })}>
              Explore 3D Catalog <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/3d-catalog" className={buttonVariants({ size: "lg", variant: "secondary" })}>
              Start Designing
            </Link>
          </div>
          <button onClick={onNext} className="mt-10 hidden items-center gap-2 text-xs font-medium tracking-wide text-grey hover:text-charcoal md:flex">
            <ArrowDown className="h-3.5 w-3.5 animate-bounce" /> Scroll to walk through a BOXES kitchen
          </button>
        </div>
      );
    case 1:
      return (
        <div>
          <Eyebrow n="01">Discover</Eyebrow>
          <h2 className={h2}>Furniture, reduced to its modules.</h2>
          <p className={body}>
            Every BOXES space is assembled from engineered cabinets — base, wall, tall, loft and corner units that lock
            together into kitchens, wardrobes and living storage.
          </p>
          <dl className="mt-8 grid max-w-md grid-cols-3 border-t border-charcoal/10 pt-6">
            {[
              [String(CATEGORIES.length), "Categories"],
              [String(PRODUCTS.length), "Module SKUs"],
              ["1 mm", "Sizing precision"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="font-display text-3xl font-semibold tracking-tight">{v}</dt>
                <dd className="mt-1 text-xs text-grey">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      );
    case 2:
      return (
        <div>
          <Eyebrow n="02">Components</Eyebrow>
          <h2 className={h2}>Look inside every unit.</h2>
          <p className={body}>
            Open the doors, slide the drawers, explode the carcass. See the board, the shutter, the hinge and the runner
            that make up each module — and exactly what each one costs.
          </p>
          <ul className="mt-7 max-w-md divide-y divide-charcoal/10 border-y border-charcoal/10 text-sm">
            {[
              ["Carcass", "BWP plywood · HDHMR · MDF · particle board"],
              ["Shutter", "Laminate · acrylic · veneer · PU lacquer"],
              ["Hardware", "Soft-close hinges, runners & handles"],
            ].map(([k, v]) => (
              <li key={k} className="flex justify-between gap-4 py-3">
                <span className="font-medium">{k}</span>
                <span className="text-right text-charcoal/60">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case 3:
      return (
        <div>
          <Eyebrow n="03">Plan</Eyebrow>
          <h2 className={h2}>Start from your actual room.</h2>
          <p className={body}>
            Enter wall lengths in feet, inches or millimetres. Choose a straight, L, U or parallel layout and place modules
            wall by wall — BOXES checks every clearance and tells you how much wall is left.
          </p>
          <div className="mt-7 flex flex-wrap gap-2 text-xs font-medium">
            {["Straight", "L-Shaped", "U-Shaped", "Parallel", "Custom"].map((l, i) => (
              <span key={l} className={cn("rounded-full border px-3.5 py-1.5", i === 1 ? "border-charcoal bg-charcoal text-ivory" : "border-charcoal/15")}>
                {l}
              </span>
            ))}
          </div>
        </div>
      );
    case 4:
      return (
        <div>
          <Eyebrow n="04">Materials</Eyebrow>
          <h2 className={h2}>Every surface, your call.</h2>
          <p className={body}>
            Carcass board, shutter substrate, finish, colour and hardware are independent choices. Tap a swatch to refinish
            the base run.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {PALETTE.map((id) => {
              const c = COLOUR_MAP[id];
              const active = colour === id;
              return (
                <button
                  key={id}
                  onClick={() => onPick(id)}
                  aria-label={c.name}
                  aria-pressed={active}
                  className={cn(
                    "h-11 w-11 rounded-full border border-charcoal/10 transition-transform duration-300",
                    active ? "scale-110 ring-2 ring-charcoal ring-offset-2 ring-offset-ivory" : "hover:scale-105",
                  )}
                  style={{
                    background:
                      c.pattern === "wood"
                        ? `repeating-linear-gradient(95deg, ${c.hex} 0 5px, color-mix(in srgb, ${c.hex} 80%, black) 5px 7px)`
                        : c.hex,
                  }}
                />
              );
            })}
          </div>
          <p className="mt-4 text-sm text-charcoal/60">
            {colour ? (
              <>
                <span className="font-medium text-charcoal">{COLOUR_MAP[colour].name}</span> · {COLOUR_MAP[colour].code} · Matte laminate
              </>
            ) : (
              "Muted Olive · OL04 · Matte laminate"
            )}
          </p>
        </div>
      );
    default:
      return (
        <div>
          <Eyebrow n="05">Visualise</Eyebrow>
          <h2 className={h2}>See it before it is made.</h2>
          <p className={body}>
            Top view, front and side elevations and a live 3D perspective — all driven by one model, so a change anywhere
            updates everywhere.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/3d-catalog" className={buttonVariants({ size: "lg" })}>
              Open the 3D Catalog <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      );
  }
}
