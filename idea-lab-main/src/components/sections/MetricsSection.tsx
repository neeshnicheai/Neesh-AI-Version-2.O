import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInView } from "../../hooks/useScrollProgress";

const METRICS = [
  { label: "Clarity Index", value: 87, color: "#09daed", desc: "How well users understand your idea" },
  { label: "Market Signal", value: 72, color: "#7c3aed", desc: "Alignment with real market demand" },
  { label: "Gap Velocity", value: 61, color: "#f59e0b", desc: "Speed of detecting missing content" },
  { label: "Validation Momentum", value: 94, color: "#10b981", desc: "Forward movement in validation loop" },
];

function CircleProgress({ value, color, size = 100 }: { value: number; color: string; size?: number }) {
  const { ref, inView } = useInView<SVGSVGElement>(0.3);
  const [animated, setAnimated] = useState(false);
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;

  useEffect(() => {
    if (inView) setAnimated(true);
  }, [inView]);

  return (
    <svg ref={ref} width={size} height={size} className="progress-ring">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(9,218,237,0.08)" strokeWidth="8" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="square"
        strokeDasharray={circ}
        strokeDashoffset={animated ? circ * (1 - value / 100) : circ}
        style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)", filter: `drop-shadow(0 0 6px ${color}60)` }}
      />
    </svg>
  );
}

function ParticleField() {
  const particles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 1,
    delay: Math.random() * 2,
    duration: Math.random() * 2 + 1.5,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute bg-[#09daed]"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, opacity: 0.25 }}
          animate={{ y: [0, -40, 0], opacity: [0.25, 0.5, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

export default function MetricsSection() {
  const { ref, inView } = useInView(0.2);

  return (
    <section className="relative bg-white/50 py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(9,218,237,0.04)_0%,transparent_70%)]" />
      <ParticleField />

      <div className="max-w-[1440px] mx-auto px-6 relative z-10">
        <div ref={ref as React.RefObject<HTMLDivElement>} className="text-center mb-16 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#09daed]/25 bg-[#09daed]/5 mb-6"
          >
            <div className="w-1.5 h-1.5 bg-[#09daed] animate-pulse" />
            <span className="text-[#09daed] text-xs font-bold tracking-widest uppercase">AI Core • Live</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold text-gray-950 mb-4"
          >
            Not guesses.{" "}
            <span className="text-[#09daed]">Measured validation.</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {METRICS.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="bg-white p-6 flex flex-col items-center text-center border border-gray-200"
              style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}
            >
              <div className="relative mb-4">
                <CircleProgress value={metric.value} color={metric.color} size={96} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-extrabold text-gray-950">{metric.value}</span>
                </div>
              </div>
              <div className="text-sm font-bold text-gray-950 mb-1">{metric.label}</div>
              <div className="text-xs text-gray-500 text-center leading-relaxed">{metric.desc}</div>

              <div className="mt-3 w-full h-8 flex items-end gap-0.5">
                {Array.from({ length: 12 }, (_, j) => (
                  <motion.div
                    key={j}
                    className="flex-1"
                    style={{ background: metric.color, opacity: 0.15 + (j / 12) * 0.55 }}
                    initial={{ height: 0 }}
                    animate={inView ? { height: `${20 + Math.random() * 60}%` } : { height: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.15 + j * 0.04 }}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#09daed]/20 to-transparent" />
    </section>
  );
}
