"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogController = void 0;
const supabase_1 = require("../config/supabase");
const crypto_1 = require("crypto");
class BlogController {
    transformBlog(blog) {
        return {
            heading: blog.heading || '',
            coverImageUrl: blog.cover_image_url || '',
            introduction: blog.introduction || '',
            content: blog.content || '',
            customFields: blog.custom_fields ? JSON.parse(blog.custom_fields) : [],
            chatbotName: blog.chatbot_name || null,
            welcomeMessage: blog.welcome_message || null,
            primaryColor: blog.primary_color || null,
            botAvatarUrl: blog.bot_avatar_url || null,
        };
    }
    async getBlog(req, res) {
        try {
            const { projectId } = req.params;
            const { data: project, error: projError } = await supabase_1.supabase
                .from('projects')
                .select('id')
                .eq('id', projectId)
                .eq('owner_id', req.user?.id)
                .single();
            if (projError || !project) {
                return res.status(404).json({ error: 'Project not found' });
            }
            const { data: blog, error } = await supabase_1.supabase
                .from('blogs')
                .select('*')
                .eq('project_id', projectId)
                .single();
            if (error || !blog) {
                return res.json({
                    heading: '', coverImageUrl: '', introduction: '',
                    content: '', customFields: []
                });
            }
            res.json(this.transformBlog(blog));
        }
        catch (error) {
            console.error('[BlogController] getBlog error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async upsertBlog(req, res) {
        try {
            const { projectId } = req.params;
            const { heading, coverImageUrl, introduction, content, customFields } = req.body;
            const { data: project, error: projError } = await supabase_1.supabase
                .from('projects')
                .select('id')
                .eq('id', projectId)
                .eq('owner_id', req.user?.id)
                .single();
            if (projError || !project) {
                return res.status(404).json({ error: 'Project not found' });
            }
            const blogData = {
                project_id: projectId,
                heading: heading || '',
                cover_image_url: coverImageUrl || '',
                introduction: introduction || '',
                content: content || '',
                custom_fields: JSON.stringify(customFields || []),
                updated_at: new Date().toISOString(),
            };
            const { data: existing } = await supabase_1.supabase
                .from('blogs')
                .select('id')
                .eq('project_id', projectId)
                .single();
            let blog;
            if (existing) {
                const { data, error } = await supabase_1.supabase
                    .from('blogs')
                    .update(blogData)
                    .eq('project_id', projectId)
                    .select()
                    .single();
                if (error)
                    throw error;
                blog = data;
            }
            else {
                const { data, error } = await supabase_1.supabase
                    .from('blogs')
                    .insert({ ...blogData, id: (0, crypto_1.randomUUID)(), created_at: new Date().toISOString() })
                    .select()
                    .single();
                if (error)
                    throw error;
                blog = data;
            }
            res.json(this.transformBlog(blog));
        }
        catch (error) {
            console.error('[BlogController] upsertBlog error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async getPublicBlog(req, res) {
        try {
            const { projectId } = req.params;
            const { data: blog, error } = await supabase_1.supabase
                .from('blogs')
                .select('*')
                .eq('project_id', projectId)
                .single();
            if (error || !blog) {
                return res.json({
                    heading: '', coverImageUrl: '', introduction: '',
                    content: '', customFields: []
                });
            }
            res.json(this.transformBlog(blog));
        }
        catch (error) {
            console.error('[BlogController] getPublicBlog error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.BlogController = BlogController;
