import { motion } from "framer-motion";
import { useInView } from "../../hooks/useScrollProgress";
import { Link } from "react-router-dom";

export default function FinalCTASection() {
  const { ref, inView } = useInView(0.3);

  return (
    <section className="relative bg-white/50 py-32 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#09daed]/6 blur-[150px] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(#09daed 1px, transparent 1px), linear-gradient(90deg, #09daed 1px, transparent 1px)`,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <div ref={ref as React.RefObject<HTMLDivElement>} className="relative z-10 max-w-[1440px] mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8 }}
          className="border border-[#09daed]/20 p-12 bg-white animate-pulse-glow"
          style={{ boxShadow: "0 20px 60px rgba(9,218,237,0.08), 0 4px 20px rgba(0,0,0,0.04)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex justify-center mb-6"
          >
            <img src="/neesh-logo.png" alt="Neesh AI" className="w-14 h-14 object-contain" style={{ filter: "drop-shadow(0 4px 12px rgba(9,218,237,0.3))" }} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center justify-center gap-1 mb-8"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <motion.div
                key={i}
                initial={{ width: 40 }}
                animate={inView ? { width: i === 4 ? 80 : 20 } : { width: 40 }}
                transition={{ duration: 0.8, delay: 0.3 + i * 0.05 }}
                className="h-1"
                style={{
                  background: i === 4 ? "#09daed" : "rgba(9,218,237,0.12)",
                }}
              />
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-gray-500 text-sm tracking-widest uppercase mb-4 font-semibold"
          >
            The final step
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-950 leading-[1.1] mb-6"
          >
            You don't need more ideas.{" "}
            <span className="text-[#09daed]">You need clarity.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-gray-600 text-lg mb-10 max-w-2xl mx-auto font-medium"
          >
            Join thousands of founders closing the gap between assumption and reality — one validation loop at a time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link to="/signup" className="bg-[#09daed] text-black font-semibold px-8 py-4 text-sm hover:bg-[#07c4d4] transition-all duration-200 animate-pulse-glow inline-block text-center">
              Start Your First Validation Loop
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-gray-500 text-xs mt-6 font-medium"
          >
            No credit card required · Free forever plan · Cancel anytime
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
