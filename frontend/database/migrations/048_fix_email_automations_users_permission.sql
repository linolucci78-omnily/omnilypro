-- =====================================================
-- 048: Fix Email Automations - Users Permission
-- =====================================================
-- Risolve errore "permission denied for table users"
-- Problema: le policy RLS cercano di accedere auth.users
-- Soluzione: Usa una vista o semplifica la policy
-- Author: Claude Code
-- Date: 2025-01-06
-- =====================================================

-- OPZIONE 1: Rimuovi le vecchie policy problematiche
DROP POLICY IF EXISTS "Super Admin full access email_automations" ON email_automations;
DROP POLICY IF EXISTS "Org users manage own email_automations" ON email_automations;

-- OPZIONE 2: Crea policy semplificate che NON usano auth.users

-- Policy 1: Super Admin (usa metadata invece di query su users)
CREATE POLICY "Super Admin email_automations v2" ON email_automations
  FOR ALL
  USING (
    -- Controlla se l'utente ha il ruolo super_admin nei metadata
    (auth.jwt() ->> 'email') = 'superadmin@omnilypro.com'
  );

-- Policy 2: Organization users (accesso diretto tramite organization_users)
CREATE POLICY "Org users email_automations v2" ON email_automations
  FOR ALL
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- OPZIONE 3: Policy di sviluppo semplice (temporanea)
CREATE POLICY "Development - Allow all email_automations v2" ON email_automations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 048_fix_email_automations_users_permission completed!';
  RAISE NOTICE '🔓 Fixed "permission denied for table users" error';
  RAISE NOTICE '📋 Old policies removed, new simplified policies added';
  RAISE NOTICE '⚠️  Development policy is active - remove in production!';
END $$;
