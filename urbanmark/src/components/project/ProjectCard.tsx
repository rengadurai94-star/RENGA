import Link from "next/link";
import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";

const sizeStyles: Record<Project["size"], string> = {
  large: "md:col-span-8 aspect-[16/10]",
  medium: "md:col-span-6 aspect-[4/5]",
  small: "md:col-span-4 aspect-[3/4]",
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className={cn("group relative col-span-12 block overflow-hidden rounded-sm", sizeStyles[project.size])}
    >
      <PlaceholderImage
        seed={project.coverImage}
        className="absolute inset-0 h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.06]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/0 to-ink/0 opacity-70 transition-opacity duration-500 group-hover:opacity-90" />

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 text-cream md:p-8">
        <div>
          <span className="text-xs tracking-[0.2em] text-cream/70 uppercase">
            {project.category} — {project.location}
          </span>
          <h3 className="font-display mt-2 text-2xl font-medium md:text-3xl">{project.title}</h3>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cream/40 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
