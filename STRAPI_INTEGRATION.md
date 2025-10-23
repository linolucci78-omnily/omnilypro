# 🔗 Integrazione Strapi ↔ OmnilyPro

## 📋 **Architettura Integrazione**

```
┌─────────────────┐
│   Admin Panel   │ ← Gestione template (solo tu)
│  (OmnilyPro)    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   Strapi CMS    │ ← Backend headless (content)
│  localhost:1337 │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   POS Interface │ ← Clienti editano contenuti
│  (Touch Forms)  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Public Sites   │ ← *.omnilypro.com
│    (Vercel)     │
└─────────────────┘
```

---

## ✅ **COMPLETATO**

### **1. Backend Strapi CMS**
- ✅ Installato Strapi v5.27.0
- ✅ Configurato italiano come lingua default
- ✅ Database SQLite (dev) - PostgreSQL (prod)
- ✅ Server running su `http://localhost:1337`

### **2. SDK TypeScript**
- ✅ Cliente Strapi (`/frontend/src/lib/strapi.ts`)
- ✅ Type-safe API methods
- ✅ Gestione template e siti organizzazioni
- ✅ Upload media

### **3. Componenti React**
- ✅ `TemplateLibrary.tsx` - Griglia template
- ✅ `OrganizationWebsites.tsx` - Gestione siti
- ✅ Path alias `@/*` configurato

---

## 🔄 **DA COMPLETARE**

### **STEP 1: Crea Content Types in Strapi**

Vai su **http://localhost:1337/admin** e crea:

#### **A) Website Template**
```
Collection Type: website-template
Campi:
- name (Text, Required, Unique)
- description (Long Text)
- category (Enumeration: ristorante, bar, negozio, servizi, generico)
- is_active (Boolean, default: true)
- demo_url (Text)
- price_tier (Enumeration: free, basic, premium)
- preview_image (Media, Single Image)
- sections (Dynamic Zone):
  - Hero (Component)
  - Features (Component)
  - Gallery (Component)
  - Contact (Component)
  - Menu (Component)
```

#### **B) Organization Website**
```
Collection Type: organization-website
Campi:
- organization_id (Text, Required)
- subdomain (Text, Required, Unique)
- custom_domain (Text)
- is_published (Boolean, default: false)
- seo_title (Text)
- seo_description (Long Text)
- template (Relation: Many-to-One con website-template)
- content (Dynamic Zone - stessi component di template)
```

#### **C) Components per Dynamic Zones**
Crea questi component in Strapi:

**Hero Section:**
```
Component: sections.hero
- title (Text)
- subtitle (Text)
- background_image (Media)
- cta_text (Text)
- cta_link (Text)
```

**Features Section:**
```
Component: sections.features
- title (Text)
- features (Component Repeatable):
  - icon (Text)
  - title (Text)
  - description (Text)
```

**Gallery Section:**
```
Component: sections.gallery
- title (Text)
- images (Media, Multiple)
```

**Contact Section:**
```
Component: sections.contact
- title (Text)
- address (Text)
- phone (Text)
- email (Email)
- show_map (Boolean)
- map_coordinates (Text)
```

**Menu Section (Ristoranti):**
```
Component: sections.menu
- title (Text)
- categories (Component Repeatable):
  - name (Text)
  - items (Component Repeatable):
    - name (Text)
    - description (Text)
    - price (Decimal)
    - image (Media)
```

---

### **STEP 2: Genera API Token**

1. Vai su **Settings → API Tokens**
2. Clicca **Create new API Token**
3. Nome: `omnilypro-frontend`
4. Token type: **Read-Only** (per frontend pubblico)
5. Crea secondo token **Full Access** (per admin)
6. Copia i token e aggiornali in `.env.local`:

```env
VITE_STRAPI_API_TOKEN=<token-read-only>
VITE_STRAPI_ADMIN_TOKEN=<token-full-access>
```

---

### **STEP 3: Integrazione con Routing**

Aggiorna il router di React per includere le nuove pagine:

```typescript
// frontend/src/App.tsx o routes.tsx

import TemplateLibrary from '@/components/TemplateLibrary'
import OrganizationWebsites from '@/components/OrganizationWebsites'

// Aggiungi routes:
{
  path: '/admin/templates',
  element: <TemplateLibrary onSelectTemplate={handleSelectTemplate} />
},
{
  path: '/admin/organizations/:id/websites',
  element: <OrganizationWebsites 
    organizationId={orgId} 
    organizationName={orgName} 
  />
}
```

