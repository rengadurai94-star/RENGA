import { useSyncExternalStore } from "react";

/**
 * Hash router for the standalone demo build. Hosted demo pages only pass a
 * plain `#name` hash, so each app route maps to one name.
 */
export const ROUTES: Record<string, string> = {
  "/": "home",
  "/3d-catalog": "catalog",
  "/sample-orders": "samples",
  "/login": "login",
};
const PATHS = Object.fromEntries(Object.entries(ROUTES).map(([p, h]) => [h, p]));

export function hrefToHash(href: string) {
  const path = href.split(/[?#]/)[0] || "/";
  return `#${ROUTES[path] ?? "home"}`;
}

function currentPath() {
  const h = window.location.hash.replace(/^#/, "");
  return PATHS[h] ?? "/";
}

function subscribe(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}

export function useHashPath() {
  return useSyncExternalStore(subscribe, currentPath, () => "/");
}
