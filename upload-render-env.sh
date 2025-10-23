#!/bin/bash

# Render Service ID
SERVICE_ID="srv-d3rtbdmr433s739v39n0"
API_KEY="rnd_cdPJTF3A3XqZzqq6z40NwgzNFrYN"

# File con le variabili
ENV_FILE="cms/.env.render"

echo "🚀 Uploading environment variables to Render..."
echo ""

# Leggi il file e crea le variabili
while IFS='=' read -r key value; do
  # Salta righe vuote e commenti
  [[ -z "$key" || "$key" =~ ^# ]] && continue

  # Rimuovi spazi
  key=$(echo "$key" | xargs)
  value=$(echo "$value" | xargs)

  echo "📝 Setting: $key"

  # Crea o aggiorna la variabile
  curl -s -X PUT \
    "https://api.render.com/v1/services/$SERVICE_ID/env-vars/$key" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"value\":\"$value\"}" > /dev/null

  if [ $? -eq 0 ]; then
    echo "   ✅ $key set successfully"
  else
    echo "   ❌ Failed to set $key"
  fi

done < "$ENV_FILE"

echo ""
echo "✅ All environment variables uploaded!"
echo ""
echo "🔄 Render will automatically redeploy your service with the new environment variables."
echo "📊 Check the deploy status at: https://dashboard.render.com/web/$SERVICE_ID"
