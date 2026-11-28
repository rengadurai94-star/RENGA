import { useEffect } from 'react';
import { getState, setState, type Section } from './store';

/**
 * Decides which part of the page is on screen so the shared 3D stage knows what to do:
 * 'hero' (cinematic orbit), 'explore' (floor explorer) or 'other' (canvas paused + hidden).
 */
export function useSectionTracker() {
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const vh = window.innerHeight;
      const hero = document.getElementById('top');
      const explore = document.getElementById('explore');
      let section: Section = 'other';
      if (explore) {
        const r = explore.getBoundingClientRect();
        if (r.top < vh * 0.5 && r.bottom > vh * 0.5) section = 'explore';
      }
      if (section === 'other' && hero) {
        const r = hero.getBoundingClientRect();
        if (r.bottom > vh * 0.08) section = 'hero';
      }
      if (getState().section !== section) setState({ section, hoveredUnit: null });
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}
