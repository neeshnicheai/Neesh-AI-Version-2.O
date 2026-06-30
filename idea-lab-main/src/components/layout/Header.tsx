import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { NeeshLogo } from "@/components/NeeshLogo";

export const Header = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isLandingPage = location.pathname === "/";

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 border-b border-border transition-all duration-300 ${isLandingPage ? 'header-glass' : 'bg-background'}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <NeeshLogo size="sm" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {isLandingPage && (
              <>
                <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </a>
                <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  How It Works
                </a>
              </>
            )}
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/signup">Get started</Link>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-foreground hover:bg-muted"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-border animate-slide-down">
            <nav className="flex flex-col">
              {isLandingPage && (
                <>
                  <a 
                    href="#features" 
                    className="px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    Features
                  </a>
                  <a 
                    href="#how-it-works" 
                    className="px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    How It Works
                  </a>
                </>
              )}
              <Link 
                to="/pricing" 
                className="px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                Pricing
              </Link>
              <div className="flex flex-col gap-1 pt-3 border-t border-border mt-2 px-3">
                <Button variant="ghost" size="sm" asChild className="justify-start">
                  <Link to="/login">Log in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/signup">Get started</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
