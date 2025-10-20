-- ============================================================================
-- FIX: Policy RLS per contract_notifications
-- ============================================================================

-- Drop vecchie policy se esistono
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON contract_notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON contract_notifications;

-- Crea policy che permette inserimento
CREATE POLICY "Enable insert for authenticated users"
ON contract_notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permetti anche lettura per gli utenti autenticati
DROP POLICY IF EXISTS "Users can read notifications" ON contract_notifications;

CREATE POLICY "Users can read notifications"
ON contract_notifications
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
  cmd
FROM pg_policies
WHERE tablename = 'contract_notifications'
ORDER BY policyname;
