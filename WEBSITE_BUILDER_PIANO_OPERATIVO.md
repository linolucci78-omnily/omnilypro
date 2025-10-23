# 🚀 Website Builder - Piano Operativo Immediato

**Data inizio**: 14 Ottobre 2025  
**Obiettivo**: Sistema Website Builder funzionante in 2.5 giorni

---

## 📅 PIANO DI LAVORO

### **FASE 1: Setup Strapi (2 ore)** ✅ PROSSIMO

#### Task 1.1: Installazione Strapi locale (30 min)
```bash
cd /Users/pasqualelucci/Desktop/omnilypro
mkdir cms
cd cms
npx create-strapi-app@latest . --quickstart
```

**Output**: Strapi running su http://localhost:1337

#### Task 1.2: Configurazione lingua italiana (15 min)
```javascript
// config/admin.js
module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  locales: ['it'],
  defaultLocale: 'it',
});

// config/plugins.js
module.exports = {
  i18n: {
    enabled: true,
    config: {
      locales: ['it', 'en'],
      defaultLocale: 'it',
    },
  },
};
```

#### Task 1.3: Deploy Railway (45 min)
1. Crea account Railway.app
2. New Project → Deploy from GitHub
3. Configura env variables:
   ```
   DATABASE_URL=postgresql://... (auto da Railway)
   ADMIN_JWT_SECRET=random-secret-qui
   API_TOKEN_SALT=altro-secret-qui
   ```
4. Deploy

**Output**: Strapi live su https://omnily-cms.railway.app

#### Task 1.4: DNS e CORS (30 min)
```javascript
// config/middlewares.js
module.exports = [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', 'https://omnilypro.com'],
          'media-src': ["'self'", 'data:', 'blob:'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: ['https://omnilypro.com', 'https://admin.omnilypro.com'],
      headers: '*',
    },
  },
  // ... altri middleware
];
```

---

### **FASE 2: Content Types Strapi (1 ora)**

#### Task 2.1: Website Template Content Type (30 min)

Via Strapi Admin → Content-Type Builder:

```
Collection Type: Template Sito Web (website-template)

Fields:
├─ nome (Text, required, unique)
├─ slug (UID from nome, required)
├─ categoria (Enumeration: ristorante, bar, negozio, servizi, beauty)
├─ descrizione (Text)
├─ anteprima (Media - Single image)
├─ sezioni (Dynamic Zone):
│   ├─ Hero
│   ├─ Menu
│   ├─ Gallery
│   ├─ Contatti
│   └─ About
├─ editable_fields (JSON)
├─ contenuto_default (JSON)
├─ component_path (Text)
├─ is_active (Boolean, default: true)
└─ version (Text, default: "1.0.0")
```

#### Task 2.2: Organization Website Content Type (30 min)

```
Collection Type: Sito Organizzazione (organization-website)

Fields:
├─ subdomain (Text, unique, required, regex: ^[a-z0-9-]+$)
├─ organization_id (Text, required) // UUID da Supabase
├─ template (Relation: Many-to-One → website-template)
├─ nome (Text, required, i18n: true)
├─ contenuto (JSON, required, i18n: true)
├─ is_published (Boolean, default: false)
├─ is_maintenance (Boolean, default: false)
├─ custom_domain (Text, optional)
├─ seo_title (Text, i18n: true)
├─ seo_description (Long text, i18n: true)
├─ og_image (Media - Single image)
└─ analytics_id (Text, optional)
```

**Abilita i18n**: Settings → Internationalization → Add locale: English

---

### **FASE 3: API Integration Next.js (2 ore)**

#### Task 3.1: Strapi API routes (1 ora)

```typescript
// frontend/app/api/strapi/websites/route.ts
import { NextRequest } from 'next/server'

const STRAPI_URL = process.env.STRAPI_URL
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN

export async function GET(req: NextRequest) {
  const subdomain = req.nextUrl.searchParams.get('subdomain')
  const locale = req.nextUrl.searchParams.get('locale') || 'it'
  
  const res = await fetch(
    `${STRAPI_URL}/api/organization-websites?` +
    `filters[subdomain][$eq]=${subdomain}&` +
    `locale=${locale}&` +
    `populate=*`,
    {
      headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` },
      next: { revalidate: 60 }
    }
  )
  
  const data = await res.json()
  return Response.json(data.data[0] || null)
}

