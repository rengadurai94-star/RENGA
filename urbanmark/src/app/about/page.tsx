import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { StatsBar } from "@/components/sections/StatsBar";
import { CTA } from "@/components/sections/CTA";
import { team } from "@/data/team";

export const metadata: Metadata = {
  title: "Studio",
  description: "A small studio working across residential, hospitality, and retail interiors since 2013.",
};

export default function AboutPage() {
  return (
    <div>
      <div className="pt-32 pb-20 md:pt-40">
        <Container className="flex flex-col gap-8">
          <Eyebrow>The studio</Eyebrow>
          <h1 className="font-display max-w-3xl text-5xl leading-[1.05] font-medium text-ink md:text-7xl">
            Design is the easy part. Restraint is the discipline.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-ink/60 md:text-lg">
            Founded in 2013, we&apos;re a twelve-person studio working across residential,
            hospitality, and retail interiors. We take on a small number of projects at a time —
            not because we have to, but because that&apos;s the only way we know how to do this well.
          </p>
        </Container>
      </div>

      <StatsBar />

      <section className="py-28 md:py-36">
        <Container className="grid items-center gap-16 md:grid-cols-2">
          <Reveal>
            <PlaceholderImage seed="studio-workshop" className="aspect-[4/5] w-full rounded-sm" />
          </Reveal>
          <Reveal>
            <SectionHeading
              eyebrow="Philosophy"
              title="Interiors that answer to the building, not a trend cycle."
              description="Every project starts with the architecture that's already there — its light, its structure, its history — rather than a moodboard. Materials are chosen to age well, not just to photograph well on day one."
            />
          </Reveal>
        </Container>
      </section>

      <section className="bg-stone-100 py-28 md:py-36">
        <Container className="flex flex-col gap-14">
          <SectionHeading eyebrow="The people" title="A small team, deliberately." />
          <Reveal stagger className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {team.map((member) => (
              <div key={member.name} className="flex flex-col gap-4">
                <PlaceholderImage seed={member.seed} className="aspect-[3/4] w-full rounded-sm" />
                <div>
                  <h3 className="font-display text-lg font-medium text-ink">{member.name}</h3>
                  <p className="text-sm text-ink/60">{member.role}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </Container>
      </section>

      <CTA />
    </div>
  );
}
