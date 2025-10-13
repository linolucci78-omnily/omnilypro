-- Fix RLS policies for email-images bucket
-- Permette agli utenti autenticati di:
-- 1. Caricare immagini nella cartella della loro organizzazione
-- 2. Leggere immagini dalla cartella della loro organizzazione
-- 3. Eliminare immagini dalla cartella della loro organizzazione

-- DROP existing policies if any
DROP POLICY IF EXISTS "Users can upload email images to their org folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read email images from their org folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete email images from their org folder" ON storage.objects;
DROP POLICY IF EXISTS "Public can view email images" ON storage.objects;

-- Policy 1: Upload (INSERT)
-- Permette agli utenti autenticati di caricare nella loro org folder
CREATE POLICY "Users can upload email images to their org folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'email-images' AND
  -- Il path deve iniziare con un organization_id a cui l'utente appartiene
  (storage.foldername(name))[1] IN (
    SELECT org_id::text 
    FROM organization_users 
    WHERE user_id = auth.uid()
  )
);

-- Policy 2: Read (SELECT) - per listare e vedere le immagini
CREATE POLICY "Users can read email images from their org folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'email-images' AND
  -- Il path deve iniziare con un organization_id a cui l'utente appartiene
  (storage.foldername(name))[1] IN (
    SELECT org_id::text 
    FROM organization_users 
    WHERE user_id = auth.uid()
  )
);

-- Policy 3: Delete (DELETE)
CREATE POLICY "Users can delete email images from their org folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'email-images' AND
  -- Il path deve iniziare con un organization_id a cui l'utente appartiene
  (storage.foldername(name))[1] IN (
    SELECT org_id::text 
    FROM organization_users 
    WHERE user_id = auth.uid()
  )
);

-- Policy 4: Public read (opzionale, solo se vuoi che le immagini siano pubbliche)
-- Questa permette a chiunque di vedere le immagini via URL pubblico
CREATE POLICY "Public can view email images"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'email-images'
);

-- Verifica che il bucket esista e sia pubblico
UPDATE storage.buckets 
SET public = true 
WHERE id = 'email-images';
