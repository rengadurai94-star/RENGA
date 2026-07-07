import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { StatsBar } from "@/components/sections/StatsBar";
import { Expertise } from "@/components/sections/Expertise";
import { Philosophy } from "@/components/sections/Philosophy";
import { FeaturedProjects } from "@/components/sections/FeaturedProjects";
import { MaterialLibrary } from "@/components/sections/MaterialLibrary";
import { Process } from "@/components/sections/Process";
import { Testimonials } from "@/components/sections/Testimonials";
import { CTA } from "@/components/sections/CTA";

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <StatsBar />
      <Expertise />
      <Philosophy />
      <FeaturedProjects />
      <MaterialLibrary />
      <Process />
      <Testimonials />
      <CTA />
    </>
  );
}
