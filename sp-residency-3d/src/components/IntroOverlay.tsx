import gsap from 'gsap';
import { SkipForward } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { INTRO_DURATION, introClock } from '../animations/introClock';
import { data } from '../data/project';
import { introSeen, markIntroSeen, prefersReducedMotion } from '../utils/device';
import { getState, setState, useStore } from '../utils/store';

// The intro must finish on time even on a slow device: no GSAP lag smoothing.
gsap.ticker.lagSmoothing(0);

const lockScroll = (lock: boolean) => {
  document.documentElement.style.overflow = lock ? 'hidden' : '';
  document.body.style.overflow = lock ? 'hidden' : '';
};

/**
 * Cinematic opening. Scene 1: inside the clouds with the brand. Scene 2: the clouds part
 * and the camera descends over a stylised Madurai. Scene 3: approach to the building,
 * which hands over to the hero. GSAP drives both this overlay and the 3D camera (introClock).
 */
export default function IntroOverlay() {
  const introDone = useStore((s) => s.introDone);
  const sceneReady = useStore((s) => s.sceneReady);
  const webgl = useStore((s) => s.webgl);
  const introRun = useStore((s) => s.introRun);
  const veil = useRef<HTMLDivElement>(null);
  const brand = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLParagraphElement>(null);
  const bar = useRef<HTMLElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const [mounted, setMounted] = useState(true);

  const finish = useCallback((instant: boolean) => {
    tl.current?.kill();
    tl.current = null;
    introClock.t = 1;
    introClock.part = 1;
    markIntroSeen();
    lockScroll(false);
    if (veil.current) {
      // a brief dissolve hides the camera cut when skipping
      if (instant) gsap.fromTo(veil.current, { opacity: 1 }, { opacity: 0, duration: 1.1, ease: 'power2.out' });
      else gsap.to(veil.current, { opacity: 0, duration: 0.9, ease: 'power2.out' });
    }
    if (brand.current) gsap.to([brand.current, line.current], { opacity: 0, duration: 0.4 });
    setState({ introDone: true, introSkipped: instant });
    window.setTimeout(() => setMounted(false), 1300);
  }, []);

  // decide whether to play
  useEffect(() => {
    if (getState().introDone && introRun === 0) return;
    setMounted(true);
    window.scrollTo(0, 0);
    lockScroll(true);
    const autoSkip = introRun === 0 && (introSeen() || prefersReducedMotion());
    if (autoSkip) {
      finish(true);
      return;
    }
    if (webgl && !sceneReady) return; // wait for the first frames
    introClock.t = 0;
    introClock.part = 0;
    const T = webgl ? INTRO_DURATION : 4.2;
    const t = gsap.timeline({ onComplete: () => finish(false) });
    t.set(veil.current, { opacity: 1 })
      .to(veil.current, { opacity: webgl ? 0 : 0.55, duration: 2.4, ease: 'power2.out' }, 0.1)
      .fromTo(bar.current, { scaleX: 0 }, { scaleX: 1, duration: T, ease: 'none' }, 0)
      .fromTo(brand.current, { opacity: 0, y: 18, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 2, ease: 'power3.out' }, 0.5)
      .fromTo(line.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1.6, ease: 'power3.out' }, 1.5)
      .to([brand.current, line.current], { opacity: 0, y: -14, filter: 'blur(6px)', duration: 1.3, ease: 'power2.in' }, webgl ? 4.8 : 3.1);
    if (webgl) {
      t.to(introClock, { t: 1, duration: INTRO_DURATION, ease: 'none' }, 0).to(introClock, { part: 1, duration: 4.6, ease: 'power2.inOut' }, 3.6);
    }
    tl.current = t;
    return () => {
      t.kill();
    };
  }, [sceneReady, webgl, introRun, finish]);

  useEffect(() => {
    if (!introDone) return;
    lockScroll(false);
  }, [introDone]);

  if (!mounted) return null;
  return (
    <div className="intro on-dark" aria-hidden={introDone} data-testid="intro">
      <div ref={veil} className="intro-veil" />
      <div className="intro-center">
        <div ref={brand} className="intro-brand">
          <img src="./brand/shan-poornam-logo-on-dark.svg" alt={`${data.project.name} ${data.project.byline}`} width={420} height={170} />
          <p ref={line} className="intro-line">
            {data.project.introLine}
          </p>
        </div>
      </div>
      {!introDone && webgl && !sceneReady && (
        <div className="intro-loading">
          <span className="loader-dot" /> &nbsp; Preparing the experience
        </div>
      )}
      {!introDone && (
        <>
          <div className="intro-progress">
            <i ref={bar} />
          </div>
          <button className="intro-skip" onClick={() => finish(true)} data-testid="skip-intro">
            Skip intro <SkipForward />
          </button>
        </>
      )}
    </div>
  );
}

export function replayIntro() {
  setState((s) => ({ introDone: false, introRun: s.introRun + 1, sceneReady: s.sceneReady, detailOpen: false }));
}
