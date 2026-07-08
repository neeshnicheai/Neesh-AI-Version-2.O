import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw, HelpCircle, Users, Trash2, Loader2, Rocket, ArrowRight, AlertTriangle, Copy, Check, Link as LinkIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import IdeaPulseCard from "./IdeaPulseCard";
import ValidationRing from "./ValidationRing";
import GapDetectionPanel from "./GapDetectionPanel";
import IdeaHealthScore from "./IdeaHealthScore";
import PersonaEngagementMatrix from "./PersonaEngagementMatrix";
import ConfusionAnalysis from "./ConfusionAnalysis";
import IterationTimeline from "./IterationTimeline";
import AISummaryCard from "./AISummaryCard";
import LinkedProjectsSection from "./LinkedProjectsSection";
import LinkProjectModal from "./LinkProjectModal";
import { generateShareableUrl } from "@/lib/slugify";
import { useAudienceData } from "@/hooks/useAudienceData";
import { useProjectLinks } from "@/hooks/useProjectLinks";
import ValidationReportView from "./ValidationReportView";

type ValidationStage = "early" | "gathering" | "detecting" | "refining" | "validated";
type PersonaType = "developer" | "marketer" | "investor" | "designer" | "entrepreneur" | "researcher" | "other";

interface ProjectOverviewProps {
  projectId: string;
  projectData: {
    title: string;
    summary?: string;
    description?: string;
    status: string;
    onboardingCompleted?: boolean;
  };
  validationReport?: string | null;
  onResumeOnboarding?: () => void;
  questionsData: Array<{
    question: string;
    count: number;
    answeredCount?: number;
  }>;
  onDeleteProject?: () => void;
  isDeleting?: boolean;
}

// Timeline events
interface TimelineEvent {
  id: string;
  type: "knowledge_update" | "blog_update" | "gap_resolved";
  title: string;
  description: string;
  timestamp: Date;
  impactMetrics?: { questionsBefore: number; questionsAfter: number; gapsClosedCount: number };
}

// ===== Analytics computation from real data =====

function computeValidationStage(totalInteractions: number): ValidationStage {
  if (totalInteractions === 0) return "early";
  if (totalInteractions <= 5) return "gathering";
  if (totalInteractions <= 15) return "detecting";
  if (totalInteractions <= 30) return "refining";
  return "validated";
}

function computeHealthScores(
  feedbackCount: number,
  uniqueOccupations: number,
  totalQuestions: number,
  unansweredCount: number
) {
  // Clarity Index: Feedback volume relative to base targets
  const clarityIndex = Math.min(100, Math.round((feedbackCount / 10) * 100));
  
  // Market Signal: Diversity of audience
  const marketSignal = Math.min(100, Math.round((uniqueOccupations / 5) * 100));
  
  // Gap Velocity: How well current questions are being addressed (inverse of unresolved gaps)
  const gapVelocity = totalQuestions > 0 
    ? Math.max(0, 100 - (unansweredCount * 10)) 
    : 100;
    
  // Validation Momentum: Combined weighted average
  const validationMomentum = Math.round((clarityIndex * 0.4 + marketSignal * 0.4 + gapVelocity * 0.2));

  return { clarityIndex, marketSignal, gapVelocity, validationMomentum };
}

function computeGaps(questionsData: Array<{ question: string; count: number; answeredCount?: number }>) {
  // Each question cluster that hasn't been fully addressed (answeredCount < totalCount)
  return questionsData
    .filter(q => (q.answeredCount || 0) < q.count)
    .map((q, i) => ({
      id: `gap-${i}`,
      topic: q.question,
      questionCount: q.count,
      personas: ["other" as PersonaType],
      severity: (q.count >= 5 ? "high" : q.count >= 3 ? "medium" : "low") as "low" | "medium" | "high",
      isResolved: false,
    }));
}

function computeConfusionPatterns(questionsData: Array<{ question: string; count: number }>) {
  // Top repeated questions become confusion patterns
  return questionsData
    .filter(q => q.count >= 2)
    .slice(0, 5)
    .map((q, i) => ({
      id: `pattern-${i}`,
      topic: q.question,
      questionCount: q.count,
      personas: ["other" as PersonaType],
      suggestedContent: `Add content addressing: "${q.question}"`,
      contentType: "knowledge" as const,
    }));
}

