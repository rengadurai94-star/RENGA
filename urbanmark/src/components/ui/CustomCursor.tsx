"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const HOVER_SELECTOR = "a, button, [data-cursor='hover']";

export function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springX = useSpring(cursorX, { stiffness: 500, damping: 40, mass: 0.4 });
  const springY = useSpring(cursorY, { stiffness: 500, damping: 40, mass: 0.4 });

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const handleMove = (event: PointerEvent) => {
      setIsVisible(true);
      cursorX.set(event.clientX);
      cursorY.set(event.clientY);
    };

    const handleOver = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      setIsHovering(Boolean(target.closest(HOVER_SELECTOR)));
    };

    const handleLeaveWindow = () => setIsVisible(false);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerover", handleOver);
    document.documentElement.addEventListener("mouseleave", handleLeaveWindow);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerover", handleOver);
      document.documentElement.removeEventListener("mouseleave", handleLeaveWindow);
    };
  }, [cursorX, cursorY]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[100] hidden mix-blend-difference md:block"
      style={{ x: springX, y: springY, opacity: isVisible ? 1 : 0 }}
    >
      <motion.div
        className="-translate-x-1/2 -translate-y-1/2 rounded-full bg-cream"
        animate={{ width: isHovering ? 56 : 10, height: isHovering ? 56 : 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      />
    </motion.div>
  );
}
