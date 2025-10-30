-- Verifica configurazione Supabase per CORS/RLS issues

-- 1. Check se la tabella devices esiste e ha RLS abilitato
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('devices', 'setup_tokens', 'organizations');

-- 2. Check policies su devices table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'devices';

-- 3. Check policies su setup_tokens table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'setup_tokens';

-- 4. Verifica se ci sono device esistenti
SELECT COUNT(*) as device_count FROM devices;

-- 5. Verifica setup_tokens table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'setup_tokens'
ORDER BY ordinal_position;
