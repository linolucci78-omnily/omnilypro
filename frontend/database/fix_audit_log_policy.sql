-- ============================================================================
-- FIX: Policy RLS per signature_audit_log
-- ============================================================================
-- Permette l'inserimento di log audit durante la creazione contratti
-- ============================================================================

-- Drop vecchie policy se esistono
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON signature_audit_log;
DROP POLICY IF EXISTS "Enable insert for system" ON signature_audit_log;
DROP POLICY IF EXISTS "Users can insert audit logs" ON signature_audit_log;

-- Crea policy che permette inserimento
CREATE POLICY "Enable insert for authenticated users"
ON signature_audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permetti anche lettura per gli utenti autenticati
DROP POLICY IF EXISTS "Users can read audit logs" ON signature_audit_log;

CREATE POLICY "Users can read audit logs"
ON signature_audit_log
FOR SELECT
TO authenticated
USING (true);

-- Verifica policy attive
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
WHERE tablename = 'signature_audit_log'
ORDER BY policyname;
