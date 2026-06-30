import { useState } from "react";
import { Check, Zap, Crown, Building2, Sparkles, Loader2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { NeeshLogo } from "@/components/NeeshLogo";
import { BetaBadge } from "@/components/BetaBadge";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Pricing = () => {
  const { subscription, isPro, isEnterprise, upgradeToPro, refetch } = useSubscription();
  const navigate = useNavigate();

  const [isUpgrading, setIsUpgrading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const currentPlan = subscription?.plan || "FREE";

  const handleBetaUpgrade = async () => {
    setIsUpgrading(true);
    const success = await upgradeToPro();
    setIsUpgrading(false);
    if (success) {
      setSuccessOpen(true);
    } else {
      toast.error("Failed to upgrade. Please try again.");
    }
  };

  const plans = [
    {
      name: "Free",
      price: "$0",
      icon: Sparkles,
      description: "For individuals just starting out",
      features: [
        "Up to 5 projects",
        "Basic AI chatbot responses",
        "Public feedback forms",
        "Community support",
        '"Powered by Neesh AI" branding on all blogs'
      ],
      buttonText: currentPlan === "FREE" ? "Current Plan" : "Free Plan",
      disabled: true,
      popular: false,
      isCurrent: currentPlan === "FREE",
      tagType: "beta" as const,
      gradient: "from-slate-500/20 to-slate-600/20",
      borderColor: "border-border",
    },
    {
      name: "Pro",
      price: "$0",
      originalPrice: "$9.99",
      period: "/mo during beta",
      icon: Crown,
      description: "For professionals and growing teams",
      features: [
        "Unlimited projects",
        "Advanced AI (Gemini class)",
        "Remove 'Powered by Neesh AI'",
        "Custom logo & branding (white-label)",
        "Cross-promotion engine — promote blogs via tags",
        "Appear in 'More Like This' sections",
        "Priority email support"
      ],
      buttonText: isPro ? "Current Plan ✓" : "Upgrade Free ⚡",
      disabled: isPro,
      popular: true,
      isCurrent: currentPlan === "PRO",
      isPro: true,
      tagType: "beta" as const,
      gradient: "from-emerald-600/20 via-green-600/20 to-teal-500/20",
      borderColor: "border-emerald-500/50",
    },
    {
      name: "Enterprise",
      price: "Custom",
      icon: Building2,
      description: "For large-scale operations",
      features: [
        "Everything in Pro",
        "SLA & dedicated support",
        "Custom AI model training",
        "Team accounts & API access",
        "Bulk data ingestion",
        "Advanced analytics dashboard"
      ],
      buttonText: "Coming Soon",
      disabled: true,
      popular: false,
      isCurrent: currentPlan === "ENTERPRISE",
      tagType: "upcoming" as const,
      gradient: "from-violet-500/20 to-purple-600/20",
      borderColor: "border-violet-500/30",
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Decorative background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[10%] w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-[30%] right-[15%] w-96 h-96 bg-green-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-[20%] left-[40%] w-80 h-80 bg-violet-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "4s" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="mb-6">
            <NeeshLogo size="lg" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-green-600/80 to-emerald-600/60">
              Choose Your Plan
            </h1>
          </div>
          <BetaBadge variant="glow" type="beta" className="mb-4" />
          <p className="text-xl text-muted-foreground max-w-2xl">
            During Beta, all Pro features are completely free — no credit card required.
          </p>
          {currentPlan !== "FREE" && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-600/10 to-green-600/10 border border-emerald-500/30">
              <Crown className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                You're on the {currentPlan} plan
              </span>
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`flex flex-col relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${
                plan.popular
                  ? `${plan.borderColor} shadow-lg shadow-emerald-500/10 scale-[1.02] z-10`
                  : `${plan.borderColor}`
              } ${plan.isCurrent ? "ring-2 ring-primary/50" : ""}`}
            >
              {/* Gradient overlay at top */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${plan.gradient}`} />

              {/* BETA / UPCOMING tag — top right */}
              <div className="absolute top-3 right-3 z-20">
                <BetaBadge variant="glow" type={plan.tagType} />
              </div>

              {plan.popular && (
                <div className="absolute top-0 left-0 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs font-bold px-4 py-1.5 rounded-br-xl shadow-lg">
                  ⚡ MOST POPULAR
                </div>
              )}

              {plan.isCurrent && !plan.popular && (
                <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-br-xl">
                  ACTIVE
                </div>
              )}

              <CardHeader className="pt-8">
                <div className="flex items-center gap-2 mb-2">
                  <plan.icon className={`w-5 h-5 ${plan.popular ? "text-emerald-500" : "text-muted-foreground"}`} />
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4 flex items-baseline">
                  {plan.originalPrice && (
                    <span className="text-2xl font-medium text-muted-foreground line-through mr-2">
                      {plan.originalPrice}
                    </span>
                  )}
                  <span className={`text-4xl font-extrabold tracking-tight ${plan.originalPrice ? "text-emerald-500" : ""}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="ml-1 text-xl font-medium text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                {plan.isPro && !isPro && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                    🎉 Free during Beta!
                  </div>
                )}
              </CardHeader>

              <CardContent className="flex-grow">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <Check className={`h-4 w-4 ${plan.popular ? "text-emerald-500" : "text-primary"}`} />
                      </div>
                      <p className="text-sm text-foreground/80">{feature}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-4">
                <Button
                  className={`w-full text-base h-12 font-semibold transition-all duration-300 ${
                    plan.popular && !plan.isCurrent
                      ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                      : plan.tagType === "upcoming"
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  variant={plan.popular && !plan.isCurrent ? "default" : "outline"}
                  disabled={plan.disabled || isUpgrading}
                  onClick={() => {
                    if (plan.isPro && !isPro) {
                      handleBetaUpgrade();
                    }
                  }}
                >
                  {isUpgrading && plan.isPro ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Upgrading...
                    </span>
                  ) : (
                    plan.buttonText
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Trust footer — Beta messaging */}
        <div className="mt-16 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <BetaBadge variant="glow" type="beta" />
          </div>
          <p className="text-muted-foreground text-sm">
            All Pro features are <strong>free during Beta</strong>. No payment required.
          </p>
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground/60">
            <span>🔒 SSL Encrypted</span>
            <span>🚀 Instant Upgrade</span>
            <span>📧 24/7 Support</span>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground">
            ← Back to Dashboard
          </Button>
        </div>
      </div>

      {/* ═══ Beta Upgrade Success Dialog ═══ */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center mb-4">
              <PartyPopper className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              🎉 Welcome to Pro!
            </h2>
            <BetaBadge variant="glow" type="beta" className="mb-3" />
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Since Neesh AI is currently in <strong className="text-foreground">Beta</strong>, the Pro plan is completely free! You now have unlimited projects, custom branding, cross-promotion, and all premium features.
            </p>
            <Button
              onClick={() => {
                setSuccessOpen(false);
                navigate("/dashboard");
              }}
              className="mt-6 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8"
            >
              Let's Go! 🚀
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pricing;
