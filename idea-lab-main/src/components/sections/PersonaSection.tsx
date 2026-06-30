import { motion } from "framer-motion";
import { useInView } from "../../hooks/useScrollProgress";
import neeshLogo from "@/assets/neesh-logo.png";

const DNA_COLOR = "#09daed";

const PERSONAS = [
  {
    role: "Founders",
    question: "I need to validate my MVP with real users before burning runway.",
  },
  {
    role: "Freelancers",
    question: "I use Neesh AI to test new service packages with clients before launching.",
  },
  {
    role: "Product Managers",
    question: "I rely on validation loops to prioritize features with actual user demand.",
  },
  {
    role: "Product Designers",
    question: "I need to ensure my new UX pattern is intuitive before handoff.",
  },
  {
    role: "UX Researchers",
    question: "Neesh AI helps me surface user friction that standard surveys miss.",
  },
  {
    role: "Engineers & Scientists",
    question: "I need to confirm market demand before spending months on architecture.",
  },
  {
    role: "SaaS & MicroSaaS Devs",
    question: "I use this to test if people will actually pay $9/month.",
  },
  {
    role: "Fullstack Developers",
    question: "I validate product-market fit before writing a single line of code.",
  },
  {
    role: "Students & Faculties",
    question: "We use it to validate our capstone research and secure early users.",
  },
  {
    role: "Content Creators",
    question: "I test my content ideas to see if they'll build an audience.",
  },
  {
    role: "Product & Brand Marketers",
    question: "I use Neesh AI to test my positioning in a crowded market.",
  },
  {
    role: "Developers",
    question: "I need to understand what end-users actually want me to code.",
  },
  {
    role: "Marketers",
    question: "I validate my campaign messaging before spending my ad budget.",
  },
  {
    role: "Investors",
    question: "I look at validation data to verify the true addressable market.",
  },
  {
    role: "Entrepreneurs",
    question: "I use this to test business models quickly without wasting months.",
  },
];

function PersonaCard({ persona, index }: { persona: typeof PERSONAS[0]; index: number }) {
  const { ref, inView } = useInView(0.05);

  return (
    <motion.div
      ref={ref as React.RefObject<HTMLDivElement>}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: (index % 5) * 0.06 }}
      className="relative group h-full"
    >
      <div
        className="h-full border p-6 bg-white transition-all duration-500 group-hover:shadow-[0_20px_50px_rgba(9,218,237,0.12)] relative overflow-hidden flex flex-col"
        style={{
          borderColor: `${DNA_COLOR}15`,
          boxShadow: "0 2px 15px rgba(0,0,0,0.03)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = `${DNA_COLOR}40`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = `${DNA_COLOR}15`;
        }}
      >
        {/* Holographic background depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#09daed]03 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        {/* Static scanline texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0) 50%, rgba(9,218,237,1) 50%)`, backgroundSize: '100% 4px' }} />

        {/* Animated scanning line */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute left-0 right-0 h-px z-10"
            style={{ background: `linear-gradient(90deg, transparent, ${DNA_COLOR}, transparent)`, opacity: 0.3 }}
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: index * 0.2 }}
          />
        </div>

        <div className="flex items-center gap-4 mb-5">
          {/* Updated Holographic Neesh AI Icon Wrapper */}
          <div className="relative w-12 h-12 flex-shrink-0">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-[#09daed]/20 rounded-full blur-md animate-pulse" />
            
            {/* Icon container */}
            <div
              className="relative w-full h-full flex items-center justify-center bg-white border border-[#09daed]/20 overflow-hidden transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm"
              style={{
                background: `linear-gradient(135deg, white, ${DNA_COLOR}08)`,
              }}
            >
              <img 
                src={neeshLogo} 
                alt="Neesh AI" 
                className="w-7 h-7 object-contain opacity-80 group-hover:opacity-100 transition-all duration-300 filter group-hover:drop-shadow-[0_0_5px_#09daed]" 
              />
              
              {/* Holographic overlay on icon */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#09daed]/10 via-transparent to-[#09daed]/5 pointer-events-none" />
            </div>
          </div>
          
          <div>
            <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-0.5">Persona</div>
            <div className="text-sm font-extrabold text-gray-900 tracking-tight">{persona.role}</div>
          </div>
        </div>

        <div
          className="flex-grow px-4 py-3 text-xs text-gray-700 font-medium border-l-2 bg-gradient-to-r from-[#09daed]05 to-transparent leading-relaxed"
          style={{ borderColor: DNA_COLOR }}
        >
          "{persona.question}"
        </div>

        <div className="mt-5 flex items-center gap-2">
          <div className="relative w-2 h-2">
            <div className="absolute inset-0 bg-[#09daed] rounded-full animate-ping opacity-40" />
            <div className="relative w-2 h-2 bg-[#09daed] rounded-full" style={{ boxShadow: `0 0 10px ${DNA_COLOR}` }} />
          </div>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Active Validation</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function PersonaSection() {
  const { ref, inView } = useInView(0.1);

  return (
    <section className="relative bg-white/50 py-24 overflow-hidden" id="users-section">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#09daed]08 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#09daed]05 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-6 relative z-10">
        <div ref={ref as React.RefObject<HTMLDivElement>} className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            className="text-[#09daed] text-sm font-bold tracking-[0.25em] uppercase mb-4"
          >
            Audience Discovery
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-gray-950 mb-6 tracking-tight"
          >
            See exactly who needs <br/><span className="text-[#09daed]">validation loops.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="text-gray-600 max-w-xl mx-auto font-medium text-lg leading-relaxed"
          >
            Discover how different roles use Neesh AI to stop guessing and start building with confidence.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {PERSONAS.map((persona, i) => (
            <PersonaCard key={persona.role} persona={persona} index={i} />
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#09daed]/20 to-transparent" />
    </section>
  );
}
