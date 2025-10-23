# Guida Setup Strapi per Website Builder

## Setup Completato

- ✅ Strapi installato e configurato (cms/)
- ✅ Content Types creati:
  - `website-template` - Template siti web
  - `organization-website` - Siti delle organizzazioni
- ✅ Componenti creati (9 sections):
  - hero, menu, gallery, contatti, about, servizi, prodotti, team, recensioni
- ✅ Plugin i18n abilitato (Italiano, Inglese, Tedesco, Francese)
- ✅ Admin Panel in Italiano
- ✅ Client API Frontend configurato (frontend/src/lib/strapi.ts)
- ✅ Variabili d'ambiente configurate (.env.local)

## Prossimi Passi

### 1. Accedi all'Admin Panel

```bash
# Strapi è già in esecuzione su:
http://localhost:1337/admin
```

**Se è la prima volta:**
- Crea un account Super Admin
- Email: la tua email
- Password: scegli una password forte

**Se hai già un account:**
- Accedi con le tue credenziali

### 2. Verifica Content Types

Nell'Admin Panel, vai a:
1. **Content-Type Builder** (icona matita in alto a sinistra)
2. Dovresti vedere:
   - **Collection Types**:
     - Template Sito Web
     - Sito Organizzazione
   - **Components**:
     - sections (9 componenti)

### 3. Configura Permissions per API Token

1. Vai a **Settings** → **API Tokens**
2. Verifica che esista il token già configurato in `.env.local`
3. Se non esiste, creane uno nuovo:
   - Nome: `Frontend Access`
   - Description: `Token per accesso dal frontend OmnilyPro`
   - Token type: `Full access` (per ora, poi customizzare)
   - Token duration: `Unlimited`
   - Copia il token e aggiornalo in `frontend/.env.local`

4. Configura Permissions per Public access:
   - Vai a **Settings** → **Users & Permissions** → **Roles** → **Public**
   - Abilita per `organization-website`:
     - ✅ `find` (per GET siti pubblici)
     - ✅ `findOne` (per GET singolo sito per subdomain)
   - Abilita per `website-template`:
     - ✅ `find` (per listare template disponibili)
     - ✅ `findOne` (per dettagli template)

### 4. Crea il Primo Template di Test

1. Vai a **Content Manager** → **Template Sito Web**
2. Click **Create new entry**
3. Compila i campi:

   ```
   Nome: Restaurant Classic
   Slug: restaurant-classic (auto-generato)
   Categoria: ristorante
   Descrizione: Template elegante per ristoranti e pizzerie
   Component Path: RestaurantClassic
   Is Active: true (✅)
   Version: 1.0.0

   Editable Fields (JSON):
   ```json
   {
     "hero": {
       "title": {
         "type": "text",
         "label": "Titolo Principale",
         "required": true,
         "maxLength": 100
       },
       "subtitle": {
         "type": "text",
         "label": "Sottotitolo",
         "maxLength": 200
       },
       "image": {
         "type": "media",
         "label": "Immagine Hero"
       }
     },
     "menu": {
       "title": {
         "type": "text",
         "label": "Titolo Sezione Menu",
         "default": "Il Nostro Menu"
       },
       "items": {
         "type": "repeater",
         "label": "Piatti",
         "max": 50,
         "fields": {
           "nome": {
             "type": "text",
             "label": "Nome Piatto",
             "required": true
           },
           "descrizione": {
             "type": "textarea",
             "label": "Descrizione"
           },
           "prezzo": {
             "type": "number",
             "label": "Prezzo (€)"
           },
           "categoria": {
             "type": "select",
             "label": "Categoria",
             "options": ["Antipasti", "Primi", "Secondi", "Pizze", "Dessert", "Bevande"]
           },
           "foto": {
             "type": "media",
             "label": "Foto Piatto"
           }
         }
       }
     },
     "gallery": {
       "images": {
         "type": "media-gallery",
         "label": "Galleria Foto",
         "max": 20
       }
     },
     "about": {
       "title": {
         "type": "text",
         "label": "Titolo Chi Siamo",
         "default": "La Nostra Storia"
       },
       "story": {
         "type": "richtext",
         "label": "Storia"
       },
       "image": {
         "type": "media",
         "label": "Immagine Chi Siamo"
       }
     },
     "contatti": {
       "show_map": {
         "type": "boolean",
         "label": "Mostra Mappa",
         "default": true
       },
       "show_form": {
         "type": "boolean",
         "label": "Mostra Form Contatti",
         "default": true
       }
     }
   }
   ```

   Contenuto Default (JSON):
   ```json
   {
     "hero": {
       "title": "Benvenuti al nostro Ristorante",
       "subtitle": "Tradizione e qualità dal 1960"
     },
     "menu": {
       "title": "Il Nostro Menu",
       "items": []
     },
     "gallery": {
       "images": []
     },
     "about": {
       "title": "La Nostra Storia",
       "story": "<p>Inserisci qui la storia del tuo ristorante...</p>"
     },
     "contatti": {
       "show_map": true,
       "show_form": true
     }
   }
   ```

4. **Sezioni (Dynamic Zone):**
   - Click **Add component to sezioni**
   - Aggiungi nell'ordine:
     1. Hero Section (layout: fullscreen)
     2. Menu/Catalogo Section (layout: grid, columns: 3)
     3. Gallery Section (layout: grid, columns: 3)
     4. About Section (layout: two-column)
     5. Contatti Section (show_map: true, show_form: true)

5. Click **Save** (in alto a destra)

### 5. Testa l'API

Apri un terminale e prova a fare una richiesta all'API:

```bash
# Ottieni tutti i template
curl http://localhost:1337/api/website-templates?populate=*

