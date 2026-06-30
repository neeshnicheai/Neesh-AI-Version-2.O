import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { ExternalLink, Bot, Share2, Activity, Plus } from "lucide-react";

type ValidationStage = "early" | "gathering" | "detecting" | "refining" | "validated";

interface IdeaPulseCardProps {
  title: string;
  summary?: string;
  status: string;
  validationStage: ValidationStage;
  lastInteractionAt?: Date;
  onShare?: () => void;
  onViewBlog?: () => void;
  onTestChatbot?: () => void;
  onLinkProject?: () => void;
}

const stageConfig: Record<ValidationStage, { label: string; color: string; bgColor: string }> = {
  early: { label: "Early Stage", color: "text-muted-foreground", bgColor: "bg-secondary" },
  gathering: { label: "Gathering Feedback", color: "text-primary", bgColor: "bg-primary/10" },
  detecting: { label: "Detecting Gaps", color: "text-warning-foreground", bgColor: "bg-warning" },
  refining: { label: "Refining Idea", color: "text-primary", bgColor: "bg-primary/10" },
  validated: { label: "Validated", color: "text-success-foreground", bgColor: "bg-success" },
};

const IdeaPulseCard = ({
  title,
  summary,
  status,
  validationStage,
  lastInteractionAt,
  onShare,
  onViewBlog,
  onTestChatbot,
  onLinkProject,
}: IdeaPulseCardProps) => {
  const stage = stageConfig[validationStage];
  const timeAgo = lastInteractionAt
    ? formatDistanceToNow(lastInteractionAt, { addSuffix: true })
    : "No interactions yet";

  return (
    <div className="border border-border bg-card">
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-semibold text-foreground">{title}</h1>
              <span className={`text-xs font-medium px-2 py-1 ${stage.bgColor} ${stage.color}`}>
                {stage.label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="capitalize">{status}</span>
              <span className="w-1 h-1 bg-border rounded-full" />
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" />
                Last activity {timeAgo}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onShare}>
              <Share2 className="w-4 h-4 mr-1.5" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={onViewBlog}>
              <ExternalLink className="w-4 h-4 mr-1.5" />
              View Blog
            </Button>
            <Button size="sm" onClick={onTestChatbot}>
              <Bot className="w-4 h-4 mr-1.5" />
              Test Chatbot
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={onLinkProject} title="Link a project">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {summary && (
        <div className="p-6">
          <p className="text-muted-foreground leading-relaxed max-w-3xl">{summary}</p>
        </div>
      )}
    </div>
  );
};

export default IdeaPulseCard;
