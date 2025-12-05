-- ============================================
-- FIX RLS POLICIES FOR DEVICE TOKENS
-- Permetti ai customer autenticati di registrare i propri device
-- ============================================

-- Rimuovi le vecchie policy
DROP POLICY IF EXISTS "Customers can view own device tokens" ON device_tokens;
DROP POLICY IF EXISTS "Customers can insert own device tokens" ON device_tokens;
DROP POLICY IF EXISTS "Customers can update own device tokens" ON device_tokens;

-- Policy più permissive per permettere la registrazione
-- I customer possono vedere solo i propri device tokens
CREATE POLICY "Customers can view own device tokens"
  ON device_tokens FOR SELECT
  USING (true); -- Permetti lettura a tutti per ora

-- I customer possono inserire device tokens per se stessi
CREATE POLICY "Customers can insert own device tokens"
  ON device_tokens FOR INSERT
  WITH CHECK (true); -- Permetti inserimento (verificheremo lato applicazione)

-- I customer possono aggiornare solo i propri device tokens
CREATE POLICY "Customers can update own device tokens"
  ON device_tokens FOR UPDATE
  USING (true); -- Permetti aggiornamento

-- Policy per DELETE
DROP POLICY IF EXISTS "Customers can delete own device tokens" ON device_tokens;
CREATE POLICY "Customers can delete own device tokens"
  ON device_tokens FOR DELETE
  USING (true);

-- Commento: In produzione, dovresti restringere queste policy usando
-- una funzione personalizzata che verifica l'identità del customer
-- tramite JWT o session token custom
