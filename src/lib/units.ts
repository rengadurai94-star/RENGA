/** Length units used across the configurator and room designer. */
export type LengthUnit = "mm" | "in" | "ft";

export const MM_PER_IN = 25.4;
export const MM_PER_FT = 304.8;

export function toMm(value: number, unit: LengthUnit) {
  if (unit === "in") return value * MM_PER_IN;
  if (unit === "ft") return value * MM_PER_FT;
  return value;
}

export function fromMm(mm: number, unit: LengthUnit) {
  if (unit === "in") return mm / MM_PER_IN;
  if (unit === "ft") return mm / MM_PER_FT;
  return mm;
}

/** Feet + inches → mm. */
export function feetInchesToMm(feet: number, inches = 0) {
  return feet * MM_PER_FT + inches * MM_PER_IN;
}

/** mm → feet-and-inches string rounded to the nearest 1/8", e.g. 3600 → 11′ 9⅜″. */
export function formatFeetInches(mm: number) {
  const totalEighths = Math.round((mm / MM_PER_IN) * 8);
  const feet = Math.floor(totalEighths / 96);
  const remEighths = totalEighths - feet * 96;
  const inches = Math.floor(remEighths / 8);
  const frac = remEighths % 8;
  const FRACS = ["", "⅛", "¼", "⅜", "½", "⅝", "¾", "⅞"];
  const inchStr = `${inches}${FRACS[frac]}″`;
  return feet > 0 ? `${feet}′ ${inchStr}` : inchStr;
}

export function formatLength(mm: number, unit: LengthUnit) {
  if (unit === "mm") return `${Math.round(mm)} mm`;
  if (unit === "in") return `${(mm / MM_PER_IN).toFixed(1)}″`;
  return formatFeetInches(mm);
}
