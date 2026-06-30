import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInView } from "../../hooks/useScrollProgress";
import { gsap, ScrollTrigger } from "../../lib/gsap";

function ChaosSide() {
  const items = [
    { text: "❌ No clear value prop", x: "8%", y: "10%" },
    { text: "⚠ Confused users dropping off", x: "46%", y: "7%" },
    { text: "❌ Wrong feature built for months", x: "16%", y: "30%" },
    { text: "⚠ Vague, unusable feedback", x: "50%", y: "26%" },
    { text: "❌ 6 months of runway wasted", x: "8%", y: "52%" },
    { text: "⚠ No market signal at all", x: "44%", y: "48%" },
    { text: "❌ Team building in different directions", x: "10%", y: "70%" },
    { text: "⚠ Investor pitch rejected again", x: "42%", y: "68%" },
    { text: "❌ Launched to silence", x: "20%", y: "86%" },
  ];

  return (
    <div
      className="relative h-full min-h-[360px]"
      style={{ background: "linear-gradient(135deg, #fff5f5, #fff0f0)" }}
    >
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `linear-gradient(rgba(239,68,68,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.6) 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.08 }}
          className="absolute text-xs border border-red-200 px-2 py-1 text-red-500 bg-red-50"
          style={{ left: item.x, top: item.y, fontSize: "10px" }}
        >
          {item.text}
        </motion.div>
      ))}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
        <line x1="0%" y1="40%" x2="100%" y2="20%" stroke="#ef4444" strokeWidth="0.8" />
        <line x1="20%" y1="0%" x2="80%" y2="90%" stroke="#ef4444" strokeWidth="0.5" />
        <line x1="60%" y1="10%" x2="10%" y2="80%" stroke="#ef4444" strokeWidth="0.6" />
        <line x1="0%" y1="65%" x2="90%" y2="45%" stroke="#ef4444" strokeWidth="0.5" />
      </svg>
    </div>
  );
}

function ClaritySide() {
  const items = [
    { label: "Clarity Index", val: 87, color: "#09daed" },
    { label: "Market Fit", val: 92, color: "#10b981" },
    { label: "Gap Closed", val: 78, color: "#7c3aed" },
    { label: "Validation Momentum", val: 94, color: "#f59e0b" },
    { label: "Gap Remaining", val: 22, color: "#ef4444" },
    { label: "Persona Coverage", val: 87, color: "#8b5cf6" },
  ];
  return (
    <div
      className="relative h-full min-h-[360px]"
      style={{ background: "linear-gradient(135deg, #f0fdfe, #e8fafa)" }}
    >
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `linear-gradient(#09daed 1px, transparent 1px), linear-gradient(90deg, #09daed 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute inset-4 border border-[#09daed]/15 flex flex-col justify-between p-4">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <img src="/neesh-logo.png" alt="Neesh AI" className="w-5 h-5 object-contain" />
            <span className="text-[#09daed] text-xs font-semibold tracking-widest">VALIDATION LOOP ACTIVE</span>
          </div>
          <div className="space-y-2.5">
            {items.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-700 text-xs font-medium">{item.label}</span>
                  <span className="text-gray-950 text-xs font-bold">{item.val}%</span>
                </div>
                <div className="h-1.5 bg-gray-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.val}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full"
                    style={{ background: item.color, boxShadow: `0 0 8px ${item.color}40` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransformSection() {
  const { ref, inView } = useInView(0.2);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [sweepX, setSweepX] = useState(50);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    ScrollTrigger.create({
      trigger: section,
      start: "top 70%",
      end: "bottom 30%",
      scrub: 1,
      onUpdate: (self) => {
        setSweepX(Math.min(50 + self.progress * 50, 100));
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.vars.trigger === section) t.kill();
      });
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-white/50 py-24">
      <div className="max-w-[1440px] mx-auto px-6">
        <div ref={ref as React.RefObject<HTMLDivElement>} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            className="text-[#09daed] text-sm font-bold tracking-widest uppercase mb-4"
          >
            Transformation
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold text-gray-950"
          >
            From idea →{" "}
            <span className="text-[#09daed]">validated product.</span>
          </motion.h2>
        </div>

        <div className="relative">
          <div className="grid grid-cols-2 gap-0 overflow-hidden border border-gray-100">
            <div>
              <div className="text-xs font-bold text-red-500 tracking-widest uppercase mb-3 flex items-center gap-2 px-2 pt-2">
                <div className="w-3 h-0.5 bg-red-400" />
                Before: Chaos
              </div>
              <ChaosSide />
            </div>
            <div>
              <div className="text-xs font-bold text-[#09daed] tracking-widest uppercase mb-3 flex items-center gap-2 px-2 pt-2">
                <div className="w-3 h-0.5 bg-[#09daed]" />
                After: Clarity
              </div>
              <ClaritySide />
            </div>
          </div>

          {/* Sweep line */}
          <div
            className="absolute top-7 bottom-0 w-0.5 pointer-events-none z-10 transition-all duration-200"
            style={{
              left: `${sweepX}%`,
              background: "linear-gradient(to bottom, #09daed, #09daed88, transparent)",
              boxShadow: "0 0 12px rgba(9,218,237,0.4)",
            }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-[#09daed] bg-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-[#09daed]" />
            </div>
          </div>
        </div>

        {/* Status blocks — BELOW the before/after grid, with margin-top for spacing */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="border border-red-200 bg-red-50/50 p-4">
            <div className="text-red-600 text-xs font-bold mb-1">Status: LOST</div>
            <div className="text-red-500 text-xs font-medium">No signal. No direction. Building blindly.</div>
          </div>
          <div className="border border-[#09daed]/20 bg-[#09daed]/5 p-4">
            <div className="text-[#09daed] text-xs font-bold mb-1">✓ Idea Validated</div>
            <div className="text-gray-600 text-xs font-medium">Clear signal. Ready to build with confidence.</div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#09daed]/20 to-transparent" />
    </section>
  );
}
