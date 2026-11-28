// Types describing src/data/project-data.json and src/data/plan-geometry.json.
// `null` always means "not provided in the source documents" - the UI hides it.

export type FloorKind = 'residential' | 'amenity';

export interface Floor {
  id: string;
  label: string;
  shortLabel: string;
  level: number;
  kind: FloorKind;
  summary: string;
  plan: 'typical' | 'stilt' | 'terrace' | null;
  derivation?: string;
  source: string;
}

export interface Room {
  name: string;
  size: string;
}

export interface UnitType {
  configuration: string;
  carpetAreaSqft: number | null;
  balconyAreaSqft: number | null;
  superBuiltUpSqft: number | null;
  udsSqft: number | null;
  vastu: string | null;
  buildingEntry: string | null;
  flatEntry: string | null;
  bedrooms: string | null;
  kitchen: string | null;
  bathrooms: string | null;
  availableOn: string | null;
  positionOnFloor: string | null;
  rooms: Room[];
  plan: string | null;
  source: string;
}

export interface Unit {
  id: string;
  floor: string;
  type: string | null;
  configuration?: string;
  officialNumber: string | null;
  status: string | null;
  note?: string;
}

export interface Amenity {
  name: string;
  where: string;
  planRef: number | null;
  image: string | null;
  caption: string | null;
}

export interface SpecGroup {
  title: string;
  items: { label: string; value: string }[];
}

export interface Place {
  name: string;
  distance: string | null;
  time: string | null;
}

export interface GalleryItem {
  id: string;
  src: string;
  category: string;
  caption: string;
  page: number;
  captioned: boolean;
}

export interface ProjectData {
  meta: { dataVersion: number; lastUpdated: string; sourceDocument: string };
  project: {
    name: string;
    shortName: string;
    byline: string;
    tagline: string;
    introLine: string;
    introLineSource: string;
    statement: string;
    developer: string;
    collaborator: string;
    credit: string;
    city: string;
    locality: string;
    state: string;
    country: string;
    totalResidences: number;
    residentialFloors: number;
    buildingLevels: string;
    unitMix: { configuration: string; count: number }[];
    carpetToSuperBuiltUp: string;
    threeBhkFrom: string;
    philosophy: { word: string; meaning: string }[];
    philosophySummary: string;
    advantages: string[];
    areaDefinitions: { carpet: string; superBuiltUp: string };
    price: string | null;
    possessionDate: string | null;
    reraNumber: string | null;
    source: string;
  };
  floors: Floor[];
  unitTypes: Record<string, UnitType>;
  units: Unit[];
  amenityGroups: { title: string; items: Amenity[] }[];
  planLegends: { stilt: { n: number; name: string }[]; terrace: { n: number; name: string }[] };
  specifications: SpecGroup[];
  location: {
    address: string;
    headline: string;
    description: string;
    whyItMatters: string[];
    mapLink: string | null;
    mapLinkSource: string;
    categories: { title: string; places: Place[] }[];
    alsoOnMap: string[];
    source: string;
  };
  contact: {
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    website: string | null;
    siteAddress: string | null;
    source: string;
  };
  gallery: GalleryItem[];
  residenceGallery: string[];
  disclaimer: string;
}

export interface PlanRegion {
  polygon_px: [number, number][];
  holes_px: [number, number][][];
  area_px: number;
}

export interface PlanGeometry {
  px_per_ft: number;
  image: { src: string; width: number; height: number };
  building_bbox_px: [number, number, number, number];
  building_size_ft_derived: [number, number];
  regions: Record<string, PlanRegion>;
  balconies: Record<string, { rect_px: [number, number, number, number]; printed: string }[]>;
  frames: Record<string, [number, number, number, number][]>;
}
