#!/bin/bash

echo "🔐 Test login Strapi..."
echo ""

# Prova il login
response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
  "https://omnilypro.onrender.com/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@omnilypro.com","password":"OmnilyPro2024!"}')

http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE:/d')

echo "📊 HTTP Status: $http_code"
echo ""
echo "📄 Response Body:"
echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
echo ""

if [ "$http_code" = "200" ]; then
  echo "✅ Login riuscito!"
elif [ "$http_code" = "500" ]; then
  echo "❌ Errore 500 - il problema del cookie persiste"
  echo ""
  echo "Possibili cause:"
  echo "1. Il codice non è stato deployato correttamente"
  echo "2. Strapi ha un'altra configurazione che sovrascrive le nostre impostazioni"
  echo "3. Problema con la configurazione del proxy di Render"
else
  echo "⚠️  Errore inatteso: $http_code"
fi
