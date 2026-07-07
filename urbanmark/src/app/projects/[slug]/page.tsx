import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { ProjectGallery } from "@/components/project/ProjectGallery";
import { projects, getProjectBySlug, getAdjacentProjects } from "@/data/projects";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.excerpt,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const { previous, next } = getAdjacentProjects(slug);

  return (
    <article className="pt-32 pb-28 md:pt-40 md:pb-36">
      <Container className="flex flex-col gap-14">
        <Reveal className="flex flex-col gap-6">
          <Eyebrow>
            {project.category} — {project.location} — {project.year}
          </Eyebrow>
          <h1 className="font-display max-w-3xl text-5xl leading-[1.05] font-medium text-ink md:text-7xl">
            {project.title}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-ink/60 md:text-lg">
            {project.description}
          </p>
        </Reveal>

        <ProjectGallery images={project.gallery} title={project.title} />

        <nav className="flex items-center justify-between border-t border-ink/10 pt-8 text-sm">
          {previous ? (
            <Link href={`/projects/${previous.slug}`} className="group flex flex-col gap-1">
              <span className="text-xs tracking-[0.2em] text-ink/40 uppercase">Previous</span>
              <span className="font-display text-lg text-ink group-hover:text-brass">{previous.title}</span>
            </Link>
          ) : (
            <span />
          )}

          {next ? (
            <Link href={`/projects/${next.slug}`} className="group flex flex-col items-end gap-1 text-right">
              <span className="text-xs tracking-[0.2em] text-ink/40 uppercase">Next</span>
              <span className="font-display text-lg text-ink group-hover:text-brass">{next.title}</span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </Container>
    </article>
  );
}
