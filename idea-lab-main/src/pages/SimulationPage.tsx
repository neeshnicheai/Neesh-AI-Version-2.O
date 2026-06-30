import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { useInView } from "../hooks/useScrollProgress";

/* ─── Corrected Flow Steps ─── */
const FLOW_STEPS = [
  {
    icon: "📤",
    num: "01",
    title: "Upload Your Idea",
    desc: "Paste your raw concept, upload documents, or describe your vision. Neesh AI ingests everything and prepares it for multi-persona analysis.",
    color: "#09daed",
  },
  {
    icon: "🧠",
    num: "02",
    title: "Get Insights from Different Personas",
    desc: "AI-generated personas — founders, developers, marketers, investors — engage with your idea and surface real questions from their unique perspectives.",
    color: "#7c3aed",
  },
  {
    icon: "📊",
    num: "03",
    title: "Segregate Insights by Persona",
    desc: "Every question, concern, and signal is automatically categorized by persona type — so you see exactly who thinks what.",
    color: "#f59e0b",
  },
  {
    icon: "🔍",
    num: "04",
    title: "Analyse What Each Persona Expects",
    desc: "Understand the gaps, expectations, and validation signals from each persona to refine your idea before building.",
    color: "#10b981",
  },
];

/* ─── 15 Persona Simulation Data ─── */
const PERSONAS = [
  {
    role: "Founders",
    emoji: "🚀",
    color: "#09daed",
    howTheyUse: [
      "Validate problem–solution fit before MVP",
      "Track Clarity Index + Market Signal to decide build vs pivot",
      "Use questions to detect positioning gaps",
    ],
    questions: [
      "Is this solving a Tier-1 pain or just a nice-to-have?",
      "What's the ICP here — are we targeting SMBs or enterprise?",
      "What's the switching cost from current alternatives?",
      "Do users perceive this as a feature or a standalone product?",
      "Where does this sit in the value chain — acquisition, retention, or monetization?",
    ],
  },
  {
    role: "Freelancers",
    emoji: "🎯",
    color: "#7c3aed",
    howTheyUse: [
      "Validate offer-market fit",
      "Test pricing elasticity + packaging",
    ],
    questions: [
      "What's the perceived ROI on this deliverable?",
      "Is this outcome-based or time-based pricing?",
      "What client segment would actually convert on this?",
      "Where does this sit in the client's funnel — top, mid, or bottom?",
      "What objections would typically kill this deal?",
    ],
  },
  {
    role: "Product Managers",
    emoji: "📋",
    color: "#f59e0b",
    howTheyUse: [
      "Validate feature prioritization",
      "Map questions → user pain vs roadmap decisions",
    ],
    questions: [
      "What JTBD (Job-To-Be-Done) is this feature addressing?",
      "Is this solving for frequency or severity of pain?",
      "What's the expected impact on activation or retention metrics?",
      "Does this reduce friction in the core user journey?",
      "How does this compare against current workaround behaviors?",
    ],
  },
  {
    role: "Product Designers",
    emoji: "🎨",
    color: "#10b981",
    howTheyUse: [
      "Validate mental models + UX clarity",
      "Detect interaction-level confusion before prototyping",
    ],
    questions: [
      "What mental model is this flow assuming?",
      "Is this interaction discoverable or does it require onboarding?",
      "Where does cognitive load spike in this flow?",
      "What's the primary action hierarchy here?",
      "Is this aligning with established UX patterns or breaking them?",
    ],
  },
  {
    role: "UX Researchers",
    emoji: "🔬",
    color: "#06b6d4",
    howTheyUse: [
      "Extract qualitative insights at scale",
      "Identify behavioral patterns & confusion clusters",
    ],
    questions: [
      "What are the dominant confusion themes across personas?",
      "Are users exhibiting goal-oriented or exploratory behavior?",
      "Where does expectation mismatch occur?",
      "What latent needs are emerging from these queries?",
      "How does this align with existing user journey maps?",
    ],
  },
  {
    role: "Engineers & Scientists",
    emoji: "⚙️",
    color: "#ef4444",
    howTheyUse: [
      "Validate problem worth solving before technical investment",
      "Avoid premature architecture decisions",
    ],
    questions: [
      "Is the problem constraint-bound or solution-bound?",
      "What scale assumptions are being made here?",
      "What's the expected system complexity vs user value?",
      "Are we optimizing for performance or usability?",
      "Is this a hard technical problem or a distribution problem?",
    ],
  },
  {
    role: "SaaS / MicroSaaS Builders",
    emoji: "☁️",
    color: "#8b5cf6",
    howTheyUse: [
      "Validate pricing model + retention potential",
      "Identify niche demand strength",
    ],
    questions: [
      "Is this a daily-use or occasional-use product?",
      "What's the expected churn profile?",
      "Does this justify a subscription or one-time payment?",
      "What's the minimum feature set to hit willingness-to-pay?",
      "Is this defensible or easily replicable?",
    ],
  },
  {
    role: "Fullstack Developers",
    emoji: "💻",
    color: "#0ea5e9",
    howTheyUse: [
      "Validate before committing to build cycles",
      "Identify core vs non-core features",
    ],
    questions: [
      "What's the MVP scope vs V1 scope?",
      "Which features are critical path vs optional?",
      "Is backend complexity justified for this use case?",
      "What integrations are actually required?",
      "What would break if this scaled to 10k users?",
    ],
  },
  {
    role: "Students & Faculty",
    emoji: "🎓",
    color: "#f59e0b",
    howTheyUse: [
      "Validate real-world applicability of research/projects",
      "Ensure academic work has market relevance",
    ],
    questions: [
      "What existing solutions does this outperform?",
      "Is this solving a real-world or theoretical problem?",
      "What's the measurable impact?",
      "Can this be commercialized?",
      "What's the novelty vs practical utility?",
    ],
  },
  {
    role: "Content Creators",
    emoji: "✍️",
    color: "#ec4899",
    howTheyUse: [
      "Validate content-market fit",
      "Identify engagement triggers",
    ],
    questions: [
      "Is this topic search-driven or curiosity-driven?",
      "What's the hook that makes this clickable?",
      "Does this align with audience intent or just trends?",
      "What format would maximize retention — short-form or long-form?",
      "What's the differentiation angle in a saturated niche?",
    ],
  },
  {
    role: "Product & Brand Marketers",
    emoji: "📢",
    color: "#e11d48",
    howTheyUse: [
      "Validate positioning clarity",
      "Test message-market fit",
    ],
    questions: [
      "What's the core value proposition in one line?",
      "Is the messaging benefit-led or feature-led?",
      "Where does this sit in the competitive positioning map?",
      "What's the primary differentiation lever?",
      "Does this resonate with the target persona's pain?",
    ],
  },
  {
    role: "Developers",
    emoji: "🧑‍💻",
    color: "#09daed",
    howTheyUse: [
      "Understand real user requirements before coding",
    ],
    questions: [
      "What's the primary use case vs edge cases?",
      "What's the expected user flow?",
      "What APIs or services are actually needed?",
      "Is this latency-sensitive?",
      "What's the failure scenario?",
    ],
  },
  {
    role: "Marketers",
    emoji: "📊",
    color: "#7c3aed",
    howTheyUse: [
      "Validate campaign hypothesis before spend",
    ],
    questions: [
      "What's the core message angle — pain, gain, or fear?",
      "What's the target audience segment?",
      "What's the expected CAC vs LTV?",
      "What's the conversion trigger?",
      "What objection needs to be handled in the copy?",
    ],
  },
  {
    role: "Investors",
    emoji: "💰",
    color: "#10b981",
    howTheyUse: [
      "Evaluate market validation signals",
      "Identify real traction vs noise",
    ],
    questions: [
      "What's the TAM/SAM/SOM here?",
      "Are we seeing strong problem validation or just interest?",
      "What's the user acquisition channel?",
      "Is there evidence of willingness to pay?",
      "How defensible is this in 12–24 months?",
    ],
  },
  {
    role: "Entrepreneurs",
    emoji: "🏃",
    color: "#ef4444",
    howTheyUse: [
      "Rapid validation of business model hypotheses",
      "Identify execution priorities",
    ],
    questions: [
      "What's the fastest path to product-market fit?",
      "What's the biggest risk — demand, execution, or distribution?",
      "Is this a scalable model or a service disguised as a product?",
      "Where's the bottleneck — acquisition or retention?",
      "What's the unfair advantage here?",
    ],
  },
];

