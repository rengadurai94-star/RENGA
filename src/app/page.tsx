import CinematicJourney from "@/components/sections/CinematicJourney";
import WhoWeAre from "@/components/sections/WhoWeAre";
import Expertise from "@/components/sections/Expertise";
import Philosophy from "@/components/sections/Philosophy";
import Projects from "@/components/sections/Projects";
import Materials from "@/components/sections/Materials";
import Process from "@/components/sections/Process";
import Testimonials from "@/components/sections/Testimonials";
import Consultation from "@/components/sections/Consultation";
import Footer from "@/components/Footer";
import { spImage, spProject } from "@/data/sp-residency";

export default function Home() {
  const spCover = spImage("sp-exterior-day-3q");
  const featured = [
    {
      title: spProject.name,
      category: "Residential · Madurai",
      href: "/projects/sp-residency",
      image: { src: spCover.src, width: spCover.width, height: spCover.height, alt: spCover.alt },
    },
  ];

  return (
    <main className="relative">
      <CinematicJourney />
      <WhoWeAre />
      <Expertise />
      <Philosophy />
      <Projects featured={featured} />
      <Materials />
      <Process />
      <Testimonials />
      <Consultation />
      <Footer />
    </main>
  );
}
