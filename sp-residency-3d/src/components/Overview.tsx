import { useEffect, useRef, useState } from 'react';
import { data } from '../data/project';
import { Img, Reveal, SourceNote } from './ui';

export default function Overview() {
  const p = data.project;
  const total = p.unitMix.reduce((a, b) => a + b.count, 0);
  const mixRef = useRef<HTMLDivElement>(null);
  const [mixIn, setMixIn] = useState(false);
  useEffect(() => {
    const el = mixRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setMixIn(true), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const amenityCount = data.amenityGroups.reduce((a, g) => a + g.items.length, 0);
  return (
    <section className="section" id="overview" aria-labelledby="overview-title">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <p className="eyebrow">Project Overview</p>
            <h2 id="overview-title" className="display h2">
              Boutique living, <em>complete</em> and built to last.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="lede">{p.statement} {p.philosophySummary}</p>
          </Reveal>
        </div>

        <div className="overview-grid">
          <Reveal as="figure" className="overview-figure">
            <Img src="media/exterior/exterior-day" alt="Exterior perspective of Shan Poornam Residence (artist's impression from the brochure)" sizes="(max-width: 980px) 100vw, 55vw" />
            <figcaption>
              <SourceNote>Exterior perspective · artist's impression · brochure p.4</SourceNote>
            </figcaption>
          </Reveal>
          <div>
            <Reveal>
              <div className="stat-row">
                <div className="stat">
                  <b>{p.totalResidences}</b>
                  <span>Residences</span>
                </div>
                <div className="stat">
                  <b>{p.residentialFloors}</b>
                  <span>Residential floors</span>
                </div>
                <div className="stat">
                  <b>85%</b>
                  <span>Carpet / super built-up</span>
                </div>
                <div className="stat">
                  <b>{amenityCount}</b>
                  <span>Amenities</span>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="mix" ref={mixRef} aria-label="Unit mix">
                {p.unitMix.map((m) => (
                  <div className="mix-row" key={m.configuration}>
                    <span>{m.configuration}</span>
                    <div className="mix-bar">
                      <i style={{ transform: `scaleX(${mixIn ? m.count / total : 0})` }} />
                    </div>
                    <b style={{ textAlign: 'right' }}>{m.count}</b>
                  </div>
                ))}
              </div>
              <p className="small" style={{ marginTop: 18 }}>
                {p.threeBhkFrom} {p.areaDefinitions.carpet} {p.areaDefinitions.superBuiltUp}
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <ul className="advantages">
                {p.advantages.map((a, i) => (
                  <li key={a}>
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    {a}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>

        <Reveal className="philosophy">
          {p.philosophy.map((w) => (
            <div key={w.word}>
              <h3>
                <small>Foundational vision</small>
                {w.word}
              </h3>
              <p>{w.meaning}</p>
            </div>
          ))}
        </Reveal>
        <p className="source-note" style={{ marginTop: 14 }}>
          {p.credit} Source: brochure dated 11 May 2026.
        </p>
      </div>
    </section>
  );
}
