import MagneticButton from "../MagneticButton";
import ScrollReveal from "../ScrollReveal";

export default function Consultation() {
  return (
    <section
      id="consultation"
      className="relative flex min-h-screen flex-col items-center justify-center bg-charcoal px-6 py-32 text-center md:px-16"
    >
      <ScrollReveal>
        <p className="text-xs uppercase tracking-editorial text-gold-bright">
          Book Consultation
        </p>
      </ScrollReveal>
      <ScrollReveal delay={0.1}>
        <h2 className="font-display mt-6 max-w-3xl text-4xl italic leading-[1.1] text-warm md:text-7xl">
          Let&rsquo;s design your next chapter.
        </h2>
      </ScrollReveal>
      <ScrollReveal delay={0.2}>
        <p className="mt-6 max-w-xl text-warm/60">
          Tell us about your space. Our design team will reach out within 24 hours
          to schedule your complimentary consultation.
        </p>
      </ScrollReveal>

      <ScrollReveal delay={0.3} className="mt-14 flex flex-col gap-4 sm:flex-row">
        <MagneticButton
          href="tel:+910000000000"
          className="rounded-full border border-gold px-9 py-4 text-xs uppercase tracking-editorial text-gold-bright transition-colors hover:bg-gold-bright/10"
        >
          Call Now
        </MagneticButton>
        <MagneticButton
          href="https://wa.me/910000000000"
          className="rounded-full border border-warm/20 px-9 py-4 text-xs uppercase tracking-editorial text-warm transition-colors hover:border-gold hover:text-gold-bright"
        >
          WhatsApp
        </MagneticButton>
        <MagneticButton
          href="#consultation"
          className="rounded-full bg-gold-bright px-9 py-4 text-xs uppercase tracking-editorial text-black transition-opacity hover:opacity-85"
        >
          Schedule Meeting
        </MagneticButton>
      </ScrollReveal>
    </section>
  );
}
