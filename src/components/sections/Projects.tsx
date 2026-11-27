"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PlaceholderMedia, { MediaTone } from "../PlaceholderMedia";
import ScrollReveal from "../ScrollReveal";

type ProjectImage = { src: string; width: number; height: number; alt: string };

export type FeaturedProject = {
  title: string;
  category: string;
  href: string;
  image: ProjectImage;
};

type ProjectRow = {
  title: string;
  category: string;
  tone: MediaTone;
  href?: string;
  image?: ProjectImage;
};

const PROJECTS: ProjectRow[] = [
  { title: "Villa Interior", category: "Residential", tone: "villa" },
  { title: "Penthouse", category: "Residential", tone: "penthouse" },
  { title: "Luxury Apartment", category: "Residential", tone: "apartment" },
  { title: "Corporate Office", category: "Commercial", tone: "office" },
  { title: "Restaurant", category: "Hospitality", tone: "restaurant" },
  { title: "Retail Boutique", category: "Retail", tone: "retail" },
];

export default function Projects({ featured = [] }: { featured?: FeaturedProject[] }) {
  const [active, setActive] = useState<number | null>(null);
  const rows: ProjectRow[] = [
    ...featured.map((f) => ({ ...f, tone: "apartment" as MediaTone })),
    ...PROJECTS,
  ];

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
        {rows.map((project, i) => {
          const inner = (
            <>
              <div className="flex items-baseline gap-6">
                <span className="text-xs text-warm/40">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-display text-3xl italic text-warm transition-transform duration-500 group-hover:translate-x-4 group-hover:text-gold-bright md:text-5xl">
                  {project.title}
                </h3>
              </div>
              <span className="hidden text-xs uppercase tracking-editorial text-warm/50 md:block">
                {project.category}
                {project.href && <span className="ml-3 text-gold-bright">View →</span>}
              </span>

              <div
                className={`pointer-events-none absolute right-24 top-1/2 hidden h-40 w-64 -translate-y-1/2 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:block ${
                  active === i ? "scale-100 opacity-100" : "scale-90 opacity-0"
                }`}
              >
                {project.image ? (
                  <Image
                    src={project.image.src}
                    alt={project.image.alt}
                    fill
                    sizes="256px"
                    className="object-cover"
                  />
                ) : (
                  <PlaceholderMedia tone={project.tone} className="h-full w-full" />
                )}
              </div>
            </>
          );

          const className =
            "group relative flex cursor-pointer items-center justify-between overflow-hidden border-t border-warm/10 py-8 transition-colors last:border-b hover:border-gold/40";

          return project.href ? (
            <Link
              key={project.title}
              href={project.href}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              data-cursor="magnetic"
              className={className}
            >
              {inner}
            </Link>
          ) : (
            <div
              key={project.title}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              data-cursor="magnetic"
              className={className}
            >
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}
