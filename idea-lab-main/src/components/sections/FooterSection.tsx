import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useInView } from "../../hooks/useScrollProgress";

const NAV_LINKS = {
  Product: [
    { label: "Features", to: "/features" },
    { label: "Simulation", to: "/simulation" },
    { label: "Pricing", to: "/pricing" },
  ],
  Resources: [
    { label: "Blog", to: "/blog-info" },
  ],
};

export default function FooterSection() {
  const { ref, inView } = useInView(0.1);

  return (
    <footer className="bg-white/50 border-t border-gray-100 pt-16 pb-8">
      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#09daed]/30 to-transparent mb-16" />
      <div className="max-w-[1440px] mx-auto px-6">
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12"
        >
          {/* Brand */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <img
                  src="/neesh-logo.png"
                  alt="Neesh AI Logo"
                  className="w-9 h-9 object-contain"
                  style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))" }}
                />
                <span className="text-gray-950 font-bold text-base tracking-wide">Neesh AI</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-6 font-medium">
                Turn your raw ideas into validated products using AI-powered feedback loops and intelligent gap detection.
              </p>
            </motion.div>
          </div>

          {Object.entries(NAV_LINKS).map(([category, links], i) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: (i + 1) * 0.08 }}
            >
              <div className="text-gray-950 text-xs font-bold tracking-widest uppercase mb-4">{category}</div>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-gray-500 text-sm hover:text-gray-800 transition-colors duration-200 font-medium"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center gap-2"
          >
            <div className="w-1 h-1 bg-[#09daed]" />
            <p className="text-gray-500 text-xs italic font-medium">
              "Validating the future, one loop at a time."
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-gray-500 text-xs font-medium"
          >
            © {new Date().getFullYear()} Neesh AI. All rights reserved.
          </motion.div>
        </div>
      </div>
    </footer>
  );
}