# Dovresti vedere il template "Restaurant Classic" che hai appena creato
```

Oppure da browser:
```
http://localhost:1337/api/website-templates?populate=*
```

### 6. Prossimi Step - Creare Sito di Test

Una volta verificato che l'API funziona, puoi creare un sito di test:

1. Vai a **Content Manager** → **Sito Organizzazione**
2. Click **Create new entry**
3. Compila:
   ```
   Subdomain: pizzerianapoli
   Organization ID: (copia un ID dalla tua tabella organizations)
   Nome: Pizzeria Napoli
   Template: Restaurant Classic (seleziona dal dropdown)
   Is Published: false (per ora)

   Contenuto (JSON):
   ```json
   {
     "hero": {
       "title": "Pizzeria Napoli",
       "subtitle": "Autentica pizza napoletana dal 1960",
       "image": null
     },
     "menu": {
       "title": "Il Nostro Menu",
       "items": [
         {
           "nome": "Pizza Margherita",
           "descrizione": "Pomodoro, mozzarella, basilico",
           "prezzo": 8,
           "categoria": "Pizze"
         },
         {
           "nome": "Pizza Marinara",
           "descrizione": "Pomodoro, aglio, origano, olio EVO",
           "prezzo": 7,
           "categoria": "Pizze"
         }
       ]
     },
     "gallery": {
       "images": []
     },
     "about": {
       "title": "La Nostra Storia",
       "story": "<p>Dal 1960 portiamo a Roma l'autentica tradizione della pizza napoletana...</p>"
     },
     "contatti": {
       "show_map": true,
       "show_form": true
     }
   }
   ```

4. Click **Save**

### 7. Testa il Sito via API

```bash
# Ottieni il sito per subdomain
curl 'http://localhost:1337/api/organization-websites?filters[subdomain][$eq]=pizzerianapoli&populate=*'
```

## Architettura

```
┌─────────────────────────────────────────────────────────┐
│                   STRAPI CMS                             │
│                  (localhost:1337)                        │
│                                                          │
│  Admin Panel:                                            │
│  - Content-Type Builder (struttura)                     │
│  - Content Manager (dati)                               │
│  - Settings (permissions, API tokens)                   │
│                                                          │
│  API Endpoints:                                          │
│  - GET  /api/website-templates                          │
│  - GET  /api/organization-websites                      │
│  - POST /api/organization-websites                      │
│  - PUT  /api/organization-websites/:id                  │
│                                                          │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ REST API (JSON)
                   │
┌──────────────────▼──────────────────────────────────────┐
│              FRONTEND OMNILYPRO                          │
│                                                          │
│  Client API: frontend/src/lib/strapi.ts                 │
│  - strapiClient.getTemplates()                          │
│  - strapiClient.createOrganizationWebsite()             │
│  - strapiClient.updateOrganizationWebsite()             │
│                                                          │
│  Components (da creare):                                 │
│  - OrganizationWebsites.tsx (gestione siti)            │
│  - TemplateLibrary.tsx (selezione template)             │
│  - WebsiteEditor.tsx (form contenuti)                   │
│  - WebsitePreview.tsx (anteprima live)                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## File Modificati

### Strapi (cms/)
- ✅ `src/components/sections/*.json` - 9 componenti sezioni
- ✅ `src/api/website-template/content-types/website-template/schema.json`
- ✅ `src/api/organization-website/content-types/organization-website/schema.json`
- ✅ `config/plugins.ts` - i18n abilitato
- ✅ `config/admin.ts` - localizzazione italiana

### Frontend (frontend/)
- ✅ `src/lib/strapi.ts` - Client API aggiornato
- ✅ `.env.local` - Variabili d'ambiente configurate

### Nuovi File
- ⏳ `src/components/OrganizationWebsites.tsx` - Da creare
- ⏳ `src/components/TemplateLibrary.tsx` - Da creare
- ⏳ `frontend/src/pages/StrapiTest.tsx` - Da creare (test)

## Comandi Utili

```bash
# Strapi
cd cms
npm run develop       # Avvia Strapi in sviluppo (già running)
npm run build         # Build per produzione
npm run start         # Avvia Strapi produzione

# Frontend
cd frontend
npm run dev           # Avvia frontend Vite

# Testa API Strapi
curl http://localhost:1337/api/website-templates?populate=*
curl 'http://localhost:1337/api/organization-websites?filters[subdomain][$eq]=pizzerianapoli&populate=*'
```

## Prossimi Sviluppi

1. **Oggi/Domani:**
   - ✅ Configurare Admin Panel Strapi
   - ✅ Creare primo template Restaurant
   - ✅ Creare sito di test
   - ⏳ Testare API da frontend
   - ⏳ Creare componente OrganizationWebsites per gestione siti

2. **Settimana prossima:**
   - Creare template React per rendering siti pubblici
   - Implementare form touch-friendly per POS
   - Configurare middleware subdomain routing
   - Deploy Strapi su Railway

3. **Milestone:**
   - Admin può creare e assegnare template
   - Cliente può modificare contenuti via form
   - Siti pubblici visualizzabili su subdomain

## Supporto

Se hai problemi:
1. Verifica che Strapi sia in esecuzione: `http://localhost:1337`
2. Verifica API Token in `.env.local`
3. Verifica permissions in Strapi Admin → Settings → Users & Permissions
4. Controlla console browser per errori

---

**Stato:** Setup Base Completato ✅
**Prossimo Step:** Creare primo template nell'Admin Panel
**Tempo stimato:** 30-45 minuti
