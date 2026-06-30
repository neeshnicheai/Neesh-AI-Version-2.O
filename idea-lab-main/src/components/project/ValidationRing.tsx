import { useState, useRef } from "react";
import {
  Users,
  FileText,
  MessageSquare,
  ThumbsUp,
  AlertTriangle,
  BookOpen,
  Bot,
  ChevronRight,
} from "lucide-react";

interface ValidationNode {
  id: string;
  label: string;
  icon: React.ElementType;
  count: number;
  description: string;
}

interface ValidationRingProps {
  visitors: number;
  questions: number;
  feedback: number;
  gaps: number;
  knowledgeItems: number;
  loopHealth: number;
  onNodeClick?: (nodeId: string) => void;
}

const ValidationRing = ({
  visitors,
  questions,
  feedback,
  gaps,
  knowledgeItems,
  loopHealth,
  onNodeClick,
}: ValidationRingProps) => {
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const nodes: ValidationNode[] = [
    { id: "visitors", label: "Visitors", icon: Users, count: visitors, description: "People landing on your idea" },
    { id: "blog", label: "Idea Blog", icon: FileText, count: 1, description: "Your published idea page" },
    { id: "questions", label: "Questions", icon: MessageSquare, count: questions, description: "Questions from your audience" },
    { id: "feedback", label: "Feedback", icon: ThumbsUp, count: feedback, description: "Direct feedback received" },
    { id: "gaps", label: "Gaps", icon: AlertTriangle, count: gaps, description: "AI-detected confusion areas" },
    { id: "knowledge", label: "Knowledge", icon: BookOpen, count: knowledgeItems, description: "Your uploaded clarifications" },
    { id: "chatbot", label: "AI Agent", icon: Bot, count: 1, description: "Re-trained with new knowledge" },
  ];

  const getHealthColor = (health: number) => {
    if (health >= 70) return "text-success";
    if (health >= 40) return "text-warning-foreground";
    return "text-destructive";
  };

  const getHealthBg = (health: number) => {
    if (health >= 70) return "bg-success";
    if (health >= 40) return "bg-warning";
    return "bg-destructive";
  };

  const handleMouseEnter = (e: React.MouseEvent, description: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({
      text: description,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="border border-border bg-card">
      {/* Header */}
      <div className="p-5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Validation Loop</h2>
            <p className="text-sm text-muted-foreground">Real-time interaction flow</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Loop Health</p>
              <p className={`text-3xl font-bold ${getHealthColor(loopHealth)}`}>{loopHealth}%</p>
            </div>
            <div className={`w-2 h-16 ${getHealthBg(loopHealth)}`} />
          </div>
        </div>
      </div>

      {/* Flow Diagram - scrollable */}
      <div className="p-6 overflow-x-auto">
        <div className="flex items-stretch gap-1 min-w-max">
          {nodes.map((node, index) => {
            const Icon = node.icon;
            const isLast = index === nodes.length - 1;

            return (
              <div key={node.id} className="flex items-center">
                <div
                  className="relative cursor-pointer transition-all duration-200 flex-shrink-0 group"
                  onMouseEnter={(e) => handleMouseEnter(e, node.description)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => onNodeClick?.(node.id)}
                >
                  {/* Node container */}
                  <div className="flex flex-col items-center p-4 bg-card border border-border transition-all duration-200 min-w-[100px] group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/20 group-hover:bg-primary/5">
                    <div className="w-12 h-12 flex items-center justify-center mb-3 transition-colors bg-secondary group-hover:bg-primary">
                      <Icon className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
                    </div>
                    <p className="text-xs font-medium text-foreground text-center mb-1 whitespace-nowrap">{node.label}</p>
                    <p className="text-2xl font-bold text-foreground group-hover:text-primary">
                      {node.count}
                    </p>
                  </div>
                </div>

                {/* Connector arrow */}
                {!isLast && (
                  <div className="flex items-center px-1">
                    <div className="w-4 h-0.5 bg-primary" />
                    <ChevronRight className="w-5 h-5 text-primary -ml-1" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Loop back indicator */}
      <div className="px-6 pb-5">
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-gradient-to-r from-transparent to-primary" />
              <div className="w-2 h-2 bg-primary rotate-45" />
            </div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Continuous Feedback Loop
            </span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rotate-45" />
              <div className="w-8 h-0.5 bg-gradient-to-l from-transparent to-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Fixed tooltip — rendered at viewport level, never clipped */}
      {tooltip && (
        <div
          className="fixed z-[9999] px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-xl whitespace-nowrap pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y - 44,
            transform: "translateX(-50%)",
          }}
        >
          {tooltip.text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
};

export default ValidationRing;
