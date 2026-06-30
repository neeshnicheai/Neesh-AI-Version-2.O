import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import { useInView } from "../hooks/useScrollProgress";
import { BetaBadgeLight } from "../components/BetaBadge";

/* ─── Pricing Data ─── */
const PLANS = [
  {
    name: "Free",
    badge: "FREE",
    price: "$0",
    period: "forever",
    desc: "For individuals just starting out",
    color: "#64748b",
    highlight: false,
    tagType: "beta" as const,
    features: [
      "Up to 5 projects",
      "Basic AI chatbot",
      "Public feedback forms",
      "Community support",
      "Standard blog templates",
      "Basic analytics",
    ],
    cta: "Get Started Free",
  },
  {
    name: "Pro",
    badge: "MOST POPULAR",
    price: "$0",
    originalPrice: "$9.99",
    period: "during beta",
    desc: "For professionals & growing teams",
    color: "#09daed",
    highlight: true,
    tagType: "beta" as const,
    features: [
      "Unlimited projects",
      "Advanced AI (Gemini class)",
      "White-label branding",
      "Cross-promotion engine",
      "Priority support",
      "Advanced gap detection",
      "Custom feedback forms",
      "Full audience insights",
    ],
    cta: "Upgrade to Pro — Free",
  },
  {
    name: "Enterprise",
    badge: "ENTERPRISE",
    price: "Custom",
    period: "contact us",
    desc: "For large-scale operations",
    color: "#7c3aed",
    highlight: false,
    tagType: "upcoming" as const,
    features: [
      "Everything in Pro",
      "Custom AI model training",
      "SLA & dedicated support",
      "Team accounts & API",
      "Custom integrations",
      "Dedicated account manager",
    ],
    cta: "Coming Soon",
  },
];

/* ─── FAQ Data ─── */
const FAQS = [
  {
    q: "Is Neesh AI really free during beta?",
    a: "Yes! During the beta period, all Pro features are completely free. No credit card required. When we exit beta, you'll be grandfathered into a special early adopter rate.",
  },
  {
    q: "How long will the beta last?",
    a: "We're planning to be in beta for the next few months while we refine the product. You'll be notified well in advance before any pricing changes take effect.",
  },
  {
    q: "Can I publish unlimited blogs?",
    a: "On the Free plan, you can create up to 5 projects. On Pro (free during beta), you get unlimited projects and blogs.",
  },
  {
    q: "What happens to my data if I downgrade?",
    a: "Your data is always yours. If you downgrade, your projects remain accessible. You just won't be able to create new ones beyond the free tier limit.",
  },
  {
    q: "Is there an API available?",
    a: "API access is planned for the Enterprise tier. During beta, we're focused on the core product experience. API access will be available when we launch Enterprise.",
  },
  {
    q: "Do you offer refunds?",
    a: "Since everything is free during beta, there's nothing to refund! When paid plans launch, we'll offer a 14-day money-back guarantee.",
  },
];

/* ─── Main Page ─── */

