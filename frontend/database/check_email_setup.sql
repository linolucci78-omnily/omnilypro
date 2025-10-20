-- Verifica configurazione email

-- 1. Controlla email_settings
SELECT
  'email_settings' as tabella,
  organization_id,
  from_email,
  from_name,
  enabled,
  daily_limit,
  emails_sent_today,
  CASE WHEN resend_api_key IS NOT NULL THEN '✅ Configurata' ELSE '❌ Mancante' END as api_key_status
FROM email_settings;

-- 2. Controlla email_templates
SELECT
  'email_templates' as tabella,
  organization_id,
  template_type,
  name,
  is_active,
  is_default,
  subject
FROM email_templates
WHERE template_type = 'contract_otp';

-- 3. Controlla email_logs (ultimi 5)
SELECT
  'email_logs' as tabella,
  to_email,
  subject,
  status,
  sent_at,
  resend_email_id,
  template_type
FROM email_logs
ORDER BY sent_at DESC
LIMIT 5;

-- 4. Verifica policy contract_notifications
SELECT
  'contract_notifications_policies' as info,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'contract_notifications';
