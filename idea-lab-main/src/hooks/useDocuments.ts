import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import apiClient from "@/lib/api";

export interface Document {
  id: string;
  project_id: string;
  document_group_id: string;
  uploaded_by: string;
  original_filename: string;
  storage_path: string;
  mime_type: string;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useDocuments = (projectId: string | undefined) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    if (!projectId || !user) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await apiClient.get<Document[]>(`/api/documents/project/${projectId}`);
      setDocuments(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch documents";
      setError(message);
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [projectId, user?.id]);

  const uploadDocument = async (file: File): Promise<Document | null> => {
    if (!user || !projectId) {
      toast.error("You must be logged in to upload documents");
      return null;
    }

    try {
      setUploading(true);
      const newDoc = await apiClient.uploadFile<Document>(`/api/documents/project/${projectId}`, file);

      setDocuments(prev => [newDoc, ...prev]);
      toast.success("Document uploaded successfully!");
      return newDoc;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload document";
      toast.error(message);
      console.error("Error uploading document:", err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const replaceDocument = async (documentId: string, file: File): Promise<Document | null> => {
    if (!user || !projectId) {
      toast.error("You must be logged in to replace documents");
      return null;
    }

    try {
      setUploading(true);
      
      // apiClient doesn't have a built-in 'putFile', but we can use post with a custom header or just extend apiClient
      // Actually, let's use the existing uploadFile logic but with PUT since backend expects PUT for replace
      // I'll quickly check if I can add a put variant to uploadFile or just use fetch with safeGetSession
      const session = await apiClient.safeGetSession();
      const token = session?.access_token;
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8081";

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${backendUrl}/api/documents/${documentId}/replace`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to replace document");
      }

      const newDoc: Document = await response.json();

      setDocuments(prev => prev.map(d => d.id === documentId ? newDoc : d));
      toast.success("Document replaced successfully!");
      return newDoc;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to replace document";
      toast.error(message);
      console.error("Error replacing document:", err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (documentId: string): Promise<boolean> => {
    if (!user) {
      toast.error("You must be logged in to delete documents");
      return false;
    }

    try {
      // Soft delete
      const { error: deleteError } = await supabase
        .from("documents")
        .update({ is_active: false })
        .eq("id", documentId);

      if (deleteError) throw deleteError;

      setDocuments(prev => prev.filter(d => d.id !== documentId));
      toast.success("Document deleted successfully!");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete document";
      toast.error(message);
      console.error("Error deleting document:", err);
      return false;
    }
  };

  const renameDocument = async (documentId: string, newName: string): Promise<boolean> => {
    if (!user) {
      toast.error("You must be logged in to rename documents");
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from("documents")
        .update({ original_filename: newName })
        .eq("id", documentId);

      if (updateError) throw updateError;

      setDocuments(prev => prev.map(d =>
        d.id === documentId ? { ...d, original_filename: newName } : d
      ));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to rename document";
      toast.error(message);
      console.error("Error renaming document:", err);
      return false;
    }
  };

  const refreshKnowledge = async (): Promise<boolean> => {
    if (!user || !projectId) {
      toast.error("You must be logged in to refresh knowledge base");
      return false;
    }

    try {
      // Call the backend refresh endpoint
      await apiClient.post(`/api/documents/project/${projectId}/refresh`, {});

      // Re-fetch documents to ensure we have the latest data
      await fetchDocuments();

      toast.success("Knowledge base refreshed successfully!");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to refresh knowledge base";
      toast.error(message);
      console.error("Error refreshing knowledge base:", err);
      return false;
    }
  };

  return {
    documents,
    loading,
    uploading,
    error,
    fetchDocuments,
    uploadDocument,
    replaceDocument,
    deleteDocument,
    renameDocument,
    refreshKnowledge,
  };
};

