"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useGsapContext } from "@/hooks/useGsapContext";
import type { ScrollProgress } from "@/components/three/CameraRig";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Magnetic } from "@/components/ui/Magnetic";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SITE } from "@/lib/constants";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
});

export function Hero() {
  const scrollProgress = useRef<ScrollProgress>({ value: 0 });

  const scope = useGsapContext<HTMLDivElement>(({ scope }) => {
    if (!scope.current) return;

    const timeline = gsap.timeline({ delay: 0.2, defaults: { ease: "power3.out" } });

    timeline
      .from("[data-hero-eyebrow]", { opacity: 0, y: 16, duration: 0.6 })
      .from("[data-hero-line]", { opacity: 0, y: "100%", duration: 1, stagger: 0.12 }, "-=0.3")
      .from("[data-hero-sub]", { opacity: 0, y: 16, duration: 0.8 }, "-=0.5")
      .from("[data-hero-cta]", { opacity: 0, y: 16, duration: 0.8 }, "-=0.6")
      .from("[data-hero-scroll]", { opacity: 0, duration: 0.6 }, "-=0.4");

    ScrollTrigger.create({
      trigger: scope.current,
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        scrollProgress.current.value = self.progress;
      },
    });
  }, []);

  return (
    <section ref={scope} className="relative flex min-h-svh items-center overflow-hidden bg-ink text-cream">
      <div className="absolute inset-y-0 right-0 z-0 hidden w-[58%] md:block lg:w-[52%]">
        <HeroScene scrollProgress={scrollProgress} />
      </div>
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-ink from-35% via-ink/50 via-55% to-transparent" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-ink via-transparent to-ink/40" />

      <Container className="relative z-10 pt-28 pb-20">
        <div data-hero-eyebrow>
          <Eyebrow className="text-cream/60">Urban Mark Interior</Eyebrow>
        </div>

        <h1 className="font-display mt-6 max-w-4xl text-6xl leading-[0.98] font-medium tracking-tight text-cream uppercase sm:text-7xl md:text-8xl lg:text-9xl">
          <span className="block overflow-hidden">
            <span data-hero-line className="block">Design</span>
          </span>
          <span className="block overflow-hidden">
            <span data-hero-line className="block text-brass italic">Beyond</span>
          </span>
          <span className="block overflow-hidden">
            <span data-hero-line className="block">Walls</span>
          </span>
        </h1>

        <p data-hero-sub className="mt-8 max-w-md text-base leading-relaxed text-cream/60 md:text-lg">
          {SITE.tagline}
        </p>

        <div data-hero-cta className="mt-10 flex flex-wrap gap-4">
          <Magnetic>
            <Button href="/contact" className="bg-brass text-ink hover:bg-cream hover:text-ink border-brass hover:border-cream">
              Book Consultation
            </Button>
          </Magnetic>
          <Magnetic>
            <Button href="/projects" variant="secondary" className="border-cream/30 text-cream hover:bg-cream hover:text-ink">
              View our work
            </Button>
          </Magnetic>
        </div>
      </Container>

      <div
        data-hero-scroll
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 text-xs tracking-[0.25em] text-cream/40 uppercase"
      >
        Scroll
        <span className="h-10 w-px bg-cream/25" />
      </div>
    </section>
  );
}
