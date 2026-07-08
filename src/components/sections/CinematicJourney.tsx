"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PlaceholderMedia, { MediaTone } from "../PlaceholderMedia";
import MagneticButton from "../MagneticButton";

gsap.registerPlugin(ScrollTrigger);

const SCENES: { tone: MediaTone; chapter: string; title: string }[] = [
  { tone: "hero", chapter: "01 — The Arrival", title: "Through the pivot door" },
  { tone: "villa", chapter: "02 — The Living Experience", title: "Living · Dining · Kitchen · Stair · Garden" },
  { tone: "penthouse", chapter: "03 — Master Bedroom", title: "The private suite" },
  { tone: "brass", chapter: "04 — Details", title: "Texture, grain, hardware" },
  { tone: "restaurant", chapter: "05 — Night Transformation", title: "Sunset into night" },
];

export default function CinematicJourney() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sceneRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      const scenes = sceneRefs.current.filter(Boolean) as HTMLDivElement[];

      gsap.set(scenes, { opacity: 0, scale: 1.12 });
      gsap.set(scenes[0], { opacity: 1, scale: 1 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top",
          end: "+=400%",
          scrub: 1,
          pin: true,
        },
      });

      scenes.forEach((scene, i) => {
        tl.to(scene, { scale: 1.05, duration: 1, ease: "none" }, i);
        if (i < scenes.length - 1) {
          tl.to(scene, { opacity: 0, duration: 0.4, ease: "none" }, i + 0.6);
          tl.fromTo(
            scenes[i + 1],
            { opacity: 0, scale: 1.12 },
            { opacity: 1, scale: 1.05, duration: 0.6, ease: "none" },
            i + 0.6
          );
        }
      });

      // fade the hero copy out as the journey begins
      gsap.to("#hero-copy", {
        opacity: 0,
        y: -40,
        ease: "none",
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top",
          end: "+=60%",
          scrub: true,
        },
      });

      // chapter label + progress ticks
      const chapters = gsap.utils.toArray<HTMLElement>(".journey-chapter");
      chapters.forEach((el, i) => {
        gsap.set(el, { opacity: i === 0 ? 1 : 0 });
      });
      scenes.forEach((_, i) => {
        if (i < scenes.length - 1) {
          tl.to(chapters[i], { opacity: 0, duration: 0.2 }, i + 0.55);
          tl.to(chapters[i + 1], { opacity: 1, duration: 0.2 }, i + 0.75);
        }
      });

      const ticks = gsap.utils.toArray<HTMLElement>(".journey-tick");
      scenes.forEach((_, i) => {
        tl.to(ticks[i], { backgroundColor: "var(--color-gold-bright)", scale: 1.4, duration: 0.2 }, i);
      });
    },
    { scope: wrapperRef }
  );

  return (
    <section id="top" ref={wrapperRef} className="relative h-screen w-full overflow-hidden bg-black">
      {SCENES.map((scene, i) => (
        <div
          key={scene.chapter}
          ref={(el) => {
            sceneRefs.current[i] = el;
          }}
          className="absolute inset-0"
        >
          <PlaceholderMedia tone={scene.tone} className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/50" />
        </div>
      ))}

      {/* hero copy */}
      <div
        id="hero-copy"
        className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
      >
        <p className="mb-6 text-[11px] uppercase tracking-editorial text-gold-bright">
          Urban Mark Interior
        </p>
        <h1 className="font-display max-w-4xl text-5xl italic leading-[1.05] text-warm md:text-7xl lg:text-8xl">
          Design Beyond Walls.
        </h1>
        <p className="mt-6 max-w-xl text-sm text-warm/70 md:text-base">
          Luxury Interiors Crafted Around Your Lifestyle.
        </p>
        <MagneticButton
          href="#consultation"
          className="mt-10 rounded-full border border-gold bg-gold-bright/5 px-9 py-4 text-xs uppercase tracking-editorial text-gold-bright backdrop-blur-sm transition-colors hover:bg-gold-bright/10"
        >
          Book Free Consultation
        </MagneticButton>
      </div>

      {/* scroll cue */}
      <div className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 text-[10px] uppercase tracking-editorial text-warm/50 sm:block">
        Scroll to enter
      </div>

      {/* chapter labels */}
      {SCENES.map((scene) => (
        <div
          key={scene.chapter}
          className="journey-chapter absolute bottom-20 left-6 z-10 w-max sm:bottom-10 md:bottom-12 md:left-12"
        >
          <p className="font-display text-lg italic text-gold-bright md:text-2xl">
            {scene.chapter}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-editorial text-warm/60">
            {scene.title}
          </p>
        </div>
      ))}

      {/* progress ticks */}
      <div className="absolute right-6 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-3 md:right-12">
        {SCENES.map((scene) => (
          <span
            key={scene.chapter}
            className="journey-tick h-1.5 w-1.5 rounded-full bg-warm/30 transition-transform"
          />
        ))}
      </div>
    </section>
  );
}
