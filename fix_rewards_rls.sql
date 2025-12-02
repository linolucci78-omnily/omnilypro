-- ========================================
-- FIX RLS POLICY PER REWARDS
-- I clienti devono poter vedere i premi attivi
-- ========================================

-- Aggiungi una policy per permettere a TUTTI (anche anonimi/clienti)
-- di leggere i premi ATTIVI
CREATE POLICY "Anyone can view active rewards"
ON rewards
FOR SELECT
TO public
USING (is_active = true);

-- Verifica le policies dopo la modifica
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'rewards'
ORDER BY policyname;
