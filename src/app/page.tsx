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

export default function Home() {
  return (
    <main className="relative">
      <CinematicJourney />
      <WhoWeAre />
      <Expertise />
      <Philosophy />
      <Projects />
      <Materials />
      <Process />
      <Testimonials />
      <Consultation />
      <Footer />
    </main>
  );
}