function computeSummary(
  feedbackCount: number,
  totalQuestions: number,
  uniqueOccupations: number,
  validationStage: ValidationStage,
  projectSummary?: string,
  projectDescription?: string
): { summary: string; strengths: string[]; opportunities: string[]; nextSteps: string[] } {
  const strengths: string[] = [];
  const opportunities: string[] = [];
  const nextSteps: string[] = [];

  // Build strengths
  if (feedbackCount > 0) strengths.push(`${feedbackCount} feedback response${feedbackCount > 1 ? "s" : ""} received`);
  if (uniqueOccupations >= 3) strengths.push(`Engaging ${uniqueOccupations} different audience personas`);
  if (totalQuestions > 0) strengths.push(`${totalQuestions} audience question${totalQuestions > 1 ? "s" : ""} captured`);
  if (strengths.length === 0) strengths.push("Project is active and ready for audience validation");

  // Build opportunities
  if (feedbackCount < 5) opportunities.push("Drive more traffic to reach 5+ feedback responses");
  if (totalQuestions === 0) opportunities.push("Enable Chatbot to capture audience questions");
  if (uniqueOccupations < 3) opportunities.push("Target diverse personas for broader validation");

  // Build next steps
  if (validationStage === "early") {
    nextSteps.push("Share your blog link to start collecting insights");
    nextSteps.push("Enrich Knowledge Base to prepare for audience queries");
  } else if (validationStage === "gathering") {
    nextSteps.push("Review feedback themes to identify pattern markers");
    nextSteps.push("Address repeated questions in the Knowledge Base");
  } else {
    nextSteps.push("Review Gap Detection to iterate on your value proposition");
    nextSteps.push("Examine persona-specific matrix to refine messaging");
  }

  const stageText: Record<ValidationStage, string> = {
    early: "Early validation stage. Start sharing to see real-time signals.",
    gathering: "Initial pulse detected! Audience interaction is beginning to flow.",
    detecting: "Patterns are emerging. Review the identified knowledge gaps.",
    refining: "High signal project! Feedback and questions are showing strong alignment.",
    validated: "High confidence validation! Your audience has clearly signaled product-market fit.",
  };

  const descText = (projectSummary && projectSummary.trim()) || (projectDescription && projectDescription.trim()) || "";
  const descriptionPart = descText ? descText.slice(0, 150) + "... " : "";

  return {
    summary: descriptionPart + stageText[validationStage],
    strengths,
    opportunities,
    nextSteps,
  };
}

// ===== Component =====

