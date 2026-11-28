import { Building2, ChevronDown, ChevronRight, ChevronUp, Hand, Info, Minus, MousePointerClick, Plus, RotateCcw, ScrollText } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import PlanSvg from '../apartments/PlanSvg';
import { data, explorerSteps, floorById, floorsTopDown, formatSqft, unitConfiguration, unitsOnFloor, unitTypeOf } from '../data/project';
import type { Floor } from '../data/types';
import { goToFloor, goToStep, hoverUnit, isProgrammaticScroll, nextFloor, prevFloor, registerExplorer, resetView, selectUnit, STEP_COUNT, zoomBy } from '../utils/actions';
import { getState, useStore } from '../utils/store';
import { openLightbox } from '../components/Lightbox';
import { Img } from '../components/ui';

const LEVEL: Record<string, number> = { stilt: 0, f1: 1, f2: 2, f3: 3, f4: 4, f5: 5, terrace: 6 };
const STEP_VH = 72;

export default function Explorer() {
  const ref = useRef<HTMLElement>(null);
  const step = useStore((s) => s.step);
  const webgl = useStore((s) => s.webgl);

  useEffect(() => {
    registerExplorer(ref.current);
    let raf = 0;
    const measure = () => {
      raf = 0;
      const el = ref.current;
      if (!el || isProgrammaticScroll()) return;
      const r = el.getBoundingClientRect();
      const range = el.offsetHeight - window.innerHeight;
      if (r.top > window.innerHeight * 0.5 || r.bottom < window.innerHeight * 0.5) return;
      const p = Math.min(1, Math.max(0, -r.top / range));
      const s = Math.round(p * (STEP_COUNT - 1));
      if (s !== getState().step) goToStep(s, { scroll: false });
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    window.addEventListener('scroll', on, { passive: true });
    return () => {
      window.removeEventListener('scroll', on);
      registerExplorer(null);
    };
  }, []);

  const floor = explorerSteps[step];
  return (
    <section
      id="explore"
      ref={ref}
      className="explore"
      style={{ height: `calc(100vh + ${(STEP_COUNT - 1) * STEP_VH}vh)` }}
      aria-label="Interactive 3D building and floor explorer"
    >
      <div className="explore-sticky">
        {!webgl && <Stage2D floor={floor} />}
        <div className="explore-head">
          <p className="eyebrow">Interactive Building</p>
          <h2 className="display" data-testid="explore-title">
            {floor ? floor.label : 'The Building'}
          </h2>
        </div>
        <FloorRail />
        <FloorPanel floor={floor} />
        <div className="explore-hint">
          <div className="hint-pill">
            <span>
              <ScrollText /> Scroll · floors
            </span>
            {webgl && (
              <span>
                <Hand /> Drag · rotate
              </span>
            )}
            <span>
              <MousePointerClick /> Click · residence
            </span>
          </div>
          {webgl && (
            <>
              <button className="icon-btn" onClick={() => zoomBy(1 / 1.18)} aria-label="Zoom out" data-testid="zoom-out">
                <Minus />
              </button>
              <button className="icon-btn" onClick={() => zoomBy(1.18)} aria-label="Zoom in" data-testid="zoom-in">
                <Plus />
              </button>
            </>
          )}
        </div>
        <div className="explore-progress" aria-hidden>
          <i style={{ height: `${(step / (STEP_COUNT - 1)) * 100}%` }} />
        </div>
      </div>
    </section>
  );
}

function FloorRail() {
  const step = useStore((s) => s.step);
  const floorId = useStore((s) => s.floorId);
  return (
    <nav className="floor-rail" aria-label="Floor navigation" data-testid="floor-rail">
      <div className="rail-tools">
        <button className="icon-btn" onClick={nextFloor} disabled={step >= STEP_COUNT - 1} aria-label="Next floor (up)" data-testid="floor-next">
          <ChevronUp />
        </button>
      </div>
      <ol>
        {floorsTopDown.map((f) => (
          <li key={f.id}>
            <button className={`floor-btn${floorId === f.id ? ' active' : ''}`} onClick={() => goToFloor(f.id)} aria-current={floorId === f.id} data-testid={`floor-btn-${f.id}`}>
              <span className="lvl">{f.shortLabel}</span>
              <span className="nm">{f.label}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="rail-tools">
        <button className="icon-btn" onClick={prevFloor} disabled={step <= 1} aria-label="Previous floor (down)" data-testid="floor-prev">
          <ChevronDown />
        </button>
        <button className="icon-btn" onClick={resetView} aria-label="Reset building view" title="Reset building view" data-testid="reset-view">
          <RotateCcw />
        </button>
      </div>
    </nav>
  );
}

function UnitRow({ id }: { id: string }) {
  const u = data.units.find((x) => x.id === id)!;
  const t = unitTypeOf(u);
  const hovered = useStore((s) => s.hoveredUnit === id);
  const selected = useStore((s) => s.selectedUnit === id);
  return (
    <li>
      <button
        className={`unit-item${hovered ? ' hover' : ''}${selected ? ' selected' : ''}`}
        onMouseEnter={() => hoverUnit(id)}
        onMouseLeave={() => getState().hoveredUnit === id && hoverUnit(null)}
        onFocus={() => hoverUnit(id)}
        onBlur={() => getState().hoveredUnit === id && hoverUnit(null)}
        onClick={() => selectUnit(id)}
        data-testid={`unit-row-${id}`}
      >
        <span className="badge">{u.type ?? unitConfiguration(u).split(' ')[0]}</span>
        <span>
          <b>{u.type ? `Type ${u.type} · ${unitConfiguration(u)}` : unitConfiguration(u)}</b>
          <small>
            {t?.carpetAreaSqft != null ? `Carpet ${formatSqft(t.carpetAreaSqft)} · ${t.vastu}` : 'Plan & areas not published in brochure'}
          </small>
        </span>
        <ChevronRight />
      </button>
    </li>
  );
}

function FloorPanel({ floor }: { floor: Floor | null }) {
  const [expanded, setExpanded] = useState(false);
  const units = floor ? unitsOnFloor(floor.id) : [];
  const level = floor ? LEVEL[floor.id] : -1;
  const legend = floor?.plan === 'stilt' ? data.planLegends.stilt : floor?.plan === 'terrace' ? data.planLegends.terrace : null;
  const illus = floor?.plan === 'stilt' ? 'media/plans/stilt-floor-3d' : floor?.plan === 'terrace' ? 'media/plans/terrace-floor-3d' : null;
  return (
    <aside className={`floor-panel${expanded ? ' expanded' : ''}`} aria-live="polite" data-testid="floor-panel">
      <div className="floor-panel-head">
        <div>
          <h3 className="display">{floor ? floor.label : 'Choose a floor'}</h3>
          <p>{floor ? floor.summary : `${data.project.buildingLevels} · ${data.project.totalResidences} residences. Scroll, or pick a floor.`}</p>
        </div>
        <button className="icon-btn panel-toggle" onClick={() => setExpanded((e) => !e)} aria-label={expanded ? 'Collapse panel' : 'Expand panel'} aria-expanded={expanded}>
          {expanded ? <ChevronDown /> : <ChevronUp />}
        </button>
      </div>
      <div className="floor-panel-body">
        {!floor && (
          <ul className="unit-list">
            {floorsTopDown.map((f) => {
              const n = unitsOnFloor(f.id).length;
              return (
                <li key={f.id}>
                  <button className="unit-item" onClick={() => goToFloor(f.id)}>
                    <span className="badge">{f.shortLabel}</span>
                    <span>
                      <b>{f.label}</b>
                      <small>{n ? `${n} residence${n > 1 ? 's' : ''}` : f.kind === 'amenity' ? 'Amenities' : ''}</small>
                    </span>
                    <ChevronRight />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {floor && units.length > 0 && (
          <ul className="unit-list" data-testid="unit-list">
            {units.map((u) => (
              <UnitRow key={u.id} id={u.id} />
            ))}
          </ul>
        )}
        {floor && level >= 1 && level <= 4 && (
          <div className="mini-plan">
            <div className="mini-plan-head">
              <span>Original plan · brochure p.15</span>
              <span>N ↑</span>
            </div>
            <PlanSvg level={level} />
          </div>
        )}
        {floor?.id === 'f5' && (
          <div className="notice floor-note" style={{ marginTop: 14 }}>
            <Info />
            <span>{floor.derivation} The brochure does not include a 5th-floor plan, so no layout is shown.</span>
          </div>
        )}
        {legend && (
          <div className="floor-note" style={{ marginTop: 6 }}>
            <ul className="legend-list">
              {legend.map((l) => (
                <li key={l.n}>
                  <b>{l.n}</b>
                  {l.name}
                </li>
              ))}
            </ul>
            {illus && (
              <button className="text-link" style={{ marginTop: 14 }} onClick={() => openLightbox([{ src: illus, caption: `${floor?.label} plan`, note: `Brochure illustration · ${floor?.source}`, kind: 'plan' }])}>
                View original {floor?.label.toLowerCase()} plan <ChevronRight />
              </button>
            )}
            <p className="source-note" style={{ marginTop: 10 }}>
              In the 3D model, the positions of these spaces are indicative. The brochure illustration is the reference.
            </p>
          </div>
        )}
        {!floor && (
          <p className="source-note" style={{ marginTop: 12 }}>
            <Building2 size={12} style={{ verticalAlign: '-2px' }} /> 3D massing is derived from the brochure's typical floor plan. It is not a survey or construction model.
          </p>
        )}
      </div>
    </aside>
  );
}

/** Used when the device has no WebGL: the explorer still works on the original 2D plans. */
function Stage2D({ floor }: { floor: Floor | null }) {
  const level = floor ? LEVEL[floor.id] : -1;
  const f = floor ? floorById(floor.id) : null;
  return (
    <div className="stage-2d" data-testid="stage-2d">
      <div className="stage-2d-inner">
        {level >= 1 && level <= 4 && <PlanSvg level={level} />}
        {level === 0 && <Img src="media/plans/stilt-floor-3d" alt="Stilt floor plan (brochure illustration)" />}
        {level === 6 && <Img src="media/plans/terrace-floor-3d" alt="Terrace floor plan (brochure illustration)" />}
        {level === 5 && <div className="not-published"><div><h3 className="display">{f?.label}</h3><p>Layout not published in the brochure.</p></div></div>}
        {level === -1 && <Img src="media/exterior/front-elevation-dusk" alt="Front elevation (brochure render)" />}
      </div>
    </div>
  );
}
