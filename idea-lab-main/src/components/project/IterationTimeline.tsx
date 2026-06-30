import { formatDistanceToNow } from "date-fns";
import { BookOpen, FileEdit, CheckCircle2, TrendingDown, TrendingUp } from "lucide-react";

interface TimelineEvent {
  id: string;
  type: "knowledge_update" | "blog_update" | "gap_resolved";
  title: string;
  description: string;
  timestamp: Date;
  impactMetrics?: {
    questionsBefore: number;
    questionsAfter: number;
    gapsClosedCount: number;
  };
}

interface IterationTimelineProps {
  events: TimelineEvent[];
  totalIterations: number;
}

const eventConfig = {
  knowledge_update: { icon: BookOpen, color: "text-primary", label: "Knowledge Base" },
  blog_update: { icon: FileEdit, color: "text-muted-foreground", label: "Blog Update" },
  gap_resolved: { icon: CheckCircle2, color: "text-success", label: "Gap Resolved" },
};

const IterationTimeline = ({ events, totalIterations }: IterationTimelineProps) => {
  return (
    <div className="border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Iteration Timeline</h2>
          <p className="text-sm text-muted-foreground">Your validation journey</p>
        </div>
        <span className="text-sm text-muted-foreground">{totalIterations} iterations</span>
      </div>

      <div className="p-4">
        {events.length > 0 ? (
          <div className="space-y-0">
            {events.map((event, index) => {
              const config = eventConfig[event.type];
              const Icon = config.icon;
              const isLast = index === events.length - 1;
              const impactPositive = event.impactMetrics 
                ? event.impactMetrics.questionsAfter < event.impactMetrics.questionsBefore
                : null;

              return (
                <div key={event.id} className="relative flex gap-4">
                  {/* Timeline connector */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 flex items-center justify-center border ${
                      index === 0 ? "border-primary bg-primary/5" : "border-border bg-background"
                    }`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    {!isLast && <div className="w-px flex-1 bg-border min-h-[24px]" />}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 pb-4 ${!isLast ? "border-b border-border mb-4" : ""}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className={`text-xs ${config.color}`}>{config.label}</span>
                        <h4 className="text-sm font-medium text-foreground">{event.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                      </span>
                    </div>

                    {event.impactMetrics && (
                      <div className="flex items-center gap-4 mt-3 text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          {impactPositive ? (
                            <TrendingDown className="w-3.5 h-3.5 text-success" />
                          ) : (
                            <TrendingUp className="w-3.5 h-3.5 text-warning" />
                          )}
                          Questions: {event.impactMetrics.questionsBefore} → {event.impactMetrics.questionsAfter}
                        </span>
                        {event.impactMetrics.gapsClosedCount > 0 && (
                          <span className="flex items-center gap-1 text-success">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {event.impactMetrics.gapsClosedCount} gaps closed
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 border border-dashed border-border">
            <p className="text-sm text-muted-foreground">No iterations yet</p>
            <p className="text-xs text-muted-foreground mt-1">Updates will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IterationTimeline;
