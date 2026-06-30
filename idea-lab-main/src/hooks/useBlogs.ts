import { useState } from "react";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import apiClient from "@/lib/api";

export interface CustomField {
  id: string;
  type: string;
  value?: string;
  order?: number;
  // Feedback form fields - allow any additional properties
  title?: string;
  description?: string;
  fields?: any[];
  [key: string]: any;
}

export interface Blog {
  id: string;
  project_id: string;
  heading: string | null;
  cover_image_url: string | null;
  introduction: string | null;
  content: string | null;
  custom_fields: CustomField[];
  chatbot_name?: string | null;
  welcome_message?: string | null;
  primary_color?: string | null;
  bot_avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateBlogInput {
  heading?: string;
  cover_image_url?: string;
  introduction?: string;
  content?: string;
  custom_fields?: CustomField[];
}

// Backend DTO matches
interface BackendBlogContent {
  heading: string;
  coverImageUrl: string;
  introduction: string;
  content: string;
  customFields: CustomField[];
  chatbotName?: string;
  welcomeMessage?: string;
  primaryColor?: string;
  botAvatarUrl?: string;
}

export const useBlogs = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transformBlog = (projectId: string, backendData: BackendBlogContent): Blog => {
    return {
      id: projectId, // Using project ID as proxy since simplified DTO doesn't return blog ID
      project_id: projectId,
      heading: backendData.heading,
      cover_image_url: backendData.coverImageUrl,
      introduction: backendData.introduction,
      content: backendData.content,
      custom_fields: backendData.customFields || [],
      chatbot_name: backendData.chatbotName || null,
      welcome_message: backendData.welcomeMessage || null,
      primary_color: backendData.primaryColor || null,
      bot_avatar_url: backendData.botAvatarUrl || null,
      created_at: new Date().toISOString(), // Mocked
      updated_at: new Date().toISOString(), // Mocked
    };
  };

  const transformInput = (input: UpdateBlogInput): BackendBlogContent => {
    return {
      heading: input.heading || "",
      coverImageUrl: input.cover_image_url || "",
      introduction: input.introduction || "",
      content: input.content || "",
      customFields: input.custom_fields || [],
    };
  };

  const getBlog = async (projectId: string): Promise<Blog | null> => {
    try {
      setLoading(true);
      setError(null);

      console.log(`[useBlogs] Fetching blog for project ${projectId}`);
      // Using generic get with explicit type
      const backendData = await apiClient.get<BackendBlogContent>(`/api/projects/${projectId}/blog`);

      console.log("[useBlogs] Received blog data:", backendData);
      return transformBlog(projectId, backendData);

    } catch (err) {
      // 404 is expected if blog doesn't exist yet, simplified backend returns 404
      console.warn("[useBlogs] Blog likely not found or error:", err);
      // Return null so frontend knows to show empty state/create mode
      return null;
    } finally {
      setLoading(false);
    }
  };

  const upsertBlog = async (projectId: string, input: UpdateBlogInput): Promise<Blog | null> => {
    if (!user) {
      toast.error("You must be logged in to update a blog");
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(`[useBlogs] Saving blog for project ${projectId}`);
      console.log("[useBlogs] Input received:", input);
      console.log("[useBlogs] Introduction from input:", input.introduction);
      console.log("[useBlogs] Content from input:", input.content);

      const backendInput = transformInput(input);
      console.log("[useBlogs] Transformed backend input:", backendInput);
      console.log("[useBlogs] Backend introduction:", backendInput.introduction);
      console.log("[useBlogs] Backend content:", backendInput.content);

      // PUT acts as upsert in our backend controller
      const backendData = await apiClient.put<BackendBlogContent>(`/api/projects/${projectId}/blog`, backendInput);

      console.log("[useBlogs] Blog saved successfully!");
      console.log("[useBlogs] Response from backend:", backendData);
      toast.success("Blog saved successfully!");
      return transformBlog(projectId, backendData);

    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save blog";
      setError(message);
      toast.error(message);
      console.error("[useBlogs] Error saving blog:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getPublicBlog = async (projectId: string): Promise<Blog | null> => {
    try {
      console.log(`[useBlogs] Fetching public blog for ${projectId}`);
      const backendData = await apiClient.get<BackendBlogContent>(`/api/public/projects/${projectId}/blog`, { skipAuth: true });
      return transformBlog(projectId, backendData);
    } catch (err) {
      console.error("[useBlogs] Error fetching public blog:", err);
      return null;
    }
  };

  const getPublicBlogBySlug = async (slug: string): Promise<Blog | null> => {
    try {
      console.log(`[useBlogs] Fetching public blog by slug: ${slug}`);
      const backendData = await apiClient.get<BackendBlogContent>(`/api/public/projects/blog/${slug}`, { skipAuth: true });

      // Extract project ID from slug for transformation
      const projectId = extractProjectIdFromSlug(slug);
      if (!projectId) {
        throw new Error("Invalid slug format");
      }

      return transformBlog(projectId, backendData);
    } catch (err) {
      console.error("[useBlogs] Error fetching public blog by slug:", err);
      return null;
    }
  };

  const extractProjectIdFromSlug = (slug: string): string | null => {
    try {
      // Expected format: "some-title-uuid"
      // UUID format: 8-4-4-4-12 hex characters
      const uuidPattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
      const match = slug.match(uuidPattern);

      if (match && match[1]) {
        return match[1];
      }
      return null;
    } catch (e) {
      console.error("Failed to extract UUID from slug:", slug, e);
      return null;
    }
  };

  return {
    loading,
    error,
    getBlog,
    upsertBlog,
    getPublicBlog,
    getPublicBlogBySlug,
  };
};
