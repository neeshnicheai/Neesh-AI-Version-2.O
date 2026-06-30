-- Create storage bucket for cover images
INSERT INTO storage.buckets (id, name, public)
VALUES ('cover-images', 'cover-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to cover images
CREATE POLICY "Cover images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'cover-images');

-- Allow authenticated users to upload cover images
CREATE POLICY "Users can upload cover images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cover-images' AND auth.uid() IS NOT NULL);

-- Allow users to update their own cover images
CREATE POLICY "Users can update cover images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'cover-images' AND auth.uid() IS NOT NULL);

-- Allow users to delete cover images
CREATE POLICY "Users can delete cover images"
ON storage.objects FOR DELETE
USING (bucket_id = 'cover-images' AND auth.uid() IS NOT NULL);