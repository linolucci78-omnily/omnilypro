-- ============================================================================
-- OMNILY PRO - REWARDS TABLE RLS POLICY FIX
-- Fix for 403 Forbidden error when creating rewards
-- ============================================================================

-- Ensure the rewards table has RLS enabled
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admin full access rewards" ON rewards;
DROP POLICY IF EXISTS "Organization users read rewards" ON rewards;
DROP POLICY IF EXISTS "Organization users insert rewards" ON rewards;
DROP POLICY IF EXISTS "Organization users update rewards" ON rewards;
DROP POLICY IF EXISTS "Organization users delete rewards" ON rewards;

-- Policy per admin - accesso completo a tutti i rewards
CREATE POLICY "Admin full access rewards" ON rewards FOR ALL USING (
  auth.uid() IN (
    SELECT user_id FROM organization_users
    WHERE role = 'super_admin'
  )
);

-- Policy per organization users - lettura rewards della loro org
CREATE POLICY "Organization users read rewards" ON rewards FOR SELECT USING (
  organization_id IN (
    SELECT org_id FROM organization_users
    WHERE user_id = auth.uid()
    AND role IN ('org_admin', 'manager', 'cashier')
  )
);

-- Policy per organization users - inserimento rewards nella loro org
CREATE POLICY "Organization users insert rewards" ON rewards FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT org_id FROM organization_users
    WHERE user_id = auth.uid()
    AND role IN ('org_admin', 'manager')
  )
);

-- Policy per organization users - aggiornamento rewards della loro org
CREATE POLICY "Organization users update rewards" ON rewards FOR UPDATE USING (
  organization_id IN (
    SELECT org_id FROM organization_users
    WHERE user_id = auth.uid()
    AND role IN ('org_admin', 'manager')
  )
);

-- Policy per organization users - eliminazione rewards della loro org
CREATE POLICY "Organization users delete rewards" ON rewards FOR DELETE USING (
  organization_id IN (
    SELECT org_id FROM organization_users
    WHERE user_id = auth.uid()
    AND role IN ('org_admin', 'manager')
  )
);

-- Verifica che le policies siano state create correttamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'rewards'
ORDER BY policyname;