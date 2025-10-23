# Directus CMS for OmnilyPro Website Builder

Headless CMS per gestire i siti web delle organizzazioni OmnilyPro.

## Setup Locale

1. Installa dipendenze:
```bash
npm install
```

2. Copia `.env.example` in `.env` e configura:
```bash
cp .env.example .env
```

3. Avvia Directus:
```bash
npm start
```

4. Accedi a: `http://localhost:8055/admin`

## Deploy su Render (Free Tier)

### 1. Crea nuovo Web Service su Render:
- Dashboard Render → New → Web Service
- Connetti repository GitHub `omnilypro`
- Root Directory: `directus`

### 2. Configurazione Build:
```
Build Command: npm install
Start Command: npm start
```

### 3. Variabili Ambiente (da `.env`):
Aggiungi tutte le variabili da Environment Variables in Render:

**Required:**
- `KEY` - Chiave di sicurezza (32+ caratteri random)
- `SECRET` - Secret (64+ caratteri random)
- `PUBLIC_URL` - https://your-app.onrender.com
- `PORT` - 10000

**Database (Neon PostgreSQL):**
- `DB_CLIENT=pg`
- `DB_HOST` - Host Neon
- `DB_PORT=5432`
- `DB_DATABASE` - Nome database
- `DB_USER` - Utente database
- `DB_PASSWORD` - Password database
- `DB_SSL=true`

**Admin:**
- `ADMIN_EMAIL` - Email admin
- `ADMIN_PASSWORD` - Password admin

**CORS:**
- `CORS_ENABLED=true`
- `CORS_ORIGIN` - https://omnilypro.vercel.app,https://omnilypro.com
- `CORS_CREDENTIALS=true`

### 4. Deploy:
- Click "Create Web Service"
- Render farà automaticamente build e deploy
- Attendi completamento (3-5 minuti)

### 5. Primo Accesso:
- Apri: `https://your-app.onrender.com/admin`
- Login con credenziali ADMIN_EMAIL/ADMIN_PASSWORD

### 6. Nota Free Tier:
⚠️ Il servizio andrà in sleep dopo 15 minuti di inattività.
Primo accesso successivo richiederà ~30 secondi per riavvio.

Per produzione, upgrade a Starter ($7/mese) per servizio always-on.

## Collections Website Builder

Collections da creare per website builder (verranno create automaticamente quando configurato):

- `website_templates` - Template siti (Restaurant, Retail, ecc.)
- `organization_websites` - Siti delle organizzazioni
- `sections_hero` - Sezione Hero
- `sections_menu` - Sezione Menu
- `sections_gallery` - Sezione Gallery
- `sections_contacts` - Sezione Contatti

## API Endpoints

Directus genera automaticamente REST API:

```
GET  /items/organization_websites
POST /items/organization_websites
GET  /items/organization_websites/:id
PATCH /items/organization_websites/:id
DELETE /items/organization_websites/:id
```

GraphQL disponibile su: `/graphql`

## Integrazione Frontend

```javascript
const DIRECTUS_URL = process.env.VITE_DIRECTUS_URL
const DIRECTUS_TOKEN = process.env.VITE_DIRECTUS_TOKEN

// Fetch website by subdomain
const response = await fetch(
  `${DIRECTUS_URL}/items/organization_websites?filter[subdomain][_eq]=${subdomain}`,
  {
    headers: {
      'Authorization': `Bearer ${DIRECTUS_TOKEN}`
    }
  }
)
const website = await response.json()
```

## Documentazione Directus

- Docs: https://docs.directus.io
- API Reference: https://docs.directus.io/reference/introduction
- Video Tutorial: https://www.youtube.com/c/DirectusVideos
