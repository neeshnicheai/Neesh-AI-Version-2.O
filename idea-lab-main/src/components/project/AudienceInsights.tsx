import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Code,
  TrendingUp,
  DollarSign,
  Palette,
  Lightbulb,
  FlaskConical,
  HelpCircle,
  Download,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  User,
  Mail,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAudienceData, type AudienceMember, type AggregatedPersonaData } from "@/hooks/useAudienceData";
import { useNotifications, type ClusterSummary } from "@/hooks/useNotifications";
import type { Database } from "@/integrations/supabase/types";

type PersonaType = Database["public"]["Enums"]["audience_persona"];

const personaConfig: Record<PersonaType, { name: string; icon: React.ElementType; color: string; bgColor: string }> = {
  developer: { name: "Developers", icon: Code, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  marketer: { name: "Marketers", icon: TrendingUp, color: "text-green-500", bgColor: "bg-green-500/10" },
  investor: { name: "Investors", icon: DollarSign, color: "text-amber-500", bgColor: "bg-amber-500/10" },
  designer: { name: "Designers", icon: Palette, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  entrepreneur: { name: "Entrepreneurs", icon: Lightbulb, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  researcher: { name: "Researchers", icon: FlaskConical, color: "text-cyan-500", bgColor: "bg-cyan-500/10" },
  other: { name: "Others", icon: HelpCircle, color: "text-muted-foreground", bgColor: "bg-muted" },
};

interface AudienceInsightsProps {
  projectId: string;
}

const AudienceInsights = ({ projectId }: AudienceInsightsProps) => {
  const {
    members,
    loading,
    error,
    refetch,
    getAggregatedPersonaData,
    stats,
  } = useAudienceData(projectId);

  const {
    clusters,
    loading: notificationsLoading,
    unansweredCount,
  } = useNotifications(projectId);

  const [selectedPersona, setSelectedPersona] = useState<PersonaType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeView, setActiveView] = useState<"overview" | "members">("overview");

  // Map clusters to personas for detailed insights
  const aggregatedPersonas = useMemo(() => {
    const baseGroups = getAggregatedPersonaData();
    const personaKeywords: Record<string, string[]> = {
      developer: ["developer", "engineer", "software", "tech", "code", "programm", "stack", "dev", "frontend", "backend", "api"],
      marketer: ["market", "growth", "seo", "sales", "content", "advert"],
      investor: ["invest", "vc", "fund", "capital", "finance", "equity"],
      designer: ["design", "ui", "ux", "creative", "graphic", "art"],
      entrepreneur: ["entrepreneur", "founder", "ceo", "business", "startup", "owner"],
      researcher: ["research", "academ", "student", "science", "analys", "studi", "phd", "university", "professor"],
    };
    
    return baseGroups.map(group => {
      const keywords = personaKeywords[group.persona] || [];
      
      // Find clusters associated with this persona
      const personaClusters = clusters.filter(c => {
        const summary = (c.personaSummary || "").toLowerCase();
        const question = (c.canonicalQuestion || "").toLowerCase();
        const combinedText = `${summary} ${question}`;
        
        if (group.persona === "other") {
          // "Other" gets clusters that don't match any primary persona keywords
          const allKeywords = Object.values(personaKeywords).flat();
          return !allKeywords.some(k => combinedText.includes(k));
        }
        
        // Primary personas get clusters that match any of their keywords in summary OR question text
        return keywords.some(k => combinedText.includes(k));
      });

      // Collect feedback themes from members in this persona
      const personaMembers = baseGroups.find(bg => bg.persona === group.persona)?.feedbackCount || 0;
      const feedbackThemes = members
        .filter(m => (m.detected_persona || 'other') === group.persona && m.feedbackSummary)
        .map(m => m.feedbackSummary!)
        .slice(0, 3);

      return {
        ...group,
        totalQuestions: personaClusters.reduce((sum, c) => sum + c.totalAskCount, 0),
        confusionPoints: personaClusters.length > 0 
          ? personaClusters
              .filter(c => c.status !== 'answered')
              .slice(0, 3)
              .map(c => ({
                topic: c.canonicalQuestion,
                count: c.totalAskCount
              }))
          : feedbackThemes.length > 0
            ? feedbackThemes.map(theme => ({ topic: theme, count: 1 }))
            : [],
        commonQuestions: personaClusters.length > 0
          ? personaClusters.slice(0, 3).map(c => c.canonicalQuestion)
          : feedbackThemes.length > 0
            ? feedbackThemes
            : [],
        contentSuggestions: [
          ...(personaClusters.length > 0 
            ? personaClusters.filter(c => c.status !== 'answered').slice(0, 2).map(c => `Explain ${c.canonicalQuestion} in your next update`)
            : []),
          ...(feedbackThemes.length > 0
            ? feedbackThemes.slice(0, 2).map(theme => `Address feedback: "${theme}"`)
            : []),
          ...(personaClusters.length === 0 && feedbackThemes.length === 0 
            ? [`Create a guide tailored for ${personaConfig[group.persona].name}`] 
            : [])
        ].slice(0, 3)
      };
    });
  }, [getAggregatedPersonaData, clusters, members]);

  const selectedPersonaData = selectedPersona
    ? (aggregatedPersonas as any[]).find((p) => p.persona === selectedPersona)
    : null;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    await refetch();
    setIsAnalyzing(false);
    toast.success("Audience analysis complete!", {
      description: "Persona insights have been updated",
    });
  };

  const handleExportCRM = () => {
    if (members.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["Name", "Email", "Occupation", "Persona", "Confidence", "Questions Asked", "Last Active"];
    const rows = members.map((m) => [
      m.name,
      m.email,
      m.occupation || "",
      m.detected_persona || "other",
      `${Math.round((m.persona_confidence || 0) * 100)}%`,
      (m.total_questions || 0).toString(),
      new Date(m.last_interaction_at).toLocaleDateString(),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audience-export-${projectId}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Export complete!", {
      description: "Audience data downloaded as CSV",
    });
  };

  if (loading || notificationsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={refetch} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state
  if (members.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Audience Insights</h2>
            <p className="text-muted-foreground mt-1">
              AI-powered persona detection and confusion analysis
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border/30 p-12 text-center shadow-card">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No audience data yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Share your blog and chatbot with your audience. As they interact, we'll automatically detect their personas and provide insights.
          </p>
          <Button onClick={refetch} variant="outline" className="rounded-xl">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Audience Insights</h2>
          <p className="text-muted-foreground mt-1">
            AI-powered persona detection and confusion analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl gap-2"
            onClick={handleExportCRM}
          >
            <Download className="w-4 h-4" />
            Export for CRM
          </Button>
          <Button
            className="rounded-xl gap-2"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isAnalyzing ? "Analyzing..." : "Re-analyze"}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border border-border/30 p-5 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Total Audience</span>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">{stats.totalMembers}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border/30 p-5 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-accent" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Total Questions</span>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">
            {clusters.reduce((sum, c) => sum + c.totalAskCount, 0)}
          </p>
        </div>
        <div className="bg-card rounded-2xl border border-border/30 p-5 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Confusion Points</span>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">
            {clusters.filter(c => c.status !== 'answered').length}
          </p>
        </div>
        <div className="bg-card rounded-2xl border border-border/30 p-5 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-success" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Suggestions</span>
          </div>
          <p className="text-3xl font-display font-bold text-foreground">
            {clusters.filter(c => c.status !== 'answered').length}
          </p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2 border-b border-border/50 pb-3">
        <button
          onClick={() => setActiveView("overview")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeView === "overview"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Persona Overview
        </button>
        <button
          onClick={() => setActiveView("members")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeView === "members"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Audience Members
        </button>
      </div>

      {activeView === "overview" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Persona Cards */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Audience Personas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {aggregatedPersonas.map((personaData) => {
                const config = personaConfig[personaData.persona];
                const Icon = config.icon;
                const isSelected = selectedPersona === personaData.persona;
                return (
                  <div
                    key={personaData.persona}
                    onClick={() => setSelectedPersona(isSelected ? null : personaData.persona)}
                    className={`bg-card rounded-2xl border p-5 shadow-card cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border/30 hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 ${config.color}`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{config.name}</h4>
                          <p className="text-sm text-muted-foreground">{personaData.members} members</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${isSelected ? "rotate-90" : ""}`} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Distribution</span>
                        <span className="font-medium text-foreground">{personaData.percentage}%</span>
                      </div>
                      <Progress value={personaData.percentage} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Persona Details */}
          <div className="space-y-4">
            {selectedPersonaData ? (
              <>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  {(() => {
                    const config = personaConfig[selectedPersonaData.persona];
                    const Icon = config.icon;
                    return <Icon className={`w-5 h-5 ${config.color}`} />;
                  })()}
                  {personaConfig[selectedPersonaData.persona].name} Insights
                </h3>

                {/* Confusion Points */}
                <div className="bg-card rounded-2xl border border-border/30 p-5 shadow-card">
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    Confusion Points
                  </h4>
                  {selectedPersonaData.confusionPoints.length > 0 ? (
                    <div className="space-y-3">
                      {selectedPersonaData.confusionPoints.map((point, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-foreground">{point.topic}</span>
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-warning/10 text-warning">
                            {point.count} questions
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No confusion points detected yet.</p>
                  )}
                </div>

                {/* Common Questions */}
                <div className="bg-card rounded-2xl border border-border/30 p-5 shadow-card">
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-accent" />
                    Common Questions
                  </h4>
                  {selectedPersonaData.commonQuestions.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedPersonaData.commonQuestions.map((q, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          {q}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No questions recorded yet.</p>
                  )}
                </div>

                {/* AI Suggestions */}
                <div className="bg-card rounded-2xl border border-border/30 p-5 shadow-card">
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    AI Content Suggestions
                  </h4>
                  {selectedPersonaData.contentSuggestions.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedPersonaData.contentSuggestions.map((s, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No suggestions available yet.</p>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-card rounded-2xl border border-border/30 p-8 text-center shadow-card">
                <User className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Select a persona to view detailed insights
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Members List View */
        <div className="bg-card rounded-2xl border border-border/30 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-left p-4 font-semibold text-muted-foreground text-sm">Name</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground text-sm">Email</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground text-sm">Occupation</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground text-sm">Persona</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground text-sm">Confidence</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground text-sm">Questions</th>
                  <th className="text-left p-4 font-semibold text-muted-foreground text-sm">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const config = personaConfig[member.detected_persona || "other"];
                  const Icon = config.icon;
                  return (
                    <tr key={member.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <span className="font-medium">{member.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{member.email}</td>
                      <td className="p-4 text-muted-foreground">{member.occupation || "-"}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${config.color}`} />
                          <span className="text-sm">{config.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-medium">
                          {Math.round((member.persona_confidence || 0) * 100)}%
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{member.total_questions || 0}</span>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">
                        {new Date(member.last_interaction_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudienceInsights;
