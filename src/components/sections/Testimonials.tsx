"use client";

import { useRef } from "react";
import ScrollReveal from "../ScrollReveal";

const TESTIMONIALS = [
  {
    quote:
      "Urban Mark Interior didn't just design our villa — they choreographed how light and material would make us feel in every room.",
    name: "A. Reddy",
    project: "Villa Interior, Hyderabad",
  },
  {
    quote:
      "Every detail was intentional. The team treated our penthouse like a piece of architecture, not a decorating job.",
    name: "S. Kapoor",
    project: "Penthouse, Mumbai",
  },
  {
    quote:
      "Our office no longer feels corporate. It feels considered — clients notice the moment they walk in.",
    name: "R. Fernandes",
    project: "Corporate Office, Bengaluru",
  },
  {
    quote:
      "They understood restraint. Nothing is decorative for its own sake, and that discipline is what makes it feel luxurious.",
    name: "M. Iyer",
    project: "Luxury Apartment, Chennai",
  },
];

export default function Testimonials() {
  const trackRef = useRef<HTMLDivElement>(null);

  return (
    <section id="testimonials" className="relative overflow-hidden bg-black py-32 md:py-40">
      <div className="px-6 md:px-16">
        <ScrollReveal>
          <p className="text-xs uppercase tracking-editorial text-gold-bright">
            Client Testimonials
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h2 className="font-display mt-6 max-w-2xl text-4xl italic leading-tight text-warm md:text-5xl">
            Trusted with the spaces people live in.
          </h2>
        </ScrollReveal>
      </div>

      <div
        ref={trackRef}
        className="no-scrollbar mt-16 flex gap-6 overflow-x-auto px-6 pb-4 md:px-16"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {TESTIMONIALS.map((t) => (
          <div
            key={t.name}
            className="hairline flex w-[85vw] shrink-0 flex-col justify-between bg-charcoal/60 p-8 md:w-[420px] md:p-10"
            style={{ scrollSnapAlign: "start" }}
          >
            <p className="font-display text-xl italic leading-relaxed text-warm md:text-2xl">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="mt-10">
              <p className="text-sm text-gold-bright">{t.name}</p>
              <p className="mt-1 text-xs uppercase tracking-editorial text-warm/50">
                {t.project}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
