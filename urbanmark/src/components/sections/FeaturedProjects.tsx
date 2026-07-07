import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { ProjectGrid } from "@/components/project/ProjectGrid";
import { projects } from "@/data/projects";

export function FeaturedProjects() {
  const featured = projects.slice(0, 4);

  return (
    <section className="py-28 md:py-36">
      <Container className="flex flex-col gap-14">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading eyebrow="Selected work" title="A handful of recent projects." />
          <Button href="/projects" variant="secondary" className="shrink-0">
            View all work
          </Button>
        </div>

        <ProjectGrid projects={featured} />
      </Container>
    </section>
  );
}
