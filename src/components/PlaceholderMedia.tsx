import clsx from "clsx";

export type MediaTone =
  | "marble"
  | "oak"
  | "walnut"
  | "fluted"
  | "brass"
  | "microcement"
  | "stone"
  | "fabric"
  | "villa"
  | "penthouse"
  | "apartment"
  | "office"
  | "restaurant"
  | "retail"
  | "hero";

const TONES: Record<MediaTone, string> = {
  marble:
    "linear-gradient(135deg,#e8e2d4 0%,#c9c1ac 35%,#a89f88 55%,#d8d1bd 75%,#f0ebde 100%)",
  oak: "linear-gradient(135deg,#8a6238 0%,#6b491f 40%,#a67c46 70%,#5c3f1c 100%)",
  walnut: "linear-gradient(135deg,#4a2f1f 0%,#2e1c12 45%,#6b442a 75%,#3a2416 100%)",
  fluted: "repeating-linear-gradient(90deg,#2a2a2c 0px,#3a3a3d 6px,#232325 12px)",
  brass: "linear-gradient(135deg,#e2c98f 0%,#9c7d3f 35%,#c3a76a 60%,#7a6535 85%,#e2c98f 100%)",
  microcement: "linear-gradient(135deg,#cfcac0 0%,#a9a297 50%,#bab4a8 100%)",
  stone: "linear-gradient(135deg,#5a5852 0%,#38372f 40%,#726f63 70%,#242320 100%)",
  fabric: "linear-gradient(135deg,#6e5a4a 0%,#4a3b30 50%,#84705d 100%)",
  villa: "linear-gradient(160deg,#171512 0%,#3a2f22 45%,#6b5334 70%,#171512 100%)",
  penthouse: "linear-gradient(160deg,#0d0f14 0%,#1e2530 40%,#3a4a5c 70%,#0d0f14 100%)",
  apartment: "linear-gradient(160deg,#141312 0%,#2c2620 45%,#5c4c34 75%,#141312 100%)",
  office: "linear-gradient(160deg,#0e0e10 0%,#22242a 45%,#42454e 75%,#0e0e10 100%)",
  restaurant: "linear-gradient(160deg,#150c0a 0%,#3a1e16 45%,#7a4326 70%,#150c0a 100%)",
  retail: "linear-gradient(160deg,#120f14 0%,#2b2130 45%,#5c4468 70%,#120f14 100%)",
  hero: "linear-gradient(160deg,#0a0a0a 0%,#241e14 35%,#4a3c22 55%,#1a1610 80%,#0a0a0a 100%)",
};

type PlaceholderMediaProps = {
  tone: MediaTone;
  label?: string;
  index?: string;
  className?: string;
  children?: React.ReactNode;
};

export default function PlaceholderMedia({
  tone,
  label,
  index,
  className,
  children,
}: PlaceholderMediaProps) {
  return (
    <div
      className={clsx("grain relative overflow-hidden", className)}
      style={{ backgroundImage: TONES[tone] }}
    >
      <div className="pointer-events-none absolute inset-0">
        <span className="absolute left-4 top-4 h-3 w-3 border-l border-t border-gold/60 md:left-6 md:top-6" />
        <span className="absolute right-4 top-4 h-3 w-3 border-r border-t border-gold/60 md:right-6 md:top-6" />
        <span className="absolute bottom-4 left-4 h-3 w-3 border-b border-l border-gold/60 md:bottom-6 md:left-6" />
        <span className="absolute bottom-4 right-4 h-3 w-3 border-b border-r border-gold/60 md:bottom-6 md:right-6" />
      </div>
      {(label || index) && (
        <div className="absolute bottom-5 left-5 flex items-center gap-3 md:bottom-7 md:left-7">
          {index && (
            <span className="font-sans text-xs tabular-nums text-gold-bright/90">{index}</span>
          )}
          {label && (
            <span className="text-[10px] uppercase tracking-editorial text-warm/70">
              {label}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
