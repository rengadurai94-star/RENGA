import { cn } from "@/lib/utils";
import type { Material } from "@/types";

const SWATCH_STYLES: Record<Material["swatch"], React.CSSProperties> = {
  marble: {
    background:
      "linear-gradient(135deg, #ece7de, #d9d2c4), repeating-linear-gradient(115deg, rgba(120,110,95,0.18) 0px, transparent 2px, transparent 40px, rgba(120,110,95,0.12) 42px)",
    backgroundBlendMode: "normal, overlay",
  },
  travertine: {
    background:
      "linear-gradient(160deg, #dcc9a8, #c7ad83), repeating-linear-gradient(0deg, rgba(90,70,40,0.08) 0px, transparent 3px, transparent 9px)",
    backgroundBlendMode: "normal, overlay",
  },
  walnut: {
    background:
      "linear-gradient(120deg, #4a2f1f, #2c1a10), repeating-linear-gradient(95deg, rgba(0,0,0,0.25) 0px, transparent 2px, transparent 10px)",
    backgroundBlendMode: "normal, soft-light",
  },
  oak: {
    background:
      "linear-gradient(120deg, #c9a26c, #a67d47), repeating-linear-gradient(95deg, rgba(70,45,20,0.18) 0px, transparent 2px, transparent 12px)",
    backgroundBlendMode: "normal, overlay",
  },
  fluted: {
    background:
      "repeating-linear-gradient(90deg, #efe7d8 0px, #efe7d8 8px, #d8cdb8 9px, #d8cdb8 17px)",
  },
  brass: {
    background:
      "linear-gradient(135deg, #e8c98a 0%, #ad8a5c 35%, #d9bd8e 55%, #8a6a41 100%)",
  },
  concrete: {
    background:
      "linear-gradient(150deg, #a7a29a, #86817a), repeating-radial-gradient(circle at 30% 30%, rgba(255,255,255,0.05) 0px, transparent 2px, transparent 6px)",
    backgroundBlendMode: "normal, overlay",
  },
  fabric: {
    background:
      "linear-gradient(#c9beac, #c9beac), repeating-linear-gradient(45deg, rgba(0,0,0,0.06) 0px, transparent 2px, transparent 4px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.06) 0px, transparent 2px, transparent 4px)",
  },
};

export function MaterialSwatch({ swatch, className }: { swatch: Material["swatch"]; className?: string }) {
  return <div className={cn("relative", className)} style={SWATCH_STYLES[swatch]} />;
}
