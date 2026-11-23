import type { Amenity } from "@/config/project";

const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Minimal line icons for amenities (24px grid). */
export function AmenityIcon({ name, className }: { name: Amenity["icon"]; className?: string }) {
  const paths: Record<Amenity["icon"], React.ReactNode> = {
    pool: (
      <>
        <path {...P} d="M3 16c2 0 2-1.5 4.5-1.5S10 16 12 16s2-1.5 4.5-1.5S19 16 21 16" />
        <path {...P} d="M3 20c2 0 2-1.5 4.5-1.5S10 20 12 20s2-1.5 4.5-1.5S19 20 21 20" />
        <path {...P} d="M8 13V5a2 2 0 0 1 4 0M14 13V5a2 2 0 0 1 4 0M8 9h6" />
      </>
    ),
    gym: <path {...P} d="M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12" />,
    garden: (
      <>
        <path {...P} d="M12 21V10" />
        <path {...P} d="M12 13c-4 0-6-3-6-7 4 0 6 3 6 7ZM12 11c0-3 2-6 6-6 0 4-2 6-6 6Z" />
        <path {...P} d="M5 21h14" />
      </>
    ),
    kids: (
      <>
        <circle {...P} cx="12" cy="6" r="2.5" />
        <path {...P} d="M7 21l2-7h6l2 7M9 14l-3-3M15 14l3-3" />
      </>
    ),
    clubhouse: (
      <>
        <path {...P} d="M3 21h18M5 21V10l7-5 7 5v11" />
        <path {...P} d="M10 21v-5h4v5" />
      </>
    ),
    security: (
      <>
        <path {...P} d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" />
        <path {...P} d="M9 12l2 2 4-4" />
      </>
    ),
    power: <path {...P} d="M13 2L5 14h6l-1 8 8-12h-6l1-8Z" />,
    parking: (
      <>
        <rect {...P} x="4" y="3" width="16" height="18" rx="2" />
        <path {...P} d="M10 17V7h3a3 3 0 0 1 0 6h-3" />
      </>
    ),
    yoga: (
      <>
        <circle {...P} cx="12" cy="5" r="2" />
        <path {...P} d="M4 12c3 0 5-2 8-2s5 2 8 2M12 10v5M7 20l5-5 5 5" />
      </>
    ),
    lift: (
      <>
        <rect {...P} x="5" y="3" width="14" height="18" rx="1.5" />
        <path {...P} d="M9 9l3-3 3 3M9 15l3 3 3-3" />
      </>
    ),
    water: <path {...P} d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />,
    ev: (
      <>
        <rect {...P} x="4" y="4" width="10" height="16" rx="1.5" />
        <path {...P} d="M10 8l-3 4h4l-3 4M14 10h2a2 2 0 0 1 2 2v4a1.5 1.5 0 0 0 3 0V9l-2-2" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {paths[name]}
    </svg>
  );
}
