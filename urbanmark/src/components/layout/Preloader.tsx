"use client";

import { useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { useLenis } from "@/hooks/useLenis";
import { SITE } from "@/lib/constants";

export function Preloader() {
  const [isDone, setIsDone] = useState(false);
  const counterRef = useRef<HTMLSpanElement>(null);
  const progress = useRef({ value: 0 });
  const lenis = useLenis();

  useIsomorphicLayoutEffect(() => {
    lenis?.stop();
    document.body.style.overflow = "hidden";

    const timeline = gsap.timeline({
      onComplete: () => {
        document.body.style.overflow = "";
        lenis?.start();
        setIsDone(true);
      },
    });

    timeline
      .to(progress.current, {
        value: 100,
        duration: 2.2,
        ease: "power2.inOut",
        onUpdate: () => {
          if (counterRef.current) {
            counterRef.current.textContent = String(Math.round(progress.current.value));
          }
        },
      })
      .to("[data-preloader-mark]", { opacity: 0, y: -12, duration: 0.4, ease: "power2.in" }, "+=0.2")
      .to(
        "[data-preloader-panel]",
        { yPercent: -100, duration: 0.9, ease: "power4.inOut" },
        "-=0.1",
      );

    return () => {
      timeline.kill();
    };
  }, [lenis]);

  if (isDone) return null;

  return (
    <div className="fixed inset-0 z-[150]">
      <div
        data-preloader-panel
        className="flex h-full w-full flex-col items-center justify-center bg-ink text-cream"
      >
        <div data-preloader-mark className="flex flex-col items-center gap-8">
          <span className="font-display text-2xl tracking-[0.35em] uppercase">
            {SITE.shortName}
          </span>
          <div className="flex items-baseline gap-1 font-display text-sm tabular-nums text-cream/50">
            <span ref={counterRef}>0</span>
            <span>%</span>
          </div>
          <div className="h-px w-40 overflow-hidden bg-cream/15">
            <div className="h-full w-full origin-left scale-x-0 bg-brass" style={{ animation: "preloader-bar 2.2s ease-in-out forwards" }} />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes preloader-bar {
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}
