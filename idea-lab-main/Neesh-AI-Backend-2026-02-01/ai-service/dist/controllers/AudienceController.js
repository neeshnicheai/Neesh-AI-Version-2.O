"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudienceController = void 0;
const supabase_1 = require("../config/supabase");
class AudienceController {
    async getAudience(req, res) {
        try {
            const { projectId } = req.params;
            const { data: members, error } = await supabase_1.supabase
                .from('audience_members')
                .select('*')
                .eq('project_id', projectId)
                .order('last_interaction_at', { ascending: false });
            if (error)
                throw error;
            const result = (members || []).map(m => ({
                id: m.id,
                name: m.name,
                email: m.email,
                occupation: m.occupation || null,
                personaType: m.persona_type || null,
                confidenceScore: m.confidence_score || null,
                engagementScore: m.engagement_score || null,
                feedbackSummary: m.feedback_text ? m.feedback_text.substring(0, 100) : null,
                firstInteractionAt: m.first_interaction_at,
                lastInteractionAt: m.last_interaction_at,
                questionCount: 0,
            }));
            res.json({ members: result, count: result.length });
        }
        catch (error) {
            console.error('[AudienceController] getAudience error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async submitPublicFeedback(req, res) {
        try {
            const { projectId } = req.params;
            const { name, email, occupation, feedbackText } = req.body;
            console.log('[AudienceController] submitPublicFeedback:', { projectId, name, email: email ? email.substring(0, 5) + '...' : 'none' });
            const resolvedEmail = email || `anon-${Date.now()}@unknown.com`;
            const resolvedName = name || 'Anonymous';
            const now = new Date().toISOString();
            const { data: existing, error: findError } = await supabase_1.supabase
                .from('audience_members')
                .select('id')
                .eq('project_id', projectId)
                .eq('email', resolvedEmail)
                .maybeSingle();
            if (findError) {
                console.error('[AudienceController] Error finding existing member:', findError);
            }
            if (existing) {
                const { error: updateError } = await supabase_1.supabase
                    .from('audience_members')
                    .update({
                    name: resolvedName,
                    occupation: occupation || null,
                    feedback_text: feedbackText || null,
                    feedback_source: 'Blog',
                    feedback_submitted_at: now,
                    last_interaction_at: now,
                })
                    .eq('id', existing.id);
                if (updateError) {
                    console.error('[AudienceController] Error updating member:', updateError);
                }
            }
            else {
                const { error: insertError } = await supabase_1.supabase
                    .from('audience_members')
                    .insert({
                    project_id: projectId,
                    name: resolvedName,
                    email: resolvedEmail,
                    occupation: occupation || null,
                    feedback_text: feedbackText || null,
                    feedback_source: 'Blog',
                    feedback_submitted_at: now,
                    first_interaction_at: now,
                    last_interaction_at: now,
                });
                if (insertError) {
                    console.error('[AudienceController] Error inserting member:', insertError);
                }
                else {
                    console.log('[AudienceController] New audience member created for project', projectId);
                }
            }
            res.json({ success: true });
        }
        catch (error) {
            console.error('[AudienceController] submitPublicFeedback error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.AudienceController = AudienceController;
