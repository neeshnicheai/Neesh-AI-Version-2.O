import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInView } from "../../hooks/useScrollProgress";
import { gsap, ScrollTrigger } from "../../lib/gsap";

const avatars = [
  {
    name: "Alex",
    color: "#09daed",
    x: "12%",
    y: "25%",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
        <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
      </svg>
    ),
  },
  {
    name: "Sam",
    color: "#7c3aed",
    x: "58%",
    y: "18%",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
        <path d="M4 20h4V12H4v8zm6 0h4V4h-4v16zm6 0h4v-6h-4v6z" />
      </svg>
    ),
  },
  {
    name: "Jordan",
    color: "#f59e0b",
    x: "78%",
    y: "48%",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="16" height="16">
        <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" fill="white" />
      </svg>
    ),
  },
  {
    name: "Taylor",
    color: "#10b981",
    x: "22%",
    y: "62%",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
      </svg>
    ),
  },
  {
    name: "Casey",
    color: "#ef4444",
    x: "52%",
    y: "66%",
    icon: (
      <svg viewBox="0 0 24 24" fill="white" width="16" height="16">
        <path d="M7 2v11h3v9l7-12h-4l4-8z" />
      </svg>
    ),
  },
  {
    name: "Morgan",
    color: "#8b5cf6",
    x: "38%",
    y: "38%",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="16" height="16">
        <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
];

// Question bubbles with proper grid-aligned layout
const bubbleRows = [
  [
    { text: "How does this actually work?", confused: false },
    { text: "What's the pricing model?", confused: true },
    { text: "This is exactly what I needed!", confused: false },
  ],
  [
    { text: "Can I integrate with Slack?", confused: true },
    { text: "Love the validation loop!", confused: false },
    { text: "Is there a free trial?", confused: true },
  ],
  [
    { text: "Does it support my niche?", confused: false },
    { text: "How long does setup take?", confused: true },
    { text: "How does the AI chatbot learn?", confused: false },
  ],
  [
    { text: "What kind of data does it collect?", confused: true },
    { text: "Can I publish multiple blogs?", confused: true },
    { text: "Will it work for B2B SaaS ideas?", confused: false },
  ],
];

// Icons for each question bubble type
const questionIcons: Record<string, React.ReactNode> = {
  "How does this actually work?": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#09daed" strokeWidth="2" width="14" height="14">
      <circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
  "What's the pricing model?": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" width="14" height="14">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  "Can I integrate with Slack?": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" width="14" height="14">
      <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z" />
      <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
    </svg>
  ),
  "Love the validation loop!": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#09daed" strokeWidth="2" width="14" height="14">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  "Is there a free trial?": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" width="14" height="14">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  "How long does setup take?": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" width="14" height="14">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  "Does it support my niche?": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#09daed" strokeWidth="2" width="14" height="14">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  ),
  "What kind of data does it collect?": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" width="14" height="14">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </svg>
  ),
  "This is exactly what I needed!": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#09daed" strokeWidth="2" width="14" height="14">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  "How does the AI chatbot learn?": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#09daed" strokeWidth="2" width="14" height="14">
      <circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
  "Can I publish multiple blogs?": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" width="14" height="14">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  "Will it work for B2B SaaS ideas?": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#09daed" strokeWidth="2" width="14" height="14">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  "What's the gap detection engine?": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" width="14" height="14">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  ),
};

export default function ProductSimSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { ref: titleRef, inView } = useInView(0.2);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    ScrollTrigger.create({
      trigger: section,
      start: "top 70%",
      end: "bottom 30%",
      scrub: 1,
      onUpdate: (self) => {
        setPhase(Math.floor(self.progress * 3));
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.vars.trigger === section) t.kill();
      });
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-white/50 py-24 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-6">
        <div ref={titleRef as React.RefObject<HTMLDivElement>} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-[#09daed] text-sm font-bold tracking-widest uppercase mb-4"
          >
            Product Simulation
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold text-gray-950"
          >
            Every question reveals what your idea is missing.
          </motion.h2>
        </div>

        <div
          className="relative border border-gray-200 overflow-hidden"
          style={{ background: "linear-gradient(135deg, #f8fafd, #f0fdfe)" }}
        >
          {/* Grid background */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(9,218,237,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(9,218,237,0.8) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />

          {/* Structured question grid */}
          <div className="relative p-6 space-y-4">
            {bubbleRows.map((row, rowIdx) => (
              <motion.div
                key={rowIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: rowIdx * 0.15 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-3"
              >
                {row.map((bubble, colIdx) => (
                  <div
                    key={colIdx}
                    className={`flex items-center gap-3 px-4 py-3 border ${
                      bubble.confused
                        ? "bg-red-50/80 border-red-200 text-red-700"
                        : "bg-[#09daed]/5 border-[#09daed]/20 text-gray-800"
                    }`}
                    style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                  >
                    {/* Logo — bigger, no white background */}
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                      <img
                        src="/neesh-logo.png"
                        alt="N"
                        className="w-7 h-7 object-contain"
                        style={{ filter: "drop-shadow(0 0 2px rgba(9,218,237,0.3))" }}
                      />
                    </div>
                    <span className="flex-1 text-xs font-semibold">{bubble.text}</span>
                    <div className="flex-shrink-0">
                      {questionIcons[bubble.text] || (
                        <svg viewBox="0 0 24 24" fill="none" stroke={bubble.confused ? "#ef4444" : "#09daed"} strokeWidth="2" width="14" height="14">
                          <circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            ))}
          </div>

          {/* Scanning line */}
          <motion.div
            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#09daed]/40 to-transparent pointer-events-none"
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Gap Detection Overlay — below the simulation box */}
        {phase >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-6 w-full"
          >
            <div
              className="border border-[#09daed]/30 bg-white/90 p-4 backdrop-blur-sm"
              style={{ boxShadow: "0 8px 32px rgba(9,218,237,0.1)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-[#09daed] animate-pulse" />
                <span className="text-[#09daed] text-xs font-bold tracking-widest uppercase">Gap Detection Active</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Pricing Clarity", val: 34, color: "#ef4444" },
                  { label: "Integration Docs", val: 52, color: "#f59e0b" },
                  { label: "Use Cases", val: 78, color: "#09daed" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600 text-[10px] font-medium">{item.label}</span>
                      <span className="text-gray-800 text-[10px] font-bold">{item.val}%</span>
                    </div>
                    <div className="h-1 bg-gray-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.val}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-full"
                        style={{ background: item.color, boxShadow: `0 0 6px ${item.color}40` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#09daed]/20 to-transparent" />
    </section>
  );
}
