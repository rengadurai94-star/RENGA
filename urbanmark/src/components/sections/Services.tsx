import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ServiceIcon } from "@/components/icons/ServiceIcon";
import { services } from "@/data/services";

export function Services() {
  return (
    <section className="bg-stone-100 py-28 md:py-36">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="What we do"
          title="Six disciplines, one continuous process."
          description="Each project moves through the same disciplines, adapted to scale — from a single room to a full commercial fit-out."
        />

        <Reveal stagger className="grid grid-cols-1 gap-px overflow-hidden rounded-sm bg-ink/10 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div key={service.id} className="flex flex-col gap-4 bg-stone-100 p-8 md:p-10">
              <ServiceIcon icon={service.icon} className="h-8 w-8 text-brass" />
              <h3 className="font-display text-xl font-medium text-ink">{service.title}</h3>
              <p className="text-sm leading-relaxed text-ink/60">{service.description}</p>
            </div>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
