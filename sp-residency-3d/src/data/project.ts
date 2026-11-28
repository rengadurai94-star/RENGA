import raw from './project-data.json';
import rawGeometry from './plan-geometry.json';
import type { Floor, PlanGeometry, ProjectData, Unit, UnitType } from './types';

/** All project content. Edit project-data.json (or use /#/editor) - never the components. */
export const data = raw as unknown as ProjectData;
export const geometry = rawGeometry as unknown as PlanGeometry;

/** Floors ordered from the ground up (Stilt -> Terrace). */
export const floorsBottomUp: Floor[] = [...data.floors].sort((a, b) => a.level - b.level);
export const floorsTopDown: Floor[] = [...floorsBottomUp].reverse();

export const floorById = (id: string | null | undefined): Floor | undefined =>
  id ? data.floors.find((f) => f.id === id) : undefined;

export const unitById = (id: string | null | undefined): Unit | undefined =>
  id ? data.units.find((u) => u.id === id) : undefined;

export const unitsOnFloor = (floorId: string): Unit[] => data.units.filter((u) => u.floor === floorId);

export const unitTypeOf = (u: Unit | undefined): UnitType | undefined =>
  u && u.type ? data.unitTypes[u.type] : undefined;

export const unitConfiguration = (u: Unit): string =>
  u.configuration ?? unitTypeOf(u)?.configuration ?? 'Configuration not provided';

/** Public title of a residence. Uses the official number when one is entered. */
export const unitTitle = (u: Unit): string => {
  if (u.officialNumber) return `Residence ${u.officialNumber}`;
  return u.type ? `Type ${u.type}` : unitConfiguration(u);
};

export const unitSubtitle = (u: Unit): string => {
  const f = floorById(u.floor);
  return `${f?.label ?? ''} · ${unitConfiguration(u)}`;
};

/** Short reference code (e.g. "2D" = 2nd floor, Type D). Not an official flat number. */
export const unitRef = (u: Unit): string => u.id;

export const residentialUnitCount = data.units.length;

/** Index of the floor in the explorer sequence: 0 = whole building, 1.. = bottom-up floors. */
export const explorerSteps: (Floor | null)[] = [null, ...floorsBottomUp];

export const media = (base: string | null | undefined, w: 960 | 1200 | 1920 | 2000 | 2400 = 960): string | undefined => {
  if (!base) return undefined;
  if (/\.(webp|jpe?g|png|svg)$/i.test(base)) return `./${base}`;
  return `./${base}-${w}.webp`;
};

// Native widths of each generated asset (so we never request a size that doesn't exist).
import manifest from './media-manifest.json';
type ManifestEntry = { native: [number, number]; files: Record<string, string> };
const mf = manifest as unknown as { photos: Record<string, ManifestEntry>; plans: Record<string, ManifestEntry> };

export const mediaInfo = (base: string | null | undefined) => {
  if (!base) return undefined;
  const key = base.replace(/^media\//, '');
  const entry = mf.photos[key] ?? mf.plans[key];
  if (!entry) return { src: `./${base}`, srcSet: undefined, width: undefined, height: undefined };
  const files = Object.entries(entry.files)
    .map(([w, f]) => ({ w: Number(w), f }))
    .sort((a, b) => a.w - b.w);
  return {
    src: `./${files[0].f}`,
    large: `./${files[files.length - 1].f}`,
    srcSet: files.map((x) => `./${x.f} ${x.w}w`).join(', '),
    width: entry.native[0],
    height: entry.native[1],
  };
};

export const formatSqft = (n: number | null | undefined) =>
  n == null ? null : `${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })} sq.ft.`;

export const DIRECTION_NAMES: Record<string, string> = {
  N: 'North', S: 'South', E: 'East', W: 'West', NE: 'North-east', NW: 'North-west', SE: 'South-east', SW: 'South-west',
};
