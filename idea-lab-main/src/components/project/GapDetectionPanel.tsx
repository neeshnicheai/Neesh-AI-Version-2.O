import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, CheckCircle2, Clock, Users } from "lucide-react";

interface GapItem {
  id: string;
  topic: string;
  questionCount: number;
  personas: string[];
  severity: "low" | "medium" | "high";
  isResolved: boolean;
  resolvedAt?: Date;
}

interface GapDetectionPanelProps {
  activeGaps: GapItem[];
  resolvedGaps: GapItem[];
  onFixGap?: (gapId: string) => void;
}

const severityConfig = {
  low: { color: "text-muted-foreground", bgColor: "bg-secondary", label: "Low" },
  medium: { color: "text-warning-foreground", bgColor: "bg-warning", label: "Medium" },
  high: { color: "text-destructive-foreground", bgColor: "bg-destructive", label: "High" },
};

const GapDetectionPanel = ({ activeGaps, resolvedGaps, onFixGap }: GapDetectionPanelProps) => {
  const totalGaps = activeGaps.length + resolvedGaps.length;
  const resolutionRate = totalGaps > 0 ? Math.round((resolvedGaps.length / totalGaps) * 100) : 0;

  return (
    <div className="border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Gap Detection</h2>
          <p className="text-sm text-muted-foreground">Topics that need clarification</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Gaps Closed</p>
          <p className="text-xl font-semibold text-foreground">{resolutionRate}%</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Active Gaps Table */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-warning rounded-full" />
            <h3 className="text-sm font-medium text-foreground">Active Gaps ({activeGaps.length})</h3>
          </div>
          
          {activeGaps.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 font-medium text-muted-foreground">Topic</th>
                  <th className="pb-2 font-medium text-muted-foreground">Questions</th>
                  <th className="pb-2 font-medium text-muted-foreground">Personas</th>
                  <th className="pb-2 font-medium text-muted-foreground">Priority</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeGaps.map((gap) => {
                  const severity = severityConfig[gap.severity];
                  return (
                    <tr key={gap.id} className="hover:bg-muted/50">
                      <td className="py-3 font-medium text-foreground">{gap.topic}</td>
                      <td className="py-3 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {gap.questionCount}
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {gap.personas.length}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-0.5 ${severity.bgColor} ${severity.color}`}>
                          {severity.label}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onFixGap?.(gap.id)}
                        >
                          Fix <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 bg-muted/30 border border-border">
              <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">No active gaps</p>
              <p className="text-xs text-muted-foreground mt-1">All confusion points have been addressed</p>
            </div>
          )}
        </div>

        {/* Resolved Gaps */}
        {resolvedGaps.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <h3 className="text-sm font-medium text-foreground">Resolved ({resolvedGaps.length})</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {resolvedGaps.map((gap) => (
                <span
                  key={gap.id}
                  className="text-xs px-2 py-1 bg-success/10 text-success border border-success/20"
                >
                  {gap.topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="text-muted-foreground">Progress to Zero Gaps</span>
            <span className="font-medium text-foreground">{resolutionRate}%</span>
          </div>
          <Progress value={resolutionRate} className="h-1.5" />
        </div>
      </div>
    </div>
  );
};

export default GapDetectionPanel;
