-- ============================================================================
-- CONFIGURAZIONE RESEND PER OMNILYPRO
-- Imposta email settings con dominio verificato omnilypro.com
-- ============================================================================

-- Settings globali con Resend configurato
INSERT INTO email_settings (
  organization_id,
  resend_api_key,
  from_name,
  from_email,
  reply_to_email,
  primary_color,
  secondary_color,
  logo_url,
  enabled,
  daily_limit,
  custom_domain,
  custom_domain_verified
) VALUES (
  NULL, -- NULL = settings globali per tutte le org
  'YOUR_RESEND_API_KEY_HERE', -- ⚠️ SOSTITUISCI CON LA TUA API KEY
  'OmnilyPRO',
  'noreply@send.omnilypro.com', -- Dominio verificato su Resend
  'support@omnilypro.com',
  '#ef4444', -- Rosso brand
  '#dc2626', -- Rosso scuro
  NULL, -- Aggiungi URL logo se disponibile
  true,
  1000, -- Limite giornaliero
  'omnilypro.com',
  true -- Dominio già verificato
)
ON CONFLICT (organization_id)
DO UPDATE SET
  from_email = EXCLUDED.from_email,
  reply_to_email = EXCLUDED.reply_to_email,
  custom_domain = EXCLUDED.custom_domain,
  custom_domain_verified = EXCLUDED.custom_domain_verified,
  updated_at = NOW();

-- Verifica inserimento
SELECT
  id,
  from_name,
  from_email,
  reply_to_email,
  enabled,
  daily_limit,
  custom_domain,
  custom_domain_verified,
  emails_sent_today,
  CASE
    WHEN resend_api_key IS NOT NULL THEN '✅ Configurata'
    ELSE '❌ Mancante'
  END as api_key_status
FROM email_settings
WHERE organization_id IS NULL;

-- Crea template campagna newsletter se non esiste
INSERT INTO email_templates (
  organization_id,
  template_type,
  name,
  description,
  subject,
  html_body,
  text_body,
  is_default,
  is_active,
  variables
) VALUES (
  NULL,
  'newsletter',
  'Newsletter Standard',
  'Template per campagne email marketing',
  '{{organization_name}} - Novità per te!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: {{primary_color}}; color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px;">{{organization_name}}</h1>
    </div>
    <div style="padding: 40px 30px; font-size: 16px; line-height: 1.8; color: #374151;">
      <p>Ciao {{customer_name}},</p>
      {{custom_content}}
    </div>
    <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 2px solid #e5e7eb; font-size: 14px; color: #6b7280;">
      <p style="margin: 0 0 8px 0;"><strong>{{organization_name}}</strong></p>
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">
        Hai ricevuto questa email perché sei registrato al nostro programma fedeltà
      </p>
    </div>
  </div>
</body>
</html>',
  'Ciao {{customer_name}},

{{custom_content}}

---
{{organization_name}}',
  true,
  true,
  ARRAY['customer_name', 'organization_name', 'custom_content', 'primary_color', 'secondary_color']::text[]
)
ON CONFLICT (organization_id, template_type, name) DO UPDATE
SET
  html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Template promozione
INSERT INTO email_templates (
  organization_id,
  template_type,
  name,
  description,
  subject,
  html_body,
  text_body,
  is_default,
  is_active,
  variables
) VALUES (
  NULL,
  'promo',
  'Promozione Standard',
  'Template per campagne promozionali',
  '{{organization_name}} - Offerta Speciale per te!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div style="background: {{primary_color}}; color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0 0 10px 0; font-size: 32px;">🎉 OFFERTA SPECIALE</h1>
      <p style="margin: 0; font-size: 18px;">{{organization_name}}</p>
    </div>
    <div style="padding: 40px 30px; font-size: 16px; line-height: 1.8; color: #374151;">
      <p>Ciao {{customer_name}},</p>
      {{custom_content}}
    </div>
    <div style="background: #f9fafb; padding: 30px; text-align: center; border-top: 2px solid #e5e7eb; font-size: 14px; color: #6b7280;">
      <p style="margin: 0 0 8px 0;"><strong>{{organization_name}}</strong></p>
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">
        Non perdere questa occasione!
      </p>
    </div>
  </div>
</body>
</html>',
  'Ciao {{customer_name}},

🎉 OFFERTA SPECIALE

{{custom_content}}

---
{{organization_name}}',
  false,
  true,
  ARRAY['customer_name', 'organization_name', 'custom_content', 'primary_color', 'secondary_color']::text[]
)
ON CONFLICT (organization_id, template_type, name) DO UPDATE
SET
  html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Mostra templates disponibili
SELECT
  template_type,
  name,
  is_default,
  is_active,
  array_length(variables, 1) as num_variables
FROM email_templates
WHERE organization_id IS NULL
ORDER BY template_type, name;

-- Mostra stats correnti
SELECT
  (SELECT COUNT(*) FROM email_campaigns) as total_campaigns,
  (SELECT COUNT(*) FROM email_campaigns WHERE status = 'draft') as draft_campaigns,
  (SELECT COUNT(*) FROM email_campaigns WHERE status = 'scheduled') as scheduled_campaigns,
  (SELECT COUNT(*) FROM email_campaigns WHERE status = 'sending') as sending_campaigns,
  (SELECT COUNT(*) FROM email_campaigns WHERE status = 'completed') as completed_campaigns,
  (SELECT COUNT(*) FROM email_logs WHERE sent_at >= CURRENT_DATE) as emails_today;

-- ============================================================================
-- PROSSIMI PASSI:
-- 1. Sostituisci YOUR_RESEND_API_KEY_HERE con la tua vera API Key
-- 2. Esegui questo script nel SQL Editor di Supabase
-- 3. Deploy le Edge Functions con: ./deploy_functions.sh
-- 4. Testa l'invio dal wizard frontend
-- ============================================================================

SELECT '✅ Configurazione Resend completata! Ora sostituisci la API Key e fai il deploy.' AS status;
