import { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "@/lib/api";

type PersonaType = "developer" | "marketer" | "investor" | "designer" | "entrepreneur" | "researcher" | "other";

// ===== Backend response types =====

interface BackendAudienceMemberSummary {
  id: string;
  name: string;
  email: string;
  occupation: string | null;
  personaType: string | null;
  confidenceScore: number | null;
  engagementScore: number | null;
  feedbackSummary: string | null;
  firstInteractionAt: string | null;
  lastInteractionAt: string | null;
  questionCount: number;
}

interface BackendAudienceListResponse {
  members: BackendAudienceMemberSummary[];
  count: number;
}

// ===== Frontend types =====

export interface AudienceMember {
  id: string;
  name: string;
  email: string;
  occupation: string | null;
  detected_persona: PersonaType | null;
  persona_confidence: number | null;
  total_questions: number | null;
  total_feedback: number | null;
  first_interaction_at: string;
  last_interaction_at: string;
  project_id: string;
  feedbackSummary: string | null;
}

export interface AggregatedPersonaData {
  persona: PersonaType;
  members: number;
  percentage: number;
  feedbackCount: number;
  confusionPoints: { topic: string; count: number }[];
  commonQuestions: string[];
  contentSuggestions: string[];
}

// Map occupation strings to persona types
function mapOccupationToPersona(occupation: string | null, personaType: string | null): PersonaType {
  if (personaType) {
    const lower = personaType.toLowerCase();
    const validPersonas: PersonaType[] = ["developer", "marketer", "investor", "designer", "entrepreneur", "researcher"];
    const match = validPersonas.find(p => lower.includes(p));
    if (match) return match;
  }
  if (occupation) {
    const lower = occupation.toLowerCase();
    if (lower.includes("develop") || lower.includes("engineer") || lower.includes("program")) return "developer";
    if (lower.includes("market") || lower.includes("growth") || lower.includes("seo")) return "marketer";
    if (lower.includes("invest") || lower.includes("vc") || lower.includes("fund")) return "investor";
    if (lower.includes("design") || lower.includes("ui") || lower.includes("ux")) return "designer";
    if (lower.includes("entrepreneur") || lower.includes("founder") || lower.includes("ceo") || lower.includes("business")) return "entrepreneur";
    if (lower.includes("research") || lower.includes("academ") || lower.includes("student")) return "researcher";
  }
  return "other";
}

import { supabase } from "@/integrations/supabase/client";

export const useAudienceData = (projectId: string | undefined) => {
  const [members, setMembers] = useState<AudienceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("[useAudienceData] Fetching audience data from backend...");
      const data = await apiClient.get<BackendAudienceListResponse>(
        `/api/projects/${projectId}/audience`
      );
      console.log(`[useAudienceData] Fetched ${data.count} audience members`);

      const mappedMembers: AudienceMember[] = data.members.map(m => ({
        id: m.id,
        name: m.name,
        email: m.email,
        occupation: m.occupation,
        detected_persona: mapOccupationToPersona(m.occupation, m.personaType),
        persona_confidence: m.confidenceScore,
        total_questions: m.questionCount || 0,
        total_feedback: m.feedbackSummary ? 1 : 0,
        first_interaction_at: m.firstInteractionAt || new Date().toISOString(),
        last_interaction_at: m.lastInteractionAt || new Date().toISOString(),
        project_id: projectId,
        feedbackSummary: m.feedbackSummary,
      }));

      setMembers(mappedMembers);
    } catch (err) {
      console.error("[useAudienceData] Error fetching audience data:", err);
      // Don't show error toast — may not have audience data yet
      setMembers([]);
      setError(err instanceof Error ? err.message : "Failed to fetch audience data");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();

    if (!projectId) return;

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`public:audience_members:project_id=eq.${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "audience_members",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          console.log("[useAudienceData] Data changed, refetching...");
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, fetchData]);

  // Compute aggregated persona data from members
  const getAggregatedPersonaData = useCallback((): AggregatedPersonaData[] => {
    const personaGroups: Record<PersonaType, AudienceMember[]> = {
      developer: [],
      marketer: [],
      investor: [],
      designer: [],
      entrepreneur: [],
      researcher: [],
      other: [],
    };

    members.forEach((member) => {
      const persona = member.detected_persona || "other";
      if (personaGroups[persona]) {
        personaGroups[persona].push(member);
      }
    });

    const totalMembers = members.length || 1;

    return Object.entries(personaGroups)
      .map(([persona, groupMembers]) => ({
        persona: persona as PersonaType,
        members: groupMembers.length,
        percentage: Math.round((groupMembers.length / totalMembers) * 100),
        feedbackCount: groupMembers.filter(m => m.feedbackSummary).length,
        confusionPoints: [],
        commonQuestions: [],
        contentSuggestions: [],
      }))
      .sort((a, b) => b.members - a.members);
  }, [members]);

  // Get question frequency
  const getQuestionFrequency = useCallback(() => {
    return [] as { question: string; count: number; isAnswered: boolean }[];
  }, []);

  // Get unanswered questions
  const getUnansweredQuestions = useCallback(() => {
    return [] as { id: string; question: string }[];
  }, []);

  // Compute stats
  const stats = useMemo(() => ({
    totalMembers: members.length,
    totalQuestions: 0, // Should be supplemented by clusters from useNotifications
    unansweredQuestions: 0,
    totalFeedback: members.filter(m => m.feedbackSummary).length,
    uniqueOccupations: new Set(members.map(m => m.occupation).filter(Boolean)).size,
    totalConfusionPoints: 0, // Placeholder, AudienceInsights.tsx will compute this from clusters
    totalSuggestions: 0,     // Placeholder
  }), [members]);

  return {
    members,
    questions: [],
    personaInsights: [],
    loading,
    error,
    refetch: fetchData,
    getAggregatedPersonaData,
    getQuestionFrequency,
    getUnansweredQuestions,
    stats,
  };
};
