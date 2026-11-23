"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchMedia("(pointer: coarse)").matches) return;

    const dot = dotRef.current!;
    const ring = ringRef.current!;
    const ringPos = { x: 0, y: 0 };

    const onMove = (e: MouseEvent) => {
      gsap.set(dot, { x: e.clientX, y: e.clientY });
      gsap.to(ringPos, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.5,
        ease: "power3.out",
        onUpdate: () => gsap.set(ring, { x: ringPos.x, y: ringPos.y }),
      });
    };

    const onEnterInteractive = () => {
      gsap.to(ring, { scale: 2.2, opacity: 0.6, duration: 0.35, ease: "power3.out" });
    };
    const onLeaveInteractive = () => {
      gsap.to(ring, { scale: 1, opacity: 1, duration: 0.35, ease: "power3.out" });
    };

    window.addEventListener("mousemove", onMove);

    const interactiveEls = document.querySelectorAll("a, button, [data-cursor='magnetic']");
    interactiveEls.forEach((el) => {
      el.addEventListener("mouseenter", onEnterInteractive);
      el.addEventListener("mouseleave", onLeaveInteractive);
    });

    return () => {
      window.removeEventListener("mousemove", onMove);
      interactiveEls.forEach((el) => {
        el.removeEventListener("mouseenter", onEnterInteractive);
        el.removeEventListener("mouseleave", onLeaveInteractive);
      });
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-coarse:hidden pointer-events-none fixed left-0 top-0 z-[999] hidden h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-bright mix-blend-difference md:block"
      />
      <div
        ref={ringRef}
        className="pointer-coarse:hidden pointer-events-none fixed left-0 top-0 z-[998] hidden h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold mix-blend-difference md:block"
      />
    </>
  );
}
