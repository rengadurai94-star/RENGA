import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-charcoal text-ivory/70">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-10">
        <div>
          <Logo inverted />
          <p className="mt-5 max-w-sm text-sm leading-relaxed">
            Design Your Space. Down to Every Detail. Modular furniture engineered to the millimetre and visualised in 3D
            before it is made.
          </p>
        </div>
        <div className="text-sm">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory/40">Platform</p>
          <ul className="space-y-2.5">
            <li><Link className="hover:text-ivory" href="/3d-catalog">3D Catalog</Link></li>
            <li><Link className="hover:text-ivory" href="/sample-orders">Sample Orders</Link></li>
            <li><Link className="hover:text-ivory" href="/login">Login</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-ivory/40">Studio</p>
          <p className="leading-relaxed">Mon–Sat · 10:00–19:00 IST<br />hello@boxes.design</p>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-5 py-5 text-xs text-ivory/40 md:flex-row md:justify-between md:px-10">
          <span>© {new Date().getFullYear()} BOXES. All rights reserved.</span>
          <span>Prices shown are indicative and include 18% GST.</span>
        </div>
      </div>
    </footer>
  );
}
