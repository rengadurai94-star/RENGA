import { cn } from "@/lib/utils";

/** BOXES mark: an isometric module built from three faces. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("h-7 w-7", className)}>
      <path d="M16 3 28 9.5 16 16 4 9.5Z" fill="currentColor" opacity="0.92" />
      <path d="M4 9.5 16 16v13L4 22.5Z" fill="var(--wood)" />
      <path d="M28 9.5 16 16v13l12-6.5Z" fill="var(--olive)" />
    </svg>
  );
}

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", inverted ? "text-ivory" : "text-charcoal", className)}>
      <LogoMark />
      <span className="font-display text-[19px] font-extrabold tracking-[0.18em]">BOXES</span>
    </span>
  );
}
