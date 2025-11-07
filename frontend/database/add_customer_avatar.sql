-- ============================================
-- ADD AVATAR AND NOTES SUPPORT TO CUSTOMERS TABLE
-- ============================================

-- Aggiungi campo avatar_url alla tabella customers
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Aggiungi campo notes alla tabella customers
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Crea indice per performance
CREATE INDEX IF NOT EXISTS idx_customers_avatar_url
ON customers(avatar_url)
WHERE avatar_url IS NOT NULL;

-- ============================================
-- SUPABASE STORAGE BUCKET SETUP
-- ============================================

-- Questo deve essere eseguito tramite interfaccia Supabase o CLI:
-- 1. Vai su Storage > Create Bucket
-- 2. Nome: customer-avatars
-- 3. Public: true
-- 4. File size limit: 5MB
-- 5. Allowed MIME types: image/*

-- OPPURE tramite SQL (se hai permessi admin):
/*
INSERT INTO storage.buckets (id, name, public)
VALUES ('customer-avatars', 'customer-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy per permettere upload pubblici
CREATE POLICY "Avatar upload policy" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'customer-avatars');

-- Policy per lettura pubblica
CREATE POLICY "Avatar read policy" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'customer-avatars');

-- Policy per update (solo owner)
CREATE POLICY "Avatar update policy" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'customer-avatars');

-- Policy per delete (solo owner)
CREATE POLICY "Avatar delete policy" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'customer-avatars');
*/

-- ============================================
-- COMMENTI
-- ============================================

COMMENT ON COLUMN customers.avatar_url IS 'URL pubblico dell''avatar del cliente (Supabase Storage)';
COMMENT ON COLUMN customers.notes IS 'Note interne sul cliente visibili solo agli operatori';

-- ============================================
-- FINE SCRIPT
-- ============================================
