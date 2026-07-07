export interface NavLink {
  label: string;
  href: string;
}

export interface Project {
  slug: string;
  title: string;
  category: string;
  location: string;
  year: string;
  coverImage: string;
  gallery: string[];
  excerpt: string;
  description: string;
  size: "large" | "medium" | "small";
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: "space" | "material" | "lighting" | "furniture" | "styling" | "consult";
}

export interface ProcessStep {
  step: string;
  title: string;
  description: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
}

export interface StatItem {
  label: string;
  value: number;
  suffix?: string;
}

export interface SocialLink {
  label: string;
  href: string;
}

export interface ExpertiseCategory {
  id: string;
  title: string;
  description: string;
  seed: string;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  swatch: "marble" | "travertine" | "walnut" | "oak" | "fluted" | "brass" | "concrete" | "fabric";
}
