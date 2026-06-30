import { supabase } from "@/integrations/supabase/client";

const BUCKET_NAME = "blog-media";

/**
 * Generates a unique storage path for a file.
 * Format: {projectId}/{type}/{timestamp}-{random}.{ext}
 */
function generatePath(projectId: string, file: File, type: "cover" | "image" | "video"): string {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${projectId}/${type}/${timestamp}-${random}.${ext}`;
}

/**
 * Checks if a string is a base64 data URL (starts with "data:").
 */
export function isBase64(value: string | null | undefined): boolean {
  return !!value && value.startsWith("data:");
}

/**
 * Checks if a string is a Supabase Storage URL (already uploaded).
 */
export function isStorageUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.includes("supabase.co/storage") || value.startsWith("https://");
}

/**
 * Converts a base64 data URL to a File object.
 */
function base64ToFile(base64: string, filename: string): File {
  const [header, data] = base64.split(",");
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new File([array], filename, { type: mime });
}

/**
 * Uploads a File to Supabase Storage and returns the public URL.
 * Uses upsert so re-uploads to the same path just overwrite.
 */
export async function uploadToStorage(
  projectId: string,
  file: File,
  type: "cover" | "image" | "video"
): Promise<string> {
  const path = generatePath(projectId, file, type);

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: "31536000", // 1 year cache
      upsert: true,
    });

  if (error) {
    console.error("[Storage] Upload error:", error);
    throw new Error(`Failed to upload ${type}: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  console.log(`[Storage] Uploaded ${type}: ${urlData.publicUrl}`);
  return urlData.publicUrl;
}

/**
 * Uploads a File directly (from file input).
 */
export async function uploadFileToStorage(
  projectId: string,
  file: File,
  type: "cover" | "image" | "video"
): Promise<string> {
  return uploadToStorage(projectId, file, type);
}

/**
 * If the value is a base64 string, uploads it to Storage and returns the URL.
 * If it's already a URL, returns it as-is.
 * If it's null/empty, returns empty string.
 */
export async function migrateBase64ToStorage(
  projectId: string,
  value: string | null | undefined,
  type: "cover" | "image" | "video"
): Promise<string> {
  if (!value || value.trim() === "") return "";

  // Already a URL — no migration needed
  if (isStorageUrl(value)) return value;

  // It's base64 — upload to storage
  if (isBase64(value)) {
    try {
      const ext = type === "video" ? "mp4" : "webp";
      const file = base64ToFile(value, `${type}-${Date.now()}.${ext}`);
      const url = await uploadToStorage(projectId, file, type);
      return url;
    } catch (err) {
      console.error(`[Storage] Failed to migrate base64 ${type}:`, err);
      // Return original base64 as fallback so data isn't lost
      return value;
    }
  }

  // Unknown format — return as-is
  return value;
}

/**
 * Deletes a file from storage by its public URL.
 */
export async function deleteFromStorage(publicUrl: string): Promise<void> {
  try {
    // Extract path from public URL
    const bucketPath = publicUrl.split(`/storage/v1/object/public/${BUCKET_NAME}/`)[1];
    if (!bucketPath) return;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([bucketPath]);

    if (error) {
      console.error("[Storage] Delete error:", error);
    }
  } catch (err) {
    console.error("[Storage] Delete failed:", err);
  }
}
