"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const supabase_1 = require("../config/supabase");
const generative_ai_1 = require("@google/generative-ai");
class ChatController {
    async getUserApiKey(userId, provider) {
        try {
            const { data: apiKey, error } = await supabase_1.supabase
                .from('user_api_keys')
                .select('encrypted_api_key')
                .eq('user_id', userId)
                .eq('provider', provider)
                .single();
            if (error || !apiKey) {
                return null;
            }
            // In production, decrypt the API key here
            // For now, assuming it's stored as plain text (not recommended)
            return apiKey.encrypted_api_key;
        }
        catch (error) {
            console.error(`[ChatController] Error getting ${provider} API key:`, error);
            return null;
        }
    }
    async getProjectContext(projectId) {
        try {
            // Get project details
            const { data: project, error: projectError } = await supabase_1.supabase
                .from('projects')
                .select('title, one_line_summary, description, introduction')
                .eq('id', projectId)
                .single();
            if (projectError || !project) {
                return '';
            }
            // Get project documents
            const { data: documents, error: docsError } = await supabase_1.supabase
                .from('documents')
                .select('original_filename, content')
                .eq('project_id', projectId)
                .eq('is_active', true);
            let context = `Project: ${project.title}\n`;
            if (project.one_line_summary)
                context += `Summary: ${project.one_line_summary}\n`;
            if (project.description)
                context += `Description: ${project.description}\n`;
            if (project.introduction)
                context += `Introduction: ${project.introduction}\n\n`;
            if (documents && documents.length > 0) {
                context += `Project Documents:\n`;
                documents.forEach(doc => {
                    context += `\n--- ${doc.original_filename} ---\n`;
                    context += doc.content?.substring(0, 2000) || 'No content available';
                    context += '\n';
                });
            }
            return context;
        }
        catch (error) {
            console.error('[ChatController] Error getting project context:', error);
            return '';
        }
    }
    async chatWithProject(req, res) {
        try {
            const { id: projectId } = req.params;
            const { query, conversationHistory = [] } = req.body;
            console.log('[ChatController] Chat request for project:', projectId);
            if (!query || query.trim().length === 0) {
                return res.status(400).json({ error: 'Query is required' });
            }
            if (query.length > 2000) {
                return res.status(400).json({ error: 'Query too long (max 2000 characters)' });
            }
            // Verify project exists and user has access
            const { data: project, error: projectError } = await supabase_1.supabase
                .from('projects')
                .select('id, title')
                .eq('id', projectId)
                .eq('owner_id', req.user?.id)
                .single();
            if (projectError || !project) {
                return res.status(404).json({ error: 'Project not found' });
            }
            // Get user's Gemini API key or use system default
            const userGeminiKey = await this.getUserApiKey(req.user?.id, 'GEMINI');
            const geminiApiKey = userGeminiKey || process.env.GEMINI_API_KEY;
            if (!geminiApiKey) {
                return res.status(400).json({
                    error: 'No Gemini API key available. Please add your API key in settings.'
                });
            }
            console.log('[ChatController] Using Gemini API key:', geminiApiKey ? 'Present' : 'Missing');
            console.log('[ChatController] Key source:', userGeminiKey ? 'User' : 'System');
            // Get project context
            const projectContext = await this.getProjectContext(projectId);
            // Initialize Gemini with working model from your API key
            const genAI = new generative_ai_1.GoogleGenerativeAI(geminiApiKey);
            const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });
            // Build conversation context
            let conversationContext = '';
            if (conversationHistory.length > 0) {
                conversationContext = conversationHistory
                    .slice(-10) // Keep last 10 messages for context
                    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
                    .join('\n');
                conversationContext += '\n\n';
            }
            // Create prompt
            const prompt = `You are an AI assistant helping users understand and work with their project: "${project.title}".

Project Context:
${projectContext}

Previous Conversation:
${conversationContext}

Current User Question: ${query}

Please provide a helpful, accurate response based on the project context and conversation history. If the question is not related to the project, politely redirect the user to project-related topics.`;
            const result = await model.generateContent(prompt);
            const response = result.response;
            const answer = response.text();
            console.log('[ChatController] Generated response length:', answer.length);
            res.json({
                answer,
                projectId,
                query,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('[ChatController] Error in chat:', error);
            res.status(500).json({ error: 'Failed to generate response' });
        }
    }
    async publicChatWithProject(req, res) {
        try {
            const { id: projectId } = req.params;
            const { query } = req.body;
            console.log('[ChatController] Public chat request for project:', projectId);
            if (!query || query.trim().length === 0) {
                return res.status(400).json({ error: 'Query is required' });
            }
            // Verify project exists (no user auth required for public endpoint)
            const { data: project, error: projectError } = await supabase_1.supabase
                .from('projects')
                .select('id, title')
                .eq('id', projectId)
                .single();
            if (projectError || !project) {
                return res.status(404).json({ error: 'Project not found' });
            }
            // Use system Gemini API key for public chats
            const geminiApiKey = process.env.GEMINI_API_KEY;
            if (!geminiApiKey) {
                return res.status(500).json({
                    error: 'Chat service temporarily unavailable'
                });
            }
            // Get project context
            const projectContext = await this.getProjectContext(projectId);
            // Initialize Gemini with most basic model name
            const genAI = new generative_ai_1.GoogleGenerativeAI(geminiApiKey);
            const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });
            // Create prompt for public chat (simpler, no conversation history)
            const prompt = `You are a chatbot for the project: "${project.title}".

Project Information:
${projectContext}

User Question: ${query}

Please provide a helpful response about this project. Keep it concise and relevant to the project.`;
            const result = await model.generateContent(prompt);
            const response = result.response;
            const answer = response.text();
            res.json({
                answer,
                projectId,
                query,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('[ChatController] Error in public chat:', error);
            res.status(500).json({ error: 'Failed to generate response' });
        }
    }
}
exports.ChatController = ChatController;
