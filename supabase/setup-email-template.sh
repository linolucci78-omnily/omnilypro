#!/bin/bash

# =====================================================
# OMNILY PRO - Email Template Setup Script
# =====================================================
# This script configures the "Invite user" email template
# using Supabase Management API
# =====================================================

set -e

echo "🚀 OMNILY PRO - Email Template Setup"
echo "======================================"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Get project ref from supabase config
if [ ! -f "supabase/.temp/project-ref" ]; then
    echo "📝 Please enter your Supabase Project Reference ID"
    echo "   (You can find it in: https://supabase.com/dashboard/project/_/settings/general)"
    read -p "Project Ref: " PROJECT_REF
else
    PROJECT_REF=$(cat supabase/.temp/project-ref)
fi

echo "📦 Project Ref: $PROJECT_REF"
echo ""

# Get access token
echo "🔑 Please enter your Supabase Access Token"
echo "   (Get it from: https://supabase.com/dashboard/account/tokens)"
read -sp "Access Token: " ACCESS_TOKEN
echo ""
echo ""

# Email template HTML
EMAIL_TEMPLATE='<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Attiva il tuo Account OMNILY PRO</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, '\''Segoe UI'\'', Roboto, '\''Helvetica Neue'\'', Arial, sans-serif; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); min-height: 100vh;">
  <table width="100%" cellpadding="0" cellspacing="0" style="min-height: 100vh; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); overflow: hidden; max-width: 100%;">
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700;">OMNILY PRO</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Piattaforma di Loyalty Management</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 700; color: #1a1a1a; text-align: center;">Benvenuto in OMNILY PRO</h2>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">Ciao,</p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">La tua organizzazione è stata creata con successo! Ora puoi attivare il tuo account e iniziare a gestire il tuo programma di loyalty.</p>
              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">Clicca sul pulsante qui sotto per impostare la tua password:</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Attiva il Tuo Account</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 30px 0 20px; font-size: 14px; line-height: 1.6; color: #6b6b6b; text-align: center;">Oppure copia questo link:</p>
              <div style="background: #f5f5f5; border: 1px solid #e5e5e5; border-radius: 8px; padding: 15px; word-break: break-all; font-family: monospace; font-size: 12px; color: #4a4a4a; text-align: center;">{{ .ConfirmationURL }}</div>
            </td>
          </tr>
          <tr>
            <td style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 15px; font-size: 14px; color: #6b7280;">Hai bisogno di aiuto?</p>
              <p style="margin: 0;"><a href="mailto:support@omnilypro.com" style="color: #3b82f6; text-decoration: none; font-weight: 600;">support@omnilypro.com</a></p>
              <p style="margin: 20px 0 0; font-size: 12px; color: #9ca3af;">&copy; 2025 OMNILY PRO</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'

echo "📧 Configurazione email template..."
echo ""

# Update email template using Management API
HTTP_CODE=$(curl -s -o /tmp/supabase-response.txt -w "%{http_code}" -X PATCH \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"MAILER_SUBJECTS_INVITE\": \"Attiva il tuo Account OMNILY PRO\",
    \"MAILER_TEMPLATES_INVITE_CONTENT\": $(echo "$EMAIL_TEMPLATE" | jq -Rs .)
  }")

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    echo "✅ Email template configurato con successo!"
    echo ""
    echo "📋 Configurazione completata:"
    echo "   - Template: Invite user"
    echo "   - Subject: Attiva il tuo Account OMNILY PRO"
    echo "   - Design: Professionale con gradient purple/pink"
    echo ""
    echo "🧪 Prossimi passi:"
    echo "   1. Vai su /admin/new-organization"
    echo "   2. Crea una nuova organizzazione"
    echo "   3. Controlla l'email del proprietario"
    echo "   4. Clicca sul link di attivazione"
    echo ""
else
    echo "❌ Errore durante la configurazione"
    echo "HTTP Code: $HTTP_CODE"
    echo "Response:"
    cat /tmp/supabase-response.txt
    echo ""
    exit 1
fi

# Save project ref for future use
mkdir -p supabase/.temp
echo "$PROJECT_REF" > supabase/.temp/project-ref

echo "✨ Setup completato!"
