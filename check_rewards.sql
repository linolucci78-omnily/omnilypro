-- ========================================
-- VERIFICA PREMI SAPORI E COLORI
-- ========================================

-- 1. Controlla quanti premi ci sono per questa organizzazione
SELECT
  COUNT(*) as totale_premi,
  COUNT(*) FILTER (WHERE is_active = true) as premi_attivi,
  COUNT(*) FILTER (WHERE is_active = false) as premi_disattivi
FROM rewards
WHERE organization_id = 'c06a8dcf-b209-40b1-92a5-c80facf2eb29';

-- 2. Lista tutti i premi con dettagli
SELECT
  id,
  name,
  type,
  points_required,
  is_active,
  created_at
FROM rewards
WHERE organization_id = 'c06a8dcf-b209-40b1-92a5-c80facf2eb29'
ORDER BY points_required ASC;

-- 3. Verifica organization_id di Lucia
SELECT
  id,
  first_name,
  last_name,
  organization_id,
  points
FROM customers
WHERE email = 'lucia.procope47@gmail.com';

-- 4. Verifica policies RLS sulla tabella rewards
-- (Questa query mostra se ci sono policies che potrebbero bloccare la lettura)
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
WHERE tablename = 'rewards';
