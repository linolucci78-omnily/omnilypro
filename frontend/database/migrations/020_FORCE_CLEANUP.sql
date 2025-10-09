-- CLEANUP FORZATO - Rimuove TUTTO senza errori
-- Esegui questo per ripartire da zero

-- Drop tutto in ordine (CASCADE rimuove dipendenze)
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS email_settings CASCADE;

-- Drop funzioni
DROP FUNCTION IF EXISTS reset_daily_email_counter() CASCADE;
DROP FUNCTION IF EXISTS increment_email_counter(UUID) CASCADE;
DROP FUNCTION IF EXISTS can_send_email(UUID) CASCADE;

-- Drop trigger functions
DROP FUNCTION IF EXISTS update_email_settings_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_email_templates_updated_at() CASCADE;

-- Verifica
SELECT
  CASE
    WHEN NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name IN ('email_settings', 'email_templates', 'email_logs'))
    THEN '✅ CLEANUP COMPLETATO - Tutto rimosso'
    ELSE '⚠️ Alcune tabelle esistono ancora'
  END as status;
