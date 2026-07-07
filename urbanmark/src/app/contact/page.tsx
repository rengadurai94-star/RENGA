import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { ContactForm } from "@/components/sections/ContactForm";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description: "Start a conversation about your next interior project.",
};

export default function ContactPage() {
  return (
    <div className="pt-32 pb-28 md:pt-40 md:pb-36">
      <Container className="grid gap-16 md:grid-cols-[1fr_1.3fr]">
        <Reveal className="flex flex-col gap-8">
          <Eyebrow>Start a project</Eyebrow>
          <h1 className="font-display max-w-md text-4xl leading-[1.1] font-medium text-ink md:text-5xl">
            Let&apos;s talk about the space.
          </h1>
          <p className="max-w-sm text-base leading-relaxed text-ink/60">
            Share a few details below and we&apos;ll set up a first conversation — no obligation,
            no generic proposal, just a straight answer on whether we&apos;re the right fit.
          </p>
          <address className="not-italic text-sm leading-relaxed text-ink/60">
            {SITE.address}
            <br />
            {SITE.email}
            <br />
            {SITE.phone}
          </address>
        </Reveal>

        <Reveal>
          <ContactForm />
        </Reveal>
      </Container>
    </div>
  );
}
