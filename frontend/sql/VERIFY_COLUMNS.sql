-- ============================================
-- VERIFICA COLONNE ORGANIZATIONS
-- Esegui questo su Supabase per verificare quali colonne mancano
-- ============================================

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'organizations'
  AND column_name LIKE 'website%'
ORDER BY column_name;

-- Se mancano colonne, esegui DEPLOY_SIMPLE.sql
