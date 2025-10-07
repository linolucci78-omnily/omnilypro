-- Fix RLS per permettere ai dispositivi di inserire log attività
-- I dispositivi Android usano la chiave anon senza auth.uid()

-- Policy per permettere INSERT di log da parte dei dispositivi
-- Solo se il device_id esiste nella tabella devices
CREATE POLICY "Devices can insert activity logs"
ON mdm_activity_logs
FOR INSERT
WITH CHECK (
  device_id IN (SELECT id FROM devices)
);

-- Verifica policy create
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'mdm_activity_logs'
ORDER BY policyname;
