-- Check current gift certificate email template in database
SELECT
  id,
  organization_id,
  template_type,
  name,
  subject,
  is_active,
  is_default,
  -- Show if qr_code_url is used in the template
  CASE
    WHEN html_body LIKE '%qr_code_url%' THEN '✅ Uses QR code'
    ELSE '❌ No QR code'
  END as has_qr_code,
  -- Show the QR code section
  SUBSTRING(html_body FROM 'QR Code.*?/if}}') as qr_section_preview,
  LENGTH(html_body) as html_length,
  created_at,
  updated_at
FROM email_templates
WHERE template_type = 'gift_certificate_issued';
