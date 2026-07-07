"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import type { NavLink } from "@/types";

export function MobileMenu({
  links,
  isOpen,
  onClose,
}: {
  links: NavLink[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useIsomorphicLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const items = panel.querySelectorAll("[data-menu-item]");

    if (isOpen) {
      gsap.set(panel, { display: "flex" });
      gsap.fromTo(panel, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.6, ease: "power4.inOut" });
      gsap.fromTo(items, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, delay: 0.2, ease: "power3.out" });
    } else {
      gsap.to(panel, {
        clipPath: "inset(0 0 100% 0)",
        duration: 0.5,
        ease: "power4.inOut",
        onComplete: () => gsap.set(panel, { display: "none" }),
      });
    }
  }, [isOpen]);

  return (
    <div
      ref={panelRef}
      className="fixed inset-0 z-40 hidden flex-col justify-center bg-ink px-8 text-cream md:hidden"
      style={{ clipPath: "inset(0 0 100% 0)" }}
    >
      <nav className="flex flex-col gap-6">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            data-menu-item
            onClick={onClose}
            aria-current={pathname === link.href ? "page" : undefined}
            className="font-display text-4xl font-medium"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
