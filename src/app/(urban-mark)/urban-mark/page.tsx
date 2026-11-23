import CinematicJourney from "@/components/urban-mark/sections/CinematicJourney";
import WhoWeAre from "@/components/urban-mark/sections/WhoWeAre";
import Expertise from "@/components/urban-mark/sections/Expertise";
import Philosophy from "@/components/urban-mark/sections/Philosophy";
import Projects from "@/components/urban-mark/sections/Projects";
import Materials from "@/components/urban-mark/sections/Materials";
import Process from "@/components/urban-mark/sections/Process";
import Testimonials from "@/components/urban-mark/sections/Testimonials";
import Consultation from "@/components/urban-mark/sections/Consultation";
import Footer from "@/components/urban-mark/Footer";

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
