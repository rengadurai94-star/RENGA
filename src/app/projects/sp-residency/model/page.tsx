import type { Metadata } from "next";
import Link from "next/link";
import report from "../../../../../public/models/sp-residency/model.json";
import SpModelExperience from "@/components/sp-residency/model/SpModelExperience";
import type { SpModelData } from "@/components/sp-residency/model/types";

export const metadata: Metadata = {
  title: "Shan Poornam Residence — 3D Model — Urban Mark Interior",
  description:
    "Interactive conceptual 3D model of Shan Poornam Residence (SP Residency), Madurai, built from the brochure floor plans.",
};

const ASSUMED_LABELS: Record<string, (v: number) => string> = {
  stilt_floor_to_floor_ft: (v) => `stilt floor-to-floor ${v}′`,
  slab_thickness_ft: (v) => `slab thickness ${Math.round(v * 304.8)} mm`,
  parapet_height_ft: (v) => `terrace parapet ${v}′`,
  parapet_thickness_ft: (v) => `parapet thickness ${v * 12}″`,
};

function toViewerData(): SpModelData {
  const b = report.building;
  return {
    buildingFile: b.file,
    footprintM: b.footprint_m as [number, number],
    footprintFt: b.footprint_ft_derived as [number, number],
    floorToFloorM: b.floor_to_floor_m,
    wallHeightM: b.wall_height_m,
    heightToTerraceM: b.height_to_terrace_m,
    levels: b.levels.map((l) => ({ id: l.id, name: l.name, elevationM: l.elevation_m, content: l.content })),
    unitRegionsM: b.unit_regions_m,
    assumed: Object.entries(report.assumed_parameters).map(([k, v]) => ASSUMED_LABELS[k]?.(v) ?? `${k} ${v}`),
    limitations: report.known_limitations,
    units: report.units.map((u) => ({
      key: u.key,
      configuration: u.configuration,
      file: u.file,
      carpetSqft: u.carpet_sqft,
      sbuSqft: u.sbu_sqft,
      balconySqft: u.balcony_sqft,
      facing: u.facing,
      position: u.position,
      rooms: u.rooms,
      sizeM: u.size_m as [number, number],
      pxPerFt: u.px_per_ft,
    })),
  };
}

export default function SpResidencyModelPage() {
  return (
    <main>
      <SpModelExperience data={toViewerData()} />
      <Link
        href="/projects/sp-residency"
        className="fixed left-6 top-[4.6rem] z-40 text-[10px] uppercase tracking-editorial text-warm/60 transition-colors hover:text-gold-bright md:left-12 md:top-20"
      >
        ← Project
      </Link>
    </main>
  );
}
