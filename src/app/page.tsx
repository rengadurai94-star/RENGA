import { Footer } from "@/components/layout/Footer";
import { FinalCta, HowItWorks, SampleTeaser } from "@/components/landing/Sections";
import { Walkthrough } from "@/components/landing/Walkthrough";

export default function Home() {
  return (
    <main>
      {/* 01–06: hero + scroll-driven 3D walkthrough */}
      <Walkthrough />
      {/* 07 */}
      <HowItWorks />
      {/* 08 */}
      <SampleTeaser />
      {/* 09 */}
      <FinalCta />
      <Footer />
    </main>
  );
}
