import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { RagController } from './controllers/RagController';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Apply Security Middleware to all /internal routes
import { requireInternalAuth } from './middleware/auth';
app.use('/internal', requireInternalAuth);

// Apply Supabase auth middleware to protected /api routes (exclude /api/public/*)
import { supabaseAuth } from './middleware/supabaseAuth';
app.use('/api', (req, res, next) => {
    // Skip auth for public endpoints
    if (req.path.startsWith('/public/')) {
        return next();
    }
    return supabaseAuth(req, res, next);
});

const ragController = new RagController();

// Public API routes (user-facing)
import { ProjectController } from './controllers/ProjectController';
const projectController = new ProjectController();

app.get('/api/projects', (req, res) => projectController.getProjects(req, res));
app.post('/api/projects', (req, res) => projectController.createProject(req, res));
app.get('/api/projects/:id', (req, res) => projectController.getProject(req, res));
app.put('/api/projects/:id', (req, res) => projectController.updateProject(req, res));
app.delete('/api/projects/:id', (req, res) => projectController.deleteProject(req, res));

// Document API routes
import { DocumentController, uploadMiddleware } from './controllers/DocumentController';
const documentController = new DocumentController();

app.get('/api/documents/project/:projectId', (req, res) => documentController.getProjectDocuments(req, res));
app.post('/api/documents/project/:projectId', uploadMiddleware, (req, res) => documentController.uploadDocument(req, res));
app.put('/api/documents/:documentId/replace', uploadMiddleware, (req, res) => documentController.replaceDocument(req, res));
app.post('/api/documents/project/:projectId/refresh', (req, res) => documentController.refreshDocuments(req, res));

// Chat API routes
import { ChatController } from './controllers/ChatController';
const chatController = new ChatController();

app.post('/api/projects/:id/chat', (req, res) => chatController.chatWithProject(req, res));

// Public chat endpoint (no auth required)
app.post('/api/public/projects/:id/chat', (req, res) => chatController.publicChatWithProject(req, res));

// Blog API routes (authenticated)
import { BlogController } from './controllers/BlogController';
const blogController = new BlogController();

app.get('/api/projects/:projectId/blog', (req, res) => blogController.getBlog(req, res));
app.put('/api/projects/:projectId/blog', (req, res) => blogController.upsertBlog(req, res));

// Public blog endpoint (no auth required)
app.get('/api/public/projects/:projectId/blog', (req, res) => blogController.getPublicBlog(req, res));

// Audience routes (authenticated)
import { AudienceController } from './controllers/AudienceController';
const audienceController = new AudienceController();

app.get('/api/projects/:projectId/audience', (req, res) => audienceController.getAudience(req, res));
app.post('/api/public/projects/:projectId/feedback', (req, res) => audienceController.submitPublicFeedback(req, res));

// User / subscription routes (authenticated)
import { UserController } from './controllers/UserController';
const userController = new UserController();

app.get('/api/users/subscription', (req, res) => userController.getSubscription(req, res));
app.put('/api/users/subscription/upgrade', (req, res) => userController.upgradeToPro(req, res));
app.put('/api/users/branding', (req, res) => userController.updateBranding(req, res));

// API Key management routes
import { ApiKeyController } from './controllers/ApiKeyController';
const apiKeyController = new ApiKeyController();

app.get('/api/user/api-keys', (req, res) => apiKeyController.getUserApiKeys(req, res));
app.post('/api/user/api-keys', (req, res) => apiKeyController.saveApiKey(req, res));
app.delete('/api/user/api-keys/:provider', (req, res) => apiKeyController.deleteApiKey(req, res));

// Notifications stub routes (not yet implemented)
app.get('/api/projects/:projectId/notifications', (req, res) => {
    res.json({ clusters: [], count: 0, unansweredCount: 0 });
});
app.get('/api/projects/:projectId/notifications/count', (req, res) => {
    res.json({ count: 0 });
});
app.get('/api/notifications/clusters/:clusterId', (req, res) => {
    res.status(404).json({ error: 'Not found' });
});
app.post('/api/notifications/clusters/:clusterId/reply', (req, res) => {
    res.json({ clusterId: req.params.clusterId, answeredCount: 0, totalCount: 0, clusterStatus: 'unanswered' });
});