export async function PUT(req: NextRequest) {
  const { id, contenuto, locale } = await req.json()
  
  // TODO: Auth check con Supabase
  
  const res = await fetch(
    `${STRAPI_URL}/api/organization-websites/${id}?locale=${locale}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STRAPI_TOKEN}`
      },
      body: JSON.stringify({ data: { contenuto } })
    }
  )
  
  return Response.json(await res.json())
}
```

#### Task 3.2: Strapi client utility (30 min)

```typescript
// frontend/lib/strapi.ts
const STRAPI_URL = process.env.STRAPI_URL!
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN!

export async function getTemplates() {
  const res = await fetch(
    `${STRAPI_URL}/api/website-templates?populate=*`,
    {
      headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` },
      next: { revalidate: 3600 }
    }
  )
  return res.json()
}

export async function getWebsiteBySubdomain(subdomain: string, locale = 'it') {
  const res = await fetch(
    `${STRAPI_URL}/api/organization-websites?` +
    `filters[subdomain][$eq]=${subdomain}&` +
    `locale=${locale}&` +
    `populate=*`,
    {
      headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` },
      next: { revalidate: 60 }
    }
  )
  const data = await res.json()
  return data.data[0] || null
}

export async function createWebsite(data: {
  subdomain: string
  organization_id: string
  template_id: string
  contenuto: any
}) {
  const res = await fetch(
    `${STRAPI_URL}/api/organization-websites`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STRAPI_TOKEN}`
      },
      body: JSON.stringify({ data })
    }
  )
  return res.json()
}
```

#### Task 3.3: Env variables (15 min)

```bash
# frontend/.env.local
STRAPI_URL=https://omnily-cms.railway.app
STRAPI_API_TOKEN=your-api-token-here
```

Genera token in Strapi: Settings → API Tokens → Create new token (Full access)

---

### **FASE 4: Admin Panel (3 ore)**

#### Task 4.1: Lista template page (45 min)

```tsx
// frontend/app/admin/websites/templates/page.tsx
import { getTemplates } from '@/lib/strapi'

export default async function TemplatesPage() {
  const { data: templates } = await getTemplates()
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Template Siti Web</h1>
      
      <div className="grid grid-cols-3 gap-6">
        {templates.map((template: any) => (
          <div key={template.id} className="border rounded-lg p-4">
            <img 
              src={template.attributes.anteprima.data?.attributes.url} 
              alt={template.attributes.nome}
              className="w-full h-48 object-cover rounded mb-4"
            />
            <h3 className="font-bold">{template.attributes.nome}</h3>
            <p className="text-sm text-gray-600">{template.attributes.categoria}</p>
            <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded">
              Anteprima
            </button>
          </div>
        ))}
      </div>
      
      <a 
        href={`${process.env.STRAPI_URL}/admin/content-manager/collectionType/api::website-template.website-template/create`}
        target="_blank"
        className="mt-6 inline-block bg-green-600 text-white px-6 py-3 rounded"
      >
        + Crea Nuovo Template in Strapi
      </a>
    </div>
  )
}
```

#### Task 4.2: Assegna sito page (1.5 ore)

```tsx
// frontend/app/admin/websites/assign/page.tsx
'use client'
import { useState } from 'react'
import { createWebsite } from '@/lib/strapi'

export default function AssignWebsitePage() {
  const [subdomain, setSubdomain] = useState('')
  const [available, setAvailable] = useState<boolean | null>(null)
  
  const checkAvailability = async (sub: string) => {
    const res = await fetch(`/api/check-subdomain?subdomain=${sub}`)
    const data = await res.json()
    setAvailable(data.available)
  }
  
  const generateSubdomain = (orgName: string) => {
    return orgName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 63)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implementa creazione sito
  }
  
  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Assegna Sito a Organizzazione</h1>
      
      {/* Seleziona Organizzazione */}
      <div className="mb-6">
        <label className="block mb-2 font-medium">Organizzazione</label>
        {/* TODO: Dropdown con org da Supabase */}
      </div>
      
      {/* Subdomain */}
      <div className="mb-6">
        <label className="block mb-2 font-medium">Subdomain</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={subdomain}
            onChange={(e) => {
              const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
              setSubdomain(val)
              if (val.length >= 3) checkAvailability(val)
            }}
            className="flex-1 border rounded px-4 py-2"
          />
          <span className="text-gray-600">.omnilypro.com</span>
        </div>
        
        {subdomain && available === true && (
          <p className="mt-2 text-green-600">✅ Disponibile</p>
        )}
        {subdomain && available === false && (
          <p className="mt-2 text-red-600">❌ Già in uso</p>
        )}
      </div>
      
      {/* Seleziona Template */}
      <div className="mb-6">
        <label className="block mb-2 font-medium">Template</label>
        {/* TODO: Dropdown template da Strapi */}
      </div>
      
      <button 
        type="submit"
        disabled={!available}
        className="w-full bg-blue-600 text-white py-3 rounded disabled:bg-gray-400"
      >
        Crea Sito Web
      </button>
    </form>
  )
}
```

#### Task 4.3: Check subdomain API (30 min)

```typescript
// frontend/app/api/check-subdomain/route.ts
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const subdomain = req.nextUrl.searchParams.get('subdomain')
  
  if (!subdomain || subdomain.length < 3) {
    return Response.json({ available: false })
  }
  
  const website = await getWebsiteBySubdomain(subdomain)
  
  return Response.json({ available: !website })
}
```

---

### **FASE 5: POS Interface (4 ore)**

#### Task 5.1: My Website dashboard (1.5 ore)

```tsx
// frontend/app/dashboard/my-website/page.tsx
'use client'
import { useEffect, useState } from 'react'

export default function MyWebsitePage() {
  const [website, setWebsite] = useState<any>(null)
  
  useEffect(() => {
    // Fetch website dell'organizzazione loggata
    fetch('/api/my-website')
      .then(r => r.json())
      .then(setWebsite)
  }, [])
  
  if (!website) {
    return <div>Caricamento...</div>
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Il Mio Sito Web</h1>
      
      {/* Info Sito */}
      <div className="bg-blue-50 p-6 rounded-lg mb-6">
        <p className="text-sm text-gray-600 mb-2">Il tuo sito è disponibile su:</p>
        <div className="flex items-center gap-4">
          <p className="text-xl font-bold text-blue-600">
            {website.attributes.subdomain}.omnilypro.com
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded">
            📋 Copia Link
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded">
            🌐 Apri Sito
          </button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border rounded p-4">
          <p className="text-sm text-gray-600">Visite questa settimana</p>
          <p className="text-3xl font-bold">287</p>
        </div>
        <div className="border rounded p-4">
          <p className="text-sm text-gray-600">Lead generati</p>
          <p className="text-3xl font-bold">12</p>
        </div>
        <div className="border rounded p-4">
          <p className="text-sm text-gray-600">Status</p>
          <p className="text-xl font-bold text-green-600">🟢 Pubblicato</p>
        </div>
      </div>
      
      {/* Edit Content Button */}
      <button 
        onClick={() => window.location.href = '/dashboard/my-website/edit'}
        className="w-full bg-blue-600 text-white py-4 rounded-lg text-lg font-bold"
      >
        ✏️ Modifica Contenuti
      </button>
    </div>
  )
}
```

#### Task 5.2: Content editor form (2.5 ore)

```tsx
// frontend/app/dashboard/my-website/edit/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export default function EditWebsitePage() {
  const [content, setContent] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  const handleSave = async (publish = false) => {
    setLoading(true)
    try {
      await fetch('/api/my-website', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content,
          is_published: publish 
        })
      })
      toast.success(publish ? '🎉 Sito pubblicato!' : '💾 Modifiche salvate')
    } catch (err) {
      toast.error('❌ Errore nel salvataggio')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Modifica Contenuti Sito</h1>
      
      {/* Hero Section */}
      <section className="mb-8 p-6 border rounded-lg">
        <h2 className="text-xl font-bold mb-4">🎯 Sezione Hero</h2>
        
        <div className="mb-4">
          <label className="block mb-2 font-medium">Titolo Principale</label>
          <input
            type="text"
            value={content?.hero?.title || ''}
            onChange={(e) => setContent({
              ...content,
              hero: { ...content.hero, title: e.target.value }
            })}
            className="w-full border rounded-lg px-4 py-3 text-lg"
            placeholder="Pizzeria Napoli"
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-2 font-medium">Sottotitolo</label>
          <input
            type="text"
            value={content?.hero?.subtitle || ''}
            onChange={(e) => setContent({
              ...content,
              hero: { ...content.hero, subtitle: e.target.value }
            })}
            className="w-full border rounded-lg px-4 py-3"
            placeholder="Dal 1960 a Roma"
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-2 font-medium">Immagine Hero</label>
          <button className="w-full border-2 border-dashed rounded-lg py-8 text-gray-600 hover:bg-gray-50">
            📷 Cambia Foto (Camera/Gallery)
          </button>
        </div>
      </section>
      
      {/* Menu Section */}
      <section className="mb-8 p-6 border rounded-lg">
        <h2 className="text-xl font-bold mb-4">🍕 Menu Piatti</h2>
        
        {/* Lista piatti - TODO */}
        
        <button className="w-full border-2 border-dashed rounded-lg py-4 text-blue-600 font-medium">
          + Aggiungi Piatto
        </button>
      </section>
      
      {/* Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-4">
        <button
          onClick={() => handleSave(false)}
          disabled={loading}
          className="flex-1 bg-gray-600 text-white py-4 rounded-lg font-bold"
        >
          💾 Salva Bozza
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={loading}
          className="flex-1 bg-green-600 text-white py-4 rounded-lg font-bold"
        >
          🚀 Pubblica
        </button>
      </div>
    </div>
  )
}
```

---

### **FASE 6: Subdomain Routing (1 ora)**

#### Task 6.1: Middleware (30 min)

```typescript
// frontend/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const subdomain = hostname.split('.')[0]
  
  // Main site
  if (subdomain === 'www' || hostname === 'omnilypro.com') {
    return NextResponse.next()
  }
  
  // Admin panel
  if (subdomain === 'admin') {
    return NextResponse.rewrite(new URL('/admin', request.url))
  }
  
  // Client websites
  const url = request.nextUrl.clone()
  url.pathname = `/sites/${subdomain}${url.pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

#### Task 6.2: Public site page (30 min)

```tsx
// frontend/app/sites/[subdomain]/page.tsx
import { getWebsiteBySubdomain } from '@/lib/strapi'
import { notFound } from 'next/navigation'

export default async function ClientWebsite({ 
  params 
}: { 
  params: { subdomain: string } 
}) {
  const website = await getWebsiteBySubdomain(params.subdomain)
  
  if (!website || !website.attributes.is_published) {
    return notFound()
  }
  
  // TODO: Load template component dynamically
  const content = website.attributes.contenuto
  
  return (
    <div>
      <h1>{content.hero?.title}</h1>
      <p>{content.hero?.subtitle}</p>
      {/* Render resto template */}
    </div>
  )
}

export async function generateMetadata({ params }: any) {
  const website = await getWebsiteBySubdomain(params.subdomain)
  
  return {
    title: website?.attributes.seo_title || website?.attributes.nome,
    description: website?.attributes.seo_description,
  }
}
```

---

### **FASE 7: Primo Template (3 ore)**

#### Task 7.1: Restaurant Classic component (2 ore)

Creare componente React bellissimo - dettagli nel ROADMAPSITE.md

#### Task 7.2: Template in Strapi (1 ora)

Caricare template in Strapi via Admin Panel con tutti i campi

---

### **FASE 8: Testing & Deploy (2 ore)**

- Test completo flusso
- Fix bug
- Deploy production

---

## ✅ CHECKLIST

### Setup (FASE 1-2)
- [ ] Strapi installato locale
- [ ] Strapi deployed Railway
- [ ] Content Types creati
- [ ] i18n configurato

### Integration (FASE 3)
- [ ] API routes Next.js
- [ ] Strapi client lib
- [ ] Env variables

### Admin (FASE 4)
- [ ] Lista template page
- [ ] Assegna sito page
- [ ] Check subdomain API

### POS (FASE 5)
- [ ] My Website dashboard
- [ ] Content editor form
- [ ] Upload immagini (Android bridge)

### Routing (FASE 6)
- [ ] Middleware subdomain
- [ ] Public site page
- [ ] SEO meta tags

### Template (FASE 7)
- [ ] Restaurant Classic React
- [ ] Template in Strapi

### Deploy (FASE 8)
- [ ] Testing completo
- [ ] Production deploy

---

## 🚨 BLOCKERS POTENZIALI

1. **Railway deploy fail**: Usa Render.com come backup
2. **CORS issues**: Verifica config Strapi middlewares
3. **Subdomain non funziona**: Controlla DNS propagation (24-48h)
4. **Upload immagini POS**: Usa bridge Android esistente

---

## 📞 PROSSIMI PASSI

1. ✅ Roadmap aggiornata
2. ✅ Decisioni documentate
3. **ADESSO**: Inizia FASE 1 - Setup Strapi
4. Poi FASE 2-8 in sequenza

**Pronto per iniziare?** 🚀
