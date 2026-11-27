"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import type { SpImage, SpUnit } from "@/data/sp-residency";

type Props = {
  typical: SpImage;
  units: SpUnit[];
};

const TYPICAL = "typical";

export default function SpFloorPlans({ typical, units }: Props) {
  const [active, setActive] = useState<string>(TYPICAL);
  const unit = units.find((u) => u.key === active);
  const plan = unit ? unit.plan : typical;

  const tabs = [{ key: TYPICAL, label: "Typical floor", sub: "Floors 1–4" }].concat(
    units.map((u) => ({ key: u.key, label: u.label, sub: u.configuration }))
  );

  return (
    <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_22rem]">
      <div>
        <div role="tablist" aria-label="Floor plans" className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 pb-2 md:mx-0 md:px-0">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={active === t.key}
              onClick={() => setActive(t.key)}
              className={clsx(
                "shrink-0 rounded-full border px-5 py-2.5 text-left transition-colors",
                active === t.key
                  ? "border-gold bg-gold-bright/10 text-gold-bright"
                  : "border-warm/15 text-warm/60 hover:border-gold/50 hover:text-warm"
              )}
            >
              <span className="block text-xs uppercase tracking-editorial">{t.label}</span>
              <span className="block text-[10px] text-warm/40">{t.sub}</span>
            </button>
          ))}
        </div>

        <div className="relative mt-6 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-sm bg-warm p-5 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.01 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-full w-full"
            >
              <Image
                src={plan.src}
                alt={plan.alt}
                fill
                sizes="(max-width: 1024px) 92vw, 60vw"
                className="object-contain"
              />
            </motion.div>
          </AnimatePresence>
          <span className="absolute bottom-3 right-4 text-[10px] uppercase tracking-editorial text-black/40">
            N ↑ &middot; Not to scale
          </span>
        </div>
      </div>

      <aside className="lg:pt-[4.5rem]">
        {unit ? (
          <div>
            <p className="text-[11px] uppercase tracking-editorial text-gold-bright">{unit.facing}</p>
            <h3 className="font-display mt-3 text-4xl italic text-warm">
              {unit.label} <span className="text-warm/50">&middot; {unit.configuration}</span>
            </h3>
            <dl className="mt-6 grid grid-cols-3 gap-4 border-y border-warm/10 py-5">
              {[
                ["Carpet", unit.carpet],
                ["Balcony", unit.balcony],
                ["SBU", unit.sbu],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <dt className="text-[10px] uppercase tracking-editorial text-warm/45">{k}</dt>
                  <dd className="font-display mt-1 text-xl italic text-warm">
                    {v}
                    <span className="ml-1 font-sans text-[10px] not-italic text-warm/40">sq.ft</span>
                  </dd>
                </div>
              ))}
            </dl>
            <ul className="mt-5 space-y-2 text-sm">
              {unit.rooms.map((r, i) => (
                <li key={`${r.name}-${i}`} className="flex justify-between gap-4 text-warm/70">
                  <span>{r.name}</span>
                  <span className="shrink-0 tabular-nums text-warm/45">{r.dims}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-warm/35">Available on the 1st to 4th floors. Kitchen dimensions include the utility area.</p>
          </div>
        ) : (
          <div>
            <p className="text-[11px] uppercase tracking-editorial text-gold-bright">Floors 1–4</p>
            <h3 className="font-display mt-3 text-4xl italic text-warm">Six homes per floor</h3>
            <p className="mt-5 text-sm leading-relaxed text-warm/65">
              A central north–south corridor with landscaped courts at both ends. Three-bedroom homes A, D and F
              hold the corners; two-bedroom homes B, C and E sit between them, with the lift and staircase
              beside Unit B.
            </p>
            <ul className="mt-6 space-y-2 border-t border-warm/10 pt-5 text-sm text-warm/70">
              {units.map((u) => (
                <li key={u.key} className="flex justify-between">
                  <button onClick={() => setActive(u.key)} className="hover:text-gold-bright">
                    {u.label} &middot; {u.configuration}
                  </button>
                  <span className="tabular-nums text-warm/45">{u.carpet} sq.ft</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}
