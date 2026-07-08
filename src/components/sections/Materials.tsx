"use client";

import { useState } from "react";
import PlaceholderMedia, { MediaTone } from "../PlaceholderMedia";
import ScrollReveal from "../ScrollReveal";

const MATERIALS: { name: string; tone: MediaTone }[] = [
  { name: "Italian Marble", tone: "marble" },
  { name: "Oak Wood", tone: "oak" },
  { name: "Walnut Veneer", tone: "walnut" },
  { name: "Fluted Panels", tone: "fluted" },
  { name: "Brass", tone: "brass" },
  { name: "Microcement", tone: "microcement" },
  { name: "Natural Stone", tone: "stone" },
  { name: "Premium Fabrics", tone: "fabric" },
];

export default function Materials() {
  const [hovered, setHovered] = useState(0);

  return (
    <section id="materials" className="relative bg-black px-6 py-32 md:px-16 md:py-40">
      <ScrollReveal>
        <p className="text-xs uppercase tracking-editorial text-gold-bright">Material Palette</p>
      </ScrollReveal>
      <ScrollReveal delay={0.1}>
        <h2 className="font-display mt-6 max-w-2xl text-4xl italic leading-tight text-warm md:text-5xl">
          Texture is the language of luxury.
        </h2>
      </ScrollReveal>

      <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="aspect-[4/3] overflow-hidden">
          <PlaceholderMedia
            tone={MATERIALS[hovered].tone}
            label={MATERIALS[hovered].name}
            index={`0${hovered + 1}`}
            className="h-full w-full transition-opacity duration-500"
          />
        </div>

        <ul className="flex flex-col">
          {MATERIALS.map((material, i) => (
            <li
              key={material.name}
              onMouseEnter={() => setHovered(i)}
              data-cursor="magnetic"
              className={`cursor-pointer border-t border-warm/10 py-5 text-2xl italic transition-colors last:border-b md:text-3xl font-display ${
                hovered === i ? "text-gold-bright" : "text-warm/60"
              }`}
            >
              {material.name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
