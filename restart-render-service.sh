#!/bin/bash

SERVICE_ID="srv-d3rtbdmr433s739v39n0"
API_KEY="rnd_cdPJTF3A3XqZzqq6z40NwgzNFrYN"

echo "🔄 Riavvio servizio Strapi su Render..."

response=$(curl -s -X POST \
  "https://api.render.com/v1/services/$SERVICE_ID/restart" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json")

echo "$response" | python3 -m json.tool

echo ""
echo "✅ Richiesta di restart inviata!"
echo "⏰ Attendi 1-2 minuti che il servizio si riavvii completamente."
echo "📊 Monitora su: https://dashboard.render.com/web/$SERVICE_ID"
