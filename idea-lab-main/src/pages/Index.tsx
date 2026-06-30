import { useEffect } from "react";
import Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap } from "../lib/gsap";
import Navbar from "../components/Navbar";
import ScrollCanvas from "../components/ScrollCanvas";
import HeroSection from "../components/sections/HeroSection";
import ProblemLoopSection from "../components/sections/ProblemLoopSection";
import FeaturesSection from "../components/sections/FeaturesSection";
import BlogShowcaseSection from "../components/sections/BlogShowcaseSection";
import MetricsSection from "../components/sections/MetricsSection";
import PersonaSection from "../components/sections/PersonaSection";
import TransformSection from "../components/sections/TransformSection";
import PricingSection from "../components/sections/PricingSection";
import FinalCTASection from "../components/sections/FinalCTASection";
import FooterSection from "../components/sections/FooterSection";

function Index() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      ScrollTrigger.update();
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    gsap.ticker.lagSmoothing(0);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      {/* Scroll-linked image sequence background */}
      <ScrollCanvas />

      {/* All content layered above the canvas background */}
      <div className="relative" style={{ position: "relative", zIndex: 1 }}>
        <Navbar />
        <main>
          <HeroSection />
          <ProblemLoopSection />
          <FeaturesSection />
          <BlogShowcaseSection />
          <MetricsSection />
          <PersonaSection />
          <TransformSection />
          <PricingSection />
          <FinalCTASection />
        </main>
        <FooterSection />
      </div>
    </div>
  );
}

export default Index;

