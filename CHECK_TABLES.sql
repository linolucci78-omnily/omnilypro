-- Script per verificare se le tabelle dei contratti esistono
-- Esegui questo su Supabase SQL Editor

-- Controlla se esistono le tabelle
SELECT
  table_name,
  CASE
    WHEN table_name IN ('contracts', 'contract_templates', 'contract_signatures', 'signature_audit_log', 'contract_notifications')
    THEN '✅ ESISTE'
    ELSE '❌ NON ESISTE'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('contracts', 'contract_templates', 'contract_signatures', 'signature_audit_log', 'contract_notifications')
ORDER BY table_name;

-- Se non vedi nessuna riga, le tabelle NON esistono!
-- Devi eseguire la migrazione: database/migrations/015_create_contracts_esignature_system.sql
