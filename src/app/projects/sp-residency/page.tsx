import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import Footer from "@/components/Footer";
import SpHero from "@/components/sp-residency/SpHero";
import SpCinematic, { type SpChapter } from "@/components/sp-residency/SpCinematic";
import SpFloorPlans from "@/components/sp-residency/SpFloorPlans";
import {
  SP_CREDIT,
  spAmenityGroups,
  spDisclaimer,
  spImage,
  spLocation,
  spProject,
  spSpecs,
  spStats,
  spUnits,
} from "@/data/sp-residency";

export const metadata: Metadata = {
  title: "Shan Poornam Residence, Madurai — Urban Mark Interior",
  description:
    "Shan Poornam Residence (SP Residency): 26 boutique homes across five floors in Visalakshipuram, Madurai — exterior, interiors, amenities and floor plans.",
};

const CHAPTERS: SpChapter[] = [
  {
    chapter: "01 — Arrival",
    title: "The security cabin",
    notes: [
      "Illuminated signage over a glazed cabin with a timber-slat base",
      "RFID access to the lobby, lift and car park",
      "Stilt parking beyond, with hazard-banded columns",
    ],
    image: spImage("sp-entrance-security-cabin"),
  },
  {
    chapter: "02 — The Lobby",
    title: "Private lobby",
    notes: [
      "Travertine-look panels with shadow gaps",
      "Mustard and ivory bucket chairs, walnut console",
      "Woven rattan pendant, striped frosted glass",
    ],
    image: spImage("sp-lobby"),
  },
  {
    chapter: "03 — Living & Dining",
    title: "The 28′4″ hall",
    notes: [
      "Fluted dark-walnut TV wall with black-metal shelving",
      "Light beige 4′ × 2′ vitrified floor",
      "Dining beneath a walnut bulkhead, opening to the balcony",
    ],
    image: spImage("sp-living-dining"),
  },
  {
    chapter: "04 — The Bedroom",
    title: "A quiet suite",
    notes: [
      "Tropical-leaf mural framed above walnut panelling",
      "Cove-lit bed wall, brass bedside lamps",
      "Wide-plank wooden vitrified floor",
    ],
    image: spImage("sp-master-bedroom"),
  },
  {
    chapter: "05 — The Balcony",
    title: "The sit-out",
    notes: [
      "Wooden vitrified floor, MS baluster railing",
      "Travertine-look walls with planter boxes",
      "Two lounge chairs on slim brass frames",
    ],
    image: spImage("sp-balcony"),
  },
  {
    chapter: "06 — Blue Hour",
    title: "The residence at night",
    notes: [
      "Stilt plus five floors and a terrace garden",
      "Copper-toned louvres and white bay frames",
      "A planted slot at the heart of the facade",
    ],
    image: spImage("sp-front-elevation-night"),
  },
];

const AMENITY_TILES = [
  { id: "sp-rooftop-lounge", className: "md:col-span-2 md:row-span-2" },
  { id: "sp-gym-cardio", className: "" },
  { id: "sp-gym-strength", className: "" },
  { id: "sp-lobby-library-lounge", className: "" },
  { id: "sp-coworking", className: "" },
  { id: "sp-management-office", className: "" },
  { id: "sp-corridor", className: "" },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs uppercase tracking-editorial text-gold-bright">{children}</p>;
}

