#!/bin/bash

echo "🔍 Verifico quale configurazione è deployata su Render..."
echo ""

# Prova ad accedere a un endpoint di debug
echo "📊 Test 1: Verifica versione commit deployata"
curl -s "https://omnilypro.onrender.com/admin" -I | grep -i "x-powered-by\|rndr-id\|date"

echo ""
echo "📊 Test 2: Verifica log recenti"
echo "   Vai su Render e cerca nel log dopo le 20:06:"
echo "   - 'cookieSecure: false' o 'STRAPI_DISABLE_SECURE_COOKIE'"
echo "   - Errori durante il boot"
echo ""

echo "💡 Se non vedi questi messaggi, il deploy non ha caricato il nuovo codice."
echo ""
echo "📋 AZIONI NECESSARIE su Render Dashboard:"
echo "   1. Vai su https://dashboard.render.com/web/srv-d3rtbdmr433s739v39n0"
echo "   2. Clicca 'Manual Deploy'"
echo "   3. Seleziona 'Clear build cache & deploy'"
echo "   4. Clicca 'Deploy'"
