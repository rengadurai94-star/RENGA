import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { processSteps } from "@/data/services";

export function Process() {
  return (
    <section className="py-28 md:py-36">
      <Container className="flex flex-col gap-14">
        <SectionHeading eyebrow="How we work" title="A process built on four steps, never skipped." />

        <Reveal stagger className="grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-6">
          {processSteps.map((step) => (
            <div key={step.step} className="flex flex-col gap-4 border-t border-ink/15 pt-6">
              <span className="font-display text-sm text-brass">{step.step}</span>
              <h3 className="font-display text-xl font-medium text-ink">{step.title}</h3>
              <p className="text-sm leading-relaxed text-ink/60">{step.description}</p>
            </div>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
