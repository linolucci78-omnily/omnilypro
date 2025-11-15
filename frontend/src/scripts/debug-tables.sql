-- =====================================================
-- DEBUG: Check what's wrong with customer_activities
-- =====================================================

-- 1. Check if table exists
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name = 'customer_activities';

-- 2. Check columns
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'customer_activities'
ORDER BY ordinal_position;

-- 3. Check RLS status
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'customer_activities';

-- 4. Check policies
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'customer_activities';

-- 5. Try a simple select
SELECT COUNT(*) as total_rows FROM customer_activities;
