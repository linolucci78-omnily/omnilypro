#!/bin/bash

# Test script per inviare una notifica push tramite Edge Function

# Supabase URL e keys
SUPABASE_URL="https://sjvatdnvewohvswfrdiv.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk"

# Organization ID (demo)
ORG_ID="c06a8dcf-b209-40b1-92a5-c80facf2eb29"

echo "📤 Invio notifica push di test..."

# Send notification via Edge Function
curl -X POST \
  "${SUPABASE_URL}/functions/v1/send-push-notification" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "'"${ORG_ID}"'",
    "title": "🎉 Test OmnilyPro",
    "body": "La tua prima notifica push funziona perfettamente!",
    "imageUrl": null,
    "actionUrl": "http://localhost:5174/demo/rewards",
    "data": {
      "type": "test",
      "timestamp": "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"
    },
    "targetAll": true
  }'

echo ""
echo "✅ Test completato!"
