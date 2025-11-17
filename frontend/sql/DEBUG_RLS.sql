-- Debug RLS issue for contact_form_submissions

-- 1. Check all policies (including RESTRICTIVE ones)
SELECT
  schemaname,
  tablename,
  policyname,
  permissive, -- Should be 'PERMISSIVE', if any are 'RESTRICTIVE' they could block
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'contact_form_submissions'
ORDER BY permissive DESC, policyname;

-- 2. Check table ownership and RLS status
SELECT
  schemaname,
  tablename,
  tableowner,
  rowsecurity -- Should be 't' for true
FROM pg_tables
WHERE tablename = 'contact_form_submissions';

-- 3. Check if anon role has INSERT permission on the table
SELECT
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'contact_form_submissions'
  AND grantee IN ('anon', 'authenticated', 'public');

-- 4. Test if we can insert as anon (this might fail but will show the exact error)
-- First, let's see what the default role is
SELECT current_user, session_user;

-- 5. Check table structure for any constraints that might be failing
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'contact_form_submissions'
ORDER BY ordinal_position;
