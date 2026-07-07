import { Reveal } from "@/components/ui/Reveal";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/types";

export function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <Reveal stagger as="div" className="grid grid-cols-12 gap-4 md:gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.slug} project={project} />
      ))}
    </Reveal>
  );
}
