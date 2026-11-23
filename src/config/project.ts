/**
 * BOXES — centralized project configuration.
 *
 * Every piece of project information shown on the website lives here so it
 * can be edited in one place. Anything that has NOT been confirmed by the
 * developer is marked as a placeholder (see `TBC`) and is rendered with a
 * "to be confirmed" treatment in the UI.
 *
 * IMPORTANT: Dimensions, areas, layouts and specifications in this prototype
 * are conceptual and illustrative only. They are not approved project data.
 */

export const TBC = "To be confirmed";

export type Facing = "North" | "East" | "South" | "West";
export type UnitId = "A" | "B" | "C" | "D";

export interface UnitConfig {
  id: UnitId;
  /** Display name, e.g. "Unit A". */
  name: string;
  bhk: number;
  label: string;
  /** Each unit on a floor must face a different direction. */
  facing: Facing;
  bedrooms: number;
  bathrooms: number;
  /** Extra notes shown next to bathroom count (e.g. "+ powder room"). */
  bathroomNote?: string;
  balconies: number;
  balconyNote: string;
  /** Indicative area placeholder. Replace with approved figures. */
  area: { value: number | null; placeholder: string; unit: "sq.ft" };
  /** Accent colour used for this unit in 3D highlights and plans. */
  accent: string;
  summary: string;
  highlights: string[];
}

export interface Amenity {
  title: string;
  description: string;
  icon:
    | "pool"
    | "gym"
    | "garden"
    | "kids"
    | "clubhouse"
    | "security"
    | "power"
    | "parking"
    | "yoga"
    | "lift"
    | "water"
    | "ev";
}

export interface LocationPoint {
  name: string;
  category: "Transit" | "Education" | "Healthcare" | "Culture" | "Retail" | "Leisure";
  /** Travel time / distance placeholder — verify before publishing. */
  distance: string;
}

export interface SpecGroup {
  title: string;
  items: { label: string; value: string }[];
}

export interface GalleryItem {
  src: string;
  title: string;
  caption: string;
}

