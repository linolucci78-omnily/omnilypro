-- Verifica API Key Resend configurata

-- Controlla se esiste resend_api_key in email_settings
SELECT
  organization_id,
  from_email,
  CASE
    WHEN resend_api_key IS NOT NULL AND resend_api_key != ''
    THEN CONCAT('✅ Configurata (lunghezza: ', LENGTH(resend_api_key), ' caratteri)')
    ELSE '❌ NON configurata'
  END as api_key_status,
  enabled,
  daily_limit,
  emails_sent_today
FROM email_settings;

-- Se vuoto, mostra che devi configurarla
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '❌ ERRORE: Tabella email_settings è vuota!'
    WHEN COUNT(*) > 0 AND SUM(CASE WHEN resend_api_key IS NULL OR resend_api_key = '' THEN 1 ELSE 0 END) > 0
    THEN '⚠️ ATTENZIONE: API Key Resend non configurata! Inserisci con: UPDATE email_settings SET resend_api_key = ''re_xxxxx'''
    ELSE '✅ OK: API Key configurata'
  END as risultato
FROM email_settings;
