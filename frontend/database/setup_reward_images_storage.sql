-- ============================================
-- SUPABASE STORAGE POLICIES - REWARD IMAGES
-- ============================================
-- Questo script configura le policy di sicurezza per il bucket reward-images
-- Esegui questo script nell'SQL Editor di Supabase

-- ============================================
-- 1. POLICY PER UPLOAD (INSERT)
-- ============================================
CREATE POLICY "Allow public upload to reward-images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'reward-images');

-- ============================================
-- 2. POLICY PER UPDATE
-- ============================================
CREATE POLICY "Allow public update to reward-images"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'reward-images')
WITH CHECK (bucket_id = 'reward-images');

-- ============================================
-- 3. POLICY PER DELETE
-- ============================================
CREATE POLICY "Allow public delete from reward-images"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'reward-images');

-- ============================================
-- 4. POLICY PER SELECT (Lettura)
-- ============================================
CREATE POLICY "Allow public read from reward-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'reward-images');

-- ============================================
-- VERIFICA POLICY ATTIVE
-- ============================================
-- Dopo aver eseguito lo script, verifica che le policy siano attive:
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%reward-images%';

-- ============================================
-- ISTRUZIONI PER CREARE IL BUCKET
-- ============================================
-- 1. Vai su Supabase Dashboard → Storage
-- 2. Clicca "Create a new bucket"
-- 3. Configurazione:
--    - Name: reward-images
--    - Public: Sì
--    - File size limit: 5MB
--    - Allowed MIME types: image/*
-- 4. Esegui questo script SQL per le policy

-- ============================================
-- NOTE
-- ============================================
-- Queste policy permettono l'accesso pubblico al bucket reward-images
-- Se hai bisogno di maggiore sicurezza, cambia "TO public" con "TO authenticated"
-- e assicurati che gli utenti siano autenticati in Supabase
