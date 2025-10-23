#!/bin/bash

# Carica variabili d'ambiente
source .env

echo "🔍 STEP 1: Verifica organizzazioni esistenti..."
curl -X POST "https://sjvatdnvewohvswfrdiv.supabase.co/rest/v1/rpc/exec_sql" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT id, name, created_at FROM organizations ORDER BY created_at ASC"}'

echo ""
echo "🔍 STEP 2: Verifica utenti senza organizzazione..."
curl -X GET "https://sjvatdnvewohvswfrdiv.supabase.co/rest/v1/users?select=id,email,full_name,organization_id,role&organization_id=is.null" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY"

echo ""
echo "📝 STEP 3: Assegna organizzazione agli utenti..."
# Ottieni prima ID dell'organizzazione
ORG_ID=$(curl -s -X GET "https://sjvatdnvewohvswfrdiv.supabase.co/rest/v1/organizations?select=id&order=created_at.asc&limit=1" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" | jq -r '.[0].id')

echo "Organization ID trovato: $ORG_ID"

# Aggiorna utenti
curl -X PATCH "https://sjvatdnvewohvswfrdiv.supabase.co/rest/v1/users?organization_id=is.null" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{\"organization_id\": \"$ORG_ID\"}"

echo ""
echo "✅ STEP 4: Verifica finale..."
curl -X GET "https://sjvatdnvewohvswfrdiv.supabase.co/rest/v1/users?select=id,email,organization_id" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY"

echo ""
echo "✅ Fatto! Controlla l'output sopra."