const ProjectOverview = ({ projectId, projectData, validationReport, onResumeOnboarding, questionsData, onDeleteProject, isDeleting }: ProjectOverviewProps) => {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Use real audience data from backend
  const {
    members: audienceMembers,
    loading: audienceLoading,
    stats: audienceStats,
    getAggregatedPersonaData,
  } = useAudienceData(projectId);

  // Project links
  const { linkedProjects, loading: linksLoading, linkProject, unlinkProject } = useProjectLinks(projectId);
  const [linkModalOpen, setLinkModalOpen] = useState(false);

  // ===== Compute all analytics locally from real data =====

  const totalFeedback = audienceStats.totalFeedback;
  const totalQuestions = questionsData.reduce((sum, q) => sum + q.count, 0);
  const unansweredQuestions = questionsData.filter(q => (q.answeredCount || 0) < q.count).length;
  const uniqueOccupations = audienceStats.uniqueOccupations;
  const totalInteractions = audienceStats.totalMembers + totalQuestions;

  const validationStage = useMemo(() => computeValidationStage(totalInteractions), [totalInteractions]);
  const healthScores = useMemo(
    () => computeHealthScores(totalFeedback, uniqueOccupations, totalQuestions, unansweredQuestions),
    [totalFeedback, uniqueOccupations, totalQuestions, unansweredQuestions]
  );
  const activeGaps = useMemo(() => computeGaps(questionsData), [questionsData]);
  const confusionPatterns = useMemo(() => computeConfusionPatterns(questionsData), [questionsData]);
  const aiSummary = useMemo(
    () => computeSummary(totalFeedback, totalQuestions, uniqueOccupations, validationStage, projectData.summary, projectData.description),
    [totalFeedback, totalQuestions, uniqueOccupations, validationStage, projectData.summary, projectData.description]
  );

  // Build persona engagement from real audience data
  const aggregatedPersonas = getAggregatedPersonaData();
  const personaEngagement = useMemo(() => {
    if (aggregatedPersonas.length > 0) {
      return aggregatedPersonas.map(p => ({
        persona: p.persona as PersonaType,
        visited: p.members,
        asked: 0, // Injected via clusters mapping when available
        feedback: p.feedbackCount,
        returned: 0,
      }));
    }
    return [];
  }, [aggregatedPersonas]);

  // Timeline events (from real data when available)
  const timelineEvents = useMemo((): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    if (audienceMembers.length > 0) {
      const earliest = audienceMembers.reduce((min, m) =>
        m.first_interaction_at < min ? m.first_interaction_at : min,
        audienceMembers[0].first_interaction_at
      );
      events.push({
        id: "first-interaction",
        type: "knowledge_update",
        title: "Validation Loop Started",
        description: "Your first audience member interacted with the blog",
        timestamp: new Date(earliest),
      });
    }
    if (totalFeedback > 0) {
      events.push({
        id: "feedback-milestone",
        type: "blog_update",
        title: `${totalFeedback} feedback points`,
        description: "Reached a new milestone of audience feedback",
        timestamp: new Date(),
      });
    }
    return events;
  }, [audienceMembers, totalFeedback]);

  // Find last interaction time
  const lastInteractionAt = useMemo(() => {
    if (audienceMembers.length > 0) {
      const latest = audienceMembers.reduce((max, m) =>
        m.last_interaction_at > max ? m.last_interaction_at : max,
        audienceMembers[0].last_interaction_at
      );
      return new Date(latest);
    }
    return null;
  }, [audienceMembers]);

  // ===== Handlers =====

  const handleShare = () => {
    // generateShareableUrl(projectId, projectTitle) — correct arg order
    const url = generateShareableUrl(projectId, projectData.title);
    navigator.clipboard.writeText(url);
    toast.success("Link copied!", { description: "Shareable link copied to clipboard" });
  };

  const handleViewBlog = () => {
    // Open the public blog URL (same as share link)
    const url = generateShareableUrl(projectId, projectData.title);
    window.open(url, "_blank");
  };

  const handleTestChatbot = () => {
    navigate(`/project/${projectId}/chatbot`);
  };

  const handleFixGap = (gapId: string) => {
    toast.info("Opening Knowledge Base", { description: "Add content to address this gap" });
  };

  const handleAddContent = (patternId: string, type: "blog" | "knowledge") => {
    if (type === "blog") {
      navigate(`/project/${projectId}/blog`);
    } else {
      toast.info("Opening Knowledge Base");
    }
  };

  const loopHealth = Math.round((healthScores.clarityIndex + healthScores.gapVelocity) / 2);

  // ===== Render =====

  if (audienceLoading) {
    return (
      <div className="space-y-4 max-w-[1200px] mx-auto">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (projectData.onboardingCompleted === false) {
    const resumeUrl = `${window.location.origin}/project/${projectId}?resume=true`;

    return (
      <div className="space-y-6 max-w-[1200px] mx-auto">
        {/* ⚠️ Warning Banner */}
        <div className="flex items-start gap-4 p-5 rounded-2xl border-2 border-amber-400/60 bg-amber-50 dark:bg-amber-950/30 shadow-sm">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-800 dark:text-amber-300 text-base">Incomplete Validation — Analytics Locked</h3>
            <p className="text-sm text-amber-700 dark:text-amber-400/80 mt-1 leading-relaxed">
              Your validation questionnaire is incomplete. Without finishing it, your AI-powered validation report, audience insights, and blog auto-population will remain locked. Complete all steps to unlock the full dashboard.
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border shadow-sm max-w-2xl mx-auto text-center space-y-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "hsl(186, 60%, 93%)" }}
          >
            <Rocket className="w-8 h-8" style={{ color: "hsl(190, 85%, 38%)" }} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground">Validation Incomplete</h2>
            <p className="text-gray-500 dark:text-muted-foreground text-sm max-w-md mx-auto">
              You exited the startup validation questions halfway. Complete all questions to generate your investor-grade validation report and auto-populate your blog.
            </p>
          </div>
          <Button
            onClick={onResumeOnboarding}
            className="px-8 py-3 text-base font-semibold rounded-xl gap-2 shadow-sm"
            style={{ background: "linear-gradient(135deg, hsl(190, 85%, 38%), hsl(186, 93%, 48%))" }}
          >
            Resume Validation Questionnaire
            <ArrowRight className="w-4 h-4" />
          </Button>

          {/* Shareable Link */}
          <div className="w-full pt-2">
            <p className="text-xs text-muted-foreground mb-2 font-medium flex items-center justify-center gap-1">
              <LinkIcon className="w-3.5 h-3.5" />
              Share this link to let a teammate continue the validation:
            </p>
            <div className="flex items-center gap-2 w-full">
              <input
                readOnly
                value={resumeUrl}
                className="flex-1 text-xs rounded-xl border border-border bg-muted/50 px-3 py-2 text-muted-foreground font-mono cursor-text select-all focus:outline-none"
                onFocus={e => e.target.select()}
              />
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl shrink-0 gap-1.5"
                onClick={() => {
                  navigator.clipboard.writeText(resumeUrl);
                  toast.success("Link copied!", { description: "Share this link to continue the validation questionnaire." });
                }}
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </Button>
            </div>
          </div>
        </div>

        {/* Danger Zone — Delete Project */}
        {onDeleteProject && (
          <div className="border border-destructive/20 bg-card rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-destructive" />
                  Delete Project
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Permanently delete this project and all associated data. This action cannot be undone.
                </p>
              </div>
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Project
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Project</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete <strong>"{projectData.title}"</strong>? This action cannot be undone. All project data, linked projects, and associated content will be permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        setShowDeleteDialog(false);
                        onDeleteProject();
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" />Deleting...</>
                      ) : (
                        "Delete Project"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* Validation Report — if available, render this instead of default widgets */}
      {validationReport && validationReport !== "{}" ? (
        <>
          <ValidationReportView reportJson={validationReport} />
        </>
      ) : (
        <>
      {/* 1. Idea Pulse Card - Hero Section */}
      <IdeaPulseCard
        title={projectData.title}
        summary={projectData.summary}
        status={projectData.status}
        validationStage={validationStage}
        lastInteractionAt={lastInteractionAt}
        onShare={handleShare}
        onViewBlog={handleViewBlog}
        onTestChatbot={handleTestChatbot}
        onLinkProject={() => setLinkModalOpen(true)}
      />

      {/* 2. AI Summary Card - Computed from real data */}
      <AISummaryCard
        summary={aiSummary.summary}
        strengths={aiSummary.strengths}
        opportunities={aiSummary.opportunities}
        nextSteps={aiSummary.nextSteps}
        validationStage={validationStage}
      />

      {/* Link Project Modal */}
      <LinkProjectModal
        open={linkModalOpen}
        onOpenChange={setLinkModalOpen}
        currentProjectId={projectId}
        alreadyLinkedIds={linkedProjects.map((p) => p.projectId)}
        onLinkProject={linkProject}
      />

      {/* 3. Main Content Grid - LinkedProjects, ValidationRing and Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Linked Projects - spans full width above validation */}
        <div className="lg:col-span-2">
          <LinkedProjectsSection
            linkedProjects={linkedProjects}
            loading={linksLoading}
            onUnlink={unlinkProject}
          />
        </div>

        {/* Validation Ring */}
        <ValidationRing
          visitors={audienceStats.totalMembers}
          questions={totalQuestions}
          feedback={totalFeedback}
          gaps={activeGaps.length}
          knowledgeItems={timelineEvents.filter(e => e.type === "knowledge_update").length}
          loopHealth={loopHealth}
          onNodeClick={(nodeId) => {
            if (nodeId === "gaps") handleFixGap("");
            else if (nodeId === "blog") handleViewBlog();
            else if (nodeId === "chatbot") handleTestChatbot();
          }}
        />

        {/* Health Score */}
        <IdeaHealthScore
          clarityIndex={healthScores.clarityIndex}
          marketSignal={healthScores.marketSignal}
          gapVelocity={healthScores.gapVelocity}
          validationMomentum={healthScores.validationMomentum}
        />
      </div>

      {/* 4. Gap Detection Panel */}
      <GapDetectionPanel
        activeGaps={activeGaps}
        resolvedGaps={[]}
        onFixGap={handleFixGap}
      />

      {/* 5. Confusion Analysis */}
      <ConfusionAnalysis
        patterns={confusionPatterns}
        onAddContent={handleAddContent}
      />

      {/* 6. Persona Engagement Matrix */}
      <PersonaEngagementMatrix
        engagementData={personaEngagement}
        onPersonaClick={(persona) => {
          toast.info(`Viewing ${persona} insights`);
        }}
      />

      {/* 7. Iteration Timeline */}
      <IterationTimeline
        events={timelineEvents}
        totalIterations={timelineEvents.length}
      />

        </> /* end fallback widgets */
      )}

      {/* 8. Danger Zone — Delete Project */}
      {onDeleteProject && (
        <div className="border border-destructive/20 bg-card rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-destructive" />
                Delete Project
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Permanently delete this project and all associated data. This action cannot be undone.
              </p>
            </div>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Project
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Project</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete <strong>"{projectData.title}"</strong>? This action cannot be undone. All project data, linked projects, and associated content will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setShowDeleteDialog(false);
                      onDeleteProject();
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" />Deleting...</>
                    ) : (
                      "Delete Project"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectOverview;
