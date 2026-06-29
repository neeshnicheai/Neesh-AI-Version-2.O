"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectController = void 0;
const supabase_1 = require("../config/supabase");
const crypto_1 = require("crypto");
class ProjectController {
    async getProjects(req, res) {
        try {
            console.log('[ProjectController] Getting projects for user:', req.user?.id);
            const { data: projects, error } = await supabase_1.supabase
                .from('projects')
                .select('*')
                .eq('owner_id', req.user?.id)
                .order('created_at', { ascending: false });
            if (error) {
                console.error('[ProjectController] Database error:', error);
                return res.status(500).json({ error: 'Failed to fetch projects' });
            }
            console.log('[ProjectController] Retrieved projects:', projects?.length || 0);
            // Transform to frontend format
            const transformedProjects = (projects || []).map(project => ({
                id: project.id,
                title: project.title,
                slug: project.slug,
                oneLineSummary: project.one_line_summary,
                introduction: project.introduction,
                description: project.description,
                status: project.status,
                createdAt: project.created_at,
                updatedAt: project.updated_at
            }));
            res.json(transformedProjects);
        }
        catch (error) {
            console.error('[ProjectController] Error getting projects:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async createProject(req, res) {
        try {
            const { title, oneLineSummary, introduction, description } = req.body;
            console.log('[ProjectController] Creating project:', { title, oneLineSummary });
            if (!title || !oneLineSummary) {
                return res.status(400).json({ error: 'Title and summary are required' });
            }
            const projectData = {
                id: (0, crypto_1.randomUUID)(), // Generate UUID in backend
                owner_id: req.user?.id,
                title,
                one_line_summary: oneLineSummary,
                introduction: introduction || null,
                description: description || null,
                status: 'draft',
                slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
                deleted: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            const { data: project, error } = await supabase_1.supabase
                .from('projects')
                .insert(projectData)
                .select()
                .single();
            if (error) {
                console.error('[ProjectController] Database error:', error);
                return res.status(500).json({ error: 'Failed to create project' });
            }
            console.log('[ProjectController] Created project:', project.id);
            // Transform to frontend format
            const transformedProject = {
                id: project.id,
                title: project.title,
                slug: project.slug,
                oneLineSummary: project.one_line_summary,
                introduction: project.introduction,
                description: project.description,
                status: project.status,
                createdAt: project.created_at,
                updatedAt: project.updated_at
            };
            res.status(201).json(transformedProject);
        }
        catch (error) {
            console.error('[ProjectController] Error creating project:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async getProject(req, res) {
        try {
            const { id } = req.params;
            console.log('[ProjectController] Getting project:', id);
            const { data: project, error } = await supabase_1.supabase
                .from('projects')
                .select('*')
                .eq('id', id)
                .eq('owner_id', req.user?.id)
                .single();
            if (error) {
                console.error('[ProjectController] Database error:', error);
                return res.status(404).json({ error: 'Project not found' });
            }
            // Transform to frontend format
            const transformedProject = {
                id: project.id,
                title: project.title,
                slug: project.slug,
                oneLineSummary: project.one_line_summary,
                introduction: project.introduction,
                description: project.description,
                status: project.status,
                createdAt: project.created_at,
                updatedAt: project.updated_at
            };
            res.json(transformedProject);
        }
        catch (error) {
            console.error('[ProjectController] Error getting project:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async updateProject(req, res) {
        try {
            const { id } = req.params;
            const { title, oneLineSummary, introduction, description, status } = req.body;
            console.log('[ProjectController] Updating project:', id);
            const updateData = {
                updated_at: new Date().toISOString()
            };
            if (title !== undefined)
                updateData.title = title;
            if (oneLineSummary !== undefined)
                updateData.one_line_summary = oneLineSummary;
            if (introduction !== undefined)
                updateData.introduction = introduction;
            if (description !== undefined)
                updateData.description = description;
            if (status !== undefined)
                updateData.status = status;
            const { data: project, error } = await supabase_1.supabase
                .from('projects')
                .update(updateData)
                .eq('id', id)
                .eq('owner_id', req.user?.id)
                .select()
                .single();
            if (error) {
                console.error('[ProjectController] Database error:', error);
                return res.status(404).json({ error: 'Project not found or update failed' });
            }
            console.log('[ProjectController] Updated project:', project.id);
            // Transform to frontend format
            const transformedProject = {
                id: project.id,
                title: project.title,
                slug: project.slug,
                oneLineSummary: project.one_line_summary,
                introduction: project.introduction,
                description: project.description,
                status: project.status,
                createdAt: project.created_at,
                updatedAt: project.updated_at
            };
            res.json(transformedProject);
        }
        catch (error) {
            console.error('[ProjectController] Error updating project:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async deleteProject(req, res) {
        try {
            const { id } = req.params;
            console.log('[ProjectController] Deleting project:', id);
            // Delete blog first to avoid FK constraint violation
            await supabase_1.supabase.from('blogs').delete().eq('project_id', id);
            const { error } = await supabase_1.supabase
                .from('projects')
                .delete()
                .eq('id', id)
                .eq('owner_id', req.user?.id);
            if (error) {
                console.error('[ProjectController] Database error:', error);
                return res.status(404).json({ error: 'Project not found' });
            }
            console.log('[ProjectController] Deleted project:', id);
            res.status(204).send();
        }
        catch (error) {
            console.error('[ProjectController] Error deleting project:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.ProjectController = ProjectController;
