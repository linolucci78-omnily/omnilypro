# Fix Token API Strapi - Guida Rapida

## Problema
Il token API in `.env.local` restituisce 401 Unauthorized perché non ha i permessi configurati.

## Soluzione

### 1. Accedi a Strapi Admin
```
http://localhost:1337/admin
```

### 2. Naviga su Settings → API Tokens
Nel menu laterale sinistro:
- Clicca "Settings" (icona ingranaggio)
- Clicca "API Tokens"

### 3. Configura il Token
Hai due opzioni:

#### Opzione A - Modifica token esistente (se presente)
- Clicca sul token esistente
- Imposta "Token type" su "Custom"
- Seleziona i permessi:
  - `website-template`: ✓ find, ✓ findOne
  - `organization-website`: ✓ find, ✓ findOne, ✓ create, ✓ update, ✓ delete
- Salva

#### Opzione B - Crea nuovo token (CONSIGLIATO)
- Clicca "Create new API Token"
- **Name**: `Frontend Website Builder`
- **Description**: `Token per accesso frontend al CMS siti web`
- **Token duration**: `Unlimited`
- **Token type**: `Custom`
- **Permissions**:
  - Espandi `website-template`:
    - ✓ find
    - ✓ findOne
  - Espandi `organization-website`:
    - ✓ find
    - ✓ findOne
    - ✓ create
    - ✓ update
    - ✓ delete
- Clicca "Save"
- **COPIA IL TOKEN** (apparirà solo questa volta!)

### 4. Aggiorna .env.local
Sostituisci il token in `/Users/pasqualelucci/Desktop/omnilypro/frontend/.env.local`:

```bash
VITE_STRAPI_API_TOKEN=IL_TUO_NUOVO_TOKEN_QUI
```

### 5. Riavvia il frontend
```bash
# Ferma il server frontend (Ctrl+C)
# Poi riavvia
cd /Users/pasqualelucci/Desktop/omnilypro/frontend
npm run dev
```

### 6. Verifica
Vai su: `http://localhost:5173/admin/websites`

Dovresti vedere i template caricati senza errori 401.

## Test Rapido
Dopo aver aggiornato il token, testa con curl:

```bash
curl -H "Authorization: Bearer IL_TUO_NUOVO_TOKEN" http://localhost:1337/api/website-templates
```

Dovresti vedere:
```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "nome": "Restaurant Classic",
        ...
      }
    }
  ]
}
```

## Screenshot Percorso Strapi Admin
1. Login → Dashboard
2. Menu laterale → Settings (ultima voce, icona ingranaggio)
3. Global Settings → API Tokens
4. Create new API Token (bottone blu in alto a destra)
