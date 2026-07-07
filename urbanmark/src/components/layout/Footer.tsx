import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { mainNav, socialLinks } from "@/data/navigation";
import { SITE } from "@/lib/constants";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-ink text-cream">
      <Container className="grid gap-16 py-20 md:grid-cols-[1.2fr_1fr_1fr]">
        <div className="flex flex-col gap-6">
          <Logo className="text-cream" />
          <p className="max-w-sm text-sm leading-relaxed text-cream/60">{SITE.tagline}</p>
          <div className="flex gap-5 pt-2 text-sm text-cream/70">
            {socialLinks.map((social) => (
              <a key={social.href} href={social.href} target="_blank" rel="noreferrer" className="hover:text-brass">
                {social.label}
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <span className="text-xs font-medium tracking-[0.25em] text-cream/40 uppercase">Sitemap</span>
          {mainNav.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-cream/70 hover:text-brass">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <span className="text-xs font-medium tracking-[0.25em] text-cream/40 uppercase">Studio</span>
          <address className="not-italic text-sm leading-relaxed text-cream/70">
            {SITE.address}
            <br />
            {SITE.email}
            <br />
            {SITE.phone}
          </address>
          <Button href="/contact" variant="secondary" className="mt-2 w-fit border-cream/30 text-cream hover:bg-cream hover:text-ink">
            Get in touch
          </Button>
        </div>
      </Container>

      <div className="border-t border-cream/10 py-6">
        <Container className="flex flex-col gap-2 text-xs text-cream/40 md:flex-row md:items-center md:justify-between">
          <span>&copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.</span>
          <span>Interior architecture &amp; design, by appointment.</span>
        </Container>
      </div>
    </footer>
  );
}
