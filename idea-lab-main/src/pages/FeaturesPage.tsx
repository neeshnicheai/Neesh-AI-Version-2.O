import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { useInView } from "../hooks/useScrollProgress";
import PersonaSection from "../components/sections/PersonaSection";
import defaultChatbotAvatar from "../assets/chatbot-avatar.png";

/* ─── Feature Data (from FeaturesSection) ─── */
const FEATURES = [
  {
    title: "Publishable Blogs",
    desc: "Auto-generate SEO-ready blog posts from your idea. Publish and share with real audiences to collect live feedback.",
    tag: "PUBLISH",
    color: "#09daed",
  },
  {
    title: "Cross Promotional Engine",
    desc: "Promote your blog inside Neesh AI's discovery network. Reach validated audiences who are already exploring similar ideas.",
    tag: "PROMOTE",
    color: "#7c3aed",
  },
  {
    title: "AI-Generated Knowledge Base",
    desc: "Turn messy notes and docs into structured, searchable knowledge your chatbot uses to answer user questions perfectly.",
    tag: "KNOWLEDGE",
    color: "#f59e0b",
  },
  {
    title: "Context-Aware Chatbot",
    desc: "Deploy a chatbot trained on your idea. It represents your product, answers questions, and captures every moment of confusion.",
    tag: "ENGAGE",
    color: "#09daed",
  },
  {
    title: "Gap Detection Engine",
    desc: "Know exactly where users are confused. AI maps every unanswered question to specific content gaps in your idea.",
    tag: "DETECT",
    color: "#ef4444",
  },
  {
    title: "Validation Command Center",
    desc: "One dashboard to track clarity index, market signal, audience engagement, and gap velocity across all your projects.",
    tag: "COMMAND",
    color: "#10b981",
  },
];


/* ─── Simulated UI Snippets ─── */

function BlogEditorSnippet() {
  return (
    <div className="bg-white border border-gray-200 overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="text-[10px] text-gray-400 font-mono ml-2">Blog Editor</div>
      </div>
      <div className="p-4 space-y-3">
        <div className="h-6 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-[#09daed]/10 rounded w-full" />
        <div className="h-4 bg-[#09daed]/10 rounded w-5/6" />
        <div className="h-4 bg-gray-50 rounded w-2/3" />
        <div className="flex gap-2 mt-3">
          <div className="px-2 py-1 bg-[#09daed]/10 border border-[#09daed]/20 text-[9px] text-[#09daed] font-bold">PUBLISH</div>
          <div className="px-2 py-1 bg-gray-50 border border-gray-100 text-[9px] text-gray-400 font-bold">DRAFT</div>
        </div>
      </div>
    </div>
  );
}

function ChatbotSnippet() {
  return (
    <div className="bg-white border border-gray-200 overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-[#09daed]/5">
        <img src={defaultChatbotAvatar} alt="AI" className="w-6 h-6 object-contain drop-shadow-sm" />
        <span className="text-xs font-bold text-gray-800">Neesh AI Bot</span>
        <div className="ml-auto w-2 h-2 bg-[#09daed] animate-pulse rounded-full" />
      </div>
      <div className="p-3 space-y-2">
        <div className="bg-[#09daed]/8 px-3 py-2 text-[10px] text-gray-700 font-medium">👋 Ask me anything about this idea!</div>
        <div className="bg-gray-50 px-3 py-2 text-[10px] text-gray-600 font-medium">How does gap detection work?</div>
        <div className="bg-[#09daed]/8 px-3 py-2 text-[10px] text-gray-700 font-medium">AI maps every unanswered question to content gaps...</div>
      </div>
    </div>
  );
}

