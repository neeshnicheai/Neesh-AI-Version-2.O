import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { randomUUID } from 'crypto';

export class BlogController {

    private transformBlog(blog: any) {
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

    async getBlog(req: Request, res: Response) {
        try {
            const { projectId } = req.params;

            const { data: project, error: projError } = await supabase
                .from('projects')
                .select('id')
                .eq('id', projectId)
                .eq('owner_id', req.user?.id)
                .single();

            if (projError || !project) {
                return res.status(404).json({ error: 'Project not found' });
            }

            const { data: blog, error } = await supabase
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
        } catch (error) {
            console.error('[BlogController] getBlog error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async upsertBlog(req: Request, res: Response) {
        try {
            const { projectId } = req.params;
            const { heading, coverImageUrl, introduction, content, customFields } = req.body;

            const { data: project, error: projError } = await supabase
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

            const { data: existing } = await supabase
                .from('blogs')
                .select('id')
                .eq('project_id', projectId)
                .single();

            let blog;
            if (existing) {
                const { data, error } = await supabase
                    .from('blogs')
                    .update(blogData)
                    .eq('project_id', projectId)
                    .select()
                    .single();
                if (error) throw error;
                blog = data;
            } else {
                const { data, error } = await supabase
                    .from('blogs')
                    .insert({ ...blogData, id: randomUUID(), created_at: new Date().toISOString() })
                    .select()
                    .single();
                if (error) throw error;
                blog = data;
            }

            res.json(this.transformBlog(blog));
        } catch (error) {
            console.error('[BlogController] upsertBlog error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getPublicBlog(req: Request, res: Response) {
        try {
            const { projectId } = req.params;

            const { data: blog, error } = await supabase
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
        } catch (error) {
            console.error('[BlogController] getPublicBlog error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
