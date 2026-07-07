import type { Project } from "@/types";

export const projects: Project[] = [
  {
    slug: "kallio-loft",
    title: "Kallio Loft",
    category: "Residential",
    location: "Helsinki, FI",
    year: "2025",
    coverImage: "kallio-loft-01",
    gallery: ["kallio-loft-01", "kallio-loft-02", "kallio-loft-03", "kallio-loft-04"],
    excerpt: "A raw industrial shell reworked into warm, textured living space.",
    description:
      "We stripped this former print works back to brick and steel, then rebuilt it around a soft material palette — limewashed walls, oiled oak, and brushed brass — so the architecture and the comfort of home could sit in the same room.",
    size: "large",
  },
  {
    slug: "harbourline-penthouse",
    title: "Harbourline Penthouse",
    category: "Residential",
    location: "Copenhagen, DK",
    year: "2024",
    coverImage: "harbourline-01",
    gallery: ["harbourline-01", "harbourline-02", "harbourline-03"],
    excerpt: "Panoramic water views framed by a restrained, tactile interior.",
    description:
      "Every material choice here answers to the light off the water — honed stone, unlacquered brass, and linen that softens through the day. Furniture was drawn to disappear so the horizon stays the focal point.",
    size: "small",
  },
  {
    slug: "atelier-nine",
    title: "Atelier Nine",
    category: "Workspace",
    location: "Lyon, FR",
    year: "2024",
    coverImage: "atelier-nine-01",
    gallery: ["atelier-nine-01", "atelier-nine-02", "atelier-nine-03"],
    excerpt: "A creative studio built for long days and slow mornings.",
    description:
      "A converted atelier for a design collective, organised around a single communal table and a perimeter of quiet, individual nooks. Plaster, cork, and untreated timber keep the acoustics soft.",
    size: "medium",
  },
  {
    slug: "villa-serrano",
    title: "Villa Serrano",
    category: "Residential",
    location: "Seville, ES",
    year: "2023",
    coverImage: "villa-serrano-01",
    gallery: ["villa-serrano-01", "villa-serrano-02", "villa-serrano-03", "villa-serrano-04"],
    excerpt: "Courtyard living reimagined with a modern, tonal restraint.",
    description:
      "A restoration of a 1930s courtyard villa. We kept the original tilework and ironmongery, and built the new interior in quiet counterpoint — terracotta, raw plaster, and hand-woven textiles.",
    size: "medium",
  },
  {
    slug: "north-end-flagship",
    title: "North End Flagship",
    category: "Retail",
    location: "Manchester, UK",
    year: "2023",
    coverImage: "north-end-01",
    gallery: ["north-end-01", "north-end-02", "north-end-03"],
    excerpt: "A retail interior designed to slow customers down.",
    description:
      "For a slow-fashion label's first flagship, we designed fixtures and finishes that read more like a private collection than a shopfloor — reclaimed timber plinths, soft plaster arches, and considered, low sightlines.",
    size: "small",
  },
  {
    slug: "the-conservatory",
    title: "The Conservatory",
    category: "Hospitality",
    location: "Turin, IT",
    year: "2022",
    coverImage: "conservatory-01",
    gallery: ["conservatory-01", "conservatory-02", "conservatory-03", "conservatory-04"],
    excerpt: "A restaurant interior built around light and living greenery.",
    description:
      "A glazed courtyard extension turned into the dining room, framed with a steel and timber structure that lets planting run right through the space. Finishes were chosen to age gracefully under direct sun.",
    size: "large",
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

export function getAdjacentProjects(slug: string): {
  previous?: Project;
  next?: Project;
} {
  const index = projects.findIndex((project) => project.slug === slug);
  if (index === -1) return {};
  return {
    previous: projects[index - 1],
    next: projects[index + 1],
  };
}
