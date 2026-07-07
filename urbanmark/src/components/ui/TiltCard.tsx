"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

export function TiltCard({
  children,
  className,
  maxTilt = 10,
}: {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const quickX = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const quickY = useRef<ReturnType<typeof gsap.quickTo> | null>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    quickX.current ??= gsap.quickTo(card, "rotateX", { duration: 0.5, ease: "power3.out" });
    quickY.current ??= gsap.quickTo(card, "rotateY", { duration: 0.5, ease: "power3.out" });

    const bounds = card.getBoundingClientRect();
    const relativeX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const relativeY = (event.clientY - bounds.top) / bounds.height - 0.5;

    quickX.current(relativeY * -maxTilt);
    quickY.current(relativeX * maxTilt);
  };

  const handlePointerLeave = () => {
    quickX.current?.(0);
    quickY.current?.(0);
  };

  return (
    <div style={{ perspective: 800 }}>
      <div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className={cn("transition-shadow duration-500", className)}
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
      </div>
    </div>
  );
}
