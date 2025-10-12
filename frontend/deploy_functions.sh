#!/bin/bash

# ============================================================================
# DEPLOY EDGE FUNCTIONS SUPABASE
# Script per deployare tutte le Edge Functions necessarie per email
# ============================================================================

echo "🚀 Deploying Supabase Edge Functions..."
echo ""

# Verifica che siamo nella directory corretta
if [ ! -d "supabase/functions" ]; then
  echo "❌ Error: supabase/functions directory not found"
  echo "   Please run this script from the project root directory"
  exit 1
fi

# Verifica che supabase CLI sia installato
if ! command -v supabase &> /dev/null; then
  echo "❌ Error: Supabase CLI not installed"
  echo "   Install with: npm install -g supabase"
  exit 1
fi

echo "📦 Functions to deploy:"
echo "  1. send-email (invia email singole)"
echo "  2. send-campaign (invia campagne in batch)"
echo "  3. check-scheduled-campaigns (scheduler per invii programmati)"
echo ""

# Deploy send-email
echo "📤 Deploying send-email..."
supabase functions deploy send-email
if [ $? -eq 0 ]; then
  echo "✅ send-email deployed successfully"
else
  echo "❌ send-email deployment failed"
  exit 1
fi
echo ""

# Deploy send-campaign
echo "📤 Deploying send-campaign..."
supabase functions deploy send-campaign
if [ $? -eq 0 ]; then
  echo "✅ send-campaign deployed successfully"
else
  echo "❌ send-campaign deployment failed"
  exit 1
fi
echo ""

# Deploy check-scheduled-campaigns
echo "📤 Deploying check-scheduled-campaigns..."
supabase functions deploy check-scheduled-campaigns
if [ $? -eq 0 ]; then
  echo "✅ check-scheduled-campaigns deployed successfully"
else
  echo "❌ check-scheduled-campaigns deployment failed"
  exit 1
fi
echo ""

echo "🎉 All functions deployed successfully!"
echo ""
echo "📝 Next steps:"
echo "  1. Set RESEND_API_KEY secret:"
echo "     supabase secrets set RESEND_API_KEY=re_YourApiKeyHere"
echo ""
echo "  2. Configure email_settings in database:"
echo "     Run: database/setup_resend_config.sql"
echo ""
echo "  3. Test from frontend wizard or use curl:"
echo "     See SETUP_EMAIL_SENDING.md for test commands"
echo ""
