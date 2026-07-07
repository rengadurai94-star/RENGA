import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Services } from "@/components/sections/Services";
import { Process } from "@/components/sections/Process";
import { CTA } from "@/components/sections/CTA";

export const metadata: Metadata = {
  title: "Services",
  description: "Space planning, material direction, lighting, bespoke furniture, styling, and consultation.",
};

export default function ServicesPage() {
  return (
    <div>
      <div className="pt-32 pb-20 md:pt-40">
        <Container className="flex flex-col gap-8">
          <Eyebrow>What we do</Eyebrow>
          <h1 className="font-display max-w-3xl text-5xl leading-[1.05] font-medium text-ink md:text-7xl">
            Full-service design, or a single focused discipline.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-ink/60 md:text-lg">
            Most clients bring us in end to end. Some need a second eye on a single decision.
            Either way, the process below stays the same.
          </p>
        </Container>
      </div>

      <Services />
      <Process />
      <CTA />
    </div>
  );
}
