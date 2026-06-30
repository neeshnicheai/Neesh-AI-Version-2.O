import { motion } from "framer-motion";
import { useInView } from "../../hooks/useScrollProgress";
import { Link } from "react-router-dom";
import { BetaBadgeLight } from "../BetaBadge";

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
    ],
    cta: "Coming Soon",
  },
];

function PricingCard({ plan, index }: { plan: typeof PLANS[0]; index: number }) {
  const { ref, inView } = useInView(0.1);

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className={`relative p-6 border flex flex-col ${
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

      {/* ── BETA / UPCOMING tag — top-right corner ── */}
      <div className="absolute top-3 right-3">
        <BetaBadgeLight variant="glow" type={plan.tagType} />
      </div>

      <div className="flex items-start justify-between mb-6 mt-2">
        <div>
          <div className="text-gray-950 font-extrabold text-lg">{plan.name}</div>
          <div className="text-gray-500 text-xs mt-0.5 font-medium">{plan.desc}</div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          {plan.originalPrice && (
            <span className="text-lg font-medium text-gray-400 line-through mr-1">
              {plan.originalPrice}
            </span>
          )}
          <span className="text-3xl font-extrabold text-gray-950">{plan.price}</span>
          <span className="text-gray-500 text-sm font-medium">/ {plan.period}</span>
        </div>
      </div>

      <ul className="space-y-2.5 mb-8 flex-1">
        {plan.features.map((feat) => (
          <li key={feat} className="flex items-center gap-2.5 text-sm text-gray-700 font-medium">
            <div className="w-1 h-1 flex-shrink-0" style={{ background: plan.color }} />
            {feat}
          </li>
        ))}
      </ul>

      <Link
        to={plan.tagType === "upcoming" ? "#" : "/pricing"}
        onClick={(e) => {
          if (plan.tagType === "upcoming") e.preventDefault();
        }}
        className={`w-full py-3 text-sm font-semibold transition-all duration-200 block text-center ${
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

export default function PricingSection() {
  const { ref, inView } = useInView(0.1);

  return (
    <section id="pricing" className="bg-white/50 py-24 relative">
      <div className="max-w-[1440px] mx-auto px-6">
        <div ref={ref as React.RefObject<HTMLDivElement>} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            className="text-[#09daed] text-sm font-bold tracking-widest uppercase mb-4"
          >
            Pricing
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold text-gray-950 mb-4"
          >
            Start free. Scale when ready.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-gray-600 max-w-lg mx-auto font-medium"
          >
            During Beta, all Pro features are completely free — no credit card required.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {PLANS.map((plan, i) => (
            <PricingCard key={plan.name} plan={plan} index={i} />
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#09daed]/20 to-transparent" />
    </section>
  );
}
