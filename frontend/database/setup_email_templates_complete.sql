-- ============================================================================
-- Setup completo: Tabella email_templates e template OTP
-- ============================================================================

-- Crea tabella email_templates se non esiste
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  template_type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(500) NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Crea indici
CREATE INDEX IF NOT EXISTS idx_email_templates_org ON email_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

-- Abilita RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Drop vecchie policy se esistono
DROP POLICY IF EXISTS "Users can read email templates" ON email_templates;
DROP POLICY IF EXISTS "Users can insert email templates" ON email_templates;
DROP POLICY IF EXISTS "Users can update email templates" ON email_templates;

-- Policy per lettura
CREATE POLICY "Users can read email templates"
ON email_templates
FOR SELECT
TO authenticated
USING (
  organization_id IS NULL OR
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

-- Policy per inserimento
CREATE POLICY "Users can insert email templates"
ON email_templates
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IS NULL OR
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

-- Policy per aggiornamento
CREATE POLICY "Users can update email templates"
ON email_templates
FOR UPDATE
TO authenticated
USING (
  organization_id IS NULL OR
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

-- Elimina template esistente se c'è
DELETE FROM email_templates WHERE template_type = 'contract_otp';

-- Inserisci template OTP
INSERT INTO email_templates (
  organization_id,
  template_type,
  name,
  description,
  subject,
  html_body,
  text_body,
  is_active,
  is_default
)
VALUES (
  NULL,  -- Template globale
  'contract_otp',
  'Codice OTP Firma Contratto',
  'Template per invio codice OTP per firma digitale contratto',
  'Codice OTP per firma contratto - {{contract_title}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🔐 Firma Contratto</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
                Gentile <strong>{{signer_name}}</strong>,
              </p>

              <p style="font-size: 16px; color: #333333; line-height: 1.6; margin: 0 0 20px 0;">
                Hai richiesto di firmare il contratto <strong>{{contract_title}}</strong>.
              </p>

              <p style="font-size: 16px; color: #333333; line-height: 1.6; margin: 0 0 30px 0;">
                Per procedere con la firma digitale, utilizza il seguente codice OTP:
              </p>

              <!-- OTP Box -->
              <div style="background-color: #f8f9fa; border: 2px dashed #1e40af; border-radius: 8px; padding: 30px; text-align: center; margin: 0 0 30px 0;">
                <div style="font-size: 14px; color: #666666; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">
                  Il tuo codice OTP
                </div>
                <div style="font-size: 48px; font-weight: bold; color: #1e40af; letter-spacing: 8px; font-family: ''Courier New'', monospace;">
                  {{otp_code}}
                </div>
                <div style="font-size: 12px; color: #999999; margin-top: 10px;">
                  ⏱️ Valido per 10 minuti
                </div>
              </div>

              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 0 0 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  <strong>⚠️ Importante:</strong> Non condividere questo codice con nessuno. Il nostro staff non ti chiederà mai il codice OTP.
                </p>
              </div>

              <p style="font-size: 14px; color: #666666; line-height: 1.6; margin: 0;">
                Se non hai richiesto questa firma, ignora questa email o contatta il nostro supporto.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="font-size: 12px; color: #999999; margin: 0 0 10px 0;">
                Questa email è stata generata automaticamente. Si prega di non rispondere.
              </p>
              <p style="font-size: 12px; color: #999999; margin: 0;">
                © 2025 OmnilyPro. Tutti i diritti riservati.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Gentile {{signer_name}},

Hai richiesto di firmare il contratto "{{contract_title}}".

Il tuo codice OTP è: {{otp_code}}

Questo codice è valido per 10 minuti.

IMPORTANTE: Non condividere questo codice con nessuno.

Se non hai richiesto questa firma, ignora questa email.

Cordiali saluti,
OmnilyPro Team',
  true,  -- is_active
  true   -- is_default
);

-- Verifica template creato
SELECT id, template_type, name, subject, is_active
FROM email_templates
WHERE template_type = 'contract_otp';
