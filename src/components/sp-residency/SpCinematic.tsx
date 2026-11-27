"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { SpImage } from "@/data/sp-residency";

gsap.registerPlugin(ScrollTrigger);

export type SpChapter = {
  chapter: string;
  title: string;
  notes: string[];
  image: SpImage;
};

/**
 * Pinned, scroll-scrubbed walk-through of the brochure interiors.
 * The brochure renders are 700-1000 px wide, so each one is shown sharp inside a frame over a
 * soft, enlarged backdrop of itself rather than stretched full-bleed.
 */
export default function SpCinematic({ chapters }: { chapters: SpChapter[] }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sceneRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(
    () => {
      const scenes = sceneRefs.current.filter(Boolean) as HTMLDivElement[];
      const frames = gsap.utils.toArray<HTMLElement>(".sp-frame");
      const copy = gsap.utils.toArray<HTMLElement>(".sp-copy");
      const ticks = gsap.utils.toArray<HTMLElement>(".sp-tick");

      gsap.set(scenes, { opacity: 0 });
      gsap.set(scenes[0], { opacity: 1 });
      gsap.set(frames, { scale: 1.08, yPercent: 4 });
      gsap.set(frames[0], { scale: 1, yPercent: 0 });
      gsap.set(copy, { opacity: 0, y: 30 });
      gsap.set(copy[0], { opacity: 1, y: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top",
          end: `+=${chapters.length * 90}%`,
          scrub: 1,
          pin: true,
        },
      });

      scenes.forEach((scene, i) => {
        tl.to(frames[i], { scale: 0.97, duration: 1, ease: "none" }, i);
        tl.to(ticks[i], { backgroundColor: "var(--color-gold-bright)", scale: 1.5, duration: 0.2 }, i);
        if (i < scenes.length - 1) {
          tl.to(scene, { opacity: 0, duration: 0.35, ease: "none" }, i + 0.65);
          tl.to(copy[i], { opacity: 0, y: -30, duration: 0.25 }, i + 0.6);
          tl.to(scenes[i + 1], { opacity: 1, duration: 0.35, ease: "none" }, i + 0.65);
          tl.to(frames[i + 1], { scale: 1, yPercent: 0, duration: 0.5, ease: "none" }, i + 0.65);
          tl.to(copy[i + 1], { opacity: 1, y: 0, duration: 0.3 }, i + 0.8);
          tl.to(ticks[i], { backgroundColor: "rgba(244,239,230,0.3)", scale: 1, duration: 0.2 }, i + 0.8);
        }
      });
    },
    { scope: wrapperRef }
  );

  return (
    <section
      id="walkthrough"
      ref={wrapperRef}
      aria-label="Interior walkthrough"
      className="relative h-[100svh] w-full overflow-hidden bg-black"
    >
      {chapters.map((c, i) => (
        <div
          key={c.chapter}
          ref={(el) => {
            sceneRefs.current[i] = el;
          }}
          className="absolute inset-0"
        >
          {/* soft backdrop: a small rendition of the same image, enlarged and blurred */}
          <div className="absolute inset-0 scale-110 opacity-45 blur-2xl">
            <Image src={c.image.src} alt="" fill sizes="128px" className="object-cover" aria-hidden />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/85" />

          {/* framed, native-resolution render */}
          <div className="absolute inset-0 flex items-center justify-center px-5 pb-36 pt-24 md:px-16 md:pb-24 md:pr-[28rem]">
            <figure
              className="sp-frame relative overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.6)]"
              style={{
                aspectRatio: `${c.image.width} / ${c.image.height}`,
                // fit inside the padded stage by width AND height, whatever the render's proportions
                width: `min(100%, 1040px, calc((100svh - 15rem) * ${(c.image.width / c.image.height).toFixed(4)}))`,
              }}
            >
              <Image
                src={c.image.src}
                alt={c.image.alt}
                fill
                sizes="(max-width: 768px) 92vw, 1040px"
                className="object-cover"
              />
              <span className="absolute left-3 top-3 h-3 w-3 border-l border-t border-gold/70" />
              <span className="absolute right-3 top-3 h-3 w-3 border-r border-t border-gold/70" />
              <span className="absolute bottom-3 left-3 h-3 w-3 border-b border-l border-gold/70" />
              <span className="absolute bottom-3 right-3 h-3 w-3 border-b border-r border-gold/70" />
            </figure>
          </div>
        </div>
      ))}

      {/* chapter copy */}
      {chapters.map((c) => (
        <div
          key={c.chapter}
          className="sp-copy absolute inset-x-6 bottom-10 z-10 md:inset-x-auto md:bottom-auto md:right-16 md:top-1/2 md:w-80 md:-translate-y-1/2"
        >
          <p className="font-display text-lg italic text-gold-bright md:text-2xl">{c.chapter}</p>
          <h3 className="mt-2 text-[11px] uppercase tracking-editorial text-warm">{c.title}</h3>
          <ul className="mt-4 hidden space-y-2 border-l border-gold/30 pl-4 text-sm text-warm/65 md:block">
            {c.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-warm/55 md:hidden">{c.notes[0]}</p>
        </div>
      ))}

      <div className="absolute left-6 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-3 md:left-12 md:flex">
        {chapters.map((c) => (
          <span key={c.chapter} className="sp-tick h-1.5 w-1.5 rounded-full bg-warm/30" />
        ))}
      </div>
    </section>
  );
}
