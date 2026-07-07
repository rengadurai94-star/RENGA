"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";

export function Magnetic({
  children,
  strength = 0.35,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const quickX = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const quickY = useRef<ReturnType<typeof gsap.quickTo> | null>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const element = elementRef.current;
    if (!element) return;

    quickX.current ??= gsap.quickTo(element, "x", { duration: 0.5, ease: "power3.out" });
    quickY.current ??= gsap.quickTo(element, "y", { duration: 0.5, ease: "power3.out" });

    const bounds = element.getBoundingClientRect();
    const relativeX = event.clientX - (bounds.left + bounds.width / 2);
    const relativeY = event.clientY - (bounds.top + bounds.height / 2);

    quickX.current(relativeX * strength);
    quickY.current(relativeY * strength);
  };

  const handlePointerLeave = () => {
    quickX.current?.(0);
    quickY.current?.(0);
  };

  return (
    <div
      ref={elementRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={className}
    >
      {children}
    </div>
  );
}
