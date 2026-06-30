/**
 * BetaBadge — reusable badge for Beta / Upcoming tags.
 *
 * Variants:
 *   "glow"   → animated green glow (landing page, pricing cards)
 *   "static" → flat green badge, no animation (dashboard button)
 *
 * type:
 *   "beta"     → green BETA tag
 *   "upcoming" → violet UPCOMING tag
 */

interface BetaBadgeProps {
  variant?: "glow" | "static";
  type?: "beta" | "upcoming";
  className?: string;
}

export const BetaBadge = ({
  variant = "glow",
  type = "beta",
  className = "",
}: BetaBadgeProps) => {
  const isBeta = type === "beta";

  // ── Colours ──
  const bg = isBeta ? "bg-emerald-500/15" : "bg-violet-500/15";
  const border = isBeta ? "border-emerald-400/40" : "border-violet-400/40";
  const text = isBeta ? "text-emerald-400" : "text-violet-400";
  const shadow = isBeta
    ? "shadow-[0_0_8px_rgba(16,185,129,0.45),0_0_20px_rgba(16,185,129,0.2)]"
    : "shadow-[0_0_8px_rgba(139,92,246,0.45),0_0_20px_rgba(139,92,246,0.2)]";
  const dot = isBeta ? "bg-emerald-400" : "bg-violet-400";
  const dotShadow = isBeta
    ? "shadow-[0_0_6px_rgba(16,185,129,0.8)]"
    : "shadow-[0_0_6px_rgba(139,92,246,0.8)]";

  // Glow uses the box-shadow + pulse animation; static is plain
  const glowClasses =
    variant === "glow" ? `${shadow} animate-pulse` : "";

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-0.5
        rounded-full
        text-[10px] font-bold tracking-widest uppercase
        border
        select-none
        ${bg} ${border} ${text} ${glowClasses}
        ${className}
      `}
    >
      {variant === "glow" && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dot} ${dotShadow}`}
        />
      )}
      {isBeta ? "BETA" : "UPCOMING"}
    </span>
  );
};

/**
 * Light-theme variant used on the landing page (white background).
 * Same API, but colours are tuned for light backgrounds.
 */
export const BetaBadgeLight = ({
  variant = "glow",
  type = "beta",
  className = "",
}: BetaBadgeProps) => {
  const isBeta = type === "beta";

  const bg = isBeta ? "bg-emerald-50" : "bg-violet-50";
  const border = isBeta ? "border-emerald-400/50" : "border-violet-400/50";
  const text = isBeta ? "text-emerald-600" : "text-violet-600";
  const shadow = isBeta
    ? "shadow-[0_0_10px_rgba(16,185,129,0.35),0_0_24px_rgba(16,185,129,0.15)]"
    : "shadow-[0_0_10px_rgba(139,92,246,0.35),0_0_24px_rgba(139,92,246,0.15)]";
  const dot = isBeta ? "bg-emerald-500" : "bg-violet-500";
  const dotShadow = isBeta
    ? "shadow-[0_0_6px_rgba(16,185,129,0.7)]"
    : "shadow-[0_0_6px_rgba(139,92,246,0.7)]";

  const glowClasses = variant === "glow" ? `${shadow} animate-pulse` : "";

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-0.5
        rounded-full
        text-[10px] font-bold tracking-widest uppercase
        border
        select-none
        ${bg} ${border} ${text} ${glowClasses}
        ${className}
      `}
    >
      {variant === "glow" && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dot} ${dotShadow}`}
        />
      )}
      {isBeta ? "BETA" : "UPCOMING"}
    </span>
  );
};
