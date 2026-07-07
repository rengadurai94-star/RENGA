import { Container } from "@/components/ui/Container";
import { CountUp } from "@/components/ui/CountUp";
import { Reveal } from "@/components/ui/Reveal";
import { stats } from "@/data/services";

export function StatsBar() {
  return (
    <section className="border-y border-ink/10 bg-cream py-16">
      <Container>
        <Reveal stagger className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-2 text-center md:text-left">
              <CountUp
                value={stat.value}
                suffix={stat.suffix}
                className="font-display text-4xl font-medium text-ink md:text-5xl"
              />
              <span className="text-xs tracking-[0.15em] text-ink/50 uppercase">{stat.label}</span>
            </div>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
