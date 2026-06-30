import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInView } from "../../hooks/useScrollProgress";
import { ScrollTrigger } from "../../lib/gsap";
import defaultChatbotAvatar from "../../assets/chatbot-avatar.png";

const STEPS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="#09daed" width="20" height="20">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
      </svg>
    ),
    title: "Create & Edit",
    desc: "Craft your validation blog with our rich editor. Structure your idea into problem, solution, and feedback sections.",
    tag: "WRITE",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="#7c3aed" width="20" height="20">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
      </svg>
    ),
    title: "Attach Rich Media",
    desc: "Embed images, videos, and interactive demos to bring your idea to life and increase audience engagement.",
    tag: "MEDIA",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="#f59e0b" width="20" height="20">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z" />
      </svg>
    ),
    title: "Custom Feedback",
    desc: "Add targeted feedback sections at any point. Capture real reactions from readers where it matters most.",
    tag: "FEEDBACK",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="#10b981" width="20" height="20">
        <path d="M12 2l-5.5 9h11L12 2zm0 12.5c-1.93 0-3.5 1.57-3.5 3.5s1.57 3.5 3.5 3.5 3.5-1.57 3.5-3.5-1.57-3.5-3.5-3.5z" />
      </svg>
    ),
    title: "Knowledge Base",
    desc: "Connect your docs, notes, and research to auto-train the embedded chatbot for intelligent responses.",
    tag: "KNOWLEDGE",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="#09daed" width="20" height="20">
        <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
      </svg>
    ),
    title: "Publish & Share",
    desc: "Go live in one click. Share a branded link and start collecting validation data from real users instantly.",
    tag: "PUBLISH",
  },
];

