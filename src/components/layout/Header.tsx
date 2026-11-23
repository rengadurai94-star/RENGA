"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

/** Exactly three navigation options — by design. */
export const NAV_LINKS = [
  { label: "3D Catalog", href: "/3d-catalog" },
  { label: "Sample Orders", href: "/sample-orders" },
  { label: "Login", href: "/login" },
] as const;

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const overHero = pathname === "/" && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-16 w-full transition-[background-color,border-color,backdrop-filter] duration-500",
        overHero
          ? "border-b border-transparent bg-transparent"
          : "border-b border-charcoal/[0.07] bg-ivory/85 backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-5 md:px-10">
        <Link href="/" aria-label="BOXES home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            const isLogin = l.href === "/login";
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-4 py-2 text-[13.5px] font-medium tracking-wide transition-colors duration-300",
                  isLogin
                    ? "ml-3 border border-charcoal/20 hover:border-charcoal hover:bg-charcoal hover:text-ivory"
                    : "text-charcoal/75 hover:text-charcoal",
                  active && !isLogin && "text-charcoal",
                  active && isLogin && "bg-charcoal text-ivory",
                )}
              >
                {l.label}
                {active && !isLogin && <span className="absolute inset-x-4 -bottom-0.5 h-px bg-charcoal" />}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile sheet — same three options */}
      <div
        id="mobile-nav"
        className={cn(
          "absolute inset-x-0 top-16 origin-top border-b border-charcoal/10 bg-ivory/95 backdrop-blur-xl transition-all duration-500 ease-[var(--ease-arch)] md:hidden",
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
        )}
      >
        <nav aria-label="Mobile" className="flex flex-col px-5 py-4">
          {NAV_LINKS.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between border-b border-charcoal/[0.07] py-4 font-display text-2xl font-semibold tracking-tight last:border-0"
            >
              {l.label}
              <span className="text-xs font-medium text-grey">0{i + 1}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
