import { cn } from "@/lib/utils";

const TONES = [
  ["#8a5a3b", "#c99a6d"],
  ["#5c6650", "#95a17f"],
  ["#463c33", "#7d6a56"],
  ["#9c7a52", "#e2c39a"],
  ["#3f4a44", "#7a8b7f"],
  ["#71503a", "#b98f63"],
];

function toneFromSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % TONES.length;
  }
  return TONES[hash];
}

/** Deterministic gradient placeholder standing in for project photography. Swap for next/image once real assets land. */
export function PlaceholderImage({
  seed,
  label,
  className,
}: {
  seed: string;
  label?: string;
  className?: string;
}) {
  const [start, end] = toneFromSeed(seed);

  return (
    <div
      className={cn("relative flex items-end overflow-hidden", className)}
      style={{ background: `linear-gradient(135deg, ${start}, ${end})` }}
      role="img"
      aria-label={label ?? seed}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.22),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_100%,rgba(0,0,0,0.25),transparent_55%)]" />
      <div className="absolute inset-0 mix-blend-overlay opacity-25 [background-image:repeating-linear-gradient(115deg,rgba(0,0,0,0.12)_0px,rgba(0,0,0,0.12)_1px,transparent_1px,transparent_3px)]" />
      {label ? (
        <span className="relative z-10 p-5 font-display text-sm text-cream/90 italic tracking-wide">
          {label}
        </span>
      ) : null}
    </div>
  );
}
