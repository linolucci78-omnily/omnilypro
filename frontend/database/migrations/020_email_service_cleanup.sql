-- Cleanup Script per Migration 020
-- Esegui questo SOLO se la migration 020 è fallita parzialmente

-- Drop tabelle in ordine inverso (rispettando foreign keys)
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS email_settings CASCADE;

-- Drop funzioni helper
DROP FUNCTION IF EXISTS reset_daily_email_counter() CASCADE;
DROP FUNCTION IF EXISTS increment_email_counter(UUID) CASCADE;
DROP FUNCTION IF EXISTS can_send_email(UUID) CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_email_settings_updated_at ON email_settings;
DROP TRIGGER IF EXISTS trigger_email_templates_updated_at ON email_templates;

-- Drop trigger functions
DROP FUNCTION IF EXISTS update_email_settings_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_email_templates_updated_at() CASCADE;

-- Verifica cleanup
SELECT
  CASE
    WHEN NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_settings')
    THEN '✅ Cleanup completato'
    ELSE '⚠️ Alcune tabelle esistono ancora'
  END AS status;