export default function PricingPage() {
  return (
    <PageLayout>
      {/* Section 1: Hero */}
      <section className="relative bg-white/50 pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: `linear-gradient(#09daed 1px, transparent 1px), linear-gradient(90deg, #09daed 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
        <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-[#09daed]/5 blur-[150px] pointer-events-none" />

        <div className="relative z-10 max-w-[1440px] mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-[#09daed] text-sm font-bold tracking-widest uppercase mb-4">
            Pricing
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }} className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-950 leading-[1.1] tracking-tight mb-6">
            Start Free. <span className="text-[#09daed]">Scale When Ready.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto font-medium leading-relaxed">
            During Beta, all Pro features are completely free — no credit card required. Join early and lock in special pricing forever.
          </motion.p>
        </div>
      </section>

      {/* Section 2: Pricing Cards */}
      <section className="relative bg-white/50 py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <PricingCard key={plan.name} plan={plan} index={i} />
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#09daed]/20 to-transparent" />
      </section>

      {/* Section 3: FAQ */}
      <section className="relative bg-white/50 py-24">
        <div className="max-w-[800px] mx-auto px-6">
          <SectionHeader
            tag="FAQ"
            title="Frequently Asked Questions"
            desc="Everything you need to know about Neesh AI pricing and plans."
          />
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-white/50 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-950 mb-4">Ready to validate your ideas?</h2>
          <p className="text-gray-600 mb-8 font-medium">No credit card required · Free forever plan · Cancel anytime</p>
          <Link to="/signup" className="bg-[#09daed] text-black font-bold px-8 py-4 text-sm hover:bg-[#07c4d4] transition-all duration-200 animate-pulse-glow inline-block">
            Start Your First Validation Loop
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

function PricingCard({ plan, index }: { plan: typeof PLANS[0]; index: number }) {
  const { ref, inView } = useInView(0.1);

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className={`relative p-8 border flex flex-col ${
        plan.highlight
          ? "border-[#09daed]/50 bg-white scale-[1.03] z-10"
          : "border-gray-200 bg-white"
      }`}
      style={
        plan.highlight
          ? { boxShadow: "0 0 50px rgba(9,218,237,0.12), 0 8px 32px rgba(0,0,0,0.06)" }
          : { boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }
      }
    >
      {plan.highlight && (
        <div className="absolute -top-px left-0 right-0 h-0.5 bg-[#09daed]" />
      )}
      {plan.highlight && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#09daed] text-black text-[10px] font-bold px-3 py-1 tracking-widest">
          MOST POPULAR
        </div>
      )}

      {/* BETA / UPCOMING tag */}
      <div className="absolute top-3 right-3">
        <BetaBadgeLight variant="glow" type={plan.tagType} />
      </div>

      <div className="flex items-start justify-between mb-6 mt-2">
        <div>
          <div className="text-gray-950 font-extrabold text-xl">{plan.name}</div>
          <div className="text-gray-500 text-xs mt-0.5 font-medium">{plan.desc}</div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-baseline gap-1">
          {plan.originalPrice && (
            <span className="text-lg font-medium text-gray-400 line-through mr-1">
              {plan.originalPrice}
            </span>
          )}
          <span className="text-4xl font-extrabold text-gray-950">{plan.price}</span>
          <span className="text-gray-500 text-sm font-medium">/ {plan.period}</span>
        </div>
      </div>

      <ul className="space-y-3 mb-10 flex-1">
        {plan.features.map((feat) => (
          <li key={feat} className="flex items-center gap-2.5 text-sm text-gray-700 font-medium">
            <svg viewBox="0 0 24 24" width="14" height="14" fill={plan.color}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
            {feat}
          </li>
        ))}
      </ul>

      <Link
        to={plan.tagType === "upcoming" ? "#" : "/signup"}
        onClick={(e) => {
          if (plan.tagType === "upcoming") e.preventDefault();
        }}
        className={`w-full py-3.5 text-sm font-semibold transition-all duration-200 block text-center ${
          plan.tagType === "upcoming"
            ? "border border-violet-300 text-violet-400 cursor-not-allowed opacity-60"
            : plan.highlight
            ? "bg-[#09daed] text-black hover:bg-[#07c4d4]"
            : "border border-gray-300 text-gray-700 hover:border-[#09daed] hover:text-[#09daed]"
        }`}
      >
        {plan.cta}
      </Link>
    </motion.div>
  );
}

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false);
  const { ref, inView } = useInView(0.1);

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="border border-gray-200 bg-white overflow-hidden transition-all duration-300"
      style={{ boxShadow: open ? "0 4px 16px rgba(9,218,237,0.08)" : "0 1px 4px rgba(0,0,0,0.04)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <span className="text-sm font-bold text-gray-900">{question}</span>
        <motion.svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#09daed"
          strokeWidth="2"
          width="18"
          height="18"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <path d="M6 9l6 6 6-6" />
        </motion.svg>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-4">
          <p className="text-sm text-gray-600 leading-relaxed font-medium">{answer}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
