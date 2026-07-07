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

  const isHome = pathname === "/";

  useEffect(() => {
    if (!lenis) return;
    return lenis.on("scroll", (instance) => setIsScrolled(instance.scroll > 60));
  }, [lenis]);

  const isSolid = isScrolled || isMenuOpen || !isHome;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 text-cream transition-colors duration-500",
          isSolid ? "bg-ink/85 backdrop-blur-md" : "bg-transparent",
        )}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5 md:px-10 xl:px-16">
          <Logo className="text-cream" />

          <nav className="hidden items-center gap-9 md:flex">
            {mainNav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                data-cursor="hover"
                className="group relative text-sm font-medium tracking-wide text-cream/80 transition-colors hover:text-cream"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-px w-0 bg-brass transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <Magnetic>
              <Button href="/contact" className="bg-brass text-ink border-brass text-xs hover:bg-cream hover:text-ink hover:border-cream">
                Book Consultation
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
            <span className={cn("h-px w-6 bg-cream transition-transform duration-300", isMenuOpen && "translate-y-[3.5px] rotate-45")} />
            <span className={cn("h-px w-6 bg-cream transition-transform duration-300", isMenuOpen && "-translate-y-[3.5px] -rotate-45")} />
          </button>
        </div>
      </header>

      <MobileMenu links={mainNav} isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
