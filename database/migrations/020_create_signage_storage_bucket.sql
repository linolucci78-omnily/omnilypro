-- Migration: Create Signage Media Storage Bucket
-- Description: Create Supabase Storage bucket for signage media files

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'signage-media',
    'signage-media',
    true, -- Public bucket so URLs work without auth
    52428800, -- 50MB max file size
    ARRAY[
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'application/pdf'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to their organization folder
CREATE POLICY "Users can upload to their org folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'signage-media' AND
    (storage.foldername(name))[1] IN (
        SELECT org_id::text FROM organization_users WHERE user_id = auth.uid()
    )
);

-- Allow authenticated users to read files from their organization folder
CREATE POLICY "Users can read their org files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'signage-media' AND
    (storage.foldername(name))[1] IN (
        SELECT org_id::text FROM organization_users WHERE user_id = auth.uid()
    )
);

-- Allow authenticated users to update files in their organization folder
CREATE POLICY "Users can update their org files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'signage-media' AND
    (storage.foldername(name))[1] IN (
        SELECT org_id::text FROM organization_users WHERE user_id = auth.uid()
    )
);

-- Allow authenticated users to delete files from their organization folder
CREATE POLICY "Users can delete their org files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'signage-media' AND
    (storage.foldername(name))[1] IN (
        SELECT org_id::text FROM organization_users WHERE user_id = auth.uid()
    )
);

-- Allow public read access (since bucket is public)
CREATE POLICY "Public can read signage media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'signage-media');
