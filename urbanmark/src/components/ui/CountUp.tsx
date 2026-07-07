"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useGsapContext } from "@/hooks/useGsapContext";

export function CountUp({
  value,
  suffix = "",
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const counter = useRef({ value: 0 });

  const scope = useGsapContext<HTMLSpanElement>(({ scope }) => {
    if (!scope.current) return;
    const target = scope.current;

    ScrollTrigger.create({
      trigger: target,
      start: "top 90%",
      once: true,
      onEnter: () => {
        gsap.to(counter.current, {
          value,
          duration: 1.6,
          ease: "power2.out",
          onUpdate: () => {
            target.textContent = `${Math.round(counter.current.value)}${suffix}`;
          },
        });
      },
    });
  }, [value, suffix]);

  return (
    <span ref={scope} className={className}>
      0{suffix}
    </span>
  );
}