/* ─── Gap Detection Dashboard ─── */
function GapDetectionDashboard() {
  const { ref, inView } = useInView(0.1);
  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7 }}
      className="bg-white border border-gray-200 overflow-hidden"
      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50/60">
        <div className="w-2 h-2 bg-[#09daed] animate-pulse rounded-full" />
        <span className="text-xs font-bold text-gray-800">Gap Detection Results</span>
        <span className="ml-auto text-[10px] text-gray-400 font-medium">Last updated: just now</span>
      </div>
      <div className="p-5 space-y-6">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Clarity Index", val: "87%", color: "#09daed" },
            { label: "Content Gaps", val: "3", color: "#ef4444" },
            { label: "Engagement", val: "91%", color: "#10b981" },
            { label: "Market Signal", val: "72%", color: "#7c3aed" },
          ].map((m) => (
            <div key={m.label} className="p-3 border border-gray-100 bg-gray-50 text-center">
              <div className="text-lg font-bold" style={{ color: m.color }}>{m.val}</div>
              <div className="text-[9px] text-gray-500 font-medium">{m.label}</div>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div className="text-xs font-bold text-gray-800">Content Gap Breakdown</div>
          {[
            { label: "Pricing Clarity", val: 34, color: "#ef4444", rec: "Add a pricing comparison table" },
            { label: "Integration Docs", val: 52, color: "#f59e0b", rec: "Create API integration guide" },
            { label: "Use Case Examples", val: 78, color: "#09daed", rec: "Looking good — add 1 more case study" },
            { label: "Onboarding Flow", val: 45, color: "#7c3aed", rec: "Simplify the getting started section" },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between mb-1">
                <span className="text-[11px] text-gray-600 font-medium">{item.label}</span>
                <span className="text-[11px] text-gray-800 font-bold">{item.val}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={inView ? { width: `${item.val}%` } : {}}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{ background: item.color, boxShadow: `0 0 6px ${item.color}40` }}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill={item.color} width="10" height="10"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" /></svg>
                <span className="text-[10px] text-gray-500 font-medium italic">{item.rec}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ─── */

export default function SimulationPage() {
  return (
    <PageLayout>
      {/* Section 1: Hero */}
      <section className="relative bg-white/50 pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: `linear-gradient(#09daed 1px, transparent 1px), linear-gradient(90deg, #09daed 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-[#ef4444]/5 blur-[150px] pointer-events-none" />

        <div className="relative z-10 max-w-[1440px] mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-[#09daed] text-sm font-bold tracking-widest uppercase mb-4">
            Product Simulation
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }} className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-950 leading-[1.1] tracking-tight mb-6">
            See Your Idea Through Your <span className="text-[#09daed]">User's Eyes</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto font-medium leading-relaxed">
            Every question reveals what your idea is missing. Simulate how real users interact, discover blind spots, and validate before you build.
          </motion.p>
        </div>
      </section>

      {/* Section 2: How Simulation Works (corrected) */}
      <section className="relative bg-white/50 py-20">
        <div className="max-w-[1440px] mx-auto px-6">
          <SectionHeader
            tag="How It Works"
            title="From Upload to Insight in 4 Steps"
            desc="Our AI simulates real user interactions and surfaces the gaps you'd never find on your own."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FLOW_STEPS.map((step, i) => (
              <FlowStepCard key={step.title} step={step} index={i} />
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#09daed]/20 to-transparent" />
      </section>

      {/* Section 3: Live Simulation — Persona Insights */}
      <section className="relative bg-white/50 py-24 overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-6">
          <SectionHeader
            tag="Live Simulation"
            title="What Each Persona Asks About Your Idea"
            desc="See real questions from 15 different user personas — each with unique expertise, language, and expectations."
          />
          <PersonaSimulationGrid />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#09daed]/20 to-transparent" />
      </section>

      {/* Section 4: Gap Detection Results */}
      <section className="relative bg-white/50 py-20">
        <div className="max-w-[1440px] mx-auto px-6">
          <SectionHeader
            tag="Gap Detection"
            title="AI-Powered Clarity Scores & Recommendations"
            desc="Get actionable insights: clarity index, content gap breakdown, and AI-suggested improvements."
          />
          <div className="max-w-4xl mx-auto">
            <GapDetectionDashboard />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-white/50 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-950 mb-4">Simulate before you build</h2>
          <p className="text-gray-600 mb-8 font-medium">Stop guessing. Let AI find the gaps in your idea before your users do.</p>
          <Link to="/signup" className="bg-[#09daed] text-black font-bold px-8 py-4 text-sm hover:bg-[#07c4d4] transition-all duration-200 animate-pulse-glow inline-block">
            Start Your First Simulation
          </Link>
        </motion.div>
      </section>
    </PageLayout>
  );
}

/* ─── Subcomponents ─── */

function SectionHeader({ tag, title, desc }: { tag: string; title: string; desc: string }) {
  const { ref, inView } = useInView(0.1);
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="text-center mb-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} className="text-[#09daed] text-sm font-bold tracking-widest uppercase mb-4">{tag}</motion.div>
      <motion.h2 initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-extrabold text-gray-950 mb-4">{title}</motion.h2>
      <motion.p initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }} className="text-gray-600 max-w-xl mx-auto font-medium">{desc}</motion.p>
    </div>
  );
}

function FlowStepCard({ step, index }: { step: typeof FLOW_STEPS[0]; index: number }) {
  const { ref, inView } = useInView(0.1);
  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.12 }}
      className="relative group"
    >
      <div className="border border-gray-200 p-6 bg-white transition-all duration-300 group-hover:border-[#09daed]/30 group-hover:shadow-lg h-full" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        <div className="absolute top-3 right-3 text-[10px] text-gray-300 font-mono font-bold">{step.num}</div>
        <div className="absolute top-0 left-0 bottom-0 w-[2px] transition-colors duration-300" style={{ background: step.color + "30" }} />
        <div className="text-3xl mb-4">{step.icon}</div>
        <h3 className="text-base font-bold text-gray-950 mb-2">{step.title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed font-medium">{step.desc}</p>
        {index < 3 && (
          <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
            <svg viewBox="0 0 24 24" fill={step.color} width="20" height="20" style={{ filter: `drop-shadow(0 0 4px ${step.color}40)` }}>
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
            </svg>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Persona Simulation Grid ─── */

function PersonaSimulationGrid() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {PERSONAS.map((persona, i) => (
        <PersonaSimCard
          key={persona.role}
          persona={persona}
          index={i}
          isExpanded={expandedIdx === i}
          onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
        />
      ))}
    </div>
  );
}

function PersonaSimCard({
  persona,
  index,
  isExpanded,
  onToggle,
}: {
  persona: typeof PERSONAS[0];
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { ref, inView } = useInView(0.05);

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: (index % 6) * 0.06 }}
      className="relative group"
    >
      <div
        className="border bg-white transition-all duration-300 overflow-hidden cursor-pointer"
        style={{
          borderColor: isExpanded ? `${persona.color}50` : `${persona.color}18`,
          boxShadow: isExpanded
            ? `0 8px 32px ${persona.color}15, 0 2px 8px rgba(0,0,0,0.04)`
            : "0 2px 12px rgba(0,0,0,0.04)",
        }}
        onClick={onToggle}
      >
        {/* Scanning line */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute left-0 right-0 h-px opacity-20"
            style={{ background: `linear-gradient(90deg, transparent, ${persona.color}, transparent)` }}
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: index * 0.3 }}
          />
        </div>

        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 flex items-center justify-center text-lg"
              style={{ background: `${persona.color}10`, border: `1px solid ${persona.color}25` }}
            >
              {persona.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold tracking-widest uppercase text-gray-400">PERSONA</div>
              <div className="text-sm font-bold text-gray-950">{persona.role}</div>
            </div>
            <motion.svg
              viewBox="0 0 24 24"
              fill="none"
              stroke={persona.color}
              strokeWidth="2"
              width="18"
              height="18"
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <path d="M6 9l6 6 6-6" />
            </motion.svg>
          </div>

          {/* How they use */}
          <div className="space-y-1 mb-3">
            {persona.howTheyUse.map((use, j) => (
              <div key={j} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 mt-1.5 rounded-full flex-shrink-0" style={{ background: persona.color }} />
                <span className="text-[11px] text-gray-600 font-medium leading-tight">{use}</span>
              </div>
            ))}
          </div>

          {/* Preview: first 2 questions always visible */}
          <div className="space-y-1.5">
            {persona.questions.slice(0, 2).map((q, j) => (
              <div
                key={j}
                className="flex items-center gap-2 px-3 py-2 border text-[11px] font-medium"
                style={{
                  borderColor: `${persona.color}20`,
                  background: `${persona.color}05`,
                  color: persona.color === "#09daed" ? "#0891b2" : persona.color,
                }}
              >
                <img src="/neesh-logo.png" alt="" className="w-4 h-4 object-contain flex-shrink-0 opacity-60" />
                <span className="text-gray-700">"{q}"</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expanded: remaining questions */}
        <motion.div
          initial={false}
          animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="px-5 pb-5 space-y-1.5">
            {persona.questions.slice(2).map((q, j) => (
              <motion.div
                key={j}
                initial={{ opacity: 0, x: -10 }}
                animate={isExpanded ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.3, delay: j * 0.08 }}
                className="flex items-center gap-2 px-3 py-2 border text-[11px] font-medium"
                style={{
                  borderColor: `${persona.color}20`,
                  background: `${persona.color}05`,
                  color: persona.color === "#09daed" ? "#0891b2" : persona.color,
                }}
              >
                <img src="/neesh-logo.png" alt="" className="w-4 h-4 object-contain flex-shrink-0 opacity-60" />
                <span className="text-gray-700">"{q}"</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer indicator */}
        <div className="px-5 pb-3 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 animate-pulse rounded-full" style={{ background: persona.color }} />
          <span className="text-[10px] text-gray-400 font-medium">
            {isExpanded ? "Click to collapse" : `+${persona.questions.length - 2} more questions`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
