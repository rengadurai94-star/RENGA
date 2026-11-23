"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TBC, formatArea, project, type UnitId } from "@/config/project";
import { openUnit } from "@/lib/boxes/director";
import FloorPlanSVG from "../ui/FloorPlanSVG";
import Reveal, { SectionLabel } from "./Reveal";
import { AmenityIcon } from "./Icons";

const isTBC = (v: string) => v.includes(TBC);

function Value({ v }: { v: string }) {
  return <span className={isTBC(v) ? "tbc" : undefined}>{v}</span>;
}

export function Overview() {
  const o = project.overview;
  return (
    <section id="overview" className="relative bg-paper px-6 py-28 md:px-12 md:py-40">
      <div className="mx-auto grid max-w-7xl gap-16 md:grid-cols-12">
        <Reveal className="md:col-span-5">
          <SectionLabel index="01">Overview</SectionLabel>
          <h2 className="mt-8 font-display text-5xl font-light leading-[1.02] text-charcoal md:text-7xl">{o.heading}</h2>
        </Reveal>
        <div className="md:col-span-6 md:col-start-7">
          {o.body.map((p, i) => (
            <Reveal key={i} delay={0.1 * i}>
              <p className="mb-6 text-lg leading-relaxed text-ash">{p}</p>
            </Reveal>
          ))}
          <Reveal delay={0.2}>
            <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6">
              {o.facts.map((f) => (
                <div key={f.label} className="border-t hairline pt-3">
                  <dt className="text-[10px] uppercase tracking-label text-taupe">{f.label}</dt>
                  <dd className="mt-1 text-sm text-charcoal">
                    <Value v={f.value} />
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
      <div className="mx-auto mt-24 grid max-w-7xl grid-cols-2 gap-y-12 border-t hairline pt-12 md:grid-cols-4">
        {o.stats.map((s, i) => (
          <Reveal key={s.label} delay={0.08 * i}>
            <p className="font-display text-7xl font-light leading-none text-charcoal md:text-8xl">{s.value}</p>
            <p className="mt-3 text-[11px] uppercase tracking-label text-ash">{s.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function LocationMap() {
  // Abstract, not-to-scale diagram — no geographic accuracy implied.
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" role="img" aria-label="Abstract location diagram (not to scale)">
      <rect width="400" height="400" fill="#f4f1eb" />
      {Array.from({ length: 11 }).map((_, i) => (
        <g key={i}>
          <line x1={i * 40} y1="0" x2={i * 40} y2="400" stroke="#e5e0d7" strokeWidth="1" />
          <line x1="0" y1={i * 40} x2="400" y2={i * 40} stroke="#e5e0d7" strokeWidth="1" />
        </g>
      ))}
      <path d="M-10 250 C 80 230, 140 300, 230 270 S 360 200, 410 220" fill="none" stroke="#d2cbc0" strokeWidth="14" />
      <path d="M120 -10 C 140 90, 110 180, 170 250 S 240 360, 230 410" fill="none" stroke="#e0d9cd" strokeWidth="9" />
      <path d="M-10 120 L 410 150" stroke="#e0d9cd" strokeWidth="6" />
      {[70, 120, 170].map((r) => (
        <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="#c9a77c" strokeOpacity="0.45" strokeDasharray="3 6" />
      ))}
      <rect x="188" y="188" width="24" height="24" fill="#2b2a28" />
      <rect x="194" y="194" width="12" height="12" fill="#c9a77c" />
      <text x="222" y="186" fontSize="12" fill="#2b2a28" letterSpacing="3" style={{ fontFamily: "var(--font-sans)" }}>
        BOXES
      </text>
      <text x="222" y="202" fontSize="9" fill="#7a7570" letterSpacing="1.5" style={{ fontFamily: "var(--font-sans)" }}>
        SURYA NAGAR
      </text>
      <text x="12" y="390" fontSize="8" fill="#9d968c" letterSpacing="1.5" style={{ fontFamily: "var(--font-sans)" }}>
        ABSTRACT DIAGRAM — NOT TO SCALE
      </text>
    </svg>
  );
}

export function Location() {
  const l = project.locationAdvantages;
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.location.mapsQuery)}`;
  return (
    <section id="location" className="relative bg-bone px-6 py-28 md:px-12 md:py-40">
      <div className="mx-auto grid max-w-7xl items-start gap-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <Reveal>
            <SectionLabel index="02">Location</SectionLabel>
            <h2 className="mt-8 font-display text-5xl font-light leading-[1.02] text-charcoal md:text-6xl">{l.heading}</h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ash">{l.body}</p>
            <a href={maps} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-8">
              Open in Google Maps ↗
            </a>
          </Reveal>
          <ul className="mt-12" role="list">
            {l.points.map((p, i) => (
              <Reveal key={p.name} delay={0.05 * i}>
                <li className="flex items-baseline justify-between gap-6 border-t hairline py-4">
                  <span>
                    <span className="block text-[10px] uppercase tracking-label text-taupe">{p.category}</span>
                    <span className="text-base text-charcoal">{p.name}</span>
                  </span>
                  <span className="shrink-0 text-sm">
                    <Value v={p.distance} />
                  </span>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
        <Reveal className="md:col-span-6 md:col-start-7" delay={0.15}>
          <div className="aspect-square overflow-hidden rounded-[2rem] border hairline">
            <LocationMap />
          </div>
          <p className="mt-3 text-[11px] text-taupe">
            {project.location.area}, {project.location.city}, {project.location.state}. Diagram is illustrative.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

export function Amenities() {
  return (
    <section id="amenities" className="relative bg-paper px-6 py-28 md:px-12 md:py-40">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-3xl">
          <SectionLabel index="03">Amenities</SectionLabel>
          <h2 className="mt-8 font-display text-5xl font-light leading-[1.02] text-charcoal md:text-6xl">
            Shared spaces, <span className="italic text-ash">quietly generous.</span>
          </h2>
          <p className="mt-6 text-sm text-taupe">All amenities listed are placeholders pending confirmation.</p>
        </Reveal>
        <div className="mt-16 grid grid-cols-1 border-l border-t hairline sm:grid-cols-2 lg:grid-cols-4">
          {project.amenities.map((a, i) => (
            <Reveal key={a.title} delay={0.03 * i} y={16} className="group border-b border-r hairline p-7 transition-colors duration-500 hover:bg-bone">
              <AmenityIcon name={a.icon} className="h-8 w-8 text-bronze transition-transform duration-500 group-hover:-translate-y-1" />
              <h3 className="mt-8 text-lg text-charcoal">{a.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ash">{a.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Residences() {
  const [active, setActive] = useState<UnitId>("A");
  const u = project.units.find((x) => x.id === active)!;
  return (
    <section id="residences" className="relative bg-charcoal px-6 py-28 text-paper md:px-12 md:py-40">
      <div className="mx-auto max-w-7xl">
        <Reveal className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="flex items-center gap-4 text-[10px] uppercase tracking-label text-bronze-light">
              <span className="tabular-nums text-paper/40">04</span>
              <span className="h-px w-10 bg-paper/20" />
              Apartment configurations
            </p>
            <h2 className="mt-8 font-display text-5xl font-light leading-[1.02] md:text-6xl">
              Four typologies.
              <br />
              <span className="italic text-paper/60">Four directions.</span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Unit types">
            {project.units.map((x) => (
              <button
                key={x.id}
                type="button"
                role="tab"
                aria-selected={active === x.id}
                onClick={() => setActive(x.id)}
                className={`rounded-full border px-5 py-3 text-[11px] uppercase tracking-label transition-colors duration-300 ${
                  active === x.id ? "border-paper bg-paper text-charcoal" : "border-paper/25 text-paper/70 hover:border-paper/60"
                }`}
              >
                {x.label}
              </button>
            ))}
          </div>
        </Reveal>
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 grid gap-12 md:grid-cols-12"
            role="tabpanel"
          >
            <div className="rounded-[2rem] bg-paper p-6 md:col-span-7 md:p-10">
              <FloorPlanSVG unitId={active} className="mx-auto h-[22rem] w-full md:h-[30rem]" labels="full" />
              <p className="mt-2 text-center text-[10px] uppercase tracking-label text-taupe">Conceptual layout — illustrative, not to scale</p>
            </div>
            <div className="md:col-span-5">
              <p className="text-[11px] uppercase tracking-label text-bronze-light">
                {u.name} · {u.facing} facing
              </p>
              <p className="mt-3 font-display text-7xl font-light">{u.label}</p>
              <p className="mt-5 text-base leading-relaxed text-paper/70">{u.summary}</p>
              <dl className="mt-10 grid grid-cols-2 gap-6">
                {[
                  ["Area*", formatArea(u)],
                  ["Bedrooms", String(u.bedrooms)],
                  ["Bathrooms", `${u.bathrooms}${u.bathroomNote ? ` ${u.bathroomNote}` : ""}`],
                  ["Balconies", String(u.balconies)],
                ].map(([k, v]) => (
                  <div key={k} className="border-t border-paper/15 pt-3">
                    <dt className="text-[10px] uppercase tracking-label text-paper/50">{k}</dt>
                    <dd className="mt-1 text-lg font-light">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-sm text-paper/60">{u.balconyNote}</p>
              <div className="mt-10 flex flex-wrap gap-3">
                <button type="button" onClick={() => openUnit(4, active)} className="btn-primary !bg-paper !text-charcoal hover:!bg-bronze-light">
                  Explore in 3D
                </button>
                <button
                  type="button"
                  onClick={() => openUnit(4, active, true)}
                  className="btn-ghost !border-paper/30 text-paper hover:!border-paper hover:!bg-transparent"
                >
                  Walk inside
                </button>
              </div>
              <p className="mt-6 text-[11px] leading-relaxed text-paper/45">
                *Indicative placeholder. Available on floors 1–{project.building.floors}; units shown on floor 4.
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

export function Specifications() {
  const [open, setOpen] = useState<number>(0);
  return (
    <section id="specifications" className="relative bg-paper px-6 py-28 md:px-12 md:py-40">
      <div className="mx-auto grid max-w-7xl gap-16 md:grid-cols-12">
        <Reveal className="md:col-span-4">
          <SectionLabel index="05">Specifications</SectionLabel>
          <h2 className="mt-8 font-display text-5xl font-light leading-[1.02] text-charcoal md:text-6xl">
            Built to <span className="italic text-ash">last.</span>
          </h2>
          <p className="mt-6 text-sm leading-relaxed text-taupe">
            Indicative specification headings. Every value is a placeholder until confirmed by the developer.
          </p>
        </Reveal>
        <div className="md:col-span-7 md:col-start-6">
          {project.specifications.map((g, i) => (
            <Reveal key={g.title} delay={0.04 * i} y={12}>
              <div className="border-t hairline">
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-6 text-left"
                  onClick={() => setOpen(open === i ? -1 : i)}
                  aria-expanded={open === i}
                >
                  <span className="font-display text-2xl text-charcoal md:text-3xl">{g.title}</span>
                  <span className={`text-xl text-taupe transition-transform duration-500 ${open === i ? "rotate-45" : ""}`}>+</span>
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.dl
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-4 pb-8 sm:grid-cols-2">
                        {g.items.map((it) => (
                          <div key={it.label}>
                            <dt className="text-[10px] uppercase tracking-label text-taupe">{it.label}</dt>
                            <dd className="mt-1 text-sm text-charcoal">
                              <Value v={it.value} />
                            </dd>
                          </div>
                        ))}
                      </div>
                    </motion.dl>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
          <div className="border-t hairline" />
        </div>
      </div>
    </section>
  );
}

function GalleryImage({ src, title, className }: { src: string; title: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <div className={`flex items-end bg-gradient-to-br from-sand via-bone to-stone p-6 ${className}`}>
        <span className="text-[10px] uppercase tracking-label text-taupe">Image placeholder · {title}</span>
      </div>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={title} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />
  );
}

export function Gallery() {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const items = project.gallery;
  return (
    <section id="gallery" className="relative bg-bone px-6 py-28 md:px-12 md:py-40">
      <div className="mx-auto max-w-7xl">
        <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <SectionLabel index="06">Gallery</SectionLabel>
            <h2 className="mt-8 font-display text-5xl font-light leading-[1.02] text-charcoal md:text-6xl">
              Views from <span className="italic text-ash">the model.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm text-taupe">
            Captured from the procedural prototype. Replace with approved renders and photography in /public/assets/images.
          </p>
        </Reveal>
        <div className="mt-16 grid auto-rows-[16rem] grid-cols-1 gap-3 md:auto-rows-[18rem] md:grid-cols-6">
          {items.map((g, i) => {
            const span = ["md:col-span-4 md:row-span-2", "md:col-span-2", "md:col-span-2", "md:col-span-2", "md:col-span-2", "md:col-span-2"][i % 6];
            return (
              <Reveal key={g.src} delay={0.05 * i} y={16} className={`group relative overflow-hidden rounded-3xl ${span}`}>
                <button type="button" className="block h-full w-full text-left" onClick={() => setLightbox(i)} aria-label={`Open ${g.title}`}>
                  <GalleryImage src={g.src} title={g.title} className="h-full w-full transition-transform duration-[1.4s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.04]" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/60 to-transparent p-5 text-paper">
                    <span className="block font-display text-2xl">{g.title}</span>
                    <span className="text-[11px] text-paper/75">{g.caption}</span>
                  </span>
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            className="fixed inset-0 z-[85] flex items-center justify-center bg-ink/90 p-4 md:p-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            role="dialog"
            aria-modal="true"
            aria-label={items[lightbox].title}
          >
            <motion.figure initial={{ scale: 0.96 }} animate={{ scale: 1 }} className="max-h-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
              <GalleryImage src={items[lightbox].src} title={items[lightbox].title} className="max-h-[78vh] w-full rounded-2xl" />
              <figcaption className="mt-4 flex items-center justify-between text-paper">
                <span>
                  <span className="font-display text-2xl">{items[lightbox].title}</span>
                  <span className="ml-3 text-sm text-paper/60">{items[lightbox].caption}</span>
                </span>
                <span className="flex gap-2">
                  <button type="button" className="h-10 w-10 rounded-full border border-paper/30" aria-label="Previous" onClick={() => setLightbox((lightbox + items.length - 1) % items.length)}>
                    ‹
                  </button>
                  <button type="button" className="h-10 w-10 rounded-full border border-paper/30" aria-label="Next" onClick={() => setLightbox((lightbox + 1) % items.length)}>
                    ›
                  </button>
                  <button type="button" className="h-10 w-10 rounded-full border border-paper/30" aria-label="Close" onClick={() => setLightbox(null)}>
                    ×
                  </button>
                </span>
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
