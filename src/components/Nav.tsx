"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MagneticButton from "./MagneticButton";

const LINKS = [
  { label: "Studio", href: "#who-we-are" },
  { label: "Expertise", href: "#expertise" },
  { label: "Philosophy", href: "#philosophy" },
  { label: "Projects", href: "#projects" },
  { label: "Materials", href: "#materials" },
  { label: "Process", href: "#process" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#consultation" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-6 md:px-12 md:py-8">
        <a
          href="#top"
          className="font-display text-sm tracking-editorial text-warm md:text-base"
        >
          URBAN MARK
          <span className="text-gold-bright"> INTERIOR</span>
        </a>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="group relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-[6px]"
          data-cursor="magnetic"
        >
          <span
            className={`h-px w-6 bg-warm transition-all duration-500 ${
              open ? "translate-y-[3.5px] rotate-45" : ""
            }`}
          />
          <span
            className={`h-px w-6 bg-warm transition-all duration-500 ${
              open ? "-translate-y-[3.5px] -rotate-45" : ""
            }`}
          />
        </button>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 flex flex-col justify-center bg-black px-6 md:px-16"
          >
            <nav className="flex flex-col gap-2">
              {LINKS.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="font-display text-4xl italic text-warm/90 transition-colors hover:text-gold-bright md:text-6xl"
                >
                  {link.label}
                </motion.a>
              ))}
            </nav>
            <div className="mt-12">
              <MagneticButton
                href="#consultation"
                onClick={() => setOpen(false)}
                className="rounded-full border border-gold px-8 py-4 text-xs uppercase tracking-editorial text-gold-bright"
              >
                Book Free Consultation
              </MagneticButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
