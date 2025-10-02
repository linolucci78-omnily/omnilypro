-- Verifica se la tabella users esiste nello schema public
SELECT
  table_schema,
  table_name
FROM information_schema.tables
WHERE table_name = 'users'
ORDER BY table_schema;

-- Verifica struttura della tabella users nello schema public
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Verifica policies sulla tabella users
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users'
  AND schemaname = 'public';

-- Conta record nella tabella users
SELECT COUNT(*) as total_users FROM public.users;
