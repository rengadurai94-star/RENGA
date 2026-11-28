import { Box, ChevronRight, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import PlanSvg from '../apartments/PlanSvg';
import { data, floorsBottomUp, formatSqft, geometry, mediaInfo, unitById, unitConfiguration, unitsOnFloor, unitTypeOf } from '../data/project';
import { hoverUnit, selectUnit, viewUnitIn3D } from '../utils/actions';
import { getState, subscribe, useStore } from '../utils/store';
import { Img, Reveal } from './ui';
import ZoomViewer from './ZoomViewer';

const LEVEL: Record<string, number> = { stilt: 0, f1: 1, f2: 2, f3: 3, f4: 4, f5: 5, terrace: 6 };

export default function FloorPlans() {
  const [tab, setTab] = useState('f1');
  const webgl = useStore((s) => s.webgl);
  const selected = useStore((s) => s.selectedUnit);
  const hovered = useStore((s) => s.hoveredUnit);

  // follow selections made elsewhere (3D building, explorer list)
  useEffect(() => {
    let prev = getState().selectedUnit;
    return subscribe(() => {
      const sel = getState().selectedUnit;
      if (sel && sel !== prev) {
        const u = unitById(sel);
        if (u) setTab(u.floor);
      }
      prev = sel;
    });
  }, []);

  const floor = floorsBottomUp.find((f) => f.id === tab)!;
  const level = LEVEL[tab];
  const units = unitsOnFloor(tab);
  const illus = floor.plan === 'stilt' ? 'media/plans/stilt-floor-3d' : floor.plan === 'terrace' ? 'media/plans/terrace-floor-3d' : null;
  const illusInfo = mediaInfo(illus);
  const legend = floor.plan === 'stilt' ? data.planLegends.stilt : floor.plan === 'terrace' ? data.planLegends.terrace : null;

  return (
    <section className="section paper" id="plans" aria-labelledby="plans-title">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <p className="eyebrow">Floor Plans</p>
            <h2 id="plans-title" className="display h2">
              Every floor, <em>as drawn</em>.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="lede">
              Original plans from the brochure. Choose a floor, then a residence. Your selection is highlighted in the 3D building as well. Drag to pan, and use the buttons, pinch or Ctrl + scroll to zoom.
            </p>
          </Reveal>
        </div>

        <div className="tabs" role="tablist" aria-label="Floors">
          {floorsBottomUp.map((f) => (
            <button key={f.id} role="tab" aria-selected={tab === f.id} className={`tab${tab === f.id ? ' active' : ''}`} onClick={() => setTab(f.id)} data-testid={`plan-tab-${f.id}`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="plans-layout">
          <div>
            {level >= 1 && level <= 4 && (
              <ZoomViewer contentW={geometry.image.width} contentH={geometry.image.height} label={`${floor.label} plan`} badge="Typical floor plan (1st–4th) · brochure p.15 · original image">
                <PlanSvg level={level} />
              </ZoomViewer>
            )}
            {illus && illusInfo && (
              <ZoomViewer contentW={illusInfo.width ?? 1600} contentH={illusInfo.height ?? 1000} label={`${floor.label} plan`} badge={`${floor.label} plan · brochure illustration · ${floor.source}`}>
                <img src={illusInfo.large ?? illusInfo.src} width={illusInfo.width} height={illusInfo.height} alt={`${floor.label} plan, original brochure illustration`} draggable={false} style={{ width: '100%', height: '100%' }} />
              </ZoomViewer>
            )}
            {tab === 'f5' && (
              <div className="not-published" data-testid="f5-not-published">
                <div>
                  <p className="eyebrow">5th Floor</p>
                  <h3 className="display">Layout not published</h3>
                  <p>{floor.derivation}</p>
                  <p className="small">We do not draw a layout for this floor. Please contact the sales team for the 5th-floor plan.</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="display h3" style={{ marginBottom: 6 }}>
              {floor.label}
            </h3>
            <p className="small" style={{ marginTop: 0 }}>
              {floor.summary}
            </p>
            {units.length > 0 && (
              <ul className="unit-list" style={{ marginTop: 18 }}>
                {units.map((u) => {
                  const t = unitTypeOf(u);
                  return (
                    <li key={u.id}>
                      <button
                        className={`unit-item${hovered === u.id ? ' hover' : ''}${selected === u.id ? ' selected' : ''}`}
                        onMouseEnter={() => hoverUnit(u.id)}
                        onMouseLeave={() => getState().hoveredUnit === u.id && hoverUnit(null)}
                        onClick={() => selectUnit(u.id)}
                        data-testid={`plans-unit-${u.id}`}
                      >
                        <span className="badge">{u.type ?? unitConfiguration(u).split(' ')[0]}</span>
                        <span>
                          <b>{u.type ? `Type ${u.type} · ${unitConfiguration(u)}` : unitConfiguration(u)}</b>
                          <small>{t?.carpetAreaSqft != null ? `Carpet ${formatSqft(t.carpetAreaSqft)} · SBU ${formatSqft(t.superBuiltUpSqft)}` : 'Plan & areas not published'}</small>
                        </span>
                        <ChevronRight />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {legend && (
              <ul className="legend-list" style={{ marginTop: 18 }}>
                {legend.map((l) => (
                  <li key={l.n}>
                    <b>{l.n}</b>
                    {l.name}
                  </li>
                ))}
              </ul>
            )}
            {selected && unitById(selected)?.floor === tab && webgl && (
              <button className="btn ghost sm" style={{ marginTop: 20 }} onClick={() => viewUnitIn3D(selected)}>
                <Box /> View {selected} in the 3D building
              </button>
            )}
            {level >= 1 && level <= 4 && (
              <div className="notice" style={{ marginTop: 24 }}>
                <Info />
                <span>
                  The 1st to 4th floors share the same typical plan. Boundaries are traced from the original plan. The brochure's plans are artists' impressions and not to scale, so rely on the printed dimensions and areas.
                </span>
              </div>
            )}
            {illus && (
              <p className="source-note" style={{ marginTop: 18 }}>
                Original brochure illustration ({floor.source}). Numbers match the legend above.
              </p>
            )}
          </div>
        </div>

        <div className="unit-cards">
          {Object.entries(data.unitTypes).map(([k, t], i) => (
            <Reveal key={k} delay={(i % 3) * 0.06}>
              <button className="unit-card" style={{ width: '100%' }} onClick={() => selectUnit(`${level >= 1 && level <= 4 ? level : 1}${k}`)} data-testid={`type-card-${k}`}>
                <div className="img">
                  <Img src={t.plan} alt={`Unit Type ${k} plan (brochure)`} sizes="(max-width: 600px) 90vw, 30vw" />
                </div>
                <div className="body">
                  <span className="eyebrow" style={{ marginBottom: 4 }}>
                    Unit Type {k}
                  </span>
                  <b>{t.configuration}</b>
                  <span>
                    Carpet {formatSqft(t.carpetAreaSqft)} · SBU {formatSqft(t.superBuiltUpSqft)}
                  </span>
                  <span>
                    {t.vastu} · {t.availableOn}
                  </span>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
