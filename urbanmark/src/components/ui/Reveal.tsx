"use client";

import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useGsapContext } from "@/hooks/useGsapContext";
import { EASE } from "@/lib/constants";
import { cn } from "@/lib/utils";

type RevealTag = "div" | "section" | "article" | "ul" | "figure";

interface RevealProps {
  as?: RevealTag;
  className?: string;
  children: React.ReactNode;
  /** Animate direct children individually instead of the wrapper as a whole. */
  stagger?: boolean;
  delay?: number;
  y?: number;
  start?: string;
}

export function Reveal({
  as: Tag = "div",
  className,
  children,
  stagger = false,
  delay = 0,
  y = 32,
  start = "top 85%",
}: RevealProps) {
  const scope = useGsapContext<HTMLDivElement>(({ scope }) => {
    if (!scope.current) return;
    const targets = stagger ? gsap.utils.toArray(scope.current.children) : scope.current;

    gsap.set(targets, { opacity: 0, y });

    ScrollTrigger.create({
      trigger: scope.current,
      start,
      once: true,
      onEnter: () => {
        gsap.to(targets, {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: EASE.premium,
          delay,
          stagger: stagger ? 0.12 : 0,
        });
      },
    });
  }, [stagger, delay, y, start]);

  const Element = Tag as unknown as React.ComponentType<{
    ref: typeof scope;
    className?: string;
    children: React.ReactNode;
  }>;

  return (
    <Element ref={scope} className={cn(className)}>
      {children}
    </Element>
  );
}
