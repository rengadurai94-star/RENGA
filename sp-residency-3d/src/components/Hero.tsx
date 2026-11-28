import { ArrowDown, RotateCcw } from 'lucide-react';
import { data } from '../data/project';
import { scrollToId } from '../utils/actions';
import { useStore } from '../utils/store';
import { replayIntro } from './IntroOverlay';

export default function Hero() {
  const introDone = useStore((s) => s.introDone);
  const webgl = useStore((s) => s.webgl);
  const p = data.project;
  return (
    <section className="hero on-dark" id="top" aria-label={`${p.name} introduction`}>
      <div className={`hero-inner hero-enter${introDone ? ' in' : ''}`}>
        <div>
          <p className="eyebrow">
            {p.locality} · {p.city}, {p.state}
          </p>
          <h1 className="display h1">
            Shan Poornam
            <br />
            <em>Residence</em>
          </h1>
          <div className="hero-meta">
            <span>{p.tagline}</span>
            <span>{p.buildingLevels}</span>
          </div>
          <div className="hero-cta">
            <button className="btn" onClick={() => scrollToId('explore')} data-testid="explore-building">
              Explore Building <ArrowDown />
            </button>
            {webgl && (
              <button className="text-link" onClick={replayIntro} data-testid="replay-intro">
                <RotateCcw /> Replay intro
              </button>
            )}
          </div>
        </div>
        <div className="hero-stats" aria-label="Key figures">
          <div>
            <b>{p.residentialFloors}</b>
            <span>Residential floors</span>
          </div>
          <div>
            <b>{p.totalResidences}</b>
            <span>Residences</span>
          </div>
        </div>
      </div>
      {introDone && <div className="scroll-cue" aria-hidden />}
    </section>
  );
}
