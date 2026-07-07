import { useEffect, useRef } from "react";

export interface NormalizedPointer {
  x: number;
  y: number;
}

/** Tracks pointer position normalised to [-1, 1] on both axes, read via a ref to avoid re-renders. */
export function useMousePosition() {
  const position = useRef<NormalizedPointer>({ x: 0, y: 0 });

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      position.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
      };
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  return position;
}
