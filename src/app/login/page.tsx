import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <main className="arch-grid flex min-h-[calc(100svh-4rem)] items-center justify-center px-5 py-16">
      <div className="w-full max-w-md rounded-2xl border border-charcoal/10 bg-paper p-8 shadow-[0_30px_80px_-40px_rgba(29,29,27,0.35)] md:p-10">
        <Logo />
        <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight">Your BOXES workspace</h1>
        <p className="mt-3 text-sm leading-relaxed text-charcoal/65">
          Customer accounts — saved designs, quotations, sample orders and purchase orders — launch with secure
          Supabase sign-in in an upcoming release. Sign-in is not available yet.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-charcoal/65">
          Until then, configurations you save in the 3D Catalog are kept on this device.
        </p>
        <Link href="/3d-catalog" className={`${buttonVariants({ size: "lg" })} mt-8 w-full`}>
          Continue to 3D Catalog
        </Link>
      </div>
    </main>
  );
}
