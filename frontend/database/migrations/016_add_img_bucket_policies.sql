-- Storage Policies for IMG bucket (logos)

-- Allow public SELECT (anyone can view images)
CREATE POLICY "Public access to IMG bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'IMG');

-- Allow authenticated users to INSERT (upload)
CREATE POLICY "Authenticated users can upload to IMG"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'IMG');

-- Allow authenticated users to UPDATE their uploads
CREATE POLICY "Authenticated users can update IMG files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'IMG');

-- Allow authenticated users to DELETE their uploads
CREATE POLICY "Authenticated users can delete IMG files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'IMG');
