import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BetaBadgeLight } from "./BetaBadge";

const NAV_ITEMS = [
  { label: "Home", to: "/" },
  { label: "Features", to: "/features" },
  { label: "Blog", to: "/blog-info" },
  { label: "Simulation", to: "/simulation" },
  { label: "Pricing", to: "/pricing" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm"
          : "bg-white/80 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/">
            <img
              src="/neesh-logo.png"
              alt="Neesh AI Logo"
              className="w-9 h-9 object-contain"
              style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))" }}
            />
          </Link>
          <Link to="/" className="text-gray-900 font-bold text-base tracking-wide">Neesh AI</Link>
          <BetaBadgeLight variant="glow" type="beta" />
        </div>

        <div className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="text-gray-700 hover:text-gray-900 text-sm transition-colors duration-200 font-semibold"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-gray-700 hover:text-gray-900 text-sm transition-colors px-4 py-2 font-semibold">
            Sign in
          </Link>
          <Link to="/signup" className="bg-[#09daed] text-black text-sm font-bold px-5 py-2.5 hover:bg-[#07c4d4] transition-colors inline-block text-center">
            Start Free
          </Link>
        </div>

        <button
          className="md:hidden text-gray-700 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <div className="w-5 h-0.5 bg-gray-700 mb-1" />
          <div className="w-5 h-0.5 bg-gray-700 mb-1" />
          <div className="w-5 h-0.5 bg-gray-700" />
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="text-gray-700 text-sm font-semibold"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/signup" className="bg-[#09daed] text-black text-sm font-bold px-4 py-2 w-full text-center" onClick={() => setMobileOpen(false)}>
            Start Free
          </Link>
        </motion.div>
      )}
    </motion.nav>
  );
}

