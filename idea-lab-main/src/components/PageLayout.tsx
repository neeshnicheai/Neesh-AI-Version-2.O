import { useEffect } from "react";
import Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap } from "../lib/gsap";
import Navbar from "./Navbar";
import ScrollCanvas from "./ScrollCanvas";
import FooterSection from "./sections/FooterSection";

interface PageLayoutProps {
  children: React.ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);

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
        <main>{children}</main>
        <FooterSection />
      </div>
    </div>
  );
}
