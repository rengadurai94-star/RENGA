import { Plus } from 'lucide-react';
import { data } from '../data/project';
import { Reveal } from './ui';

export default function Specifications() {
  const half = Math.ceil(data.specifications.length / 2);
  const cols = [data.specifications.slice(0, half), data.specifications.slice(half)];
  return (
    <section className="section" id="specifications" aria-labelledby="spec-title">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <p className="eyebrow">Project Specifications</p>
            <h2 id="spec-title" className="display h2">
              Quality you can see. <em>Comfort you can feel.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="lede">The full specification schedule, exactly as printed on pages 22 and 23 of the brochure.</p>
          </Reveal>
        </div>
        <div className="spec-grid">
          {cols.map((col, ci) => (
            <div key={ci}>
              {col.map((g, gi) => {
                const n = ci * half + gi + 1;
                return (
                  <details className="spec-group" key={g.title} open={n <= 2}>
                    <summary>
                      <span>{String(n).padStart(2, '0')}</span>
                      {g.title}
                      <Plus aria-hidden />
                    </summary>
                    <dl className="rows">
                      {g.items.map((it) => (
                        <div key={it.label}>
                          <dt>{it.label}</dt>
                          <dd>{it.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
