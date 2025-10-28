-- Diagnose Gift Certificate Email Issues
-- Run this script to check all email configuration for gift certificates

-- 1. Check email_settings (global and per-org)
SELECT
  '1. EMAIL SETTINGS' as section,
  CASE WHEN organization_id IS NULL THEN '🌐 Global' ELSE '🏢 Org: ' || organization_id END as scope,
  from_email,
  from_name,
  enabled as email_enabled,
  daily_limit,
  emails_sent_today,
  CASE WHEN resend_api_key IS NOT NULL THEN '✅ API Key Set' ELSE '❌ No API Key' END as api_key_status,
  primary_color,
  secondary_color,
  CASE WHEN logo_url IS NOT NULL THEN '✅ Has Logo' ELSE '⚠️ No Logo' END as logo_status
FROM email_settings
ORDER BY organization_id NULLS FIRST;

-- 2. Check gift_certificate_issued template
SELECT
  '2. GIFT CERT TEMPLATE' as section,
  CASE WHEN organization_id IS NULL THEN '🌐 Global' ELSE '🏢 Org: ' || organization_id END as scope,
  name,
  template_type,
  subject,
  is_active,
  is_default,
  LENGTH(html_body) as html_body_size,
  LENGTH(text_body) as text_body_size,
  created_at
FROM email_templates
WHERE template_type = 'gift_certificate_issued'
ORDER BY organization_id NULLS FIRST, is_default DESC;

-- 3. Check recent email logs for gift certificates
SELECT
  '3. RECENT EMAIL LOGS' as section,
  to_email,
  subject,
  status,
  sent_at,
  template_type,
  resend_email_id,
  LEFT(error_message, 100) as error_preview
FROM email_logs
WHERE template_type = 'gift_certificate_issued'
ORDER BY sent_at DESC
LIMIT 10;

-- 4. Check if we have any email logs at all
SELECT
  '4. TOTAL EMAIL STATS' as section,
  COUNT(*) as total_emails,
  COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
  MAX(sent_at) as last_email_sent
FROM email_logs;

-- 5. Check gift certificate settings
SELECT
  '5. GIFT CERT SETTINGS' as section,
  organization_id,
  code_prefix,
  code_length,
  default_validity_days,
  send_email_on_issue,
  allow_partial_redemption
FROM gift_certificate_settings;

-- 6. Check if any gift certificates exist
SELECT
  '6. GIFT CERTIFICATES' as section,
  COUNT(*) as total_certs,
  COUNT(*) FILTER (WHERE status = 'active') as active_certs,
  COUNT(*) FILTER (WHERE recipient_email IS NOT NULL) as certs_with_email,
  MAX(issued_at) as last_issued
FROM gift_certificates;

-- 7. Check RLS policies on email_settings
SELECT
  '7. EMAIL_SETTINGS RLS' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd,
  LEFT(qual::text, 80) as row_security_condition
FROM pg_policies
WHERE tablename = 'email_settings'
ORDER BY policyname;

-- 8. Check RLS policies on email_templates
SELECT
  '8. EMAIL_TEMPLATES RLS' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd,
  LEFT(qual::text, 80) as row_security_condition
FROM pg_policies
WHERE tablename = 'email_templates'
ORDER BY policyname;
