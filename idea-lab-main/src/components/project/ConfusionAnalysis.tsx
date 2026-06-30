import { Button } from "@/components/ui/button";
import { ArrowRight, FileEdit, BookOpen } from "lucide-react";

type PersonaType = "developer" | "marketer" | "investor" | "designer" | "entrepreneur" | "researcher" | "other";

interface ConfusionPattern {
  id: string;
  topic: string;
  questionCount: number;
  personas: PersonaType[];
  suggestedContent: string;
  contentType: "blog" | "knowledge";
}

interface ConfusionAnalysisProps {
  patterns: ConfusionPattern[];
  onAddContent?: (patternId: string, type: "blog" | "knowledge") => void;
}

const personaLabels: Record<PersonaType, string> = {
  developer: "Dev",
  marketer: "Mkt",
  investor: "Inv",
  designer: "Des",
  entrepreneur: "Ent",
  researcher: "Res",
  other: "Other",
};

const getPersonaLabel = (persona: string) => {
  return personaLabels[persona as PersonaType] || "Other";
};

const ConfusionAnalysis = ({ patterns, onAddContent }: ConfusionAnalysisProps) => {
  if (patterns.length === 0) {
    return (
      <div className="border border-border bg-card p-6">
        <div className="text-center py-8">
          <p className="text-sm font-medium text-foreground">No confusion patterns detected</p>
          <p className="text-xs text-muted-foreground mt-1">Your audience seems to understand your idea well</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">What's Confusing Them</h2>
        <p className="text-sm text-muted-foreground">AI-analyzed confusion patterns with content suggestions</p>
      </div>

      {/* Patterns Table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left bg-muted/30">
            <th className="p-4 font-medium text-muted-foreground">Topic</th>
            <th className="p-4 font-medium text-muted-foreground">Questions</th>
            <th className="p-4 font-medium text-muted-foreground">Personas</th>
            <th className="p-4 font-medium text-muted-foreground">Suggested Content</th>
            <th className="p-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {patterns.map((pattern) => (
            <tr key={pattern.id} className="hover:bg-muted/50">
              <td className="p-4 font-medium text-foreground">{pattern.topic}</td>
              <td className="p-4 text-muted-foreground">{pattern.questionCount}</td>
              <td className="p-4">
                <div className="flex items-center gap-1">
                  {pattern.personas.map((persona) => (
                    <span
                      key={persona}
                      className="text-xs px-1.5 py-0.5 bg-secondary text-secondary-foreground"
                    >
                      {getPersonaLabel(persona)}
                    </span>
                  ))}
                </div>
              </td>
              <td className="p-4 text-muted-foreground max-w-xs truncate">{pattern.suggestedContent}</td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onAddContent?.(pattern.id, "blog")}
                  >
                    <FileEdit className="w-3 h-3 mr-1" />
                    Blog
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddContent?.(pattern.id, "knowledge")}
                  >
                    <BookOpen className="w-3 h-3 mr-1" />
                    KB
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ConfusionAnalysis;
