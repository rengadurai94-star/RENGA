import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { TiltCard } from "@/components/ui/TiltCard";
import { MaterialSwatch } from "@/components/ui/MaterialSwatch";
import { materials } from "@/data/materials";

export function MaterialLibrary() {
  return (
    <section className="bg-ink py-28 text-cream md:py-36">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="Material library"
          title="Every finish, chosen on purpose."
          description="A working library of the stone, wood, metal, and textile we specify most — tilt a sample to feel the surface."
          theme="dark"
        />

        <Reveal stagger className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {materials.map((material) => (
            <TiltCard key={material.id} className="rounded-sm">
              <div className="group flex flex-col gap-4 rounded-sm border border-cream/10 bg-charcoal p-4">
                <MaterialSwatch swatch={material.swatch} className="aspect-square w-full rounded-sm shadow-lg shadow-black/30" />
                <div>
                  <span className="text-[0.65rem] tracking-[0.2em] text-cream/40 uppercase">{material.category}</span>
                  <h3 className="font-display text-lg font-medium text-cream">{material.name}</h3>
                </div>
              </div>
            </TiltCard>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
