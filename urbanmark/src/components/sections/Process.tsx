"use client";

import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useGsapContext } from "@/hooks/useGsapContext";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { processSteps } from "@/data/services";

export function Process() {
  const scope = useGsapContext<HTMLDivElement>(({ scope }) => {
    if (!scope.current) return;
    const fill = scope.current.querySelector("[data-process-fill]");
    if (!fill) return;

    gsap.set(fill, { scaleY: 0, transformOrigin: "top" });

    ScrollTrigger.create({
      trigger: scope.current,
      start: "top 75%",
      end: "bottom 60%",
      scrub: 0.6,
      onUpdate: (self) => gsap.set(fill, { scaleY: self.progress }),
    });
  }, []);

  return (
    <section className="py-28 md:py-36">
      <Container className="flex flex-col gap-16">
        <SectionHeading eyebrow="Our process" title="A luxury build has no shortcuts." />

        <div ref={scope} className="relative flex flex-col gap-12 pl-10 sm:pl-14">
          <div className="absolute top-1 bottom-1 left-[7px] w-px bg-ink/12 sm:left-[11px]">
            <div data-process-fill className="h-full w-full bg-brass" />
          </div>

          {processSteps.map((step) => (
            <div key={step.step} className="relative flex flex-col gap-2">
              <span className="absolute top-1 -left-10 flex h-4 w-4 items-center justify-center rounded-full bg-brass sm:-left-14 sm:h-5 sm:w-5" />
              <span className="font-display text-xs text-brass">{step.step}</span>
              <h3 className="font-display text-2xl font-medium text-ink md:text-3xl">{step.title}</h3>
              <p className="max-w-lg text-sm leading-relaxed text-ink/60 md:text-base">{step.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
