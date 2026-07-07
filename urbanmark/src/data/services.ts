import type { ProcessStep, Service, StatItem, Testimonial } from "@/types";

export const services: Service[] = [
  {
    id: "space-planning",
    title: "Space Planning",
    description:
      "Spatial strategy rooted in how you actually live — traffic flow, sightlines, and light studied before a single finish is chosen.",
    icon: "space",
  },
  {
    id: "material-direction",
    title: "Material Direction",
    description:
      "A tightly considered palette of stone, timber, and textile sourced from makers we trust, built to age well rather than just photograph well.",
    icon: "material",
  },
  {
    id: "lighting-design",
    title: "Lighting Design",
    description:
      "Layered, low-glare lighting plans that shift with the day — from working light to the low, warm glow a room needs in the evening.",
    icon: "lighting",
  },
  {
    id: "bespoke-furniture",
    title: "Bespoke Furniture",
    description:
      "Joinery and upholstered pieces designed in-house and built by regional workshops, sized precisely to the room they live in.",
    icon: "furniture",
  },
  {
    id: "styling",
    title: "Styling & Installation",
    description:
      "Final layer, done by hand — art, objects, and textiles placed on site until the room feels lived-in from day one.",
    icon: "styling",
  },
  {
    id: "consultation",
    title: "Design Consultation",
    description:
      "A focused session for clients who need a second eye — a clear, actionable direction delivered in a single sitting.",
    icon: "consult",
  },
];

export const processSteps: ProcessStep[] = [
  {
    step: "01",
    title: "Discovery",
    description: "A walk-through of the space and an honest conversation about how you want to live in it.",
  },
  {
    step: "02",
    title: "Concept",
    description: "Spatial studies, mood, and material direction presented as one coherent story, not a moodboard.",
  },
  {
    step: "03",
    title: "Development",
    description: "Detailed drawings, joinery specs, and sourcing — the unglamorous work that makes the concept real.",
  },
  {
    step: "04",
    title: "Installation",
    description: "On-site delivery and styling, room by room, until every surface earns its place.",
  },
];

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "Elin Fors",
    role: "Kallio Loft",
    quote:
      "They understood the brief was about restraint, not decoration. The finished space feels inevitable, like it couldn't have been done any other way.",
  },
  {
    id: "t2",
    name: "Marcus Voss",
    role: "Harbourline Penthouse",
    quote:
      "Every material decision was explained and defended. Nothing in the apartment feels trend-driven — it already feels like it will be right in ten years.",
  },
  {
    id: "t3",
    name: "Camille Roy",
    role: "Atelier Nine",
    quote:
      "Our studio needed to work for twelve very different people. Somehow they designed a space that all of us call ours.",
  },
];

export const stats: StatItem[] = [
  { label: "Projects delivered", value: 84 },
  { label: "Years in practice", value: 12 },
  { label: "Cities worked in", value: 19 },
  { label: "Design awards", value: 7 },
];
