/**
 * Client-only entry for the static preview build (`npm run build:preview`).
 * Renders the same homepage as src/app/(boxes)/page.tsx without a Next.js server.
 */
import { createRoot } from "react-dom/client";
import BoxesExperience from "@/components/boxes/BoxesExperience";
import { Amenities, Gallery, Location, Overview, Residences, Specifications } from "@/components/boxes/sections/Sections";
import Enquiry from "@/components/boxes/sections/Enquiry";
import SiteFooter from "@/components/boxes/sections/SiteFooter";

function App() {
  return (
    <>
      <BoxesExperience />
      <main className="relative z-10 shadow-[0_-40px_80px_-30px_rgba(43,42,40,0.25)]">
        <Overview />
        <Location />
        <Amenities />
        <Residences />
        <Specifications />
        <Gallery />
        <Enquiry />
        <SiteFooter />
      </main>
    </>
  );
}

const el = document.getElementById("boxes-root");
if (el) createRoot(el).render(<App />);
