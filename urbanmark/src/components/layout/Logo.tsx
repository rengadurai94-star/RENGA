import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("font-display flex items-baseline gap-1.5 text-xl font-medium tracking-tight", className)}>
      Urban Mark
      <span className="text-brass">·</span>
      <span className="text-[0.65em] tracking-[0.3em] uppercase opacity-70">Interior</span>
    </Link>
  );
}
