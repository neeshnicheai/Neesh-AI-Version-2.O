import { Sparkles, TrendingUp, AlertCircle, Lightbulb, ArrowRight } from "lucide-react";

interface AISummaryCardProps {
  summary: string;
  strengths: string[];
  opportunities: string[];
  nextSteps: string[];
  validationStage: string;
}

const AISummaryCard = ({
  summary,
  strengths,
  opportunities,
  nextSteps,
  validationStage,
}: AISummaryCardProps) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-secondary to-primary/10 border-2 border-primary/30">
      {/* Futuristic accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
      
      {/* Header */}
      <div className="p-6 border-b border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              AI Analysis Summary
              <span className="text-xs font-medium px-2 py-0.5 bg-primary text-primary-foreground uppercase tracking-wider">
                {validationStage}
              </span>
            </h2>
            <p className="text-sm text-muted-foreground">Real-time insights from your validation data</p>
          </div>
        </div>
      </div>

      {/* Main Summary */}
      <div className="p-6 border-b border-primary/20 bg-white/50">
        <p className="text-lg text-foreground leading-relaxed">
          {summary}
        </p>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-primary/20">
        {/* Strengths */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-success" />
            <h3 className="font-semibold text-foreground">Strengths</h3>
          </div>
          <ul className="space-y-2">
            {strengths.slice(0, 3).map((strength, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <ArrowRight className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Opportunities */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-warning-foreground" />
            <h3 className="font-semibold text-foreground">Opportunities</h3>
          </div>
          <ul className="space-y-2">
            {opportunities.slice(0, 3).map((opportunity, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <ArrowRight className="w-3.5 h-3.5 text-warning-foreground mt-0.5 flex-shrink-0" />
                <span>{opportunity}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Next Steps */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Recommended Actions</h3>
          </div>
          <ul className="space-y-2">
            {nextSteps.slice(0, 3).map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="w-5 h-5 bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0 font-medium">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Futuristic bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </div>
  );
};

export default AISummaryCard;