---

### **STEP 4: Crea primo template di esempio**

In Strapi Admin Panel:
1. Vai su **Content Manager → Website Templates**
2. Clicca **Create new entry**
3. Compila:
   - Name: "Ristorante Elegante"
   - Description: "Template moderno per ristoranti con menu digitale"
   - Category: `ristorante`
   - Price Tier: `free`
   - Is Active: `true`
   - Sections: Aggiungi Hero, Features, Menu, Contact
4. **Save & Publish**

---

### **STEP 5: POS Interface (Touch-Friendly)**

Crea form ottimizzati per POS touch:

```typescript
// frontend/src/components/POSWebsiteEditor.tsx

export default function POSWebsiteEditor({ websiteId }: { websiteId: number }) {
  // Form con pulsanti grandi, input touch-friendly
  // Solo contenuti: testi, immagini, contatti
  // NO struttura/layout (quella è nel template)
  
  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-6">Modifica Sito Web</h2>
      
      {/* Sezioni editabili */}
      <div className="space-y-6">
        <TouchInput label="Titolo Homepage" size="large" />
        <TouchInput label="Sottotitolo" size="large" />
        <ImageUpload label="Logo" />
        <TouchTextarea label="Descrizione Attività" rows={6} />
        {/* ... */}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <button className="w-full py-6 bg-blue-600 text-white text-2xl rounded-xl">
          💾 Salva Modifiche
        </button>
      </div>
    </div>
  )
}
```

---

### **STEP 6: Middleware Next.js per Subdomains**

Quando farai deploy su Vercel, crea middleware per gestire subdomains:

```typescript
// Questo andrà in un progetto Next.js separato per i siti pubblici
// frontend-public/middleware.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const subdomain = hostname.split('.')[0]
  
  // Escludi domini principali
  if (subdomain === 'www' || subdomain === 'omnilypro') {
    return NextResponse.next()
  }
  
  // Fetch sito da Strapi
  const siteData = await fetch(
    `${process.env.STRAPI_URL}/api/organization-websites?filters[subdomain][$eq]=${subdomain}&populate=*`
  )
  
  if (!siteData.ok) {
    return new NextResponse('Sito non trovato', { status: 404 })
  }
  
  // Rewrite per rendering dinamico
  const url = request.nextUrl.clone()
  url.pathname = `/sites/${subdomain}${url.pathname}`
  
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

---

### **STEP 7: Deploy Strapi su Railway**

1. Crea account su **https://railway.app**
2. **New Project → Deploy from GitHub**
3. Seleziona repo con cartella `/cms`
4. Configura variabili ambiente:
   ```
   NODE_ENV=production
   DATABASE_CLIENT=postgres
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   APP_KEYS=<genera-random>
   API_TOKEN_SALT=<genera-random>
   ADMIN_JWT_SECRET=<genera-random>
   ```
5. Deploy automatico ✅

---

## 🎯 **PROSSIMI PASSI PRATICI**

1. **Ora**: Vai su http://localhost:1337/admin
2. **Crea Content Types** (5 minuti)
3. **Genera API Tokens** (2 minuti)
4. **Crea template di esempio** (10 minuti)
5. **Integra componenti nel router** (5 minuti)

Poi testiamo il flusso completo:
```
Admin → Crea template
Cliente dal POS → Sceglie template → Compila contenuti
Sistema → Genera sito su subdomain
Pubblico → Visita pizzerianapoli.omnilypro.com
```

---

## 📚 **File Creati**

```
frontend/
├── src/
│   ├── lib/
│   │   └── strapi.ts          ← SDK Strapi
│   └── components/
│       ├── TemplateLibrary.tsx
│       └── OrganizationWebsites.tsx
├── .env.local                  ← Variabili ambiente
├── tsconfig.app.json           ← Path alias @/*
└── vite.config.ts              ← Resolve alias

cms/                            ← Strapi CMS
├── config/
│   ├── admin.ts               ← Config italiana
│   └── plugins.ts             ← i18n, upload
└── [files...]
```

---

## 🚀 **Vuoi che proceda con:**

A) **Creare i Content Types via script automatico** (più veloce)
B) **Guidarti step-by-step nel pannello Strapi** (più didattico)
C) **Creare componenti POS touch-friendly**
D) **Setup deploy Railway**

Cosa preferisci?
