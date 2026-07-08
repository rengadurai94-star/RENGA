"use client";

import { useState } from "react";
import PlaceholderMedia, { MediaTone } from "../PlaceholderMedia";
import ScrollReveal from "../ScrollReveal";

const PROJECTS: { title: string; category: string; tone: MediaTone }[] = [
  { title: "Villa Interior", category: "Residential", tone: "villa" },
  { title: "Penthouse", category: "Residential", tone: "penthouse" },
  { title: "Luxury Apartment", category: "Residential", tone: "apartment" },
  { title: "Corporate Office", category: "Commercial", tone: "office" },
  { title: "Restaurant", category: "Hospitality", tone: "restaurant" },
  { title: "Retail Boutique", category: "Retail", tone: "retail" },
];

export default function Projects() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <section id="projects" className="relative bg-black px-6 py-32 md:px-16 md:py-40">
      <ScrollReveal>
        <p className="text-xs uppercase tracking-editorial text-gold-bright">Featured Projects</p>
      </ScrollReveal>
      <ScrollReveal delay={0.1}>
        <h2 className="font-display mt-6 max-w-2xl text-4xl italic leading-tight text-warm md:text-5xl">
          A portfolio of considered spaces.
        </h2>
      </ScrollReveal>

      <div className="mt-16 flex flex-col">
        {PROJECTS.map((project, i) => (
          <div
            key={project.title}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            data-cursor="magnetic"
            className="group relative flex cursor-pointer items-center justify-between overflow-hidden border-t border-warm/10 py-8 transition-colors last:border-b hover:border-gold/40"
          >
            <div className="flex items-baseline gap-6">
              <span className="text-xs text-warm/40">0{i + 1}</span>
              <h3 className="font-display text-3xl italic text-warm transition-transform duration-500 group-hover:translate-x-4 group-hover:text-gold-bright md:text-5xl">
                {project.title}
              </h3>
            </div>
            <span className="hidden text-xs uppercase tracking-editorial text-warm/50 md:block">
              {project.category}
            </span>

            <div
              className={`pointer-events-none absolute right-24 top-1/2 hidden h-40 w-64 -translate-y-1/2 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:block ${
                active === i ? "scale-100 opacity-100" : "scale-90 opacity-0"
              }`}
            >
              <PlaceholderMedia tone={project.tone} className="h-full w-full" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
