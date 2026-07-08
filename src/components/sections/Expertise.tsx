"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PlaceholderMedia, { MediaTone } from "../PlaceholderMedia";
import ScrollReveal from "../ScrollReveal";

gsap.registerPlugin(ScrollTrigger);

const CARDS: { title: string; tone: MediaTone; index: string }[] = [
  { title: "Luxury Villas", tone: "villa", index: "01" },
  { title: "Modern Apartments", tone: "apartment", index: "02" },
  { title: "Commercial Interiors", tone: "office", index: "03" },
  { title: "Corporate Offices", tone: "microcement", index: "04" },
  { title: "Retail Spaces", tone: "retail", index: "05" },
  { title: "Hospitality", tone: "restaurant", index: "06" },
];

export default function Expertise() {
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>(".expertise-card");
      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            delay: (i % 3) * 0.08,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 90%", once: true },
          }
        );
      });
    },
    { scope: gridRef }
  );

  return (
    <section id="expertise" className="relative bg-black px-6 py-32 md:px-16 md:py-40">
      <ScrollReveal>
        <p className="text-xs uppercase tracking-editorial text-gold-bright">Our Expertise</p>
      </ScrollReveal>
      <ScrollReveal delay={0.1}>
        <h2 className="font-display mt-6 max-w-2xl text-4xl italic leading-tight text-warm md:text-5xl">
          Every space, one design language.
        </h2>
      </ScrollReveal>

      <div ref={gridRef} className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
        {CARDS.map((card) => (
          <div
            key={card.title}
            className="expertise-card group relative aspect-[4/5] cursor-pointer overflow-hidden"
            data-cursor="magnetic"
          >
            <PlaceholderMedia
              tone={card.tone}
              index={card.index}
              className="h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
            />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/85 via-black/10 to-transparent p-6">
              <h3 className="font-display text-2xl italic text-warm transition-colors group-hover:text-gold-bright md:text-3xl">
                {card.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
