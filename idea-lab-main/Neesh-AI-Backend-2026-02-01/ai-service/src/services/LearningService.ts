import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EmbeddingService } from './EmbeddingService';
import { VectorStoreService } from './VectorStoreService';

export class LearningService {
    private supabase: SupabaseClient;
    private embeddingService: EmbeddingService;
    private vectorStore: VectorStoreService;

    constructor() {
        const sbUrl = process.env.SUPABASE_URL;
        const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!sbUrl || !sbKey) throw new Error("SUPABASE env vars missing");

        this.supabase = createClient(sbUrl, sbKey);
        this.embeddingService = new EmbeddingService();
        this.vectorStore = new VectorStoreService();
    }

    async logQuestion(projectId: string, questionText: string): Promise<string> {
        const normalized = questionText.trim().toLowerCase();

        const { data: existing } = await this.supabase
            .from('questions')
            .select('id, ask_count')
            .eq('project_id', projectId)
            .eq('normalized_text', normalized)
            .single();

        if (existing) {
            await this.supabase
                .from('questions')
                .update({
                    ask_count: existing.ask_count + 1,
                    last_asked_at: new Date().toISOString()
                })
                .eq('id', existing.id);
            return existing.id;
        } else {
            const { data, error } = await this.supabase
                .from('questions')
                .insert({
                    project_id: projectId,
                    question_text: questionText,
                    normalized_text: normalized,
                    notification_status: 'OPEN'
                })
                .select('id')
                .single();

            if (error) throw new Error(`Failed to log question: ${error.message}`);
            return data.id;
        }
    }

    async logAnswer(questionId: string, answer: string, confidence: string, isAi: boolean): Promise<string> {
        const { data, error } = await this.supabase
            .from('answer_logs')
            .insert({
                question_id: questionId,
                answer_text: answer,
                confidence_level: confidence,
                is_ai_answer: isAi
            })
            .select('id')
            .single();

        if (error) throw new Error(`Failed to log answer: ${error.message}`);
        return data.id;
    }

    async submitFeedback(logId: string, questionId: string, type: 'POSITIVE' | 'NEGATIVE', comment?: string): Promise<void> {
        const { error } = await this.supabase
            .from('feedback')
            .insert({
                question_id: questionId,
                answer_log_id: logId,
                feedback_type: type,
                comment: comment
            });

        if (error) throw new Error(`Feedback error: ${error.message}`);

        // Lifecycle: If Negative, Reopen question
        if (type === 'NEGATIVE') {
            await this.supabase
                .from('questions')
                .update({ notification_status: 'REOPENED' })
                .eq('id', questionId);
        }
    }

    async submitManualAnswer(
        projectId: string,
        questionId: string,
        answerText: string,
        answerType: 'OVERRIDE' | 'SUPPLEMENT',
        founderId: string
    ): Promise<void> {

        // 1. Validation
        const trimmed = answerText.trim();
        if (trimmed.length < 20) {
            throw new Error("Manual answer must be at least 20 characters.");
        }
        if (trimmed.length > 500) {
            throw new Error("Manual answer must be at most 500 characters.");
        }

        // 2. Deactivate old
        await this.supabase
            .from('manual_answers')
            .update({ is_active: false })
            .eq('question_id', questionId);

        // 3. Insert new
        const { error } = await this.supabase
            .from('manual_answers')
            .insert({
                question_id: questionId,
                answer_text: trimmed,
                answer_type: answerType,
                created_by: founderId,
                is_active: true
            });

        if (error) throw new Error(`Failed to save manual answer: ${error.message}`);

        // 4. Update Lifecycle -> RESOLVED
        await this.supabase
            .from('questions')
            .update({ notification_status: 'RESOLVED' })
            .eq('id', questionId);

        // 5. Inject Vector
        const { data: question } = await this.supabase.from('questions').select('question_text').eq('id', questionId).single();
        const qText = question ? question.question_text : "";
        const combinedText = `Question: ${qText}\nAnswer: ${trimmed}`;

        const embedding = await this.embeddingService.generateEmbedding(combinedText);
        const docGroupId = questionId;

        await this.vectorStore.storeVectors(
            projectId,
            docGroupId,
            1,
            [combinedText],
            [embedding],
            {
                source_type: 'MANUAL',
                manual_answer_type: answerType
            }
        );
    }

    async getNotifications(projectId: string): Promise<any[]> {
        const { data, error } = await this.supabase
            .from('questions')
            .select('*')
            .eq('project_id', projectId)
            .neq('notification_status', 'RESOLVED') // Open or Reopened
            .order('ask_count', { ascending: false });

        if (error) throw new Error(error.message);
        return data;
    }
}
