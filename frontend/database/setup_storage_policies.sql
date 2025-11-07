-- ============================================
-- SUPABASE STORAGE POLICIES - CUSTOMER AVATARS
-- ============================================
-- Questo script configura le policy di sicurezza per il bucket customer-avatars
-- Esegui questo script nell'SQL Editor di Supabase

-- ============================================
-- 1. POLICY PER UPLOAD (INSERT)
-- ============================================
CREATE POLICY "Allow public upload to customer-avatars"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'customer-avatars');

-- ============================================
-- 2. POLICY PER UPDATE
-- ============================================
CREATE POLICY "Allow public update to customer-avatars"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'customer-avatars')
WITH CHECK (bucket_id = 'customer-avatars');

-- ============================================
-- 3. POLICY PER DELETE
-- ============================================
CREATE POLICY "Allow public delete from customer-avatars"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'customer-avatars');

-- ============================================
-- 4. POLICY PER SELECT (Lettura)
-- ============================================
CREATE POLICY "Allow public read from customer-avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'customer-avatars');

-- ============================================
-- VERIFICA POLICY ATTIVE
-- ============================================
-- Dopo aver eseguito lo script, verifica che le policy siano attive:
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%customer-avatars%';

-- ============================================
-- NOTE
-- ============================================
-- Queste policy permettono l'accesso pubblico al bucket customer-avatars
-- Se hai bisogno di maggiore sicurezza, cambia "TO public" con "TO authenticated"
-- e assicurati che gli utenti siano autenticati in Supabase
