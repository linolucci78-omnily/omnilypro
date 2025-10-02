-- ============================================================================
-- VERIFICA SOLO TABELLA public.users
-- ============================================================================

-- 1. Verifica se esiste la tabella public.users
SELECT
  table_schema,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'users';

-- 2. Struttura SOLO della tabella public.users
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Verifica RLS policies su public.users
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users';

-- 4. Verifica il tuo ruolo attuale
SELECT
  ou.user_id,
  ou.org_id,
  ou.role,
  ou.status,
  au.email
FROM public.organization_users ou
JOIN auth.users au ON au.id = ou.user_id
WHERE ou.user_id = auth.uid();

-- 5. Conta utenti esistenti in public.users
SELECT COUNT(*) as total_records
FROM public.users;

-- 6. Mostra primi 5 record (se esistono)
SELECT *
FROM public.users
LIMIT 5;
