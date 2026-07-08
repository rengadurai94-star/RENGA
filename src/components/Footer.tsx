import MagneticButton from "./MagneticButton";

const YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="relative bg-black px-6 pb-10 pt-24 md:px-16 md:pt-32">
      <MagneticButton href="#consultation" className="block">
        <h2 className="font-display max-w-5xl text-5xl italic leading-[1.05] text-warm transition-colors hover:text-gold-bright md:text-8xl">
          Let&rsquo;s Build Something Extraordinary.
        </h2>
      </MagneticButton>

      <div className="mt-20 flex flex-col gap-10 border-t border-warm/10 pt-10 text-sm text-warm/60 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-lg italic text-warm">
            Urban Mark <span className="text-gold-bright">Interior</span>
          </p>
          <p className="mt-2 max-w-xs text-xs text-warm/40">
            Luxury residential, villas, apartments, commercial, retail &amp; hospitality
            interiors.
          </p>
        </div>

        <div className="flex gap-10 text-xs uppercase tracking-editorial">
          <a href="#expertise" className="hover:text-gold-bright">Expertise</a>
          <a href="#projects" className="hover:text-gold-bright">Projects</a>
          <a href="#materials" className="hover:text-gold-bright">Materials</a>
          <a href="#consultation" className="hover:text-gold-bright">Contact</a>
        </div>

        <p className="text-xs text-warm/30">&copy; {YEAR} Urban Mark Interior. All rights reserved.</p>
      </div>
    </footer>
  );
}
