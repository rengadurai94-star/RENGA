"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { FLOORS } from "@/lib/boxes/layout";
import { journey, useBoxes } from "@/lib/boxes/store";
import {
  STOP_VH,
  TAIL_VH,
  clearAutoScroll,
  getLenis,
  isAutoScrolling,
  lockScroll,
  markAutoScroll,
  setJourneyTrigger,
  setLenis,
} from "@/lib/boxes/scroll";
import { playIntro } from "@/lib/boxes/director";
import { useDeepLink } from "./useDeepLink";
import Loader from "./ui/Loader";
import IntroOverlay from "./ui/IntroOverlay";
import TopBar from "./ui/TopBar";
import FloorIndicator from "./ui/FloorIndicator";
import FloorPanel from "./ui/FloorPanel";
import UnitPanel from "./ui/UnitPanel";
import InteriorHUD from "./ui/InteriorHUD";
import ViewControls from "./ui/ViewControls";
import ScrollHint from "./ui/ScrollHint";
import FloorTooltip from "./ui/FloorTooltip";
import WebGLFallback from "./ui/WebGLFallback";

const Stage = dynamic(() => import("./canvas/Stage"), { ssr: false });

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function BoxesExperience() {
  const journeyRef = useRef<HTMLElement>(null);
  const webgl = useBoxes((s) => s.webgl);
  const ready = useBoxes((s) => s.ready);
  useDeepLink();

  // WebGL capability check
  useEffect(() => {
    if (!hasWebGL()) useBoxes.setState({ webgl: "unsupported", ready: true, progress: 1, entered: true, mode: "explore" });
  }, []);

  // Smooth scrolling + scroll-driven journey
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, touchMultiplier: 1.4 });
    setLenis(lenis);
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    if (!useBoxes.getState().entered) lockScroll();

    const el = journeyRef.current!;
    const stopFrac = () => {
      const total = el.offsetHeight - window.innerHeight;
      return (STOP_VH * window.innerHeight) / 100 / Math.max(1, total);
    };

    // Timeline scrubbed by scroll: journey.floor travels 0 -> FLOORS, then a free tail.
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const st = useBoxes.getState();
          const f = Math.round(journey.floor);
          if (st.activeFloor !== f && st.mode === "explore") useBoxes.setState({ activeFloor: f, hoveredUnit: null });
          const past = self.progress > stopFrac() * (FLOORS + 0.45);
          if (past !== st.pastJourney) useBoxes.setState({ pastJourney: past });
        },
      },
    });
    for (let i = 0; i <= FLOORS; i++) tl.addLabel(`floor-${i}`, i);
    tl.to(journey, { floor: FLOORS, duration: FLOORS });
    tl.to({}, { duration: (FLOORS * TAIL_VH) / (STOP_VH * FLOORS) });
    setJourneyTrigger(tl.scrollTrigger ?? null);

    // Activity flags: render only while the journey is on screen.
    const vis = ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "bottom top+=5%",
      onToggle: (self) => useBoxes.setState({ inJourney: self.isActive }),
    });

    // Floor-by-floor snapping with Lenis (one scroll gesture = one floor).
    let timer = 0;
    let lastDir = 1;
    const onScroll = (l: Lenis) => {
      if (isAutoScrolling()) return;
      if (l.direction) lastDir = l.direction;
      window.clearTimeout(timer);
      timer = window.setTimeout(maybeSnap, 170);
    };
    const maybeSnap = () => {
      const s = useBoxes.getState();
      const st = tl.scrollTrigger;
      if (!st || isAutoScrolling() || s.mode !== "explore" || !s.entered || lenis.isStopped) return;
      // wait until the user's gesture (and Lenis' smoothing) has fully settled
      if (lenis.isScrolling || Math.abs(lenis.velocity) > 0.3) {
        timer = window.setTimeout(maybeSnap, 120);
        return;
      }
      const sp = stopFrac() * (st.end - st.start);
      const y = lenis.scroll;
      if (y < st.start - 2 || y > st.start + sp * FLOORS + sp * 0.35) return;
      const f = (y - st.start) / sp;
      const target = Math.min(FLOORS, Math.max(0, lastDir > 0 ? Math.ceil(f - 0.04) : Math.floor(f + 0.04)));
      if (Math.abs(f - target) < 0.004) return;
      const duration = 0.75 + Math.min(0.6, Math.abs(f - target) * 0.5);
      markAutoScroll(duration);
      lenis.scrollTo(st.start + target * sp, {
        duration,
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
        onComplete: clearAutoScroll,
      });
    };
    lenis.on("scroll", onScroll);

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);
    ScrollTrigger.refresh();

    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(timer);
      vis.kill();
      tl.scrollTrigger?.kill();
      tl.kill();
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
      setJourneyTrigger(null);
    };
  }, []);

  // Start the cinematic intro once the scene is ready.
  useEffect(() => {
    if (!ready || useBoxes.getState().entered) return;
    const tl = playIntro();
    return () => void tl.kill();
  }, [ready]);

  // Esc returns one level up.
  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const { mode } = useBoxes.getState();
      const d = await import("@/lib/boxes/director");
      if (mode === "interior") d.exitApartment();
      else if (mode === "unit") d.backToFloor();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Pinned canvas pointer: let the page keep focus for keyboard scrolling.
  useEffect(() => {
    getLenis()?.resize();
  }, [ready]);

  return (
    <>
      <div id="boxes-stage" className="fixed inset-0 z-0 bg-paper" aria-hidden={webgl === "unsupported"}>
        {webgl !== "unsupported" && <Stage />}
        <div className="boxes-vignette pointer-events-none absolute inset-0" />
      </div>
      <div id="boxes-fader" className="pointer-events-none fixed inset-0 z-[70] bg-paper opacity-0" />
      <WebGLFallback />
      <IntroOverlay />
      <TopBar />
      <FloorIndicator />
      <FloorPanel />
      <UnitPanel />
      <InteriorHUD />
      <ViewControls />
      <ScrollHint />
      <FloorTooltip />
      <Loader />
      <section
        id="explore"
        ref={journeyRef}
        aria-label="Scroll to travel through the eight floors"
        className="pointer-events-none relative z-[1]"
        style={{ height: `${100 + FLOORS * STOP_VH + TAIL_VH}vh` }}
      />
    </>
  );
}
