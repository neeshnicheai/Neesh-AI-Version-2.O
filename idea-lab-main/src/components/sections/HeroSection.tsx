import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.6], [0, -80]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[90vh] bg-white/50 flex items-center overflow-hidden"
    >
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(#09daed 1px, transparent 1px), linear-gradient(90deg, #09daed 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial glow */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-[#09daed]/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-[#09daed]/4 blur-[100px] pointer-events-none" />

      <motion.div
        style={{ opacity, y, zIndex: 10, position: "relative" }}
        className="max-w-[1440px] mx-auto px-6 pt-32 pb-16 w-full text-center"
      >
        <div className="flex flex-col items-center">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#09daed]/30 bg-[#09daed]/5 mb-8"
            >
              <div className="w-1.5 h-1.5 bg-[#09daed] animate-pulse" />
              <span className="text-[#09daed] text-xs font-semibold tracking-widest uppercase">AI-Powered Validation</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-gray-950 leading-[1.1] tracking-tight mb-6"
            >
              With Great <span className="text-[#09daed]">Ideas</span> Comes Great <span className="text-[#09daed]">Responsibility</span>
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-6"
            >
              Stop Building in the Dark. Start Validating in Real Time.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-gray-600 text-lg md:text-xl leading-relaxed mb-10 max-w-3xl mx-auto font-medium"
            >
              Upload your raw ideas, generate a live blog + chatbot, and close the gap between what you think users want and what they actually need.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-wrap gap-4 justify-center"
            >
              <Link to="/signup" className="bg-[#09daed] text-black font-bold px-8 py-4 text-sm hover:bg-[#07c4d4] transition-all duration-200 animate-pulse-glow inline-block text-center rounded-sm">
                Start Validating for Free
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="flex items-center justify-center gap-10 mt-12 pt-8 border-t border-gray-200"
            >
              {[["89%", "Clarity Gain"], ["3x", "Faster Iteration"]].map(([val, label]) => (
                <div key={label}>
                  <div className="text-3xl font-extrabold text-[#09daed]">{val}</div>
                  <div className="text-xs text-gray-500 font-medium tracking-wider uppercase">{label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#09daed]/20 to-transparent" />
    </section>
  );
}
