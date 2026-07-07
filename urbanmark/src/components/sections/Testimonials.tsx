"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { testimonials } from "@/data/services";

export function Testimonials() {
  return (
    <section className="bg-ink py-28 text-cream md:py-36">
      <Container className="flex flex-col gap-14">
        <SectionHeading eyebrow="Client word" title="What it's like to work with us." theme="dark" />

        <Reveal stagger className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.id}
              whileHover={{ y: -8 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex flex-col justify-between gap-10 rounded-sm border border-cream/10 bg-charcoal p-8 md:p-10"
            >
              <blockquote className="font-display text-xl leading-snug font-medium text-cream italic md:text-2xl">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>
              <figcaption className="flex items-center gap-3 text-sm text-cream/60">
                <span className="h-px w-6 bg-brass" />
                {testimonial.name} — {testimonial.role}
              </figcaption>
            </motion.div>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
