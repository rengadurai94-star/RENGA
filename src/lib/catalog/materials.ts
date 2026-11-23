import type {
  Accessory,
  BoardMaterial,
  Channel,
  Colour,
  Finish,
  Handle,
  Hinge,
  StoneMaterial,
} from "./types";

/**
 * Demo material & hardware library. Rates are realistic Indian market
 * ballparks (INR) used by the pricing engine; the admin panel will own them later.
 */

export const BOARDS: BoardMaterial[] = [
  {
    id: "bwp-ply",
    name: "BWP Marine Plywood",
    type: "plywood",
    grade: "IS 710 · Boiling Water Proof",
    thicknessMm: 18,
    ratePerSqm: 1450,
    description: "Hardwood-core plywood rated for wet zones. The default for sink and base units.",
    interiorHex: "#e9e2d3",
    usableFor: ["carcass", "shutter"],
  },
  {
    id: "bwr-ply",
    name: "BWR Plywood",
    type: "plywood",
    grade: "IS 303 · Boiling Water Resistant",
    thicknessMm: 18,
    ratePerSqm: 1080,
    description: "Moisture-resistant plywood for dry zones — wardrobes, TV and storage units.",
    interiorHex: "#ece5d6",
    usableFor: ["carcass", "shutter"],
  },
  {
    id: "hdhmr",
    name: "HDHMR Board",
    type: "hdhmr",
    grade: "High Density · High Moisture Resistance",
    thicknessMm: 18,
    ratePerSqm: 1180,
    description: "Dense, termite-proof engineered board with excellent screw holding and a flat face for shutters.",
    interiorHex: "#efece6",
    usableFor: ["carcass", "shutter"],
  },
  {
    id: "mdf",
    name: "Interior MDF",
    type: "mdf",
    grade: "E1 · Medium Density Fibreboard",
    thicknessMm: 18,
    ratePerSqm: 780,
    description: "Smooth, machinable board ideal for painted and routed shutters in dry areas.",
    interiorHex: "#f1eee8",
    usableFor: ["carcass", "shutter"],
  },
  {
    id: "particle",
    name: "Pre-laminated Particle Board",
    type: "particle",
    grade: "E1 · Prelam both sides",
    thicknessMm: 18,
    ratePerSqm: 620,
    description: "Value carcass board with factory laminate on both faces. Dry zones only.",
    interiorHex: "#f3f1ec",
    usableFor: ["carcass"],
  },
];

export const FINISHES: Finish[] = [
  {
    id: "lam-matte",
    name: "Matte Laminate",
    type: "laminate-matte",
    ratePerSqm: 520,
    edgeBandPerM: 38,
    roughness: 0.78,
    clearcoat: 0,
    description: "1mm decorative laminate with a soft, fingerprint-resistant matte face.",
  },
  {
    id: "lam-gloss",
    name: "High-Gloss Laminate",
    type: "laminate-gloss",
    ratePerSqm: 690,
    edgeBandPerM: 46,
    roughness: 0.18,
    clearcoat: 0.6,
    description: "Mirror-like laminate that bounces light around compact kitchens.",
  },
  {
    id: "lam-texture",
    name: "Textured Suede Laminate",
    type: "laminate-texture",
    ratePerSqm: 610,
    edgeBandPerM: 42,
    roughness: 0.92,
    clearcoat: 0,
    description: "Synchronised-pore texture that you can feel — ideal for wood decors.",
  },
  {
    id: "acrylic",
    name: "Acrylic High-Gloss",
    type: "acrylic",
    ratePerSqm: 1650,
    edgeBandPerM: 72,
    roughness: 0.06,
    clearcoat: 1,
    description: "Solid acrylic sheet with deep, scratch-resistant gloss and laser edge banding.",
  },
  {
    id: "veneer",
    name: "Natural Veneer",
    type: "veneer",
    ratePerSqm: 1980,
    edgeBandPerM: 85,
    roughness: 0.55,
    clearcoat: 0.25,
    description: "Real wood veneer, hand-selected and sealed with a matte PU lacquer.",
  },
  {
    id: "pu",
    name: "PU Lacquer",
    type: "pu",
    ratePerSqm: 1450,
    edgeBandPerM: 0,
    roughness: 0.4,
    clearcoat: 0.4,
    description: "Spray-painted polyurethane in any colour, wrapped seamlessly over the edges.",
  },
];

const SOLID_FINISHES = ["lam-matte", "lam-gloss", "acrylic", "pu"];
const WOOD_FINISHES = ["lam-matte", "lam-texture", "veneer"];

export const COLOURS: Colour[] = [
  { id: "ivory", name: "Warm Ivory", code: "IV01", hex: "#ece5d6", pattern: "solid", finishes: SOLID_FINISHES },
  { id: "chalk", name: "Chalk White", code: "CW02", hex: "#f2f0ea", pattern: "solid", finishes: SOLID_FINISHES },
  { id: "fog", name: "Fog Grey", code: "FG03", hex: "#bdbab2", pattern: "solid", finishes: SOLID_FINISHES },
  { id: "olive", name: "Muted Olive", code: "OL04", hex: "#6b704f", pattern: "solid", finishes: SOLID_FINISHES },
  { id: "sage", name: "Sage", code: "SG05", hex: "#9da58a", pattern: "solid", finishes: SOLID_FINISHES },
  { id: "charcoal", name: "Charcoal", code: "CH06", hex: "#2f2f2c", pattern: "solid", finishes: SOLID_FINISHES },
  { id: "ink", name: "Ink Blue", code: "IB07", hex: "#2c3a4a", pattern: "solid", finishes: SOLID_FINISHES },
  { id: "clay", name: "Terracotta Clay", code: "TC08", hex: "#b06e4f", pattern: "solid", finishes: SOLID_FINISHES, premiumPerSqm: 60 },
  { id: "oak", name: "Natural Oak", code: "WO11", hex: "#b99a74", pattern: "wood", finishes: WOOD_FINISHES },
  { id: "ash", name: "Pale Ash", code: "WA12", hex: "#d6c6ab", pattern: "wood", finishes: WOOD_FINISHES },
  { id: "walnut", name: "Smoked Walnut", code: "WW13", hex: "#6b5040", pattern: "wood", finishes: WOOD_FINISHES, premiumPerSqm: 120 },
  { id: "teak", name: "Burma Teak", code: "WT14", hex: "#94704c", pattern: "wood", finishes: WOOD_FINISHES, premiumPerSqm: 150 },
  { id: "carrara", name: "Carrara Stone", code: "ST21", hex: "#e8e6e1", pattern: "stone", finishes: ["lam-matte", "lam-gloss"], premiumPerSqm: 90 },
  { id: "basalt", name: "Basalt Stone", code: "ST22", hex: "#4a4946", pattern: "stone", finishes: ["lam-matte", "lam-texture"], premiumPerSqm: 90 },
];

