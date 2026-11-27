/**
 * Static, single-page prototype of the Urban Mark Interior site.
 * It renders the SAME page components as the Next.js app (src/app/...), with next/image,
 * next/link and next/dynamic swapped for the shims in ./shims (see prototype/build.mjs).
 */
import { useEffect, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Preloader from "@/components/Preloader";
import CustomCursor from "@/components/CustomCursor";
import Nav from "@/components/Nav";
import SmoothScroll from "@/components/SmoothScroll";
import Home from "@/app/page";
import SpResidencyPage from "@/app/projects/sp-residency/page";
import SpResidencyModelPage from "@/app/projects/sp-residency/model/page";
import { HOME_TITLE, ROUTES, isRoute, toHash, type RouteName } from "./routes";

const PAGES: Record<RouteName, () => ReactNode> = {
  home: Home,
  "sp-residency": SpResidencyPage,
  "sp-residency-3d": SpResidencyModelPage,
};

function readHash(): string {
  try {
    return decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return "";
  }
}

function App() {
  const [hash, setHash] = useState(readHash);
  const [nonce, setNonce] = useState(0);
  const route: RouteName = isRoute(hash) ? hash : "home";
  const anchor = isRoute(hash) || hash === "" ? null : hash;

  // follow the hash
  useEffect(() => {
    const onHash = () => setHash(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // site links written as plain <a href="/..."> (nav overlay, buttons) -> hash routes
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a");
      const href = a?.getAttribute("href");
      if (!a || !href || !href.startsWith("/") || a.hasAttribute("download")) return;
      e.preventDefault();
      const next = toHash(href);
      if (window.location.hash === next || (next === "#" && !window.location.hash)) setNonce((n) => n + 1);
      else window.location.hash = next;
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // title, scroll position and in-page anchors after each navigation
  useEffect(() => {
    document.title = route === "home" ? HOME_TITLE : ROUTES[route].title;
    window.scrollTo(0, 0);
    if (!anchor) return;
    let frame = 0;
    const timer = window.setTimeout(() => {
      ScrollTrigger.refresh();
      frame = requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView());
    }, 120);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [route, anchor, nonce]);

  const Page = PAGES[route];
  return (
    <div className="min-h-full bg-black text-warm antialiased">
      <Preloader />
      <CustomCursor />
      <Nav />
      <SmoothScroll>
        <Page key={route} />
      </SmoothScroll>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
