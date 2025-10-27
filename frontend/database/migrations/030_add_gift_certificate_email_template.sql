-- Migration: Add Gift Certificate Email Template
-- Description: Creates email template for gift certificate issued notifications
-- Date: 2025-10-28

-- Delete existing template if exists (global template only)
DELETE FROM email_templates
WHERE organization_id IS NULL
AND template_type = 'gift_certificate_issued';

-- Insert gift certificate issued email template
INSERT INTO email_templates (
  organization_id,
  template_type,
  name,
  subject,
  html_body,
  text_body,
  is_active,
  is_default,
  variables,
  created_at,
  updated_at
) VALUES (
  NULL, -- Global template
  'gift_certificate_issued',
  'Gift Certificate Issued',
  'Hai ricevuto un Gift Certificate da {{organization_name}}!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gift Certificate</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, {{primary_color}} 0%, {{secondary_color}} 100%); padding: 40px 20px; text-align: center;">
              {{#if logo_url}}
              <img src="{{logo_url}}" alt="{{organization_name}}" style="max-width: 150px; margin-bottom: 20px;">
              {{/if}}
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">
                🎁 Hai ricevuto un Gift Certificate!
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">

              <!-- Greeting -->
              <p style="font-size: 16px; color: #333333; margin: 0 0 20px 0;">
                Ciao {{recipient_name}},
              </p>

              <p style="font-size: 16px; color: #333333; margin: 0 0 30px 0;">
                Hai ricevuto un fantastico Gift Certificate da <strong>{{organization_name}}</strong>!
              </p>

              <!-- Certificate Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; overflow: hidden; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 30px 20px; text-align: center;">

                    <!-- Amount -->
                    <div style="background-color: rgba(255,255,255,0.2); border-radius: 50px; padding: 15px 30px; display: inline-block; margin-bottom: 20px;">
                      <p style="color: #ffffff; font-size: 36px; font-weight: bold; margin: 0;">
                        €{{amount}}
                      </p>
                    </div>

                    <!-- Code -->
                    <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px 0; opacity: 0.9;">
                      Codice Gift Certificate
                    </p>
                    <p style="background-color: rgba(255,255,255,0.95); color: #333333; font-size: 24px; font-weight: bold; padding: 15px 20px; border-radius: 8px; margin: 0 auto; max-width: 300px; letter-spacing: 2px; word-break: break-all;">
                      {{gift_certificate_code}}
                    </p>

                    <!-- QR Code -->
                    {{#if qr_code_url}}
                    <div style="margin-top: 20px; background-color: #ffffff; padding: 15px; border-radius: 10px; display: inline-block;">
                      <img src="{{qr_code_url}}" alt="QR Code" style="max-width: 150px; display: block;">
                      <p style="font-size: 12px; color: #666666; margin: 10px 0 0 0;">
                        Scansiona questo QR per riscattare
                      </p>
                    </div>
                    {{/if}}

                  </td>
                </tr>
              </table>

              <!-- Personal Message -->
              {{#if personal_message}}
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-left: 4px solid {{primary_color}}; border-radius: 5px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="font-size: 14px; color: #666666; margin: 0 0 5px 0;">
                      <strong>Messaggio personale:</strong>
                    </p>
                    <p style="font-size: 16px; color: #333333; margin: 0; font-style: italic;">
                      "{{personal_message}}"
                    </p>
                  </td>
                </tr>
              </table>
              {{/if}}

              <!-- Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">
                    <p style="font-size: 14px; color: #666666; margin: 0;">
                      <strong>Valore:</strong> €{{amount}}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">
                    <p style="font-size: 14px; color: #666666; margin: 0;">
                      <strong>Valido fino al:</strong> {{valid_until}}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <p style="font-size: 14px; color: #666666; margin: 0;">
                      <strong>Codice:</strong> <code style="background-color: #f0f0f0; padding: 3px 8px; border-radius: 3px; font-size: 13px;">{{gift_certificate_code}}</code>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Instructions -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #e8f5e9; border-radius: 5px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="color: #2e7d32; font-size: 18px; margin: 0 0 10px 0;">
                      Come utilizzare il tuo Gift Certificate
                    </h3>
                    <ol style="color: #555555; font-size: 14px; margin: 0; padding-left: 20px;">
                      <li style="margin-bottom: 8px;">Visita <strong>{{organization_name}}</strong></li>
                      <li style="margin-bottom: 8px;">Mostra il codice o scansiona il QR code alla cassa</li>
                      <li style="margin-bottom: 8px;">Il valore verrà scalato automaticamente dal tuo acquisto</li>
                    </ol>
                  </td>
                </tr>
              </table>

              <!-- Note -->
              <p style="font-size: 13px; color: #999999; margin: 0; line-height: 1.6;">
                <strong>Nota:</strong> Conserva questa email in un luogo sicuro. Avrai bisogno del codice o del QR code per riscattare il tuo Gift Certificate.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="font-size: 14px; color: #666666; margin: 0 0 10px 0;">
                Questa email è stata inviata da <strong>{{organization_name}}</strong>
              </p>
              <p style="font-size: 12px; color: #999999; margin: 0;">
                Per assistenza, contatta {{organization_name}}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Ciao {{recipient_name}},

Hai ricevuto un Gift Certificate da {{organization_name}}!

VALORE: €{{amount}}
CODICE: {{gift_certificate_code}}
VALIDO FINO AL: {{valid_until}}

{{#if personal_message}}
Messaggio personale: "{{personal_message}}"
{{/if}}

COME UTILIZZARE IL TUO GIFT CERTIFICATE:
1. Visita {{organization_name}}
2. Mostra il codice alla cassa
3. Il valore verrà scalato automaticamente dal tuo acquisto

Conserva questa email in un luogo sicuro.

---
Questa email è stata inviata da {{organization_name}}
',
  TRUE,
  TRUE,
  ARRAY['organization_name', 'recipient_name', 'amount', 'gift_certificate_code', 'valid_until', 'personal_message', 'qr_code_url', 'logo_url', 'primary_color', 'secondary_color'],
  NOW(),
  NOW()
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Gift certificate email template created successfully';
END $$;
