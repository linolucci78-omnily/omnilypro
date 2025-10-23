#!/bin/bash

echo "🔍 Monitoraggio deploy Strapi su Render..."
echo "⏰ Controllo ogni 10 secondi..."
echo ""

counter=0
max_attempts=30  # 5 minuti massimo

while [ $counter -lt $max_attempts ]; do
  counter=$((counter + 1))

  echo "[$counter/$max_attempts] Tentativo di connessione..."

  # Prova a connettersi all'API
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://omnilypro.onrender.com/admin" 2>/dev/null)

  if [ "$http_code" = "200" ]; then
    echo ""
    echo "✅ Strapi è online!"
    echo ""

    # Verifica se organization-websites è disponibile
    echo "🔍 Verifico disponibilità API organization-websites..."
    api_response=$(curl -s --max-time 10 "https://omnilypro.onrender.com/api/organization-websites" 2>/dev/null)

    if echo "$api_response" | grep -q "404"; then
      echo "⚠️  API restituisce 404 - content-type non ancora caricato"
      echo "   Potrebbe servire ancora qualche secondo..."
    elif echo "$api_response" | grep -q "403"; then
      echo "✅ API trovata! (403 Forbidden - permessi da configurare)"
    elif echo "$api_response" | grep -q "data"; then
      echo "✅ API funzionante e accessibile!"
    else
      echo "🤔 Risposta inattesa: $api_response"
    fi

    echo ""
    echo "🎉 Puoi provare ad accedere all'admin:"
    echo "   👉 https://omnilypro.onrender.com/admin"
    echo ""
    exit 0
  elif [ "$http_code" = "000" ]; then
    echo "   ⏳ Servizio ancora offline (timeout)"
  else
    echo "   ⏳ HTTP $http_code - servizio in avvio..."
  fi

  sleep 10
done

echo ""
echo "⏱️  Timeout dopo 5 minuti. Il deploy potrebbe richiedere più tempo."
echo "   Controlla manualmente: https://dashboard.render.com/web/srv-d3rtbdmr433s739v39n0"
