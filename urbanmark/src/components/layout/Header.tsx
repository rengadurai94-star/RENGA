"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLenis } from "@/hooks/useLenis";
import { mainNav } from "@/data/navigation";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { Button } from "@/components/ui/Button";
import { Magnetic } from "@/components/ui/Magnetic";
import { cn } from "@/lib/utils";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;
    return lenis.on("scroll", (instance) => setIsScrolled(instance.scroll > 60));
  }, [lenis]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
          isScrolled || isMenuOpen ? "bg-cream/90 backdrop-blur-md" : "bg-transparent",
        )}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5 md:px-10 xl:px-16">
          <Logo />

          <nav className="hidden items-center gap-9 md:flex">
            {mainNav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className="group relative text-sm font-medium tracking-wide text-ink/80 transition-colors hover:text-ink"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-brass transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <Magnetic>
              <Button href="/contact" variant="primary" className="text-xs">
                Start a project
              </Button>
            </Magnetic>
          </div>

          <button
            type="button"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
          >
            <span className={cn("h-px w-6 bg-ink transition-transform duration-300", isMenuOpen && "translate-y-[3.5px] rotate-45")} />
            <span className={cn("h-px w-6 bg-ink transition-transform duration-300", isMenuOpen && "-translate-y-[3.5px] -rotate-45")} />
          </button>
        </div>
      </header>

      <MobileMenu links={mainNav} isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