// FAQ stub routes
app.get('/api/projects/:projectId/faqs', (req, res) => {
    res.json({ faqs: [], count: 0 });
});
app.post('/api/projects/:projectId/faqs', (req, res) => {
    res.status(501).json({ error: 'Not implemented' });
});
app.put('/api/faqs/:faqId', (req, res) => {
    res.status(501).json({ error: 'Not implemented' });
});
app.delete('/api/faqs/:faqId', (req, res) => {
    res.json({ success: true });
});

// Questions stub routes
app.get('/api/projects/:projectId/questions/unanswered', (req, res) => {
    res.json({ questions: [], count: 0 });
});
app.put('/api/questions/:questionId/resolve', (req, res) => {
    res.json({ success: true });
});

// Links stub routes
app.get('/api/projects/:projectId/links', (req, res) => {
    res.json([]);
});
app.post('/api/projects/:projectId/links', (req, res) => {
    res.status(501).json({ error: 'Not implemented' });
});
app.delete('/api/projects/:projectId/links/:linkId', (req, res) => {
    res.json({ success: true });
});

// Promotions stub routes
app.get('/api/promotions', (req, res) => {
    res.json([]);
});
app.post('/api/promotions', (req, res) => {
    res.status(501).json({ error: 'Not implemented' });
});
app.delete('/api/promotions/:promotionId', (req, res) => {
    res.json({ success: true });
});

// Blog branding stub route
app.get('/api/public/blog-branding/:projectId', (req, res) => {
    res.json({ botName: null, botAvatarUrl: null });
});

// Public health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        service: 'Neesh AI Service',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'ai-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Debug endpoint to test Gemini models and list available models
app.get('/debug/gemini-models', async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'No GEMINI_API_KEY found' });
        }

        // Try to list available models using direct API call
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
        const data = await response.json();

        if (!response.ok) {
            return res.json({
                apiKeyStatus: 'invalid',
                error: data.error || 'API key validation failed',
                keyLength: apiKey.length,
                keyPrefix: apiKey.substring(0, 10) + '...'
            });
        }

        // Extract model names from the response
        const availableModels = data.models?.map((model: any) => model.name) || [];

        res.json({
            apiKeyStatus: 'valid',
            availableModels,
            totalModels: availableModels.length,
            keyLength: apiKey.length,
            keyPrefix: apiKey.substring(0, 10) + '...',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : String(error),
            apiKeyStatus: 'unknown'
        });
    }
});

// Internal API routes
app.post('/internal/ingest/:projectId', (req, res) => ragController.ingestProject(req, res));
app.post('/internal/query', (req, res) => ragController.queryVectorStore(req, res));
app.post('/internal/chat', (req, res) => ragController.chatWithProject(req, res));

// RAG Analytics + Cache Management routes
app.get('/internal/projects/:projectId/rag-analytics', (req, res) => ragController.getProjectRagAnalytics(req, res));
app.get('/internal/rag-analytics/global', (req, res) => ragController.getGlobalRagAnalytics(req, res));
app.get('/internal/rag-analytics/cache', (req, res) => ragController.getCacheStats(req, res));
app.delete('/internal/projects/:projectId/cache', (req, res) => ragController.invalidateProjectCache(req, res));

// Learning Loop Routes
import { LearningController } from './controllers/LearningController';
const learningController = new LearningController();
app.post('/internal/feedback', (req, res) => learningController.submitFeedback(req, res));
app.post('/internal/manual-answer', (req, res) => learningController.submitManualAnswer(req, res));
app.get('/internal/notifications/:projectId', (req, res) => learningController.getNotifications(req, res));

// Insight Routes
import { InsightController } from './controllers/InsightController';
const insightController = new InsightController();
app.get('/internal/projects/:projectId/health', (req, res) => insightController.getProjectHealth(req, res));
app.get('/internal/projects/:projectId/readiness', (req, res) => insightController.getReadiness(req, res));
app.get('/internal/projects/:projectId/risks', (req, res) => insightController.getRisks(req, res));


app.listen(port, () => {
    console.log(`AI Service running on port ${port}`);
});
