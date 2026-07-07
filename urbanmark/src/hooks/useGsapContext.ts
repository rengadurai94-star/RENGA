import { type RefObject, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

export function useGsapContext<T extends HTMLElement>(
  callback: (context: { scope: RefObject<T | null> }) => void,
  deps: React.DependencyList = [],
) {
  const scope = useRef<T | null>(null);

  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context(() => callback({ scope }), scope);
    return () => ctx.revert();
  }, deps);

  return scope;
}
