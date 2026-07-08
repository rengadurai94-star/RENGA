"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScrollReveal from "../ScrollReveal";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  { n: "01", title: "Consultation" },
  { n: "02", title: "Space Planning" },
  { n: "03", title: "Moodboard" },
  { n: "04", title: "3D Visualization" },
  { n: "05", title: "Material Selection" },
  { n: "06", title: "Execution" },
  { n: "07", title: "Final Styling" },
];

export default function Process() {
  const listRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          transformOrigin: "top",
          scrollTrigger: {
            trigger: listRef.current,
            start: "top 70%",
            end: "bottom 60%",
            scrub: 1,
          },
        }
      );

      const items = gsap.utils.toArray<HTMLElement>(".process-step");
      items.forEach((item) => {
        gsap.fromTo(
          item,
          { opacity: 0, x: -30 },
          {
            opacity: 1,
            x: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: item, start: "top 85%", once: true },
          }
        );
      });
    },
    { scope: listRef }
  );

  return (
    <section id="process" className="relative bg-charcoal px-6 py-32 md:px-16 md:py-40">
      <ScrollReveal>
        <p className="text-xs uppercase tracking-editorial text-gold-bright">Design Process</p>
      </ScrollReveal>
      <ScrollReveal delay={0.1}>
        <h2 className="font-display mt-6 max-w-2xl text-4xl italic leading-tight text-warm md:text-5xl">
          A journey, precisely staged.
        </h2>
      </ScrollReveal>

      <div ref={listRef} className="relative mt-20 max-w-2xl">
        <div className="absolute left-[9px] top-2 bottom-2 w-px bg-warm/10">
          <div ref={lineRef} className="h-full w-full bg-gold-bright" />
        </div>

        <div className="flex flex-col gap-12">
          {STEPS.map((step) => (
            <div key={step.n} className="process-step relative flex items-baseline gap-8 pl-8">
              <span className="absolute left-0 top-1.5 h-[9px] w-[9px] rounded-full bg-gold-bright" />
              <span className="font-sans text-sm tabular-nums text-gold-bright/70">{step.n}</span>
              <h3 className="font-display text-2xl italic text-warm md:text-3xl">{step.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
