import AnimatedStat from "../AnimatedStat";
import ScrollReveal from "../ScrollReveal";

const STATS = [
  { value: 250, suffix: "+", label: "Projects Completed" },
  { value: 12, suffix: "+", label: "Years Experience" },
  { value: 95, suffix: "%", label: "Client Satisfaction" },
  { value: 20, suffix: "+", label: "Design Professionals" },
];

export default function WhoWeAre() {
  return (
    <section id="who-we-are" className="relative bg-black px-6 py-32 md:px-16 md:py-48">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <p className="text-xs uppercase tracking-editorial text-gold-bright">Who We Are</p>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h2 className="font-display mt-6 max-w-3xl text-4xl italic leading-tight text-warm md:text-6xl">
            Urban Mark Interior
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-warm/70 md:text-xl">
            We design timeless interiors that blend architecture, functionality
            and emotion.
          </p>
        </ScrollReveal>

        <div className="mt-20 grid grid-cols-2 gap-x-8 md:grid-cols-4">
          {STATS.map((stat) => (
            <AnimatedStat key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
