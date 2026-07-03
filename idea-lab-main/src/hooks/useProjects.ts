import { useState, useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import apiClient from "@/lib/api";

// Backend API response format (camelCase)
interface BackendProject {
  id: string;
  title: string;
  slug: string;
  oneLineSummary: string | null;
  introduction: string | null;
  description: string | null;
  status: string;
  industry: string | null;
  startupStage: string | null;
  validationReport: string | null;
  onboardingCompleted: boolean | null;
  chatbotName: string | null;
  welcomeMessage: string | null;
  primaryColor: string | null;
  botAvatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// Frontend format (snake_case for compatibility with existing components)
export interface Project {
  id: string;
  owner_id: string;
  title: string;
  slug: string;
  one_line_summary: string | null;
  introduction: string | null;
  description: string | null;
  status: string;
  industry: string | null;
  startup_stage: string | null;
  validation_report: string | null;
  onboarding_completed: boolean;
  chatbot_name: string | null;
  welcome_message: string | null;
  primary_color: string | null;
  bot_avatar_url: string | null;
  deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectInput {
  title: string;
  one_line_summary?: string;
  introduction?: string;
  description?: string;
  industry?: string;
  startup_stage?: string;
  validation_answers?: string;
  onboarding_completed?: boolean;
  chatbot_name?: string;
  welcome_message?: string;
  primary_color?: string;
  bot_avatar_url?: string | null;
}

export interface UpdateProjectInput {
  title?: string;
  one_line_summary?: string;
  introduction?: string;
  description?: string;
  status?: string;
  industry?: string;
  startup_stage?: string;
  validation_answers?: string;
  onboarding_completed?: boolean;
  chatbot_name?: string;
  welcome_message?: string;
  primary_color?: string;
  bot_avatar_url?: string | null;
}

// Transform backend response to frontend format
const transformProject = (backendProject: BackendProject): Project => ({
  id: backendProject.id,
  owner_id: "", // Not returned by backend, but not needed in frontend
  title: backendProject.title,
  slug: backendProject.slug,
  one_line_summary: backendProject.oneLineSummary,
  introduction: backendProject.introduction,
  description: backendProject.description,
  status: backendProject.status,
  industry: backendProject.industry,
  startup_stage: backendProject.startupStage,
  validation_report: backendProject.validationReport,
  onboarding_completed: backendProject.onboardingCompleted || false,
  chatbot_name: backendProject.chatbotName,
  welcome_message: backendProject.welcomeMessage,
  primary_color: backendProject.primaryColor,
  bot_avatar_url: backendProject.botAvatarUrl,
  deleted: false,
  created_at: backendProject.createdAt,
  updated_at: backendProject.updatedAt,
});

// Transform frontend input to backend format
const transformCreateInput = (input: CreateProjectInput) => ({
  title: input.title,
  oneLineSummary: input.one_line_summary || null,
  introduction: input.introduction || null,
  description: input.description || null,
  industry: input.industry || null,
  startupStage: input.startup_stage || null,
  validationAnswers: input.validation_answers || null,
  onboardingCompleted: input.onboarding_completed || null,
  chatbotName: input.chatbot_name || null,
  welcomeMessage: input.welcome_message || null,
  primaryColor: input.primary_color || null,
  botAvatarUrl: input.bot_avatar_url || null,
});

const transformUpdateInput = (input: UpdateProjectInput) => ({
  title: input.title,
  oneLineSummary: input.one_line_summary,
  introduction: input.introduction,
  description: input.description,
  status: input.status,
  industry: input.industry,
  startupStage: input.startup_stage,
  validationAnswers: input.validation_answers,
  onboardingCompleted: input.onboarding_completed,
  chatbotName: input.chatbot_name,
  welcomeMessage: input.welcome_message,
  primaryColor: input.primary_color,
  botAvatarUrl: input.bot_avatar_url,
});

export const useProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guard against duplicate fetches during auth state transitions
  const lastFetchedUserIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchProjects = async (force = false) => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      lastFetchedUserIdRef.current = null;
      return;
    }

    // Skip if we already fetched for this user (unless forced)
    if (!force && lastFetchedUserIdRef.current === user.id && projects.length >= 0 && !loading) {
      return;
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      setLoading(true);
      setError(null);

      console.log("[useProjects] Fetching projects from backend...");
      const backendProjects = await apiClient.get<BackendProject[]>('/api/projects');
      console.log("[useProjects] Received projects:", backendProjects);

      const transformedProjects = backendProjects.map(transformProject);
      setProjects(transformedProjects);
      lastFetchedUserIdRef.current = user.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch projects";
      setError(message);
      console.error("[useProjects] Error fetching projects:", err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user?.id]);

  const createProject = async (input: CreateProjectInput): Promise<Project | null> => {
    if (!user) {
      toast.error("You must be logged in to create a project");
      return null;
    }

    try {
      console.log("[useProjects] Creating project:", input);
      const backendInput = transformCreateInput(input);

      const backendProject = await apiClient.post<BackendProject>('/api/projects', backendInput);
      console.log("[useProjects] Project created:", backendProject);

      const newProject = transformProject(backendProject);
      setProjects(prev => [newProject, ...prev]);
      toast.success("Project created successfully!");
      return newProject;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create project";
      toast.error(message);
      console.error("[useProjects] Error creating project:", err);
      return null;
    }
  };

  const updateProject = async (id: string, input: UpdateProjectInput): Promise<Project | null> => {
    if (!user) {
      toast.error("You must be logged in to update a project");
      return null;
    }

    try {
      console.log("[useProjects] Updating project:", id, input);
      const backendInput = transformUpdateInput(input);

      const backendProject = await apiClient.put<BackendProject>(`/api/projects/${id}`, backendInput);
      console.log("[useProjects] Project updated:", backendProject);

      const updatedProject = transformProject(backendProject);
      setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
      return updatedProject;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update project";
      toast.error(message);
      console.error("[useProjects] Error updating project:", err);
      return null;
    }
  };

  const deleteProject = async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error("You must be logged in to delete a project");
      return false;
    }

    try {
      console.log("[useProjects] Deleting project:", id);
      await apiClient.delete(`/api/projects/${id}`);
      console.log("[useProjects] Project deleted");

      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success("Project deleted successfully!");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete project";
      toast.error(message);
      console.error("[useProjects] Error deleting project:", err);
      return false;
    }
  };

  const getProject = async (id: string): Promise<Project | null> => {
    try {
      console.log("[useProjects] Getting project:", id);
      const backendProject = await apiClient.get<BackendProject>(`/api/projects/${id}`);
      console.log("[useProjects] Got project:", backendProject);
      return transformProject(backendProject);
    } catch (err) {
      console.error("[useProjects] Error fetching project:", err);
      return null;
    }
  };

  const getPublicProject = async (slug: string): Promise<Project | null> => {
    try {
      console.log("[useProjects] Getting public project by slug:", slug);
      // Public projects endpoint doesn't require auth
      const backendProject = await apiClient.get<BackendProject>(`/api/public/projects/${slug}`, { skipAuth: true });
      console.log("[useProjects] Got public project:", backendProject);
      return transformProject(backendProject);
    } catch (err) {
      console.error("[useProjects] Error fetching public project:", err);
      return null;
    }
  };

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    getProject,
    getPublicProject,
  };
};
