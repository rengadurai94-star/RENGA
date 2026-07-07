import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { expertise } from "@/data/expertise";

export function Expertise() {
  return (
    <section className="bg-ink py-28 text-cream md:py-36">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="Our expertise"
          title="Every kind of space, one design standard."
          description="From private residences to full commercial fit-outs, the same rigor applies regardless of scale."
          theme="dark"
        />

        <Reveal stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {expertise.map((category) => (
            <div
              key={category.id}
              data-cursor="hover"
              className="group relative aspect-[4/5] overflow-hidden rounded-sm"
            >
              <PlaceholderImage
                seed={category.seed}
                className="absolute inset-0 h-full w-full scale-105 transition-transform duration-700 ease-out group-hover:scale-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-6">
                <h3 className="font-display text-2xl font-medium text-cream">{category.title}</h3>
                <p className="max-w-xs translate-y-2 text-sm text-cream/0 opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:text-cream/70 group-hover:opacity-100">
                  {category.description}
                </p>
              </div>
            </div>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
