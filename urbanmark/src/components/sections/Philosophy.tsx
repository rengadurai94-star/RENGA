"use client";

import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useGsapContext } from "@/hooks/useGsapContext";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { philosophyLines } from "@/data/philosophy";

export function Philosophy() {
  const scope = useGsapContext<HTMLDivElement>(({ scope }) => {
    if (!scope.current) return;
    const lines = gsap.utils.toArray<HTMLElement>("[data-philosophy-line]", scope.current);
    if (lines.length === 0) return;

    gsap.set(lines, { opacity: 0, y: 24 });
    gsap.set(lines[0], { opacity: 1, y: 0 });

    ScrollTrigger.create({
      trigger: scope.current,
      start: "top top",
      end: `+=${(lines.length - 1) * 100}%`,
      scrub: 0.4,
      pin: true,
      onUpdate: (self) => {
        const position = self.progress * (lines.length - 1);
        const activeIndex = Math.round(position);

        lines.forEach((line, index) => {
          const isActive = index === activeIndex;
          gsap.to(line, {
            opacity: isActive ? 1 : 0,
            y: isActive ? 0 : index < activeIndex ? -24 : 24,
            duration: 0.4,
            ease: "power2.out",
            overwrite: "auto",
          });
        });
      },
    });
  }, []);

  return (
    <section ref={scope} className="relative flex h-svh flex-col items-center justify-center overflow-hidden bg-ink text-cream">
      <Eyebrow className="absolute top-28 text-cream/50">Our philosophy</Eyebrow>
      <div className="relative flex h-32 w-full max-w-5xl items-center justify-center px-6 text-center md:h-40">
        {philosophyLines.map((line) => (
          <p
            key={line}
            data-philosophy-line
            className="font-display absolute px-6 text-4xl leading-tight font-medium text-cream sm:text-5xl md:text-6xl lg:text-7xl"
          >
            {line}
          </p>
        ))}
      </div>
    </section>
  );
}
