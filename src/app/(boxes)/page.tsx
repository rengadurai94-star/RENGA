import BoxesExperience from "@/components/boxes/BoxesExperience";
import { Amenities, Gallery, Location, Overview, Residences, Specifications } from "@/components/boxes/sections/Sections";
import Enquiry from "@/components/boxes/sections/Enquiry";
import SiteFooter from "@/components/boxes/sections/SiteFooter";

export default function Home() {
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
