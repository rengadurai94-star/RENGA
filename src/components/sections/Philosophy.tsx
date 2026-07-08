"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const LINES = [
  "We don't decorate spaces.",
  "We create experiences.",
  "Every material has a purpose.",
  "Every light tells a story.",
  "Every detail matters.",
  "Luxury begins with simplicity.",
];

export default function Philosophy() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const lines = gsap.utils.toArray<HTMLElement>(".philosophy-line");
      gsap.set(lines, { opacity: 0, y: 24 });
      gsap.set(lines[0], { opacity: 1, y: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top",
          end: `+=${LINES.length * 100}%`,
          scrub: 1,
          pin: true,
        },
      });

      lines.forEach((line, i) => {
        if (i < lines.length - 1) {
          tl.to(line, { opacity: 0, y: -24, duration: 0.4 }, i + 0.6);
          tl.fromTo(
            lines[i + 1],
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.4 },
            i + 0.7
          );
        }
      });
    },
    { scope: wrapperRef }
  );

  return (
    <section id="philosophy" ref={wrapperRef} className="relative h-screen overflow-hidden bg-charcoal">
      <div className="absolute left-6 top-10 z-10 text-xs uppercase tracking-editorial text-gold-bright md:left-16 md:top-16">
        Design Philosophy
      </div>
      <div className="relative h-full px-6 md:px-16">
        {LINES.map((line) => (
          <p
            key={line}
            className="philosophy-line font-display absolute inset-0 flex max-w-4xl mx-auto items-center justify-center text-center text-3xl italic leading-tight text-warm md:text-5xl lg:text-6xl"
          >
            {line}
          </p>
        ))}
      </div>
    </section>
  );
}
