-- Create storage bucket for website images
INSERT INTO storage.buckets (id, name, public)
VALUES ('website-images', 'website-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
CREATE POLICY "Public Access for website images"
ON storage.objects FOR SELECT
USING (bucket_id = 'website-images');

CREATE POLICY "Authenticated users can upload website images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'website-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their website images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'website-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their website images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'website-images' AND
  auth.role() = 'authenticated'
);
