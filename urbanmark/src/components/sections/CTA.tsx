import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Magnetic } from "@/components/ui/Magnetic";
import { Reveal } from "@/components/ui/Reveal";

export function CTA() {
  return (
    <section className="py-28 md:py-36">
      <Container>
        <Reveal className="flex flex-col items-center gap-8 rounded-sm bg-stone-100 px-8 py-20 text-center md:px-20">
          <h2 className="font-display max-w-2xl text-4xl leading-[1.1] font-medium text-ink md:text-5xl">
            Have a space that&apos;s ready for its next chapter?
          </h2>
          <p className="max-w-md text-base leading-relaxed text-ink/60">
            Tell us about the project and we&apos;ll arrange a first, no-obligation conversation.
          </p>
          <Magnetic>
            <Button href="/contact">Start a project</Button>
          </Magnetic>
        </Reveal>
      </Container>
    </section>
  );
}
