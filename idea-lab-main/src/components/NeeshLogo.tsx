import neeshLogo from "@/assets/neesh-logo.png";

interface NeeshLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export const NeeshLogo = ({ size = "md", showText = true }: NeeshLogoProps) => {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-14",
  };

  return (
    <div className="flex items-center gap-2">
      <img 
        src={neeshLogo} 
        alt="Neesh AI Logo" 
        className={`${sizeClasses[size]} w-auto object-contain`}
      />
      {showText && (
        <span className="font-semibold text-xl text-foreground tracking-tight">
          Neesh <span className="text-primary">AI</span>
        </span>
      )}
    </div>
  );
};
