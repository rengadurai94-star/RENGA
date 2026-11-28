import { explorerSteps, unitById } from '../data/project';
import { getState, setState } from './store';

/**
 * Navigation actions shared by the 3D scene, the floor rail, the 2D plans and the
 * detail drawer. The explorer is a tall page section: its scroll position maps
 * to a floor, so mouse-wheel / touch scrolling and button clicks drive the same state.
 */
let explorerEl: HTMLElement | null = null;
let programmaticUntil = 0;

export const registerExplorer = (el: HTMLElement | null) => {
  explorerEl = el;
};

export const STEP_COUNT = explorerSteps.length;

export function stepScrollTop(step: number) {
  if (!explorerEl) return 0;
  const top = explorerEl.getBoundingClientRect().top + window.scrollY;
  const range = explorerEl.offsetHeight - window.innerHeight;
  return Math.round(top + (range * step) / (STEP_COUNT - 1));
}

export function isProgrammaticScroll() {
  return performance.now() < programmaticUntil;
}

export const floorIdForStep = (step: number) => explorerSteps[step]?.id ?? null;
export const stepForFloor = (floorId: string | null) => {
  const i = explorerSteps.findIndex((f) => (f ? f.id === floorId : floorId === null));
  return i < 0 ? 0 : i;
};

export function goToStep(step: number, opts: { scroll?: boolean; smooth?: boolean } = {}) {
  const s = Math.max(0, Math.min(STEP_COUNT - 1, step));
  const prev = getState();
  setState({
    step: s,
    floorId: floorIdForStep(s),
    hoveredUnit: null,
    // keep the selection only if it belongs to the new floor
    selectedUnit: prev.selectedUnit && unitById(prev.selectedUnit)?.floor === floorIdForStep(s) ? prev.selectedUnit : null,
  });
  if (opts.scroll !== false && explorerEl) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const smooth = opts.smooth !== false && !reduce;
    programmaticUntil = performance.now() + (smooth ? 1400 : 120);
    window.scrollTo({ top: stepScrollTop(s), behavior: smooth ? 'smooth' : 'auto' });
  }
}

export const goToFloor = (floorId: string | null, opts?: { scroll?: boolean; smooth?: boolean }) =>
  goToStep(stepForFloor(floorId), opts);

export const nextFloor = () => goToStep(getState().step + 1);
export const prevFloor = () => goToStep(getState().step - 1);

export function resetView() {
  setState((s) => ({ resetToken: s.resetToken + 1, zoom: 1, selectedUnit: null, hoveredUnit: null, detailOpen: false }));
  goToStep(0);
}

export function selectUnit(id: string | null, opts: { open?: boolean } = {}) {
  if (!id) {
    setState({ selectedUnit: null, detailOpen: false });
    return;
  }
  const u = unitById(id);
  if (!u) return;
  const s = getState();
  const patch: Partial<ReturnType<typeof getState>> = { selectedUnit: id, detailOpen: opts.open ?? true };
  if (s.floorId !== u.floor) {
    if (s.section === 'explore') {
      setState(patch);
      goToFloor(u.floor);
      setState({ selectedUnit: id });
      return;
    }
    patch.floorId = u.floor;
    patch.step = stepForFloor(u.floor);
  }
  setState(patch);
}

export const hoverUnit = (id: string | null) => setState({ hoveredUnit: id });
export const closeDetail = () => setState({ detailOpen: false });

/** Scroll to the 3D explorer, focused on a unit's floor, with the unit highlighted. */
export function viewUnitIn3D(id: string) {
  const u = unitById(id);
  if (!u) return;
  setState({ detailOpen: false, selectedUnit: id });
  goToFloor(u.floor, { smooth: true });
  setState({ selectedUnit: id });
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (id === 'explore' ? 0 : 60), behavior: reduce ? 'auto' : 'smooth' });
}

export function zoomBy(f: number) {
  setState((s) => ({ zoom: Math.max(0.55, Math.min(1.8, s.zoom * f)) }));
}
