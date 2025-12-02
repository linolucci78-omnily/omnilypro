-- ========================================
-- FIX RLS POLICY PER COUPONS
-- I clienti devono poter vedere i coupon attivi
-- ========================================

-- Aggiungi una policy per permettere a TUTTI (anche anonimi/clienti)
-- di leggere i coupon ATTIVI
CREATE POLICY "Anyone can view active coupons"
ON coupons
FOR SELECT
TO public
USING (status = 'active');

-- Verifica le policies dopo la modifica
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'coupons'
ORDER BY policyname;
