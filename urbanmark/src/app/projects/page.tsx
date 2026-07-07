import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProjectGrid } from "@/components/project/ProjectGrid";
import { projects } from "@/data/projects";

export const metadata: Metadata = {
  title: "Work",
  description: "Residential, hospitality, and retail interiors designed and delivered end to end.",
};

export default function ProjectsPage() {
  return (
    <div className="pt-32 pb-28 md:pt-40 md:pb-36">
      <Container className="flex flex-col gap-14">
        <SectionHeading
          eyebrow="Selected work"
          title="Every project, one continuous body of work."
          description="Residential, hospitality, retail — different briefs, the same standard of restraint and craft."
        />
        <ProjectGrid projects={projects} />
      </Container>
    </div>
  );
}
