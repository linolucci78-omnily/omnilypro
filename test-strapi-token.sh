#!/bin/bash

# Script per verificare il token API Strapi

echo "🔍 Testing Strapi API Token..."
echo ""

# Leggi il token dal .env.local
TOKEN=$(grep VITE_STRAPI_API_TOKEN frontend/.env.local | cut -d '=' -f2)

if [ -z "$TOKEN" ]; then
    echo "❌ Token non trovato in frontend/.env.local"
    exit 1
fi

echo "📋 Token trovato (primi 20 caratteri): ${TOKEN:0:20}..."
echo ""

# Test 1: Health check Strapi
echo "1️⃣ Testing Strapi health..."
HEALTH=$(curl -s http://localhost:1337/_health)
if [ $? -eq 0 ]; then
    echo "✅ Strapi is running"
else
    echo "❌ Strapi is not responding"
    exit 1
fi
echo ""

# Test 2: Fetch templates con token
echo "2️⃣ Testing website-templates endpoint..."
RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" http://localhost:1337/api/website-templates)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API Token works! (HTTP $HTTP_CODE)"
    echo ""
    echo "📄 Response:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    echo "❌ API Token failed (HTTP $HTTP_CODE)"
    echo ""
    echo "📄 Error Response:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    echo ""
    echo "🔧 Fix: Configura i permessi del token in Strapi Admin"
    echo "   http://localhost:1337/admin → Settings → API Tokens"
    exit 1
fi
echo ""

# Test 3: Fetch organization-websites
echo "3️⃣ Testing organization-websites endpoint..."
RESPONSE2=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" http://localhost:1337/api/organization-websites)
HTTP_CODE2=$(echo "$RESPONSE2" | tail -n1)

if [ "$HTTP_CODE2" = "200" ]; then
    echo "✅ organization-websites endpoint works! (HTTP $HTTP_CODE2)"
else
    echo "❌ organization-websites endpoint failed (HTTP $HTTP_CODE2)"
fi
echo ""

echo "🎉 Test completato!"
echo ""
echo "Next steps:"
echo "  1. Vai su http://localhost:5173/admin/websites"
echo "  2. Verifica che i template vengano caricati"
echo "  3. Prova a creare un nuovo sito"