export const HANDLES: Handle[] = [
  { id: "gprofile-alu", name: "G-Profile · Anodised Aluminium", style: "gprofile", metalHex: "#b9b8b3", roughness: 0.35, price: 420, lengthMm: 0 },
  { id: "bar-steel", name: "Slim Bar · Brushed Steel", style: "bar", metalHex: "#c7c6c1", roughness: 0.3, price: 260, lengthMm: 160 },
  { id: "bar-black", name: "Slim Bar · Matte Black", style: "bar", metalHex: "#1f1f1e", roughness: 0.6, price: 290, lengthMm: 160 },
  { id: "bar-brass", name: "Slim Bar · Brushed Brass", style: "bar", metalHex: "#b8925a", roughness: 0.32, price: 480, lengthMm: 160 },
  { id: "knob-brass", name: "Round Knob · Brass", style: "knob", metalHex: "#b8925a", roughness: 0.3, price: 210, lengthMm: 30 },
  { id: "edge-black", name: "Edge Pull · Matte Black", style: "edge", metalHex: "#1f1f1e", roughness: 0.55, price: 340, lengthMm: 120 },
  { id: "push", name: "Push-to-Open (handleless)", style: "none", metalHex: "#000000", roughness: 1, price: 380, lengthMm: 0 },
];

export const HINGES: Hinge[] = [
  { id: "hinge-std", name: "Standard Soft-Close · 110°", price: 165, description: "Clip-on concealed hinge with integrated damper." },
  { id: "hinge-pro", name: "Premium Soft-Close · 3D Adjust", price: 320, description: "Tool-free 3-axis adjustment and 80,000-cycle rating." },
  { id: "hinge-sig", name: "Signature Wide-Angle · 165°", price: 540, description: "Full-access opening for corner and tall units." },
];

export const CHANNELS: Channel[] = [
  { id: "ch-tele", name: "Telescopic Ball-Bearing", price: 480, description: "Full-extension steel runners, 35kg rating (per pair)." },
  { id: "ch-soft", name: "Soft-Close Telescopic", price: 890, description: "Full extension with soft-close damping, 40kg (per pair)." },
  { id: "ch-tandem", name: "Tandem Box · Soft-Close", price: 2650, description: "Double-wall metal drawer system, 50kg, silent close (per drawer)." },
];

export const ACCESSORIES: Record<string, Accessory> = {
  "wardrobe-rod": { id: "wardrobe-rod", name: "Oval wardrobe rail with supports", price: 650 },
  "plate-rack": { id: "plate-rack", name: "Stainless plate & cup rack", price: 2400 },
  "corner-carousel": { id: "corner-carousel", name: "Blind-corner pull-out (magic corner)", price: 9800 },
  "cutlery-tray": { id: "cutlery-tray", name: "Moulded cutlery organiser", price: 1150 },
  "waste-bin": { id: "waste-bin", name: "Twin pull-out waste bins", price: 3200 },
  "pantry-unit": { id: "pantry-unit", name: "Tall pantry pull-out frame", price: 14500 },
  "led-strip": { id: "led-strip", name: "Warm LED profile with sensor", price: 1800 },
  "lift-up": { id: "lift-up", name: "Gas-strut lift-up mechanism", price: 1350 },
};

export const STONES: StoneMaterial[] = [
  { id: "quartz-snow", name: "Snow Quartz", hex: "#efede8", veinHex: "#cfcac0", ratePerSqm: 9500 },
  { id: "granite-black", name: "Absolute Black Granite", hex: "#1c1c1c", veinHex: "#2e2e2e", ratePerSqm: 6200 },
  { id: "marble-carrara", name: "Carrara Marble", hex: "#ecebe7", veinHex: "#a9a8a3", ratePerSqm: 14500 },
  { id: "quartz-taupe", name: "Taupe Quartz", hex: "#b8ab98", veinHex: "#9d907d", ratePerSqm: 9800 },
];

/* ───────────────────────── Lookups ───────────────────────── */

const byId = <T extends { id: string }>(list: T[]) =>
  Object.fromEntries(list.map((x) => [x.id, x])) as Record<string, T>;

export const BOARD_MAP = byId(BOARDS);
export const FINISH_MAP = byId(FINISHES);
export const COLOUR_MAP = byId(COLOURS);
export const HANDLE_MAP = byId(HANDLES);
export const HINGE_MAP = byId(HINGES);
export const CHANNEL_MAP = byId(CHANNELS);
export const STONE_MAP = byId(STONES);

export function coloursForFinish(finishId: string) {
  return COLOURS.filter((c) => c.finishes.includes(finishId));
}
