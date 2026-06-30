import { Progress } from "@/components/ui/progress";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface HealthMetric {
  id: string;
  label: string;
  value: number;
  previousValue?: number;
  description: string;
}

interface IdeaHealthScoreProps {
  clarityIndex: number;
  marketSignal: number;
  gapVelocity: number;
  validationMomentum: number;
  previousMetrics?: {
    clarityIndex?: number;
    marketSignal?: number;
    gapVelocity?: number;
    validationMomentum?: number;
  };
}

const IdeaHealthScore = ({
  clarityIndex,
  marketSignal,
  gapVelocity,
  validationMomentum,
  previousMetrics,
}: IdeaHealthScoreProps) => {
  const metrics: HealthMetric[] = [
    {
      id: "clarity",
      label: "Clarity Index",
      value: clarityIndex,
      previousValue: previousMetrics?.clarityIndex,
      description: "How well people understand your idea",
    },
    {
      id: "market",
      label: "Market Signal",
      value: marketSignal,
      previousValue: previousMetrics?.marketSignal,
      description: "Interest from high-value personas",
    },
    {
      id: "velocity",
      label: "Gap Velocity",
      value: gapVelocity,
      previousValue: previousMetrics?.gapVelocity,
      description: "How fast you're closing gaps",
    },
    {
      id: "momentum",
      label: "Validation Momentum",
      value: validationMomentum,
      previousValue: previousMetrics?.validationMomentum,
      description: "Overall progress trend",
    },
  ];

  const overallScore = Math.round((clarityIndex + marketSignal + gapVelocity + validationMomentum) / 4);
  
  const getScoreLabel = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "text-success" };
    if (score >= 60) return { label: "Good", color: "text-primary" };
    if (score >= 40) return { label: "Developing", color: "text-warning-foreground" };
    return { label: "Needs Work", color: "text-destructive" };
  };

  const getTrend = (current: number, previous?: number) => {
    if (previous === undefined) return null;
    const diff = current - previous;
    if (diff > 5) return { icon: ArrowUp, color: "text-success", value: `+${diff}` };
    if (diff < -5) return { icon: ArrowDown, color: "text-destructive", value: `${diff}` };
    return { icon: Minus, color: "text-muted-foreground", value: "0" };
  };

  const scoreInfo = getScoreLabel(overallScore);

  return (
    <div className="border-2 border-primary/30 bg-gradient-to-br from-secondary/50 to-white overflow-hidden">
      {/* Header with futuristic styling */}
      <div className="p-5 border-b border-primary/20 bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Idea Health Score</h2>
          <p className="text-sm text-muted-foreground">AI-powered validation metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className={`text-3xl font-bold ${scoreInfo.color}`}>{overallScore}</p>
            <p className={`text-xs font-medium ${scoreInfo.color}`}>{scoreInfo.label}</p>
          </div>
          <div className={`w-2 h-16 ${overallScore >= 60 ? "bg-success" : overallScore >= 40 ? "bg-warning" : "bg-destructive"}`} />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="divide-y divide-primary/20">
        {metrics.map((metric) => {
          const trend = getTrend(metric.value, metric.previousValue);
          
          return (
            <div key={metric.id} className="p-4 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-medium text-foreground">{metric.label}</span>
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  {trend && (
                    <span className={`flex items-center gap-0.5 text-xs ${trend.color}`}>
                      <trend.icon className="w-3 h-3" />
                      {trend.value}
                    </span>
                  )}
                  <span className="text-lg font-bold text-primary w-14 text-right">{metric.value}%</span>
                </div>
              </div>
              <Progress value={metric.value} className="h-2" />
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-4 bg-secondary/30 border-t border-primary/20">
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-success" /> 80+ Excellent
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-primary" /> 60-79 Good
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-warning" /> 40-59 Developing
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-destructive" /> &lt;40 Needs Work
          </span>
        </div>
      </div>
    </div>
  );
};

export default IdeaHealthScore;
