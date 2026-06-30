import { motion } from "framer-motion";
import { useInView } from "../../hooks/useScrollProgress";

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="#09daed" width="22" height="22">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
      </svg>
    ),
    title: "Publishable Blogs",
    desc: "Auto-generate SEO-ready blog posts from your idea. Publish and share with real audiences to collect live feedback.",
    tag: "PUBLISH",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="#7c3aed" width="22" height="22">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
      </svg>
    ),
    title: "Cross Promotional Engine",
    desc: "Promote your blog inside Neesh AI's discovery network. Reach validated audiences who are already exploring similar ideas.",
    tag: "PROMOTE",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="#f59e0b" width="22" height="22">
        <path d="M20 6h-2.18c.07-.44.18-.88.18-1.33C18 2.1 15.9 0 13.33 0c-1.36 0-2.56.57-3.43 1.48L9 2.99l-.9-1.52C7.23.57 6.03 0 4.67 0 2.1 0 0 2.1 0 4.67c0 .46.11.89.18 1.33H0v2h20V6z" />
      </svg>
    ),
    title: "AI-Generated Knowledge Base",
    desc: "Turn messy notes and docs into structured, searchable knowledge your chatbot uses to answer user questions perfectly.",
    tag: "KNOWLEDGE",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="#09daed" width="22" height="22">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
      </svg>
    ),
    title: "Context-Aware Chatbot",
    desc: "Deploy a chatbot trained on your idea. It represents your product, answers questions, and captures every moment of confusion.",
    tag: "ENGAGE",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" width="22" height="22">
        <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" fill="#ef4444" />
      </svg>
    ),
    title: "Gap Detection Engine",
    desc: "Know exactly where users are confused. AI maps every unanswered question to specific content gaps in your idea.",
    tag: "DETECT",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="#10b981" width="22" height="22">
        <path d="M4 20h4V12H4v8zm6 0h4V4h-4v16zm6 0h4v-6h-4v6z" />
      </svg>
    ),
    title: "Validation Command Center",
    desc: "One dashboard to track clarity index, market signal, audience engagement, and gap velocity across all your projects.",
    tag: "COMMAND",
  },
];

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const { ref, inView } = useInView(0.1);
  const isAudienceInsights = feature.tag === "INSIGHTS";

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group relative bg-white p-6 border border-gray-200 hover:border-[#09daed]/30 transition-all duration-300 flex flex-col"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
    >
      <div className="absolute top-2 left-2 text-[10px] text-gray-400 font-mono font-bold">
        {String(index + 1).padStart(2, "0")}
      </div>
      <div className="absolute top-0 left-0 bottom-0 w-[2px] bg-transparent group-hover:bg-[#09daed] transition-colors duration-300" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-gray-100 group-hover:border-[#09daed]/30 transition-all duration-300" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-gray-100 group-hover:border-[#09daed]/30 transition-all duration-300" />

      <div className="flex items-start justify-between mb-4">
        <div>{feature.icon}</div>
        <div className="text-[9px] font-bold tracking-widest text-[#09daed]/70 border border-[#09daed]/20 px-2 py-0.5 bg-[#09daed]/5">
          {feature.tag}
        </div>
      </div>

      <h3 className="text-gray-950 font-bold text-base mb-2 leading-tight">{feature.title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed flex-1">{feature.desc}</p>

    </motion.div>
  );
}

export default function FeaturesSection() {
  const { ref, inView } = useInView(0.1);

  return (
    <section id="features" className="bg-white/50 py-24 relative">
      <div className="max-w-[1440px] mx-auto px-6">
        <div ref={ref as React.RefObject<HTMLDivElement>} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            className="text-[#09daed] text-sm font-bold tracking-widest uppercase mb-4"
          >
            Core Features
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold text-gray-950 mb-4"
          >
            Everything you need to validate faster
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-gray-600 max-w-lg mx-auto font-medium"
          >
            Six AI-powered modules working together to turn your raw ideas into validated products.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#09daed]/20 to-transparent" />
    </section>
  );
}
