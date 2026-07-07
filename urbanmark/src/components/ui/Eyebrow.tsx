import { cn } from "@/lib/utils";

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("flex items-center gap-3 text-xs font-medium tracking-[0.25em] text-ink/60 uppercase", className)}>
      <span className="h-px w-8 bg-brass" />
      {children}
    </span>
  );
}
