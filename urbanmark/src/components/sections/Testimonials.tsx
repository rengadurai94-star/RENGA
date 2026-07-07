"use client";

import { useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { testimonials } from "@/data/services";

export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const quoteRef = useRef<HTMLDivElement>(null);

  const goTo = (index: number) => {
    const nextIndex = (index + testimonials.length) % testimonials.length;
    const el = quoteRef.current;
    if (!el) {
      setActiveIndex(nextIndex);
      return;
    }

    gsap.to(el, {
      opacity: 0,
      y: -12,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        setActiveIndex(nextIndex);
        gsap.fromTo(el, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
      },
    });
  };

  const active = testimonials[activeIndex];

  return (
    <section className="bg-ink py-28 text-cream md:py-36">
      <Container className="flex flex-col items-center gap-10 text-center">
        <Eyebrow className="text-cream/60">Client word</Eyebrow>

        <div ref={quoteRef} className="flex max-w-3xl flex-col items-center gap-8">
          <blockquote className="font-display text-2xl leading-snug font-medium italic md:text-4xl">
            &ldquo;{active.quote}&rdquo;
          </blockquote>
          <figcaption className="text-sm text-cream/60">
            {active.name} — {active.role}
          </figcaption>
        </div>

        <div className="flex items-center gap-4">
          {testimonials.map((testimonial, index) => (
            <button
              key={testimonial.id}
              type="button"
              aria-label={`Show testimonial from ${testimonial.name}`}
              onClick={() => goTo(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === activeIndex ? "w-8 bg-brass" : "w-1.5 bg-cream/30"
              }`}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
