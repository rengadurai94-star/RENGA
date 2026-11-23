/**
 * BOXES catalog domain model.
 * All dimensions are millimetres. All money is INR.
 */

export type CategoryId =
  | "kitchen-base"
  | "kitchen-wall"
  | "tall"
  | "corner"
  | "drawer"
  | "sink"
  | "loft"
  | "wardrobe"
  | "tv"
  | "storage"
  | "open-shelf";

/** How the unit is mounted — drives plinth, default elevation and room placement. */
export type MountType = "floor" | "wall" | "loft";

/**
 * A vertical zone of a cabinet front, stacked bottom → top.
 * `mm` fixes the zone height, `frac` makes it a fraction of the carcass height,
 * neither means "take the remaining height".
 */
export interface FrontZone {
  kind: "doors" | "drawers" | "drawer-row" | "flap" | "open" | "niche" | "blind";
  /** Number of doors / drawers. "auto" picks by width (doors ≤600mm → 1, else 2…). */
  count?: number | "auto";
  mm?: number;
  frac?: number;
  /** Relative drawer heights, top → bottom. */
  ratios?: number[];
  shelves?: number;
  /** Wardrobe hanging rod. */
  rod?: boolean;
  /** Vertical divider at the centre. */
  divider?: boolean;
}

export interface DimRange {
  min: number;
  max: number;
  step: number;
  default: number;
}

export interface Product {
  sku: string;
  name: string;
  category: CategoryId;
  mount: MountType;
  description: string;
  zones: FrontZone[];
  plinthMm: number;
  width: DimRange;
  height: DimRange;
  depth: DimRange;
  /** Default elevation from floor when placed in a room. */
  defaultElevationMm: number;
  /** Shows a sink basin when a countertop is rendered. */
  sink?: boolean;
  /** Shows a hob on the countertop. */
  hob?: boolean;
  /** Accessories that are always included (priced in hardware). */
  accessories?: string[];
  features: string[];
  defaults: MaterialSelection;
}

export interface Category {
  id: CategoryId;
  name: string;
  short: string;
  description: string;
}

/* ───────────────────────── Materials & hardware ───────────────────────── */

export type BoardType = "plywood" | "mdf" | "hdhmr" | "particle";

export interface BoardMaterial {
  id: string;
  name: string;
  type: BoardType;
  grade: string;
  thicknessMm: number;
  /** Cost per square metre of 18mm board. */
  ratePerSqm: number;
  description: string;
  /** Interior laminate colour seen on the carcass. */
  interiorHex: string;
  usableFor: ("carcass" | "shutter")[];
}

export type FinishType = "laminate-matte" | "laminate-gloss" | "laminate-texture" | "acrylic" | "veneer" | "pu";

export interface Finish {
  id: string;
  name: string;
  type: FinishType;
  /** Cost per square metre of finished face. */
  ratePerSqm: number;
  /** Edge band cost per running metre for this finish. */
  edgeBandPerM: number;
  roughness: number;
  clearcoat: number;
  description: string;
}

export type ColourPattern = "solid" | "wood" | "stone";

export interface Colour {
  id: string;
  name: string;
  code: string;
  hex: string;
  pattern: ColourPattern;
  /** Finishes this colour is available in. */
  finishes: string[];
  /** Surcharge per square metre (designer decors). */
  premiumPerSqm?: number;
}

export type HandleStyle = "bar" | "knob" | "gprofile" | "edge" | "none";

export interface Handle {
  id: string;
  name: string;
  style: HandleStyle;
  metalHex: string;
  roughness: number;
  price: number;
  lengthMm: number;
}

export interface Hinge {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface Channel {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface Accessory {
  id: string;
  name: string;
  price: number;
}

export interface StoneMaterial {
  id: string;
  name: string;
  hex: string;
  veinHex: string;
  ratePerSqm: number;
}

export interface MaterialSelection {
  carcass: string;
  shutter: string;
  finish: string;
  colour: string;
  handle: string;
  hinge: string;
  channel: string;
}

/** A fully specified, priceable cabinet. */
export interface CabinetConfig extends MaterialSelection {
  sku: string; // product sku
  width: number;
  height: number;
  depth: number;
}
