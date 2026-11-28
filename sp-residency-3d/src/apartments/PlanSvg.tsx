import { geometry, unitById, unitConfiguration } from '../data/project';
import { hoverUnit, selectUnit } from '../utils/actions';
import { getState, useStore } from '../utils/store';

const UNIT_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];

function centroid(poly: [number, number][]) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % poly.length];
    const f = x0 * y1 - x1 * y0;
    a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
  }
  a *= 0.5;
  return [cx / (6 * a), cy / (6 * a)];
}
const CENTROIDS = Object.fromEntries(UNIT_KEYS.map((k) => [k, centroid(geometry.regions[k].polygon_px)]));

/**
 * The ORIGINAL typical floor plan (brochure p.15) with traced, clickable unit boundaries.
 * Hover/selection is read from and written to the shared store, so the 2D plan and the
 * 3D building always highlight the same residence.
 */
export default function PlanSvg({ level, interactive = true, onSelect, dimOthers = false, highlight }: { level: number; interactive?: boolean; onSelect?: (id: string) => void; dimOthers?: boolean; highlight?: string | null }) {
  const hovered = useStore((s) => s.hoveredUnit);
  const selectedState = useStore((s) => s.selectedUnit);
  const selected = highlight ?? selectedState;
  const { width, height, src } = geometry.image;
  return (
    <svg className={`plan-svg${dimOthers ? ' dim-others' : ''}`} viewBox={`0 0 ${width} ${height}`} role="group" aria-label="Typical floor plan (1st to 4th floor) with residences A to F">
      <image href={`./${src}`} width={width} height={height} />
      {UNIT_KEYS.map((k) => {
        const id = `${level}${k}`;
        const u = unitById(id);
        const d = 'M' + geometry.regions[k].polygon_px.map((p) => p.join(',')).join('L') + 'Z';
        const cls = `unit-shape${hovered === id ? ' hover' : ''}${selected === id ? ' selected' : ''}`;
        const [cx, cy] = CENTROIDS[k];
        return (
          <g key={k}>
            <path
              d={d}
              className={cls}
              data-unit={id}
              tabIndex={interactive ? 0 : -1}
              role={interactive ? 'button' : undefined}
              aria-label={u ? `Type ${k}, ${unitConfiguration(u)}` : `Type ${k}`}
              onMouseEnter={() => interactive && hoverUnit(id)}
              onMouseLeave={() => interactive && getState().hoveredUnit === id && hoverUnit(null)}
              onClick={() => {
                if (!interactive) return;
                if (onSelect) onSelect(id);
                else selectUnit(id);
              }}
              onKeyDown={(e) => {
                if (!interactive) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (onSelect) onSelect(id);
                  else selectUnit(id);
                }
              }}
              style={{ pointerEvents: interactive ? 'auto' : 'none' }}
            />
            {(hovered === id || selected === id) && (
              <g className={selected === id ? 'selected-tag' : ''} transform={`translate(${cx},${cy})`} aria-hidden>
                <rect className="unit-tag-bg" x={-26} y={-15} width={52} height={30} rx={15} />
                <text className="unit-tag" textAnchor="middle" dominantBaseline="central">
                  {id}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
