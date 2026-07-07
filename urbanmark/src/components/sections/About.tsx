import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

export function About() {
  return (
    <section className="py-28 md:py-36">
      <Container className="grid items-center gap-16 md:grid-cols-2">
        <Reveal className="order-2 md:order-1">
          <SectionHeading
            eyebrow="The studio"
            title="Twelve years of quiet, considered interiors."
            description="We're a small studio by design — twelve of us, working on a handful of projects at a time so every detail gets the attention it deserves. Founded in 2013, we've since worked across seven countries without ever opening a second office."
          />
          <Button href="/about" variant="secondary" className="mt-8">
            About the studio
          </Button>
        </Reveal>

        <Reveal className="order-1 md:order-2">
          <PlaceholderImage
            seed="studio-portrait"
            className="aspect-[4/5] w-full rounded-sm"
          />
        </Reveal>
      </Container>
    </section>
  );
}
