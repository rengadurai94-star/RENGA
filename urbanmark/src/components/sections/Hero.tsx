"use client";

import dynamic from "next/dynamic";
import { gsap } from "@/lib/gsap";
import { useGsapContext } from "@/hooks/useGsapContext";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Magnetic } from "@/components/ui/Magnetic";
import { Eyebrow } from "@/components/ui/Eyebrow";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
});

export function Hero() {
  const scope = useGsapContext<HTMLDivElement>(({ scope }) => {
    if (!scope.current) return;

    const timeline = gsap.timeline({ delay: 0.3, defaults: { ease: "power3.out" } });

    timeline
      .from("[data-hero-eyebrow]", { opacity: 0, y: 16, duration: 0.6 })
      .from("[data-hero-line]", { opacity: 0, y: "100%", duration: 1, stagger: 0.12 }, "-=0.3")
      .from("[data-hero-sub]", { opacity: 0, y: 16, duration: 0.8 }, "-=0.5")
      .from("[data-hero-cta]", { opacity: 0, y: 16, duration: 0.8 }, "-=0.6")
      .from("[data-hero-scroll]", { opacity: 0, duration: 0.6 }, "-=0.4");
  }, []);

  return (
    <section ref={scope} className="relative flex min-h-svh items-center overflow-hidden bg-cream">
      <div className="absolute inset-y-0 right-0 z-0 hidden w-[58%] md:block lg:w-[52%]">
        <HeroScene />
      </div>
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-cream from-35% via-cream/40 via-55% to-transparent" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-cream via-transparent to-cream/30" />

      <Container className="relative z-10 pt-28 pb-20">
        <div data-hero-eyebrow>
          <Eyebrow>Interior architecture &amp; design</Eyebrow>
        </div>

        <h1 className="font-display mt-6 max-w-4xl text-5xl leading-[1.05] font-medium text-ink sm:text-6xl md:text-7xl lg:text-8xl">
          <span className="block overflow-hidden">
            <span data-hero-line className="block">Interiors built</span>
          </span>
          <span className="block overflow-hidden">
            <span data-hero-line className="block">to be <em className="italic text-brass">lived in</em>,</span>
          </span>
          <span className="block overflow-hidden">
            <span data-hero-line className="block">not just photographed.</span>
          </span>
        </h1>

        <p data-hero-sub className="mt-8 max-w-md text-base leading-relaxed text-ink/60 md:text-lg">
          A design studio working across residential, hospitality, and retail interiors —
          from first sketch to the last piece placed on the shelf.
        </p>

        <div data-hero-cta className="mt-10 flex flex-wrap gap-4">
          <Magnetic>
            <Button href="/projects">View our work</Button>
          </Magnetic>
          <Magnetic>
            <Button href="/contact" variant="secondary">
              Start a project
            </Button>
          </Magnetic>
        </div>
      </Container>

      <div
        data-hero-scroll
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 text-xs tracking-[0.25em] text-ink/50 uppercase"
      >
        Scroll
        <span className="h-10 w-px bg-ink/30" />
      </div>
    </section>
  );
}
