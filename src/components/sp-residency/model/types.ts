export type SpModelUnit = {
  key: string;
  configuration: string;
  file: string;
  carpetSqft: number;
  sbuSqft: number;
  balconySqft: number;
  facing: string;
  position: string;
  rooms: { name: string; dims: string }[];
  sizeM: [number, number];
  pxPerFt: number;
};

export type SpModelLevel = {
  id: string;
  name: string;
  elevationM: number;
  content: string;
};

export type SpModelData = {
  buildingFile: string;
  footprintM: [number, number];
  footprintFt: [number, number];
  floorToFloorM: number;
  wallHeightM: number;
  heightToTerraceM: number;
  levels: SpModelLevel[];
  unitRegionsM: Record<string, number[][]>;
  assumed: string[];
  limitations: string[];
  units: SpModelUnit[];
};
