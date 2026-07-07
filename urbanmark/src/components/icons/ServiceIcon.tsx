import type { Service } from "@/types";

const paths: Record<Service["icon"], React.ReactNode> = {
  space: <path d="M4 20V6l8-3 8 3v14M4 20h16M9 20v-6h6v6" />,
  material: <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />,
  lighting: <path d="M12 3a5 5 0 00-3 9v2h6v-2a5 5 0 00-3-9zM10 18h4M11 21h2" />,
  furniture: <path d="M4 12V7a2 2 0 012-2h12a2 2 0 012 2v5M3 12h18v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3zM6 17v3M18 17v3" />,
  styling: <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />,
  consult: <path d="M21 11.5a8.4 8.4 0 01-8.9 8.4A9 9 0 013 12a9 9 0 019-9 8.4 8.4 0 019 8.5zM8 12h8M8 9h5M8 15h4" />,
};

export function ServiceIcon({ icon, className }: { icon: Service["icon"]; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths[icon]}
    </svg>
  );
}
