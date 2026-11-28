import { lazy, Suspense, useEffect, useLayoutEffect, useState } from 'react';
import { initialQuality, hasWebGL } from '../utils/device';
import { getState, setState, useStore } from '../utils/store';
import { data, mediaInfo } from '../data/project';
import Nav from './Nav';
import IntroOverlay from './IntroOverlay';
import Hero from './Hero';
import Overview from './Overview';
import Explorer from '../floors/Explorer';
import FloorPlans from './FloorPlans';
import Gallery from './Gallery';
import Amenities from './Amenities';
import Specifications from './Specifications';
import Location from './Location';
import Contact from './Contact';
import Footer from './Footer';
import ApartmentDetail from '../apartments/ApartmentDetail';
import { LightboxHost } from './Lightbox';
import { useSectionTracker } from '../utils/useSectionTracker';
import { introClock } from '../animations/introClock';
import { subscribe } from '../utils/store';

// Test/debug hook (used by the automated browser tests).
if (typeof window !== 'undefined') {
  (window as unknown as { __spr: unknown }).__spr = { getState, setState, subscribe, introClock };
}

const SceneCanvas = lazy(() => import('../scenes/SceneCanvas'));

function Fallback2D() {
  const img = mediaInfo(data.gallery[0]?.src);
  return (
    <div className="stage" data-testid="stage-fallback">
      <div className="stage-fallback" style={{ backgroundImage: img ? `url(${img.large ?? img.src})` : undefined }} />
    </div>
  );
}

function AutoLowerToast() {
  const auto = useStore((s) => s.autoLowered);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!auto) return;
    setShow(true);
    const t = window.setTimeout(() => setShow(false), 6000);
    return () => window.clearTimeout(t);
  }, [auto]);
  if (!show) return null;
  return (
    <div className="toast" role="status">
      Switched to Performance mode for smoother motion. You can switch back with the button at the top right.
    </div>
  );
}

export default function Site() {
  const webgl = useStore((s) => s.webgl);

  useLayoutEffect(() => {
    const gl = hasWebGL();
    const params = new URLSearchParams(window.location.search);
    const forced2D = params.get('mode') === '2d';
    const q = params.get('quality');
    const locked = q === 'high' || q === 'low';
    setState({ webgl: gl && !forced2D, quality: locked ? (q as 'high' | 'low') : initialQuality(), qualityLocked: locked });
  }, []);

  useSectionTracker();

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && getState().detailOpen) setState({ detailOpen: false });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {webgl ? (
        <Suspense fallback={<div className="stage" />}>
          <SceneCanvas />
        </Suspense>
      ) : (
        <Fallback2D />
      )}
      <IntroOverlay />
      <Nav />
      <main>
        <Hero />
        <Overview />
        <Explorer />
        <FloorPlans />
        <Gallery />
        <Amenities />
        <Specifications />
        <Location />
        <Contact />
      </main>
      <Footer />
      <ApartmentDetail />
      <LightboxHost />
      <AutoLowerToast />
    </>
  );
}
