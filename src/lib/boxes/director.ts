/**
 * The "director" orchestrates cinematic transitions between the experience
 * states. UI components and 3D pickers call these functions; GSAP drives the
 * timed values that the camera rig / scenes read every frame.
 */
import gsap from "gsap";
import type { UnitId } from "@/config/project";
import { dive, intro, journey, orbit, useBoxes } from "./store";
import { floorScrollY, getLenis, lockScroll, scrollToFloor, unlockScroll } from "./scroll";

const FADER = "#boxes-fader";

function resetOrbit(duration = 0.9) {
  gsap.to(orbit, { az: 0, el: 0, zoom: 1, duration, ease: "power2.out", overwrite: true });
}

/** Plays the intro reveal (clouds part, camera glides in). */
export function playIntro() {
  gsap.killTweensOf(intro);
  intro.t = 0;
  intro.clouds = 0;
  const tl = gsap.timeline();
  tl.to(intro, { clouds: 1, duration: 5.2, ease: "power1.inOut" }, 0.2);
  tl.to(intro, { t: 1, duration: 6.4, ease: "power2.inOut" }, 0);
  return tl;
}

export function enterExperience() {
  const s = useBoxes.getState();
  if (s.entered) return;
  gsap.killTweensOf(intro);
  gsap.to(intro, { t: 1, clouds: 1, duration: Math.max(0.6, (1 - intro.t) * 2), ease: "power2.out" });
  useBoxes.setState({ entered: true, mode: "explore" });
  unlockScroll();
  // make sure we start at the top of the journey
  const y = floorScrollY(0);
  if (y !== null && window.scrollY > y + 4) scrollToFloor(0, { immediate: true });
}

/** Skip straight into the explore state (deep links, gallery capture). */
export function skipIntro() {
  gsap.killTweensOf(intro);
  intro.t = 1;
  intro.clouds = 1;
  useBoxes.setState({ entered: true, mode: "explore" });
  unlockScroll();
}

export function goToFloor(floor: number) {
  const s = useBoxes.getState();
  if (s.transitioning) return;
  if (!s.entered) enterExperience();
  if (s.mode === "unit" || s.mode === "interior") backToFloor(false);
  scrollToFloor(floor);
}

export function selectUnit(floor: number, unit: UnitId) {
  const s = useBoxes.getState();
  if (s.transitioning) return;
  if (s.mode === "interior") return;
  if (s.mode === "explore") {
    // snap the scroll exactly onto this floor before locking
    const y = floorScrollY(floor);
    const lenis = getLenis();
    if (y !== null && Math.abs(journey.floor - floor) > 0.02) {
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
    }
    lockScroll();
  }
  resetOrbit();
  useBoxes.setState({ mode: "unit", selected: { floor, unit }, hoveredUnit: null, hoveredFloor: null, activeFloor: floor });
}

export function backToFloor(animate = true) {
  const s = useBoxes.getState();
  if (s.transitioning) return;
  const floor = s.selected?.floor ?? s.activeFloor;
  resetOrbit(animate ? 0.9 : 0.01);
  useBoxes.setState({ mode: "explore", selected: null, room: null, hoveredUnit: null });
  unlockScroll();
  journey.floor = floor;
  const y = floorScrollY(floor);
  const lenis = getLenis();
  if (y !== null) {
    if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
  }
}

export function enterApartment() {
  const s = useBoxes.getState();
  if (!s.selected || s.transitioning || s.mode !== "unit") return;
  useBoxes.setState({ transitioning: true, hoveredUnit: null });
  gsap.killTweensOf(dive);
  resetOrbit(0.6);
  const tl = gsap.timeline();
  tl.to(dive, { t: 1, duration: 1.7, ease: "power2.inOut" });
  tl.to(FADER, { opacity: 1, duration: 0.55, ease: "power1.in" }, "-=0.6");
  tl.add(() => {
    useBoxes.setState({ mode: "interior", interiorView: "walk", room: null });
  });
  tl.to(FADER, { opacity: 0, duration: 1.1, ease: "power2.out", delay: 0.45 });
  tl.add(() => {
    dive.t = 0;
    useBoxes.setState({ transitioning: false });
  });
}

export function exitApartment() {
  const s = useBoxes.getState();
  if (s.mode !== "interior" || s.transitioning) return;
  useBoxes.setState({ transitioning: true });
  const tl = gsap.timeline();
  tl.to(FADER, { opacity: 1, duration: 0.5, ease: "power1.in" });
  tl.add(() => {
    dive.t = 0.85;
    useBoxes.setState({ mode: "unit", room: null, interiorView: "walk" });
  });
  tl.to(FADER, { opacity: 0, duration: 0.9, ease: "power2.out", delay: 0.15 });
  tl.to(dive, { t: 0, duration: 1.8, ease: "power3.out" }, "<");
  tl.add(() => useBoxes.setState({ transitioning: false }));
}

/** Fly back up to a floor and open a residence (optionally walking inside). */
export function openUnit(floor: number, unit: UnitId, enter = false) {
  const s = useBoxes.getState();
  if (s.transitioning || s.mode === "interior") return;
  if (!s.entered) enterExperience();
  if (s.mode === "unit") backToFloor(false);
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    journey.floor = floor;
    selectUnit(floor, unit);
    if (enter) window.setTimeout(enterApartment, 1500);
  };
  scrollToFloor(floor, { duration: 2.2, onComplete: () => window.setTimeout(finish, 350) });
}

let roomNonce = 0;
/** Ask the interior walker to move to a room (handled by the interior scene). */
export function requestRoom(roomId: string) {
  roomNonce += 1;
  useBoxes.setState({ room: roomId });
  window.dispatchEvent(new CustomEvent("boxes:room", { detail: { roomId, nonce: roomNonce } }));
}

export function setInteriorView(view: "walk" | "dollhouse") {
  useBoxes.setState({ interiorView: view });
}
