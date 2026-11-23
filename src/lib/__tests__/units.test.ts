import { describe, expect, it } from "vitest";
import { feetInchesToMm, formatFeetInches, fromMm, toMm } from "@/lib/units";

describe("units", () => {
  it("converts feet and inches to millimetres", () => {
    expect(feetInchesToMm(10)).toBeCloseTo(3048);
    expect(feetInchesToMm(12)).toBeCloseTo(3657.6);
    expect(feetInchesToMm(10, 6)).toBeCloseTo(3200.4);
    expect(toMm(24, "in")).toBeCloseTo(609.6);
  });
  it("round-trips", () => {
    expect(toMm(fromMm(2743, "ft"), "ft")).toBeCloseTo(2743);
  });
  it("formats feet-inches to the nearest eighth", () => {
    expect(formatFeetInches(3048)).toBe("10′ 0″");
    expect(formatFeetInches(3600)).toBe("11′ 9¾″");
    expect(formatFeetInches(600)).toBe("1′ 11⅝″");
    expect(formatFeetInches(100)).toBe("3⅞″");
  });
});