export const project = {
  name: "BOXES",
  tagline: "Eight floors. Thirty-two homes. Four horizons.",
  intro:
    "A vertical neighbourhood of thirty-two residences, each one a box of light opening to its own direction.",
  location: {
    area: "Surya Nagar",
    city: "Madurai",
    state: "Tamil Nadu",
    country: "India",
    mapsQuery: "Surya Nagar, Madurai, Tamil Nadu, India",
  },
  developer: { name: "Developer name", website: "" }, // placeholder
  rera: TBC,
  disclaimer:
    "Conceptual prototype. All layouts, dimensions, areas, specifications, amenities and imagery shown are illustrative placeholders generated for this demo and do not represent approved project information.",

  /** Building configuration — drives the procedural 3D model. */
  building: {
    floors: 8,
    unitsPerFloor: 4,
    /** Floor-to-floor height in metres (conceptual). */
    floorToFloor: 3.4,
    /** Stilt / lobby level height in metres (conceptual). */
    groundLevelHeight: 4.6,
    /** Side length of the central lift & stair core in metres (conceptual). */
    coreSize: 15,
  },

  units: [
    {
      id: "A",
      name: "Unit A",
      bhk: 2,
      label: "2 BHK",
      facing: "North",
      bedrooms: 2,
      bathrooms: 2,
      balconies: 2,
      balconyNote: "Living sit-out + utility balcony",
      area: { value: null, placeholder: "≈ 1,150", unit: "sq.ft" },
      accent: "#c9a27a",
      summary: "A compact, light-filled home with a generous living room opening to the north.",
      highlights: ["Open living & dining", "Master suite", "Utility balcony"],
    },
    {
      id: "B",
      name: "Unit B",
      bhk: 3,
      label: "3 BHK",
      facing: "East",
      bedrooms: 3,
      bathrooms: 3,
      bathroomNote: "+ powder room",
      balconies: 2,
      balconyNote: "Full-width front balcony + utility balcony",
      area: { value: null, placeholder: "≈ 1,750", unit: "sq.ft" },
      accent: "#a8835c",
      summary: "East-facing family home with a full-width balcony catching the morning sun.",
      highlights: ["Pooja room", "Walk-in dressing", "Full-width balcony"],
    },
    {
      id: "C",
      name: "Unit C",
      bhk: 4,
      label: "4 BHK",
      facing: "South",
      bedrooms: 4,
      bathrooms: 4,
      bathroomNote: "+ powder room",
      balconies: 3,
      balconyNote: "Front balcony, bedroom balcony + utility",
      area: { value: null, placeholder: "≈ 2,350", unit: "sq.ft" },
      accent: "#8a8f8c",
      summary: "A large-format residence with a separate family lounge and four ensuite bedrooms.",
      highlights: ["Family lounge", "Four ensuite bedrooms", "Pooja room"],
    },
    {
      id: "D",
      name: "Unit D",
      bhk: 5,
      label: "5 BHK",
      facing: "West",
      bedrooms: 5,
      bathrooms: 5,
      bathroomNote: "+ powder room",
      balconies: 4,
      balconyNote: "Front balcony, two bedroom balconies + utility",
      area: { value: null, placeholder: "≈ 2,900", unit: "sq.ft" },
      accent: "#5d5853",
      summary: "The signature residence: five bedrooms, a media room and a sunset-facing living room.",
      highlights: ["Media / study room", "Master suite with dressing", "Sunset living"],
    },
  ] satisfies UnitConfig[],

  overview: {
    heading: "Architecture as a stack of considered boxes.",
    body: [
      "BOXES is a conceptual residential tower for Surya Nagar, Madurai. Four apartment typologies are arranged around a central core so every home opens to a different direction — north, east, south and west.",
      "Each residence reads as its own framed volume on the elevation: deep reveals for shade, bronze-toned fins, and balconies that bring the outdoors into daily life in a hot-humid climate.",
    ],
    stats: [
      { value: "8", label: "Residential floors" },
      { value: "32", label: "Residences" },
      { value: "4", label: "Typologies, 2–5 BHK" },
      { value: "4", label: "Facing directions" },
    ],
    facts: [
      { label: "Land area", value: TBC },
      { label: "Structure", value: "Stilt + 8 floors (conceptual)" },
      { label: "RERA No.", value: TBC },
      { label: "Possession", value: TBC },
    ],
  },

  locationAdvantages: {
    heading: "Rooted in Surya Nagar, connected to Madurai.",
    body: "Placeholder copy — replace with verified location highlights. Distances and travel times below are deliberately left unconfirmed.",
    points: [
      { name: "Madurai Junction (railway)", category: "Transit", distance: TBC },
      { name: "Madurai International Airport", category: "Transit", distance: TBC },
      { name: "Meenakshi Amman Temple", category: "Culture", distance: TBC },
      { name: "Schools & colleges nearby", category: "Education", distance: TBC },
      { name: "Hospitals & clinics nearby", category: "Healthcare", distance: TBC },
      { name: "Daily retail & markets", category: "Retail", distance: TBC },
    ] satisfies LocationPoint[],
  },

  amenities: [
    { title: "Rooftop pool", description: "Placeholder — infinity edge lap pool on the terrace.", icon: "pool" },
    { title: "Fitness studio", description: "Placeholder — equipped gym with garden views.", icon: "gym" },
    { title: "Landscaped podium", description: "Placeholder — shaded courts and native planting.", icon: "garden" },
    { title: "Children's play", description: "Placeholder — safe, supervised play area.", icon: "kids" },
    { title: "Residents' lounge", description: "Placeholder — multipurpose hall for gatherings.", icon: "clubhouse" },
    { title: "Yoga deck", description: "Placeholder — open-air terrace for wellness.", icon: "yoga" },
    { title: "24×7 security", description: "Placeholder — CCTV, access control, manned gate.", icon: "security" },
    { title: "Power backup", description: "Placeholder — backup for common areas & lifts.", icon: "power" },
    { title: "Covered parking", description: "Placeholder — stilt-level parking.", icon: "parking" },
    { title: "EV charging", description: "Placeholder — provision for EV charging points.", icon: "ev" },
    { title: "High-speed lifts", description: "Placeholder — passenger and service lifts.", icon: "lift" },
    { title: "Rainwater harvesting", description: "Placeholder — rainwater capture and recharge.", icon: "water" },
  ] satisfies Amenity[],

  specifications: [
    {
      title: "Structure",
      items: [
        { label: "Frame", value: `RCC framed structure — ${TBC}` },
        { label: "Seismic design", value: TBC },
        { label: "Walls", value: TBC },
      ],
    },
    {
      title: "Flooring",
      items: [
        { label: "Living & dining", value: `Large-format tiles / marble — ${TBC}` },
        { label: "Bedrooms", value: `Engineered wood finish — ${TBC}` },
        { label: "Bathrooms & balconies", value: `Anti-skid tiles — ${TBC}` },
      ],
    },
    {
      title: "Kitchen",
      items: [
        { label: "Counter", value: `Granite / quartz — ${TBC}` },
        { label: "Sink", value: TBC },
        { label: "Provisions", value: `Water purifier, chimney points — ${TBC}` },
      ],
    },
    {
      title: "Bathrooms",
      items: [
        { label: "Sanitaryware", value: TBC },
        { label: "CP fittings", value: TBC },
        { label: "Wall dado", value: TBC },
      ],
    },
    {
      title: "Doors & windows",
      items: [
        { label: "Main door", value: `Teak frame & shutter — ${TBC}` },
        { label: "Windows", value: `uPVC / aluminium with glazing — ${TBC}` },
      ],
    },
    {
      title: "Electrical & services",
      items: [
        { label: "Wiring", value: TBC },
        { label: "Power backup", value: TBC },
        { label: "Lifts", value: TBC },
        { label: "Water supply", value: TBC },
      ],
    },
  ] satisfies SpecGroup[],

  gallery: [
    {
      src: "assets/images/gallery/exterior-day.jpg",
      title: "The tower",
      caption: "Procedural model — exterior, afternoon light",
    },
    {
      src: "assets/images/gallery/floor-cutaway.jpg",
      title: "Exploded floor",
      caption: "Four residences around the central core",
    },
    {
      src: "assets/images/gallery/interior-living.jpg",
      title: "Living room",
      caption: "Conceptual interior — Unit C",
    },
    {
      src: "assets/images/gallery/interior-bedroom.jpg",
      title: "Master bedroom",
      caption: "Conceptual interior — Unit D",
    },
    {
      src: "assets/images/gallery/interior-kitchen.jpg",
      title: "Kitchen",
      caption: "Conceptual interior — Unit B",
    },
    {
      src: "assets/images/gallery/dollhouse.jpg",
      title: "Dollhouse view",
      caption: "Conceptual layout — Unit D",
    },
  ] satisfies GalleryItem[],

  contact: {
    heading: "Begin a conversation.",
    phone: "+91 XXXXX XXXXX",
    email: "enquiries@example.com",
    address: "Site office — Surya Nagar, Madurai, Tamil Nadu (address to be confirmed)",
    hours: "Site visits by appointment",
  },

  /**
   * Optional GLB/GLTF models. Leave as `null` to use the procedural geometry.
   * See /public/assets/README.md for export guidelines (SketchUp, Revit, Blender).
   */
  models: {
    building: null as string | null,
    interiors: { A: null, B: null, C: null, D: null } as Record<UnitId, string | null>,
  },

  /** Sun position used for the 3D lighting (degrees). */
  environment: {
    sunAzimuth: 285, // compass bearing the sun shines FROM (0 = north, 90 = east)
    sunElevation: 34,
  },
};

export type Project = typeof project;

export function getUnit(id: UnitId): UnitConfig {
  const unit = project.units.find((u) => u.id === id);
  if (!unit) throw new Error(`Unknown unit ${id}`);
  return unit;
}

/** Unit numbering convention: floor 3, unit B -> "302". */
export function unitNumber(floor: number, unitId: UnitId): string {
  const index = project.units.findIndex((u) => u.id === unitId) + 1;
  return `${floor}${String(index).padStart(2, "0")}`;
}

export function parseUnitNumber(num: string): { floor: number; unitId: UnitId } | null {
  const m = /^(\d)(\d{2})$/.exec(num.trim());
  if (!m) return null;
  const floor = Number(m[1]);
  const idx = Number(m[2]) - 1;
  const unit = project.units[idx];
  if (!unit || floor < 1 || floor > project.building.floors) return null;
  return { floor, unitId: unit.id };
}

export function formatArea(unit: UnitConfig): string {
  if (unit.area.value) return `${unit.area.value.toLocaleString("en-IN")} ${unit.area.unit}`;
  return `${unit.area.placeholder} ${unit.area.unit}`;
}

export const floorsList = Array.from({ length: project.building.floors }, (_, i) => i + 1);
