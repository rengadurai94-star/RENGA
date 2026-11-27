"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { SpImage } from "@/data/sp-residency";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  image: SpImage;
  name: string;
  tagline: string;
  location: string;
  stats: { value: string; label: string }[];
};

export default function SpHero({ image, name, tagline, location, stats }: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(".sp-hero-line", {
        y: 60,
        opacity: 0,
        duration: 1.3,
        ease: "power3.out",
        stagger: 0.12,
        delay: 0.2,
      });
      gsap.to(".sp-hero-media", {
        yPercent: 12,
        scale: 1.06,
        ease: "none",
        scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(".sp-hero-copy", {
        opacity: 0,
        y: -60,
        ease: "none",
        scrollTrigger: { trigger: ref.current, start: "top top", end: "60% top", scrub: true },
      });
    },
    { scope: ref }
  );

  return (
    <section ref={ref} id="top" className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-black">
      <div className="sp-hero-media absolute inset-0">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          preload
          sizes="100vw"
          className="object-cover object-[50%_40%]"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/60" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />

      <div className="sp-hero-copy absolute inset-x-0 bottom-0 z-10 px-6 pb-14 md:px-16 md:pb-20">
        <p className="sp-hero-line text-[11px] uppercase tracking-editorial text-gold-bright">
          Project Showcase &middot; {location}
        </p>
        <h1 className="sp-hero-line font-display mt-5 max-w-4xl text-5xl italic leading-[1.02] text-warm md:text-7xl lg:text-8xl">
          {name}
        </h1>
        <p className="sp-hero-line mt-5 max-w-xl text-sm text-warm/70 md:text-base">{tagline}.</p>

        <dl className="sp-hero-line mt-10 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-6 border-t border-warm/15 pt-8 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-display text-3xl italic text-warm md:text-4xl">{s.value}</dd>
              <p className="mt-1 text-[10px] uppercase tracking-editorial text-warm/50">{s.label}</p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
