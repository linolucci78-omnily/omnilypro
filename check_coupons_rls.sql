-- ========================================
-- VERIFICA RLS POLICIES PER COUPONS
-- ========================================

-- 1. Verifica policies sulla tabella coupons
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'coupons';

-- 2. Verifica se RLS è abilitato
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'coupons';

-- 3. Controlla alcuni coupon attivi di Sapori e Colori
SELECT
  id,
  code,
  title,
  type,
  value,
  status,
  is_flash,
  valid_from,
  valid_until
FROM coupons
WHERE organization_id = 'c06a8dcf-b209-40b1-92a5-c80facf2eb29'
ORDER BY is_flash DESC, created_at DESC;
