-- Migration 021: Fix Email Service RLS for Super Admin
-- Problema: Le policy permettono solo role='admin', ma super_admin non può accedere
-- Soluzione: Aggiornare le policy per includere ANCHE super_admin
-- Data: 2025-10-11

-- ============================================
-- FIX: email_settings policies
-- ============================================

DROP POLICY IF EXISTS "Admin full access email_settings" ON email_settings;
CREATE POLICY "Admin full access email_settings" ON email_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_users
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

DROP POLICY IF EXISTS "Super admin can view global settings" ON email_settings;
CREATE POLICY "Super admin can view global settings" ON email_settings FOR SELECT
USING (
  organization_id IS NULL
  OR EXISTS (
    SELECT 1 FROM organization_users
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);

-- ============================================
-- FIX: email_templates policies
-- ============================================

DROP POLICY IF EXISTS "Admin full access email_templates" ON email_templates;
CREATE POLICY "Admin full access email_templates" ON email_templates FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_users
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- ============================================
-- FIX: email_logs policies
-- ============================================

DROP POLICY IF EXISTS "Admin full access email_logs" ON email_logs;
CREATE POLICY "Admin full access email_logs" ON email_logs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM organization_users
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- ============================================
-- VERIFICA
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration 021 completata!';
  RAISE NOTICE '✅ Super admin può ora accedere a email_settings, email_templates e email_logs';
  RAISE NOTICE '';
END $$;
