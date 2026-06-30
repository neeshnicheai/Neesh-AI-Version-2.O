import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface ProjectHealth {
    projectId: string;
    totalQuestions: number;
    unansweredQuestions: number;
    answeredQuestions: number;
    overrideCount: number;
    supplementCount: number;
    confidenceDistribution: {
        highPct: number;
        mediumPct: number;
        lowPct: number;
    };
    avgResolutionTimeHours: number; // New: Learning Velocity
    lastUpdatedAt: string;
}

export interface ReadinessState {
    status: 'NOT_READY' | 'PARTIALLY_READY' | 'READY';
    reason: string; // Specific actionable reason
    metrics: {
        confidenceHighPct: number;
        unansweredPct: number;
    };
}

export interface RiskQuestion {
    questionText: string;
    askCount: number;
    status: string; // OPEN, REOPENED
    unresolvedDays: number;
    recommendedAction: string;
}

export class InsightService {
    private supabase: SupabaseClient;

    constructor() {
        const sbUrl = process.env.SUPABASE_URL;
        const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!sbUrl || !sbKey) throw new Error("SUPABASE env vars missing");
        this.supabase = createClient(sbUrl, sbKey);
    }

    async getProjectHealth(projectId: string): Promise<ProjectHealth> {
        // 1. Questions Stats
        const { count: totalQuestions } = await this.supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId);

        const { count: unansweredCount } = await this.supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .neq('notification_status', 'RESOLVED');

        // 2. Manual Answers Stats
        const { data: qIds } = await this.supabase.from('questions').select('id').eq('project_id', projectId);
        const ids = qIds?.map(q => q.id) || [];

        let overrideCount = 0;
        let supplementCount = 0;

        if (ids.length > 0) {
            const { data: manuals } = await this.supabase
                .from('manual_answers')
                .select('answer_type')
                .in('question_id', ids)
                .eq('is_active', true);

            overrideCount = manuals?.filter(m => m.answer_type === 'OVERRIDE').length || 0;
            supplementCount = manuals?.filter(m => m.answer_type === 'SUPPLEMENT').length || 0;
        }

        // 3. Confidence Distribution (Actionable)
        let highPct = 0, mediumPct = 0, lowPct = 0;
        if (ids.length > 0) {
            const { data: logs } = await this.supabase
                .from('answer_logs')
                .select('confidence_level')
                .in('question_id', ids);

            if (logs && logs.length > 0) {
                const total = logs.length;
                highPct = Math.round((logs.filter(l => l.confidence_level === 'HIGH').length / total) * 100);
                mediumPct = Math.round((logs.filter(l => l.confidence_level === 'MEDIUM').length / total) * 100);
                lowPct = Math.round((logs.filter(l => l.confidence_level === 'LOW').length / total) * 100);
            }
        }

        // 4. Learning Velocity (Avg Resolution Time)
        // Find manual answers created_at vs question first_asked_at
        let totalResolutionTime = 0;
        let resolvedCount = 0;

        if (ids.length > 0) {
            const { data: resolutions } = await this.supabase
                .from('manual_answers')
                .select('created_at, question_id')
                .in('question_id', ids)
                .eq('is_active', true);

            // Need question creation times.
            // Map questionId -> firstAskedAt
            const { data: questions } = await this.supabase
                .from('questions')
                .select('id, first_asked_at')
                .in('id', ids);

            if (resolutions && questions) {
                const qMap = new Map(questions.map(q => [q.id, new Date(q.first_asked_at).getTime()]));

                resolutions.forEach(r => {
                    const askTime = qMap.get(r.question_id);
                    const resolveTime = new Date(r.created_at).getTime();
                    if (askTime && resolveTime > askTime) {
                        totalResolutionTime += (resolveTime - askTime);
                        resolvedCount++;
                    }
                });
            }
        }

        const avgResolutionTimeHours = resolvedCount > 0
            ? Math.round((totalResolutionTime / (1000 * 60 * 60)) * 10) / 10
            : 0;

        return {
            projectId,
            totalQuestions: totalQuestions || 0,
            unansweredQuestions: unansweredCount || 0,
            answeredQuestions: (totalQuestions || 0) - (unansweredCount || 0),
            overrideCount,
            supplementCount,
            confidenceDistribution: { highPct, mediumPct, lowPct },
            avgResolutionTimeHours,
            lastUpdatedAt: new Date().toISOString()
        };
    }

    async getRisks(projectId: string): Promise<RiskQuestion[]> {
        // Top 5 Unresolved by Ask Count
        const { data: questions } = await this.supabase
            .from('questions')
            .select('*')
            .eq('project_id', projectId)
            .neq('notification_status', 'RESOLVED')
            .order('ask_count', { ascending: false })
            .limit(5);

        if (!questions) return [];

        const now = new Date().getTime();

        return questions.map(q => {
            const ageDays = Math.round((now - new Date(q.first_asked_at).getTime()) / (1000 * 60 * 60 * 24));

            // Recommendation Logic
            let action = "Review context.";
            if (q.ask_count > 2) action = "High demand! Add Manual Answer immediately.";
            else if (ageDays > 3) action = "Stale question. Archive or Answer.";
            else action = "Monitor or Supplement docs.";

            return {
                questionText: q.question_text,
                askCount: q.ask_count,
                status: q.notification_status,
                unresolvedDays: ageDays,
                recommendedAction: action
            };
        });
    }

    async getReadiness(projectId: string): Promise<ReadinessState> {
        const health = await this.getProjectHealth(projectId);
        const total = health.totalQuestions;

        if (total === 0) {
            return {
                status: 'NOT_READY',
                reason: "Project has no learning usage data.",
                metrics: { confidenceHighPct: 0, unansweredPct: 0 }
            };
        }

        const unansweredPct = (health.unansweredQuestions / total) * 100;
        const highPct = health.confidenceDistribution.highPct;
        const lowPct = health.confidenceDistribution.lowPct;

        // Actionable Reasons
        const reasons: string[] = [];

        // READY: > 80% High Confidence AND < 10% Unanswered
        if (highPct >= 80 && unansweredPct <= 10) {
            return {
                status: 'READY',
                reason: "System is performing with high confidence and low gap ratio.",
                metrics: { confidenceHighPct: highPct, unansweredPct }
            };
        }

        // NOT_READY Logic
        if (unansweredPct > 50) reasons.push("More than 50% of questions are unanswered.");
        if (lowPct > 25) reasons.push("High risk: >25% of answers have LOW confidence.");
        if (health.avgResolutionTimeHours > 72) reasons.push("Slow learning velocity (> 3 days to resolve).");

        if (reasons.length > 0) {
            return {
                status: 'NOT_READY',
                reason: reasons.join(" "),
                metrics: { confidenceHighPct: highPct, unansweredPct }
            };
        }

        return {
            status: 'PARTIALLY_READY',
            reason: "Metrics are stabilizing but gaps remain.",
            metrics: { confidenceHighPct: highPct, unansweredPct }
        };
    }
}
