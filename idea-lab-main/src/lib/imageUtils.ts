/**
 * Client-side image compression utility using Canvas API.
 * Resizes large images and converts to WebP for optimal file size.
 * No external dependencies required.
 */

interface CompressOptions {
    /** Maximum width or height in pixels (default: 2560) */
    maxDimension?: number;
    /** Output quality 0-1 (default: 0.92) */
    quality?: number;
    /** Output MIME type (default: 'image/webp', falls back to 'image/jpeg') */
    outputType?: string;
}

/**
 * Compress an image file using Canvas API.
 * - Resizes to fit within maxDimension (preserving aspect ratio)
 * - Converts to WebP (with JPEG fallback for unsupported browsers)
 * - Typically reduces a 5MB photo to ~200-500KB
 *
 * @param file - The original image File
 * @param options - Compression options
 * @returns A compressed File object
 */
export async function compressImage(
    file: File,
    options: CompressOptions = {}
): Promise<File> {
    const {
        maxDimension = 2560,
        quality = 0.92,
        outputType = 'image/webp',
    } = options;

    // Skip compression for small files (under 1MB) and non-raster formats
    if (file.size < 1024 * 1024) {
        return file;
    }

    // Skip SVGs — they're vector and don't benefit from raster compression
    if (file.type === 'image/svg+xml') {
        return file;
    }

    return new Promise<File>((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            let { width, height } = img;

            // Calculate new dimensions while preserving aspect ratio
            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = Math.round((height / width) * maxDimension);
                    width = maxDimension;
                } else {
                    width = Math.round((width / height) * maxDimension);
                    height = maxDimension;
                }
            }

            // Draw to canvas at new dimensions
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                // Fallback: return original if canvas context unavailable
                resolve(file);
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Try WebP first, fall back to JPEG
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        // WebP not supported, try JPEG
                        canvas.toBlob(
                            (jpegBlob) => {
                                if (!jpegBlob) {
                                    resolve(file); // Give up, return original
                                    return;
                                }
                                const compressedFile = new File(
                                    [jpegBlob],
                                    file.name.replace(/\.[^.]+$/, '.jpg'),
                                    { type: 'image/jpeg', lastModified: Date.now() }
                                );
                                console.log(
                                    `[imageUtils] Compressed ${formatSize(file.size)} → ${formatSize(compressedFile.size)} (JPEG fallback, ${width}x${height})`
                                );
                                resolve(compressedFile);
                            },
                            'image/jpeg',
                            quality
                        );
                        return;
                    }

                    const compressedFile = new File(
                        [blob],
                        file.name.replace(/\.[^.]+$/, '.webp'),
                        { type: outputType, lastModified: Date.now() }
                    );
                    console.log(
                        `[imageUtils] Compressed ${formatSize(file.size)} → ${formatSize(compressedFile.size)} (WebP, ${width}x${height})`
                    );
                    resolve(compressedFile);
                },
                outputType,
                quality
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            console.warn('[imageUtils] Failed to load image for compression, using original');
            resolve(file); // Graceful fallback
        };

        img.src = objectUrl;
    });
}

/** Format bytes to human-readable string */
function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

/**
 * Append Supabase image transform query params to a storage URL.
 * Uses Supabase's built-in CDN image transforms for serving optimized thumbnails.
 *
 * @param url - The original Supabase storage public URL
 * @param width - Desired width in pixels
 * @param quality - Quality 1-100 (default: 75)
 * @returns URL with transform params appended
 */
export function getOptimizedImageUrl(
    url: string,
    width: number,
    quality: number = 75
): string {
    if (!url) return url;

    // Only transform Supabase storage URLs
    if (!url.includes('supabase')) return url;

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${width}&quality=${quality}`;
}
