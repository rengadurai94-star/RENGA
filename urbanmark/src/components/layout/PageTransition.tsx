"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "@/lib/gsap";

export function PageTransition() {
  const pathname = usePathname();
  const overlayRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const overlay = overlayRef.current;
    if (!overlay) return;

    gsap
      .timeline()
      .set(overlay, { scaleY: 1, transformOrigin: "bottom" })
      .to(overlay, { scaleY: 0, transformOrigin: "top", duration: 0.6, ease: "power4.inOut" });
  }, [pathname]);

  return (
    <div
      ref={overlayRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[140] scale-y-0 bg-ink"
    />
  );
}
