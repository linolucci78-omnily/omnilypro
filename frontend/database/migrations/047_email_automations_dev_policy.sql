-- =====================================================
-- 047: Email Automations - Development Policy
-- =====================================================
-- Aggiunge policy temporanea per sviluppo/testing
-- Author: Claude Code
-- Date: 2025-01-06
-- =====================================================

-- Aggiungi policy per sviluppo che permette accesso completo
CREATE POLICY "Development - Allow all for email_automations" ON email_automations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 047_email_automations_dev_policy completed successfully!';
  RAISE NOTICE '🔓 Development policy added to email_automations table';
  RAISE NOTICE '⚠️  REMEMBER: Remove this policy in production!';
END $$;
