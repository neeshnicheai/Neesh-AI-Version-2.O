import { useState, useEffect } from "react";
import { toast } from "sonner";
import { compressImage } from "@/lib/imageUtils";
import { uploadFileToStorage, isBase64, migrateBase64ToStorage } from "@/lib/storage";

/**
 * Manages cover images using Supabase Storage.
 * Images are compressed client-side then uploaded to storage.
 * Falls back to localStorage for reading old base64 data.
 */
export const useCoverImage = (projectId: string | undefined) => {
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Load cover image — check localStorage first (legacy), then storage URL
  useEffect(() => {
    if (!projectId) return;

    const saved = localStorage.getItem(`cover-image-${projectId}`);
    if (saved) {
      setCoverImage(saved);

      // If it's still base64 (legacy), migrate to Storage in background
      if (isBase64(saved)) {
        migrateBase64ToStorage(projectId, saved, "cover").then((url) => {
          if (url && url !== saved) {
            // Update localStorage with the new URL
            localStorage.setItem(`cover-image-${projectId}`, url);
            setCoverImage(url);
            console.log("[CoverImage] Migrated base64 to Storage URL:", url);
          }
        }).catch(() => {
          // Keep base64 as fallback
        });
      }
    }
  }, [projectId]);

  const uploadCoverImage = async (file: File) => {
    if (!projectId) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large. Please upload an image under 10MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file.");
      return;
    }

    setUploading(true);

    try {
      // Compress image first
      const compressedFile = await compressImage(file);

      // Upload to Supabase Storage
      const url = await uploadFileToStorage(projectId, compressedFile, "cover");

      // Store URL in localStorage (not base64 anymore)
      localStorage.setItem(`cover-image-${projectId}`, url);
      setCoverImage(url);
      toast.success("Cover image uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeCoverImage = async () => {
    if (!projectId) return;

    setCoverImage(null);
    localStorage.removeItem(`cover-image-${projectId}`);
    toast.success("Cover image removed.");
  };

  return {
    coverImage,
    uploading,
    uploadCoverImage,
    removeCoverImage,
  };
};
