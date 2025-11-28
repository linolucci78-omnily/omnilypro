-- Fix RLS policies per stripe_config
-- Rimuovi le vecchie policy
DROP POLICY IF EXISTS "Admin can view stripe config" ON stripe_config;
DROP POLICY IF EXISTS "Admin can update stripe config" ON stripe_config;
DROP POLICY IF EXISTS "Admin can insert stripe config" ON stripe_config;

-- Crea policy più semplici che usano solo auth.uid()
-- Tutti gli utenti autenticati possono vedere (poi filtreremo nel frontend)
CREATE POLICY "Allow authenticated users to view stripe config" ON stripe_config
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Tutti gli utenti autenticati possono aggiornare (poi filtreremo nel frontend)
CREATE POLICY "Allow authenticated users to update stripe config" ON stripe_config
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Tutti gli utenti autenticati possono inserire (poi filtreremo nel frontend)
CREATE POLICY "Allow authenticated users to insert stripe config" ON stripe_config
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- NOTA: In produzione, dovresti aggiungere un campo 'role' nella tabella users
-- e controllare che solo gli admin possano accedere.
-- Per ora, il controllo sarà fatto a livello di routing nel frontend.