/* ─── Blog Preview Tab ─── */
function BlogPreviewTab({ active }: { active: boolean }) {
  const [chatOpen, setChatOpen] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={active ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative"
    >
      {/* Outer glow */}
      <div
        className="absolute -inset-[2px] animate-pulse-glow opacity-60"
        style={{
          background:
            "linear-gradient(135deg, rgba(37,211,102,0.25), rgba(9,218,237,0.12), rgba(37,211,102,0.25))",
          filter: "blur(8px)",
        }}
      />

      {/* Card */}
      <div
        className="relative bg-white border border-[#25d366]/25 overflow-hidden"
        style={{
          boxShadow:
            "0 20px 60px rgba(37,211,102,0.12), 0 4px 20px rgba(0,0,0,0.06)",
        }}
      >
        {/* Top bar */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="text-[10px] text-gray-400 bg-gray-100 px-4 py-0.5 font-mono">
              neesh.ai/blog/whatsapp-idea-validation
            </div>
          </div>
          <div className="w-2 h-2 bg-[#25d366] animate-pulse" />
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-5">
          {/* Project Title */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={active ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <img
                src="/neesh-logo.png"
                alt="Neesh AI"
                className="w-5 h-5 object-contain"
              />
              <span className="text-[9px] text-[#09daed] font-bold tracking-widest uppercase border border-[#09daed]/20 px-2 py-0.5 bg-[#09daed]/5">
                LIVE DEMO IDEA
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-[#128C7E] leading-tight flex items-center gap-2">
              Idea Validation: WhatsApp
            </h3>
            <p className="text-[11px] text-gray-400 mt-1 font-medium">
              Validating a global SMS alternative · 2.5k views · 482 feedback signals
            </p>
          </motion.div>

          {/* Problem Statement */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={active ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="border-l-[3px] border-red-400 pl-4"
          >
            <div className="text-[10px] text-red-500 font-bold tracking-widest uppercase mb-1">
              Problem Statement
            </div>
            <p className="text-gray-700 text-sm leading-relaxed font-medium">
              Regular text messages (SMS) are expensive, undependable across countries, and offer no way of knowing if the other person is actually available to talk right now.
            </p>
          </motion.div>

          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={active ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="border-l-[3px] border-[#7c3aed] pl-4"
          >
            <div className="text-[10px] text-[#7c3aed] font-bold tracking-widest uppercase mb-1">
              Introduction
            </div>
            <p className="text-gray-700 text-sm leading-relaxed font-medium">
              We propose an app called "WhatsApp". Initially, a simple status app built into your phone's address book letting everyone know what you are doing (e.g., "At the gym, can't talk").
            </p>
          </motion.div>

          {/* Solution */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={active ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.75 }}
            className="border-l-[3px] border-[#25d366] pl-4"
          >
            <div className="text-[10px] text-[#25d366] font-bold tracking-widest uppercase mb-1">
              The Solution & Pivot
            </div>
            <p className="text-gray-700 text-sm leading-relaxed font-medium">
              Users loved the statuses so much they used them to talk! We quickly pivoted. WhatsApp is now a full messaging app that works over the internet, making global chats completely free.
            </p>
          </motion.div>

          {/* Inline media placeholder - WhatsApp Chat Image */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={active ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="border border-[#25D366]/20 bg-[#ECE5DD] p-4 relative h-36 overflow-hidden flex flex-col gap-3 rounded-md"
          >
            <div className="absolute inset-0 bg-[#E5DDD5] opacity-50 pointer-events-none" />
            <div className="self-end bg-[#DCF8C6] px-3 py-2 rounded-lg rounded-tr-none shadow-sm text-xs text-gray-800 max-w-[85%] relative z-10 leading-tight">
              Is this just for statuses or can I really message you here for free? 🤔
              <div className="text-[9px] text-gray-500 text-right mt-1">10:41 AM ✓✓</div>
            </div>
            <div className="self-start bg-white px-3 py-2 rounded-lg rounded-tl-none shadow-sm text-xs text-gray-800 max-w-[85%] relative z-10 leading-tight">
              Yes! We added push notifications. We are basically a free global messaging app now! 🚀
              <div className="text-[9px] text-gray-400 text-right mt-1">10:42 AM</div>
            </div>
          </motion.div>

          {/* Feedback */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={active ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 1.05 }}
            className="border-l-[3px] border-[#10b981] pl-4"
          >
            <div className="text-[10px] text-[#10b981] font-bold tracking-widest uppercase mb-1">
              Reader Feedback Loop
            </div>
            <p className="text-gray-700 text-sm leading-relaxed font-medium">
              Would this replace your regular SMS app? Share your thoughts below or ask the Neesh AI chatbot more about this idea!
            </p>
          </motion.div>
        </div>

        {/* Chatbot widget — bottom right */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={active ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 1.2, type: "spring" }}
          className="absolute bottom-4 right-4 z-20"
        >
          {!chatOpen ? (
            <button
              onClick={() => setChatOpen(true)}
              className="w-11 h-11 bg-[#09daed] flex items-center justify-center hover:bg-[#07c4d4] transition-colors cursor-pointer rounded-full"
              style={{ boxShadow: "0 4px 16px rgba(9,218,237,0.4)" }}
            >
              <svg viewBox="0 0 24 24" fill="black" width="20" height="20">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a3 3 0 0 1 3 3v2h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2v2a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3v-2H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2V10a3 3 0 0 1 3-3h1V5.73A2 2 0 1 1 12 2zm-3 10a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
              </svg>
            </button>
          ) : (
            <div
              className="w-64 border border-[#09daed]/30 bg-white"
              style={{ boxShadow: "0 8px 32px rgba(9,218,237,0.15)" }}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-[#09daed]/5">
                <div className="flex items-center gap-2">
                  <img src={defaultChatbotAvatar} alt="AI" className="w-6 h-6 object-contain drop-shadow-sm" />
                  <span className="text-xs font-bold text-gray-800">Neesh AI Bot</span>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="p-3 space-y-2">
                <div className="bg-[#09daed]/8 px-3 py-2 text-xs text-gray-700 font-medium leading-relaxed">
                  👋 Hi! Want to know more about how Neesh AI helped validate this WhatsApp idea?
                </div>
                <div className="bg-gray-50 px-3 py-2 text-xs text-gray-600 font-medium">
                  How will they make money if it's completely free?
                </div>
                <div className="bg-[#09daed]/8 px-3 py-2 text-xs text-gray-700 font-medium leading-relaxed">
                  Validation data showed users are willing to pay $1 a year to avoid annoying ads forever!
                </div>
              </div>
              <div className="px-3 pb-3 flex gap-2">
                <div className="flex-1 border border-gray-200 px-2 py-1.5 text-[10px] text-gray-400">
                  Type a question...
                </div>
                <div className="w-7 h-7 bg-[#09daed] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="black" width="12" height="12">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Scanning line animation */}
        <motion.div
          className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#25d366]/40 to-transparent pointer-events-none"
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}

/* ─── Step Card ─── */
function StepCard({
  step,
  index,
  isActive,
}: {
  step: (typeof STEPS)[0];
  index: number;
  isActive: boolean;
}) {
  const { ref, inView } = useInView(0.1);

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, x: -20 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`relative p-4 border transition-all duration-300 group ${
        isActive
          ? "border-[#09daed]/40 bg-[#09daed]/5"
          : "border-gray-100 bg-white hover:border-[#09daed]/20"
      }`}
      style={
        isActive
          ? { boxShadow: "0 4px 20px rgba(9,218,237,0.1)" }
          : { boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }
      }
    >
      {/* Active indicator */}
      <div
        className={`absolute top-0 left-0 bottom-0 w-[3px] transition-colors duration-300 ${
          isActive ? "bg-[#09daed]" : "bg-transparent"
        }`}
      />

      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
            isActive ? "bg-[#09daed]/10" : "bg-gray-50 group-hover:bg-[#09daed]/5"
          }`}
        >
          {step.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[9px] font-bold tracking-widest transition-colors duration-300 ${
                isActive ? "text-[#09daed]" : "text-gray-400"
              }`}
            >
              0{index + 1}
            </span>
            <span
              className={`text-[8px] font-bold tracking-widest border px-1.5 py-0.5 transition-all duration-300 ${
                isActive
                  ? "text-[#09daed] border-[#09daed]/20 bg-[#09daed]/5"
                  : "text-gray-400 border-gray-100 bg-gray-50"
              }`}
            >
              {step.tag}
            </span>
          </div>
          <h4
            className={`text-sm font-bold mb-1 transition-colors duration-300 ${
              isActive ? "text-gray-950" : "text-gray-700"
            }`}
          >
            {step.title}
          </h4>
          <p className="text-gray-500 text-xs leading-relaxed font-medium">
            {step.desc}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Section ─── */
export default function BlogShowcaseSection() {
  const { ref, inView } = useInView(0.1);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  // Scroll-linked step highlighting
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    ScrollTrigger.create({
      trigger: section,
      start: "top 50%",
      end: "bottom 50%",
      scrub: 0.3,
      onUpdate: (self) => {
        const stepCount = STEPS.length;
        const idx = Math.floor(self.progress * (stepCount + 1));
        setActiveStep(Math.min(idx, stepCount - 1));
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
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(#09daed 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      <div className="max-w-[1440px] mx-auto px-6">
        {/* Header */}
        <div ref={ref as React.RefObject<HTMLDivElement>} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            className="text-[#09daed] text-sm font-bold tracking-widest uppercase mb-4"
          >
            Blog Creation
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold text-gray-950 mb-4"
          >
            Publish. Engage.{" "}
            <span className="text-[#09daed]">Validate.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-gray-600 max-w-xl mx-auto font-medium"
          >
            Create rich, interactive blogs from your ideas — embed media,
            customize feedback sections, attach a knowledge base, and publish
            with a single shareable link.
          </motion.p>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left — Step cards */}
          <div className="space-y-3">
            {STEPS.map((step, i) => (
              <StepCard
                key={step.tag}
                step={step}
                index={i}
                isActive={activeStep === i}
              />
            ))}
          </div>

          {/* Right — Glowing blog preview */}
          <div className="lg:sticky lg:top-24">
            <BlogPreviewTab active={inView} />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#09daed]/20 to-transparent" />
    </section>
  );
}