export default function SpResidencyPage() {
  const hero = spImage("sp-exterior-day-3q");
  const night = spImage("sp-front-elevation-night");
  const frontage = spImage("sp-entrance-frontage");
  const stilt = spImage("sp-stilt-plan-3d");
  const terrace = spImage("sp-terrace-plan-3d");
  const typical = spImage("sp-plan-typical");

  return (
    <main className="relative bg-black">
      <SpHero
        image={hero}
        name={spProject.name}
        tagline={spProject.tagline}
        location={spProject.location}
        stats={spStats}
      />

      {/* ------------------------------------------------------------------ introduction */}
      <section id="introduction" className="relative px-6 py-28 md:px-16 md:py-40">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.25fr] lg:gap-24">
          <div>
            <ScrollReveal>
              <Eyebrow>The Project</Eyebrow>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="font-display mt-6 text-4xl italic leading-tight text-warm md:text-5xl">
                Twenty-six homes, balanced like the sun and the moon.
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="mt-8 max-w-xl text-sm leading-relaxed text-warm/65 md:text-base">
                <em className="not-italic text-warm">Shan</em> means five — earth, fire, water, air and space.{" "}
                <em className="not-italic text-warm">Poornam</em> means completeness. Shan Poornam Residence turns
                that balance into a boutique address in Visalakshipuram, Madurai: a stilt level of lobby, library
                and co-working rooms, five residential floors, and a terrace for fitness and evenings outdoors.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-warm/10 pt-8">
                {Object.entries(spProject.unitMix).map(([type, count]) => (
                  <div key={type}>
                    <dd className="font-display text-3xl italic text-warm">{count}</dd>
                    <dt className="mt-1 text-[10px] uppercase tracking-editorial text-warm/50">{type}</dt>
                  </div>
                ))}
              </dl>
            </ScrollReveal>
          </div>

          <div className="grid gap-6">
            <ScrollReveal>
              <figure>
                <div className="relative aspect-[3/2] overflow-hidden">
                  <Image
                    src={night.src}
                    alt={night.alt}
                    fill
                    sizes="(max-width: 1024px) 92vw, 55vw"
                    className="object-cover object-[50%_45%] scale-[1.35]"
                  />
                </div>
                <figcaption className="mt-3 text-[10px] uppercase tracking-editorial text-warm/40">
                  {night.caption}
                </figcaption>
              </figure>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <figure>
                <div className="relative aspect-[21/9] overflow-hidden">
                  <Image
                    src={frontage.src}
                    alt={frontage.alt}
                    fill
                    sizes="(max-width: 1024px) 92vw, 55vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-3 text-[10px] uppercase tracking-editorial text-warm/40">
                  {frontage.caption}
                </figcaption>
              </figure>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ cinematic interiors */}
      <SpCinematic chapters={CHAPTERS} />

      {/* ------------------------------------------------------------------ amenities */}
      <section id="amenities" className="relative px-6 py-28 md:px-16 md:py-40">
        <ScrollReveal>
          <Eyebrow>{spProject.amenitiesCount} Amenities</Eyebrow>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h2 className="font-display mt-6 max-w-3xl text-4xl italic leading-tight text-warm md:text-5xl">
            Planned from the ground up — and the roof down.
          </h2>
        </ScrollReveal>

        <div className="mt-16 grid auto-rows-[220px] grid-cols-1 gap-4 sm:grid-cols-2 md:auto-rows-[240px] md:grid-cols-4">
          {AMENITY_TILES.map(({ id, className }, i) => {
            const img = spImage(id);
            return (
              <ScrollReveal key={id} delay={(i % 4) * 0.06} className={className}>
                <figure className="group relative h-full w-full overflow-hidden">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes={i === 0 ? "(max-width: 768px) 92vw, 50vw" : "(max-width: 768px) 92vw, 25vw"}
                    className="object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <figcaption className="absolute bottom-4 left-4 text-[10px] uppercase tracking-editorial text-warm/85">
                    {img.caption}
                  </figcaption>
                </figure>
              </ScrollReveal>
            );
          })}
        </div>

        <div className="mt-20 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {spAmenityGroups.map((g, i) => (
            <ScrollReveal key={g.title} delay={i * 0.08}>
              <h3 className="text-[11px] uppercase tracking-editorial text-gold-bright">{g.title}</h3>
              <ul className="mt-5 space-y-2.5 border-l border-gold/25 pl-4 text-sm text-warm/70">
                {g.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </ScrollReveal>
          ))}
        </div>

        <div className="mt-24 grid gap-6 md:grid-cols-2">
          {[stilt, terrace].map((img) => (
            <ScrollReveal key={img.src}>
              <figure>
                <div className="relative aspect-[16/10] overflow-hidden bg-charcoal">
                  <Image src={img.src} alt={img.alt} fill sizes="(max-width: 768px) 92vw, 46vw" className="object-cover" />
                </div>
                <figcaption className="mt-3 text-[10px] uppercase tracking-editorial text-warm/40">{img.caption}</figcaption>
              </figure>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ floor plans */}
      <section id="floor-plans" className="relative border-t border-warm/5 px-6 py-28 md:px-16 md:py-40">
        <ScrollReveal>
          <Eyebrow>Floor Plans</Eyebrow>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h2 className="font-display mt-6 max-w-3xl text-4xl italic leading-tight text-warm md:text-5xl">
            Up to 85% carpet to super built-up — more room to live.
          </h2>
        </ScrollReveal>
        <SpFloorPlans typical={typical} units={spUnits} />
      </section>

      {/* ------------------------------------------------------------------ 3D model */}
      <section id="model" className="relative px-6 pb-28 md:px-16 md:pb-40">
        <div className="grid items-center gap-12 border-t border-warm/10 pt-20 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <div>
            <ScrollReveal>
              <Eyebrow>Interactive 3D Model</Eyebrow>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="font-display mt-6 text-4xl italic leading-tight text-warm md:text-5xl">
                Walk the floors before they are built.
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-warm/60">
                A conceptual model built from the brochure&rsquo;s own floor plans: explode the building floor by
                floor, select any home, then step into a dollhouse view of each unit type.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <Link
                href="/projects/sp-residency/model"
                className="mt-10 inline-block rounded-full border border-gold bg-gold-bright/5 px-8 py-4 text-xs uppercase tracking-editorial text-gold-bright transition-colors hover:bg-gold-bright/15"
              >
                Open the 3D model →
              </Link>
            </ScrollReveal>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { src: "/images/sp-residency/model/sp-model-building.webp", w: 1600, h: 1179, alt: "Exploded 3D model of the building, floors 1 to 4 with walls extruded from the brochure plan" },
              { src: "/images/sp-residency/model/sp-model-unit-a.webp", w: 1600, h: 1091, alt: "3D cut-away model of Unit A, a three-bedroom home" },
            ].map((img, i) => (
              <ScrollReveal key={img.src} delay={i * 0.1}>
                <Link href="/projects/sp-residency/model" className="group block overflow-hidden bg-[#0b0b0c]">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    width={img.w}
                    height={img.h}
                    sizes="(max-width: 1024px) 46vw, 30vw"
                    className="h-auto w-full transition-transform duration-700 group-hover:scale-105"
                  />
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ specifications */}
      <section id="specifications" className="relative px-6 py-28 md:px-16 md:py-32">
        <ScrollReveal>
          <Eyebrow>Specifications</Eyebrow>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h2 className="font-display mt-6 max-w-3xl text-4xl italic leading-tight text-warm md:text-5xl">
            Quality you can see. Comfort you can feel.
          </h2>
        </ScrollReveal>
        <div className="mt-16 grid gap-x-12 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
          {spSpecs.map((group, i) => (
            <ScrollReveal key={group.title} delay={(i % 3) * 0.08}>
              <h3 className="text-[11px] uppercase tracking-editorial text-gold-bright">{group.title}</h3>
              <dl className="mt-5 divide-y divide-warm/10 border-y border-warm/10">
                {group.rows.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[8.5rem_1fr] gap-4 py-3 text-sm">
                    <dt className="text-warm/45">{k}</dt>
                    <dd className="text-warm/80">{v}</dd>
                  </div>
                ))}
              </dl>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ location */}
      <section id="location" className="relative border-t border-warm/5 px-6 py-28 md:px-16 md:py-40">
        <ScrollReveal>
          <Eyebrow>Visalakshipuram, Madurai</Eyebrow>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h2 className="font-display mt-6 max-w-3xl text-4xl italic leading-tight text-warm md:text-5xl">
            Close to everything, yet far above the ordinary.
          </h2>
        </ScrollReveal>
        <div className="mt-16 grid gap-x-12 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {spLocation.map((group, i) => (
            <ScrollReveal key={group.title} delay={(i % 4) * 0.06}>
              <h3 className="text-[11px] uppercase tracking-editorial text-gold-bright">{group.title}</h3>
              <ul className="mt-5 space-y-3">
                {group.places.map((p) => (
                  <li key={p.name} className="border-b border-warm/10 pb-3">
                    <p className="text-sm text-warm/80">{p.name}</p>
                    <p className="mt-0.5 text-xs tabular-nums text-warm/40">
                      {p.distance} &middot; {p.drive_time}
                    </p>
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ credits */}
      <section className="px-6 pb-16 md:px-16">
        <div className="flex flex-col gap-6 border-t border-warm/10 pt-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-3 text-xs leading-relaxed text-warm/35">
            <p>{SP_CREDIT}.</p>
            <p>{spDisclaimer}</p>
          </div>
          <Link
            href="/#projects"
            className="shrink-0 text-xs uppercase tracking-editorial text-warm/60 transition-colors hover:text-gold-bright"
          >
            ← All projects
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
