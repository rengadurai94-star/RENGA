"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

/** Fade/slide-in on scroll into view. */
export default function Reveal({ delay = 0, y = 28, children, ...rest }: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function SectionLabel({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-4 text-[10px] uppercase tracking-label text-bronze-dark">
      <span className="tabular-nums text-taupe">{index}</span>
      <span className="h-px w-10 bg-stone" />
      {children}
    </p>
  );
}
