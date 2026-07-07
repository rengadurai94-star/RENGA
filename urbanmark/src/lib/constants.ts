export const EASE = {
  premium: "power3.out",
  soft: "power2.out",
  sharp: "power4.inOut",
} as const;

export const DURATION = {
  fast: 0.4,
  base: 0.8,
  slow: 1.4,
} as const;

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export const SITE = {
  name: "Urban Mark Interior",
  shortName: "Urban Mark",
  headline: "Design Beyond Walls",
  tagline: "Luxury Interior Design Crafted Around Your Lifestyle",
  email: "studio@urbanmarkinterior.com",
  phone: "+91 98765 43210",
  whatsapp: "https://wa.me/919876543210",
  address: "14 Ropewalk Yard, London E2",
  mapsEmbedSrc: "https://www.google.com/maps?q=14+Ropewalk+Yard+London+E2&output=embed",
} as const;
