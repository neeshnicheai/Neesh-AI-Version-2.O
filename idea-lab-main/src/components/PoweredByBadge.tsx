import { NeeshLogo } from "@/components/NeeshLogo";

interface PoweredByBadgeProps {
  /** If true, show the badge (for Free users) */
  show: boolean;
  /** Custom logo URL (for Pro users replacing Neesh branding) */
  customLogoUrl?: string;
  /** Custom branding text (for Pro users) */
  customBrandingText?: string;
}

const PoweredByBadge = ({ show, customLogoUrl, customBrandingText }: PoweredByBadgeProps) => {
  // Pro users with custom branding
  if (!show && (customLogoUrl || customBrandingText)) {
    return (
      <div className="flex items-center justify-center gap-3 py-6 mt-8 border-t border-border/30">
        {customLogoUrl && (
          <img src={customLogoUrl} alt="Brand" className="h-8 object-contain" />
        )}
        {customBrandingText && (
          <span className="text-sm text-muted-foreground font-medium">{customBrandingText}</span>
        )}
      </div>
    );
  }

  // Free users — mandatory Neesh AI branding
  if (!show) return null;

  return (
    <div className="flex items-center justify-center gap-3 py-6 mt-8 border-t border-border/30">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border border-border/30">
        <NeeshLogo size="sm" />
        <span className="text-sm text-muted-foreground font-medium">
          Powered by <span className="text-foreground font-semibold">Neesh AI</span>
        </span>
      </div>
    </div>
  );
};

export default PoweredByBadge;
