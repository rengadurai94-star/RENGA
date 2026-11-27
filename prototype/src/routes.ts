/**
 * Hash routes for the static prototype. The hosting frame only passes plain `#name` hashes,
 * so each site path maps to one name. Any other hash (e.g. `#projects`) is treated as an
 * in-page anchor on the home page.
 */
export const ROUTES = {
  "sp-residency": { path: "/projects/sp-residency", title: "Shan Poornam Residence — Urban Mark Interior" },
  "sp-residency-3d": { path: "/projects/sp-residency/model", title: "SP Residency 3D Model — Urban Mark Interior" },
} as const;

export type RouteName = keyof typeof ROUTES | "home";

export const HOME_TITLE = "Urban Mark Interior — Design Beyond Walls";

export function isRoute(name: string): name is keyof typeof ROUTES {
  return Object.prototype.hasOwnProperty.call(ROUTES, name);
}

/** Map a site href ("/", "/#projects", "/projects/sp-residency") to a prototype hash. */
export function toHash(href: string): string {
  if (!href.startsWith("/")) return href;
  const [path, anchor] = href.split("#");
  const clean = path.replace(/\/+$/, "") || "/";
  if (clean === "/") return anchor ? `#${anchor}` : "#";
  for (const [name, r] of Object.entries(ROUTES)) {
    if (r.path === clean) return `#${name}`;
  }
  return "#";
}