function KnowledgeBaseSnippet() {
  return (
    <div className="bg-white border border-gray-200 overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
        <span className="text-[10px] text-gray-500 font-bold tracking-widest">KNOWLEDGE BASE</span>
      </div>
      <div className="p-3 space-y-2">
        {["product-brief.pdf", "user-research.docx", "pitch-deck.pptx"].map((doc) => (
          <div key={doc} className="flex items-center gap-2 px-3 py-2 border border-gray-100 bg-gray-50/50">
            <div className="w-6 h-6 bg-[#09daed]/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="#09daed" width="12" height="12"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z" /></svg>
            </div>
            <span className="text-[10px] text-gray-700 font-medium">{doc}</span>
            <div className="ml-auto text-[9px] text-green-600 font-bold">✓ Indexed</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GapDetectionSnippet() {
  return (
    <div className="bg-white border border-gray-200 overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
        <div className="w-2 h-2 bg-[#ef4444] animate-pulse rounded-full" />
        <span className="text-[10px] text-[#ef4444] font-bold tracking-widest">GAP DETECTION</span>
      </div>
      <div className="p-3 space-y-3">
        {[
          { label: "Pricing Clarity", val: 34, color: "#ef4444" },
          { label: "Integration Docs", val: 52, color: "#f59e0b" },
          { label: "Use Cases", val: 78, color: "#09daed" },
        ].map((item) => (
          <div key={item.label}>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-gray-600 font-medium">{item.label}</span>
              <span className="text-[10px] text-gray-800 font-bold">{item.val}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${item.val}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                viewport={{ once: true }}
                className="h-full rounded-full"
                style={{ background: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommandCenterSnippet() {
  return (
    <div className="bg-white border border-gray-200 overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
        <img src="/neesh-logo.png" alt="Neesh" className="w-4 h-4 object-contain" />
        <span className="text-[10px] text-gray-500 font-bold tracking-widest">COMMAND CENTER</span>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: "Clarity", val: "87%", color: "#09daed" },
            { label: "Signal", val: "72%", color: "#7c3aed" },
            { label: "Gaps", val: "3", color: "#f59e0b" },
          ].map((m) => (
            <div key={m.label} className="p-2 border border-gray-100 bg-gray-50 text-center">
              <div className="text-sm font-bold" style={{ color: m.color }}>{m.val}</div>
              <div className="text-[9px] text-gray-500 font-medium">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CrossPromoSnippet() {
  return (
    <div className="bg-white border border-gray-200 overflow-hidden" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-[#7c3aed]/5">
        <span className="text-[10px] text-[#7c3aed] font-bold tracking-widest">CROSS PROMOTION</span>
      </div>
      <div className="p-3 space-y-2">
        {["Fintech SaaS Validator", "AI Workflow Tool", "EdTech MVP"].map((title, i) => (
          <div key={title} className="flex items-center gap-2 px-3 py-2 border border-gray-100 bg-gray-50/50">
            <div className="w-6 h-6 bg-[#7c3aed]/10 flex items-center justify-center rounded-full text-[9px] font-bold text-[#7c3aed]">{i + 1}</div>
            <span className="text-[10px] text-gray-700 font-medium flex-1">{title}</span>
            <span className="text-[9px] text-green-600 font-bold">{[128, 96, 74][i]} viewers</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const FEATURE_SNIPPETS: Record<string, React.ReactNode> = {
  PUBLISH: <BlogEditorSnippet />,
  PROMOTE: <CrossPromoSnippet />,
  KNOWLEDGE: <KnowledgeBaseSnippet />,
  ENGAGE: <ChatbotSnippet />,
  DETECT: <GapDetectionSnippet />,
  COMMAND: <CommandCenterSnippet />,
};

/* ─── Response & Notification Preview ─── */

function ResponsePreview() {
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
        <svg viewBox="0 0 24 24" fill="#09daed" width="16" height="16"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
        <span className="text-xs font-bold text-gray-800">Response Dashboard</span>
        <div className="ml-auto text-[10px] text-gray-400 font-medium">12 responses</div>
      </div>
      <div className="divide-y divide-gray-50">
        {[
          { name: "Sarah K.", role: "Product Manager", feedback: "Love the validation loop concept!", rating: 5, color: "#f59e0b" },
          { name: "Alex M.", role: "Founder", feedback: "Pricing model is unclear to me.", rating: 3, color: "#09daed" },
          { name: "Jordan T.", role: "Developer", feedback: "API integration docs would help.", rating: 4, color: "#ef4444" },
        ].map((r) => (
          <div key={r.name} className="px-5 py-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: r.color }}>{r.name[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900">{r.name}</span>
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: `${r.color}15`, color: r.color }}>{r.role}</span>
              </div>
              <p className="text-[11px] text-gray-600 mt-0.5">{r.feedback}</p>
            </div>
            <div className="flex gap-0.5 flex-shrink-0">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} viewBox="0 0 24 24" width="10" height="10" fill={s <= r.rating ? "#f59e0b" : "#e5e7eb"}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function NotificationPreview() {
  const { ref, inView } = useInView(0.1);
  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: 0.15 }}
      className="bg-white border border-gray-200 overflow-hidden"
      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50/60">
        <svg viewBox="0 0 24 24" fill="#7c3aed" width="16" height="16"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" /></svg>
        <span className="text-xs font-bold text-gray-800">Notifications</span>
        <span className="ml-auto bg-[#7c3aed] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">5 new</span>
      </div>
      <div className="divide-y divide-gray-50">
        {[
          { q: "What's the pricing model?", count: 8, status: "unanswered" },
          { q: "How does gap detection work?", count: 5, status: "answered" },
          { q: "Can I integrate with Slack?", count: 3, status: "unanswered" },
        ].map((n) => (
          <div key={n.q} className="px-5 py-3 flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${n.status === "unanswered" ? "bg-[#ef4444]" : "bg-[#10b981]"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-800 font-medium truncate">{n.q}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{n.count} people asked · {n.status}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Main Page ─── */

export default function FeaturesPage() {
  return (
    <PageLayout>
      {/* Section 1: Hero */}
      <section className="relative bg-white/50 pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: `linear-gradient(#09daed 1px, transparent 1px), linear-gradient(90deg, #09daed 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-[#09daed]/5 blur-[150px] pointer-events-none" />

        <div className="relative z-10 max-w-[1440px] mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-[#09daed] text-sm font-bold tracking-widest uppercase mb-4">
            Core Features
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }} className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-950 leading-[1.1] tracking-tight mb-6">
            Everything You Need to <span className="text-[#09daed]">Validate</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto font-medium leading-relaxed">
            Six AI-powered modules working together to turn your raw ideas into validated products — from blog creation to gap detection.
          </motion.p>
        </div>
      </section>

      {/* Section 2: Core Features with Simulated UI */}
      <section className="relative bg-white/50 py-20">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="space-y-16">
            {FEATURES.map((f, i) => {
              const isReversed = i % 2 === 1;
              return (
                <FeatureRow key={f.tag} feature={f} index={i} reversed={isReversed} />
              );
            })}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#09daed]/20 to-transparent" />
      </section>

      {/* Section 3: Who Uses Neesh AI */}
      <PersonaSection />

      {/* Section 4: Validate with Response & Notification */}
      <section className="relative bg-white/50 py-24">
        <div className="max-w-[1440px] mx-auto px-6">
          <SectionHeader
            tag="Validation in Practice"
            title="Close the Loop with Response & Notifications"
            desc="Track every piece of feedback and surface the questions that matter most — all in real time."
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ResponsePreview />
            <NotificationPreview />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-white/50 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-950 mb-4">Ready to validate your next big idea?</h2>
          <p className="text-gray-600 mb-8 font-medium">Join thousands of founders, PMs, and developers using Neesh AI.</p>
          <Link to="/signup" className="bg-[#09daed] text-black font-bold px-8 py-4 text-sm hover:bg-[#07c4d4] transition-all duration-200 animate-pulse-glow inline-block">
            Start Validating for Free
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
      <motion.p initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }} className="text-gray-600 max-w-lg mx-auto font-medium">{desc}</motion.p>
    </div>
  );
}

function FeatureRow({ feature, index, reversed }: { feature: typeof FEATURES[0]; index: number; reversed: boolean }) {
  const { ref, inView } = useInView(0.1);
  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.1 }}
      className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center ${reversed ? "lg:direction-rtl" : ""}`}
    >
      <div className={reversed ? "lg:order-2" : ""}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-bold tracking-widest" style={{ color: feature.color }}>{String(index + 1).padStart(2, "0")}</span>
          <span className="text-[9px] font-bold tracking-widest border px-2 py-0.5" style={{ color: feature.color, borderColor: `${feature.color}30`, background: `${feature.color}08` }}>{feature.tag}</span>
        </div>
        <h3 className="text-2xl md:text-3xl font-extrabold text-gray-950 mb-3">{feature.title}</h3>
        <p className="text-gray-600 text-base leading-relaxed font-medium max-w-lg">{feature.desc}</p>
      </div>
      <div className={reversed ? "lg:order-1" : ""}>
        {FEATURE_SNIPPETS[feature.tag]}
      </div>
    </motion.div>
  );
}

