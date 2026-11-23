import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Swatch } from "@/components/catalog/Swatch";
import { buttonVariants } from "@/components/ui/button";
import { BOARDS, COLOURS, FINISHES, HANDLES } from "@/lib/catalog/materials";

export const metadata: Metadata = { title: "Sample Orders" };

export default function SampleOrdersPage() {
  return (
    <main>
      <section className="mx-auto max-w-[1600px] px-5 pb-20 pt-14 md:px-10 md:pt-20">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-olive">Sample Orders</p>
        <h1 className="max-w-3xl font-display text-[2.4rem] font-bold leading-[1] tracking-[-0.04em] md:text-[4rem]">
          Touch it before you choose it.
        </h1>
        <p className="mt-5 max-w-xl text-charcoal/65">
          Browse the full sample library below. Online checkout for sample kits — cart, delivery details and payment —
          is being built next and is not live yet.
        </p>
        <div role="status" className="mt-6 inline-flex rounded-full border border-olive/30 bg-olive-3/30 px-4 py-2 text-xs font-medium text-olive">
          Library preview · ordering opens soon
        </div>

        <h2 className="mt-16 font-display text-xl font-semibold tracking-tight">Colours &amp; decors</h2>
        <div className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-7">
          {COLOURS.map((c) => (
            <figure key={c.id}>
              <Swatch colour={c} className="aspect-square w-full rounded-lg border border-charcoal/5" />
              <figcaption className="mt-2 text-[12px] font-medium leading-tight">
                {c.name}
                <span className="block text-[11px] font-normal text-grey">{c.code}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-16 grid gap-10 md:grid-cols-3">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">Boards</h2>
            <ul className="mt-4 divide-y divide-charcoal/10 text-sm">
              {BOARDS.map((b) => (
                <li key={b.id} className="py-3">
                  <span className="font-medium">{b.name}</span>
                  <span className="block text-xs text-grey">{b.grade}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">Finishes</h2>
            <ul className="mt-4 divide-y divide-charcoal/10 text-sm">
              {FINISHES.map((f) => (
                <li key={f.id} className="py-3">
                  <span className="font-medium">{f.name}</span>
                  <span className="block text-xs text-grey">{f.description}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">Hardware</h2>
            <ul className="mt-4 divide-y divide-charcoal/10 text-sm">
              {HANDLES.map((h) => (
                <li key={h.id} className="py-3 font-medium">{h.name}</li>
              ))}
            </ul>
          </div>
        </div>

        <Link href="/3d-catalog" className={`${buttonVariants({ size: "lg" })} mt-16`}>
          See these finishes in 3D <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
      <Footer />
    </main>
  );
}
