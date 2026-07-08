"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function AnimatedStat({
  value,
  suffix,
  label,
}: {
  value: number;
  suffix: string;
  label: string;
}) {
  const numRef = useRef<HTMLSpanElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const counter = { val: 0 };
      gsap.to(counter, {
        val: value,
        duration: 2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 85%",
          once: true,
        },
        onUpdate: () => {
          if (numRef.current) numRef.current.textContent = Math.round(counter.val).toString();
        },
      });
    },
    { scope: rootRef }
  );

  return (
    <div ref={rootRef} className="border-t border-warm/10 py-8">
      <p className="font-display text-4xl italic text-gold-bright md:text-6xl">
        <span ref={numRef}>0</span>
        {suffix}
      </p>
      <p className="mt-2 text-xs uppercase tracking-editorial text-warm/60">{label}</p>
    </div>
  );
}
