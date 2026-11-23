import type { Metadata } from "next";
import Link from "next/link";
import "./(boxes)/globals.css";

export const metadata: Metadata = {
  title: "Not found — BOXES",
  description: "The page you are looking for does not exist.",
};

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-paper px-6 text-center">
        <div>
          <p className="text-lg font-light tracking-[0.42em] text-charcoal">BOXES</p>
          <h1 className="mt-6 text-4xl font-light text-charcoal">This floor doesn&apos;t exist.</h1>
          <Link href="/" className="btn-primary mt-8">
            Back to the tower
          </Link>
        </div>
      </body>
    </html>
  );
}
