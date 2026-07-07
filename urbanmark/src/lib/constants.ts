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
  name: "Ostrum Interiors",
  tagline: "Interiors built to be lived in, not just photographed.",
  email: "studio@ostruminteriors.com",
  phone: "+44 20 7946 0958",
  address: "14 Ropewalk Yard, London E2",
} as const;
