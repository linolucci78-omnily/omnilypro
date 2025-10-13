# 🌐 OMNILY PRO - Sistema Siti Vetrina

## 📋 Panoramica

**Modulo**: **Website Builder** - Sistema di creazione e gestione siti vetrina professionali
**Obiettivo**: Fornire ad ogni organizzazione un sito web professionale di livello Wix/Squarespace, completamente integrato con l'ecosistema OmnilyPro (Loyalty, CRM, Email Marketing, POS)

**Target Quality**: Siti vetrina competitivi con Wix, Squarespace, Webflow - NON giocattoli

---

## 🎯 Visione Strategica

### **Perché Questo Modulo?**

1. **Completamento Ecosistema**: OmnilyPro diventa piattaforma all-in-one
   - ✅ Loyalty System
   - ✅ Email Marketing
   - ✅ CRM Clienti
   - ✅ POS Integration
   - 🆕 **Sito Vetrina** → Chiude il cerchio!

2. **Vantaggio Competitivo**
   - Wix/Squarespace: Solo siti web
   - **OmnilyPro**: Sito + Loyalty + Email + POS + CRM in un'unica piattaforma

3. **Monetizzazione**
   - Piano Base: Landing page singola
   - Piano Pro: Sito multi-pagina + blog
   - Piano Enterprise: Multi-sito + A/B testing

4. **Integrazione Nativa**
   - Form contatti → CRM OmnilyPro
   - Prodotti sito → Catalogo POS
   - Lead generation → Email Marketing
   - Programma punti esposto sul sito

---

## 🏗️ Architettura del Sistema

### **Principio Fondamentale: Separazione Struttura/Contenuti**

```
┌─────────────────────────────────────────────────────────┐
│                    ADMIN OMNILYPRO                      │
│  (Super Admin - Gestisce struttura e design)            │
│                                                          │
│  ✏️ GrapesJS Editor Completo                            │
│  • Drag & drop componenti                               │
│  • Layout design                                        │
│  • Template professionali                               │
│  • Definisce campi modificabili per cliente             │
│  • SEO setup avanzato                                   │
│  • Multi-pagina (Home, Chi Siamo, Servizi, etc)        │
│                                                          │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ Crea struttura + definisce campi
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              CLIENTE (Organizzazione)                    │
│  (Vede solo FORM per modificare contenuti)              │
│                                                          │
│  📝 Dashboard Contenuti                                 │
│  • Form testuali semplici                               │
│  • Upload immagini/gallery                              │
│  • Gestione prodotti/servizi                            │
│  • Orari apertura                                       │
│  • Info SEO base                                        │
│  • Preview live                                         │
│                                                          │
│  ⚠️ NON vede mai l'editor GrapesJS                      │
│                                                          │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ Contenuti salvati
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│                SITO PUBBLICO                             │
│  URL: {slug}.omnilypro.app                              │
│  Custom domain: www.azienda.it (opzionale)              │
│                                                          │
│  🌐 Rendering Dinamico                                  │
│  • Struttura (da Admin)                                 │
│  • + Contenuti (da Cliente)                             │
│  • = Sito finale                                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### **Flusso di Lavoro**

#### **1. Admin Crea Sito per Cliente**

```
Admin Dashboard
  └── Organizzazioni
       └── [Seleziona "Gelateria Roma"]
            └── 🌐 Gestisci Sito Web
                 │
                 ├── ✏️ Crea/Modifica Struttura (GrapesJS)
                 │    • Sceglie template (Ristorante/Retail/Servizi/Beauty/Corporate)
                 │    • Layout viene auto-popolato con dati da organizations:
                 │      - logo_url → Logo automatico
                 │      - name → Nome azienda
                 │      - tagline → Slogan
                 │      - address, city → Indirizzo
                 │      - phone, business_email → Contatti
                 │      - primary_color, secondary_color → Palette
                 │      - facebook_url, instagram_url → Social
                 │    • Admin personalizza layout/design
                 │    • Marca elementi come "modificabili dal cliente"
                 │    • Configura pagine (Home, Chi Siamo, Servizi, Contatti)
                 │
                 ├── 📋 Definisce Campi Modificabili
                 │    • Hero title/subtitle/image
                 │    • Sezione prodotti (repeater)
                 │    • Gallery immagini
                 │    • Testi descrittivi
                 │    • Orari apertura
                 │    • Form contatti
                 │
                 ├── 🔍 SEO Setup
                 │    • Meta title/description
                 │    • OpenGraph tags
                 │    • Schema.org markup
                 │
                 ├── 👁️ Preview Multi-Device
                 │    • Desktop/Tablet/Mobile
                 │
                 └── 🚀 Pubblica
                      • is_published = true
                      • URL live: gelateriaroma.omnilypro.app
```

#### **2. Cliente Gestisce Contenuti**

```
Dashboard Organizzazione
  └── 🌐 Il Mio Sito
       │
       ├── 📊 Statistiche (Read-Only)
       │    • URL sito: gelateriaroma.omnilypro.app [Copia] [Apri]
       │    • Visite questa settimana: 234
       │    • Lead generati: 12
       │    • Dispositivi: 60% mobile, 35% desktop, 5% tablet
       │    • Pagine più viste
       │
       ├── ✏️ Modifica Contenuti (Form Semplici)
       │    │
       │    ├── 📝 Contenuti Principali
       │    │    • Titolo principale [input text]
       │    │    • Sottotitolo [textarea]
       │    │    • Immagine hero [upload]
       │    │
       │    ├── 🍦 Prodotti/Servizi
       │    │    • Nome [text]
       │    │    • Prezzo [number]
       │    │    • Descrizione [textarea]
       │    │    • Foto [upload]
       │    │    [+ Aggiungi Prodotto] (max 12)
       │    │
       │    ├── 📸 Gallery
       │    │    • [Upload multiplo immagini]
       │    │    • Drag per riordinare
       │    │    • Max 20 immagini
       │    │
       │    ├── 📞 Info Contatto (auto-popolato da DB)
       │    │    • Telefono [readonly - da organizations]
       │    │    • Email [readonly - da organizations]
       │    │    • Indirizzo [readonly - da organizations]
       │    │
       │    ├── 🕐 Orari Apertura
       │    │    • Lun-Ven: [09:00] - [20:00]
       │    │    • Sab-Dom: [10:00] - [22:00]
       │    │    • ☑️ Stesso orario tutti i giorni
       │    │
       │    └── 🔍 SEO Base
       │         • Meta description [textarea]
       │         • Parole chiave [tags]
       │
       ├── 👁️ Anteprima
       │    • Preview real-time
       │    • Switch desktop/mobile
       │
       ├── 💾 Salva Bozza
       │
       └── 🚀 Pubblica Modifiche
            • Cliente può pubblicare le sue modifiche contenuti
            • NON può modificare struttura/design
```

#### **3. Visitatore Vede Sito Pubblico**

```
URL: gelateriaroma.omnilypro.app
Opzionale: www.gelateriaroma.it (custom domain)

🌐 Sito Renderizzato
  • Struttura layout (da Admin)
  • Contenuti personalizzati (da Cliente)
  • SEO ottimizzato
  • Mobile responsive
  • Performance elevate (PageSpeed > 90)
  • Form contatti → Salvati in CRM OmnilyPro
  • Integrazione con loyalty program (mostra punti disponibili)
```

---

## 💾 Database Schema

### **Tabelle Principali**

```sql
-- ========================================
-- Struttura sito (gestita da Admin)
-- ========================================
CREATE TABLE organization_websites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Template e struttura (solo Admin modifica)
  template_name TEXT NOT NULL, -- 'restaurant', 'retail', 'services', 'beauty', 'corporate'
  template_version INTEGER DEFAULT 1,

  -- Design GrapesJS (JSON)
  page_structure JSONB NOT NULL, -- Layout GrapesJS completo
  compiled_html TEXT, -- HTML compilato cache
  compiled_css TEXT, -- CSS compilato cache

  -- Configurazione campi modificabili dal cliente
  editable_fields JSONB NOT NULL, -- Schema campi che cliente può modificare
  /* Esempio editable_fields:
  {
    "hero": {
      "title": { "type": "text", "label": "Titolo Principale", "maxLength": 100, "required": true },
      "subtitle": { "type": "text", "label": "Sottotitolo", "maxLength": 200 },
      "image": { "type": "image", "label": "Immagine Hero", "maxSize": "2MB" }
    },
    "products": {
      "type": "repeater",
      "label": "Prodotti/Servizi",
      "max": 12,
      "fields": {
        "name": { "type": "text", "label": "Nome Prodotto" },
        "price": { "type": "number", "label": "Prezzo (€)" },
        "description": { "type": "textarea", "label": "Descrizione" },
        "image": { "type": "image", "label": "Foto Prodotto" }
      }
    },
    "gallery": {
      "type": "image-gallery",
      "label": "Gallery Foto",
      "max": 20,
      "aspectRatio": "16:9"
    },
    "hours": {
      "type": "business-hours",
      "label": "Orari Apertura"
    },
    "testimonials": {
      "type": "repeater",
      "label": "Testimonianze",
      "max": 6,
      "fields": {
        "name": { "type": "text", "label": "Nome Cliente" },
        "text": { "type": "textarea", "label": "Testimonianza" },
        "rating": { "type": "number", "label": "Voto (1-5)", "min": 1, "max": 5 }
      }
    }
  }
  */

  -- SEO (configurato da Admin, alcuni campi editabili da Cliente)
  seo_config JSONB, -- Meta tags, schema.org, etc

  -- Publishing
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  published_by UUID REFERENCES users(id), -- Admin che ha pubblicato

  -- Custom domain (opzionale)
  custom_domain TEXT UNIQUE,
  domain_verified BOOLEAN DEFAULT false,
  domain_verified_at TIMESTAMP,

  -- Analytics
  total_visits INTEGER DEFAULT 0,
  total_leads INTEGER DEFAULT 0,
  last_visit_at TIMESTAMP,

  -- Audit
  created_by UUID REFERENCES users(id), -- Admin creator
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(organization_id) -- Una sola struttura per organizzazione
);

CREATE INDEX idx_websites_org ON organization_websites(organization_id);
CREATE INDEX idx_websites_published ON organization_websites(is_published);
CREATE INDEX idx_websites_custom_domain ON organization_websites(custom_domain);

-- ========================================
-- Contenuti modificati dal Cliente
-- ========================================
CREATE TABLE website_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID REFERENCES organization_websites(id) ON DELETE CASCADE,

  -- Identificativo campo
  field_name TEXT NOT NULL, -- 'hero.title', 'products.0.name', 'gallery.0', etc.
  field_type TEXT NOT NULL, -- 'text', 'textarea', 'image', 'number', 'richtext', etc.

  -- Valore contenuto
  field_value JSONB NOT NULL, -- Valore effettivo (string, number, url immagine, etc)

  -- Stato
  is_draft BOOLEAN DEFAULT false,

  -- Audit
  updated_by UUID REFERENCES users(id), -- User organizzazione
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(website_id, field_name) -- Un solo valore per campo
);

CREATE INDEX idx_content_website ON website_content(website_id);
CREATE INDEX idx_content_field ON website_content(field_name);

-- ========================================
-- Pagine multiple (Home, Chi Siamo, etc)
-- ========================================
CREATE TABLE website_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID REFERENCES organization_websites(id) ON DELETE CASCADE,

  -- Identificativo pagina
  slug TEXT NOT NULL, -- 'home', 'about', 'services', 'contact', 'menu', etc.
  title TEXT NOT NULL, -- 'Home', 'Chi Siamo', 'I Nostri Servizi'

  -- Struttura pagina (GrapesJS JSON)
  page_structure JSONB NOT NULL,
  editable_fields JSONB, -- Campi modificabili specifici per questa pagina

  -- SEO per pagina
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,

  -- Ordinamento e visibilità
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true, -- Mostra nel menu navigazione
  is_published BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(website_id, slug)
);

CREATE INDEX idx_pages_website ON website_pages(website_id);
CREATE INDEX idx_pages_published ON website_pages(is_published);

-- ========================================
-- Log modifiche per audit trail
-- ========================================
CREATE TABLE website_edit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID REFERENCES organization_websites(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),

  action TEXT NOT NULL, -- 'created', 'updated_structure', 'updated_content', 'published', 'unpublished'
  changes_summary TEXT, -- Descrizione leggibile delle modifiche
  changes_detail JSONB, -- Dettaglio tecnico (diff)

  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_logs_website ON website_edit_logs(website_id);
CREATE INDEX idx_logs_user ON website_edit_logs(user_id);
CREATE INDEX idx_logs_created ON website_edit_logs(created_at DESC);

-- ========================================
-- Analytics e tracking visite
-- ========================================
CREATE TABLE website_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID REFERENCES organization_websites(id) ON DELETE CASCADE,

  -- Visita
  page_slug TEXT, -- Quale pagina
  referrer TEXT, -- Da dove arriva
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- Device info
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  browser TEXT,
  os TEXT,

  -- Location (opzionale - da IP)
  country TEXT,
  city TEXT,

  -- Timestamp
  visited_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_visits_website ON website_visits(website_id);
CREATE INDEX idx_visits_date ON website_visits(visited_at DESC);

-- ========================================
-- Lead generation (form contatti)
-- ========================================
CREATE TABLE website_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID REFERENCES organization_websites(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Dati lead
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,

  -- Form origine
  form_type TEXT, -- 'contact', 'booking', 'newsletter', 'quote'
  page_slug TEXT, -- Da quale pagina

  -- Status
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'converted', 'spam'
  assigned_to UUID REFERENCES users(id), -- User che gestisce il lead

  -- Auto-import in CRM
  customer_id UUID REFERENCES customers(id), -- Se convertito in cliente

  -- Tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leads_website ON website_leads(website_id);
CREATE INDEX idx_leads_org ON website_leads(organization_id);
CREATE INDEX idx_leads_status ON website_leads(status);
CREATE INDEX idx_leads_created ON website_leads(created_at DESC);

-- ========================================
-- Bucket storage per immagini sito
-- ========================================
-- Usa bucket Supabase esistente: email-images
-- Path: website-images/{organization_id}/{filename}
-- Già configurato con policies RLS

-- ========================================
-- Template predefiniti (Admin-only)
-- ========================================
CREATE TABLE website_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name TEXT NOT NULL UNIQUE, -- 'restaurant-modern', 'retail-minimal', etc.
  category TEXT NOT NULL, -- 'restaurant', 'retail', 'services', 'beauty', 'corporate'
  display_name TEXT NOT NULL, -- Nome visibile "Ristorante Moderno"
  description TEXT,
  thumbnail_url TEXT,

  -- Template structure
  template_structure JSONB NOT NULL, -- GrapesJS JSON
  default_editable_fields JSONB NOT NULL, -- Schema campi predefinito
  default_pages JSONB, -- Pagine predefinite da creare

  -- Configurazione
  recommended_colors JSONB, -- Palette colori suggerite
  required_images INTEGER DEFAULT 0, -- Numero immagini minimo richiesto

  -- Publishing
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false, -- Solo per piani Pro/Enterprise

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_templates_category ON website_templates(category);
CREATE INDEX idx_templates_active ON website_templates(is_active);
```

---

## 🎨 Template Professionali

### **1. Restaurant/Bar Premium**

**Target**: Ristoranti, pizzerie, bar, gelaterie, pasticcerie

**Pagine Incluse**:
- Home (Hero + Highlights + Gallery + Contatti)
- Menu (Categorie filtrabili + prezzi)
- Chi Siamo (Storia + Chef/Team)
- Prenota (Form prenotazione)
- Contatti (Mappa + Form + Orari)

**Sezioni Hero**:
- Full-screen image con parallax
- Video background opzionale
- Titolo + Sottotitolo + CTA ("Prenota Ora" / "Vedi Menu")

**Sezioni Prodotti/Menu**:
- Categorie tabs (Antipasti, Primi, Secondi, Dessert, Bevande)
- Card prodotto: Nome, Descrizione, Prezzo, Allergeni
- Filtri: Vegetariano, Vegano, Gluten-free
- Gallery foto piatti (masonry layout)

**Componenti Speciali**:
- ⏰ Orari dinamici ("Aperto ora" badge verde/rosso)
- 📍 Google Maps integrata con marker custom
- 🌟 Recensioni Google (widget)
- 📸 Instagram feed live
- 📞 Click-to-call mobile
- 💬 WhatsApp chat button

**Campi Modificabili**:
```json
{
  "hero": {
    "title": "text",
    "subtitle": "text",
    "image": "image",
    "cta_text": "text"
  },
  "menu_categories": {
    "type": "repeater",
    "fields": {
      "category": "text",
      "dishes": {
        "type": "repeater",
        "fields": {
          "name": "text",
          "description": "textarea",
          "price": "number",
          "image": "image",
          "allergens": "tags"
        }
      }
    }
  },
  "gallery": {
    "type": "image-gallery",
    "max": 24
  },
  "hours": "business-hours",
  "story": "richtext",
  "chef_bio": "richtext"
}
```

---

### **2. E-commerce/Retail Showcase**

**Target**: Negozi, boutique, concept store, showroom

**Pagine**:
- Home (Hero carousel + Prodotti top + Brand story)
- Prodotti (Grid + Filtri categorie)
- Chi Siamo (Brand story + Valori)
- Dove Siamo (Negozi fisici + Mappa)
- Contatti

**Sezioni Prodotti**:
- Grid responsiva (4-3-2-1 colonne)
- Hover effects (zoom, overlay info)
- Quick view modal
- Filtri: Categoria, Prezzo, Nuovo
- Badge: "Novità", "Offerta", "Esaurito"

**Componenti Speciali**:
- 🛍️ Product cards con immagine + nome + prezzo
- 🎁 Sezione "Gift Card"
- 📦 "Contattaci per ordini" CTA
- 💳 Link pagamento Stripe (opzionale)
- 📧 Newsletter signup
- ⭐ Testimonial carousel

**Campi Modificabili**:
```json
{
  "products": {
    "type": "repeater",
    "max": 50,
    "fields": {
      "name": "text",
      "description": "textarea",
      "price": "number",
      "sale_price": "number",
      "category": "select",
      "images": {
        "type": "image-gallery",
        "max": 5
      },
      "is_new": "boolean",
      "is_on_sale": "boolean",
      "stock_status": "select"
    }
  },
  "brand_story": "richtext",
  "values": {
    "type": "repeater",
    "max": 6,
    "fields": {
      "title": "text",
      "description": "textarea",
      "icon": "icon-picker"
    }
  }
}
```

---

### **3. Professional Services**

**Target**: Studi professionali, agenzie, consulenti, avvocati, commercialisti

**Pagine**:
- Home (Hero + Servizi + Numeri + CTA)
- Servizi (Dettaglio per servizio)
- Team (Bio professionisti)
- Portfolio/Case Studies
- Contatti (Form lead generation)

**Sezioni Servizi**:
- Cards con icona + titolo + descrizione
- Modal dettaglio servizio
- CTA "Richiedi consulenza"

**Componenti Speciali**:
- 📊 Stats counter animati (Clienti, Progetti, Anni esperienza)
- 🏆 Certificazioni/Partner logos
- 💼 Portfolio filtrato per categoria
- 📝 Form contatti avanzato (multi-step)
- 👔 Team grid con bio hover
- 📰 Blog/News section

**Campi Modificabili**:
```json
{
  "services": {
    "type": "repeater",
    "max": 12,
    "fields": {
      "title": "text",
      "description": "richtext",
      "icon": "icon-picker",
      "features": "list"
    }
  },
  "stats": {
    "clients": "number",
    "projects": "number",
    "years": "number"
  },
  "team": {
    "type": "repeater",
    "fields": {
      "name": "text",
      "role": "text",
      "bio": "textarea",
      "photo": "image",
      "linkedin": "url"
    }
  },
  "portfolio": {
    "type": "repeater",
    "max": 20,
    "fields": {
      "title": "text",
      "category": "text",
      "description": "textarea",
      "image": "image",
      "results": "textarea"
    }
  }
}
```

---

### **4. Beauty/Wellness**

**Target**: Saloni, spa, centri estetici, palestre, yoga studio

**Pagine**:
- Home (Hero + Servizi + Gallery + Prenota)
- Servizi/Trattamenti (Listino prezzi)
- Team (Specialisti)
- Gallery (Before/After + Ambiente)
- Prenota (Booking system)
- Contatti

**Sezioni Trattamenti**:
- Listino elegante con categorie
- Nome + Durata + Prezzo
- Modal con dettagli trattamento

**Componenti Speciali**:
- 📅 Booking/Prenotazione online (integrazione Calendly)
- ↔️ Before/After slider
- 💆 Listino prezzi elegante
- 👩 Team specialists con foto + bio
- 📸 Instagram feed
- 🎁 "Gift Card" section
- ⭐ Recensioni clienti

**Campi Modificabili**:
```json
{
  "treatments": {
    "type": "repeater",
    "fields": {
      "category": "text",
      "services": {
        "type": "repeater",
        "fields": {
          "name": "text",
          "duration": "text",
          "price": "number",
          "description": "textarea"
        }
      }
    }
  },
  "team": {
    "type": "repeater",
    "fields": {
      "name": "text",
      "specialization": "text",
      "bio": "textarea",
      "photo": "image"
    }
  },
  "before_after": {
    "type": "repeater",
    "max": 10,
    "fields": {
      "before_image": "image",
      "after_image": "image",
      "treatment": "text"
    }
  }
}
```

---

### **5. Corporate/Agency**

**Target**: Aziende, agenzie, startup, tech companies

**Pagine**:
- Home (Hero minimal + Services + Portfolio + Team)
- About (Mission + Vision + Storia)
- Services
- Portfolio/Progetti
- Blog/News
- Careers (opzionale)
- Contatti

**Componenti Speciali**:
- 🎯 Hero minimal con CTA forte
- 📊 Services showcase (icons + descrizioni)
- 💼 Portfolio filtrato (Web, Mobile, Branding, etc)
- 👥 Team section moderna
- 🏢 Partner/Client logos carousel
- 📰 Blog con categorie
- 📧 Form contatti enterprise (multi-step)

**Campi Modificabili**:
```json
{
  "hero": {
    "headline": "text",
    "subheadline": "text",
    "cta_primary": "text",
    "cta_secondary": "text",
    "background_video": "url"
  },
  "services": {
    "type": "repeater",
    "max": 8,
    "fields": {
      "icon": "icon-picker",
      "title": "text",
      "description": "textarea"
    }
  },
  "projects": {
    "type": "repeater",
    "max": 30,
    "fields": {
      "title": "text",
      "client": "text",
      "category": "select",
      "description": "richtext",
      "cover_image": "image",
      "gallery": "image-gallery",
      "tags": "tags"
    }
  },
  "blog_posts": {
    "type": "repeater",
    "fields": {
      "title": "text",
      "excerpt": "textarea",
      "content": "richtext",
      "cover_image": "image",
      "category": "text",
      "author": "text",
      "published_date": "date"
    }
  }
}
```

---

## 🔗 Integrazioni con Ecosistema OmnilyPro

### **1. Integrazione CRM**

```typescript
// Form contatti → Auto-crea lead/cliente in CRM
<ContactForm onSubmit={async (data) => {
  // 1. Salva in website_leads
  const lead = await createWebsiteLead({
    website_id,
    organization_id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    message: data.message,
    form_type: 'contact'
  })

  // 2. Crea/Aggiorna cliente in CRM OmnilyPro
  const customer = await upsertCustomer({
    organization_id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    source: 'website',
    lead_id: lead.id
  })

  // 3. Trigger email benvenuto (Email Marketing)
  await sendWelcomeEmail(customer.id)

  // 4. Notifica organizzazione (dashboard)
  await notifyNewLead(organization_id, lead.id)
}}>
```

### **2. Integrazione Loyalty Program**

```typescript
// Widget loyalty sul sito
<LoyaltyWidget organization_id={org_id}>
  {/* Mostra programma punti */}
  <div>
    <h3>Programma Fedeltà</h3>
    <p>Accumula {org.points_per_euro} punti ogni €1 speso</p>
    <p>Raggiungi {org.reward_threshold} punti per il primo premio!</p>
    <Button>Iscriviti ora</Button>
  </div>
</LoyaltyWidget>

// Link diretto a iscrizione da sito → registrazione cliente
<SignupButton organization_id={org_id} />
```

### **3. Integrazione POS**

```typescript
// Prodotti/Servizi da sito → sincronizzati con catalogo POS
// Cliente aggiunge prodotto sul sito:
await syncProductToPOS({
  organization_id,
  product_name: "Gelato Pistacchio",
  price: 5.00,
  category: "Gelati",
  source: 'website'
})

// Quando cliente acquista al POS → punti loyalty automatici
// Flow completo:
// Sito → Catalogo prodotti
//   ↓
// Cliente vede "Gelato Pistacchio €5"
//   ↓
// Cliente viene in negozio
//   ↓
// POS → Scansiona NFC card cliente
//   ↓
// Transazione "Gelato Pistacchio €5"
//   ↓
// +5 punti loyalty automatici
```

### **4. Integrazione Email Marketing**

```typescript
// Newsletter signup da sito → lista email marketing
<NewsletterForm onSubmit={async (email) => {
  // 1. Crea/Aggiorna contatto
  await upsertCustomer({
    organization_id,
    email,
    source: 'website_newsletter',
    marketing_consent: true
  })

  // 2. Aggiungi a lista email marketing
  await addToEmailList({
    organization_id,
    email,
    list_name: 'newsletter_subscribers'
  })

  // 3. Email conferma iscrizione
  await sendNewsletterConfirmation(email)
}}>
```

### **5. Analytics Unificati**

```typescript
// Dashboard organizzazione → Stats unificate
{
  "total_customers": 450,
  "website_leads": 34,
  "pos_transactions": 1234,
  "email_opens": 567,
  "website_visits": 890,
  "loyalty_members": 312
}

// Visualizzazione funnel:
Website Visit → Lead Form → Customer → POS Transaction → Loyalty Points
    890      →     34      →   450    →      1234       →     15.234
```

---

## 🎯 Funzionalità Avanzate

### **SEO Professionale**

```typescript
// Auto-generazione meta tags
<head>
  {/* Basic SEO */}
  <title>{page.meta_title || `${org.name} - ${page.title}`}</title>
  <meta name="description" content={page.meta_description} />
  <meta name="keywords" content={page.keywords.join(', ')} />

  {/* OpenGraph (Facebook, LinkedIn) */}
  <meta property="og:title" content={page.meta_title} />
  <meta property="og:description" content={page.meta_description} />
  <meta property="og:image" content={page.og_image_url} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={`https://${org.slug}.omnilypro.app/${page.slug}`} />

  {/* Twitter Cards */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={page.meta_title} />
  <meta name="twitter:description" content={page.meta_description} />
  <meta name="twitter:image" content={page.og_image_url} />

  {/* Schema.org (Restaurant example) */}
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "name": org.name,
      "image": org.logo_url,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": org.address,
        "addressLocality": org.city,
        "postalCode": org.postal_code,
        "addressCountry": "IT"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": org.latitude,
        "longitude": org.longitude
      },
      "url": `https://${org.slug}.omnilypro.app`,
      "telephone": org.phone,
      "priceRange": org.price_range,
      "servesCuisine": org.cuisine_type,
      "openingHoursSpecification": formatOpeningHours(org.hours),
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": org.google_rating,
        "reviewCount": org.google_reviews_count
      }
    })}
  </script>

  {/* Sitemap */}
  <link rel="sitemap" type="application/xml" href={`/${org.slug}/sitemap.xml`} />
</head>
```

### **Performance Optimization**

```typescript
// Image optimization automatica
import { optimizeImage } from '@/lib/imageOptimizer'

// Client upload image → Auto-ottimizzata
async function uploadImage(file: File) {
  // 1. Validazione
  if (file.size > 2 * 1024 * 1024) throw new Error("Max 2MB")

  // 2. Ottimizzazione
  const optimized = await optimizeImage(file, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
    format: 'webp' // Conversione automatica WebP
  })

  // 3. Upload Supabase Storage
  const { url } = await supabase.storage
    .from('website-images')
    .upload(`${org_id}/${Date.now()}_${file.name}`, optimized)

  // 4. Genera varianti responsive
  await generateResponsiveVariants(url) // 1920w, 1280w, 640w, 320w

  return url
}

// Rendering con lazy loading
<img
  src={image.url}
  srcSet={`
    ${image.url_320w} 320w,
    ${image.url_640w} 640w,
    ${image.url_1280w} 1280w,
    ${image.url_1920w} 1920w
  `}
  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
  loading="lazy"
  decoding="async"
  alt={image.alt}
/>

// Code splitting
const AdminEditor = lazy(() => import('@/components/AdminEditor'))
const PublicWebsite = lazy(() => import('@/components/PublicWebsite'))

// Service Worker per offline
// Cache-first strategy per assets statici
// Network-first per contenuti dinamici
```

### **Analytics Integration**

```typescript
// Google Analytics 4
import { initGA4, trackPageView, trackEvent } from '@/lib/analytics'

// Auto-setup GA4 per organizzazione
async function setupAnalytics(org_id: string) {
  const tracking_id = await createGA4Property({
    name: org.name,
    url: `https://${org.slug}.omnilypro.app`
  })

  await updateOrganization(org_id, {
    ga4_tracking_id: tracking_id
  })
}

// Tracking automatico
useEffect(() => {
  // Page view
  trackPageView({
    page_path: location.pathname,
    page_title: document.title
  })

  // Events custom
  trackEvent('website_visit', {
    organization_id: org.id,
    page_slug: page.slug,
    device: getDeviceType(),
    referrer: document.referrer
  })
}, [location])

// Form submission tracking
<ContactForm onSubmit={(data) => {
  trackEvent('lead_generated', {
    organization_id: org.id,
    form_type: 'contact',
    value: 1 // Valore lead
  })

  // Salva anche nel DB per dashboard interna
  await createWebsiteLead(data)
}}>
```

### **Custom Domain Setup**

```typescript
// Flow configurazione dominio custom
// 1. Cliente inserisce dominio desiderato
async function setupCustomDomain(website_id: string, domain: string) {
  // Esempio: www.gelateriaroma.it

  // 1. Valida dominio
  if (!isValidDomain(domain)) throw new Error("Dominio non valido")

  // 2. Genera record DNS da configurare
  const dnsRecords = {
    type: 'CNAME',
    name: domain,
    value: 'omnilypro.app',
    ttl: 3600
  }

  // 3. Salva nel DB (non verificato)
  await updateWebsite(website_id, {
    custom_domain: domain,
    domain_verified: false
  })

  // 4. Mostra istruzioni cliente
  return {
    message: "Configura questi record DNS presso il tuo provider:",
    records: dnsRecords,
    verification_url: `https://omnilypro.app/verify-domain/${website_id}`
  }
}

// 2. Verifica dominio (cron job ogni ora)
async function verifyCustomDomains() {
  const pending = await getUnverifiedDomains()

  for (const website of pending) {
    const isValid = await checkDNSRecord(website.custom_domain)

    if (isValid) {
      // 3. Setup SSL automatico (Let's Encrypt)
      await setupSSL(website.custom_domain)

      // 4. Marca come verificato
      await updateWebsite(website.id, {
        domain_verified: true,
        domain_verified_at: new Date()
      })

      // 5. Notifica cliente
      await notifyDomainVerified(website.organization_id)
    }
  }
}

// Routing multi-domain
async function routeRequest(request: Request) {
  const hostname = new URL(request.url).hostname

  // Custom domain
  if (hostname !== 'omnilypro.app') {
    const website = await getWebsiteByCustomDomain(hostname)
    if (website) return renderWebsite(website.id)
  }

  // Subdomain
  const subdomain = hostname.split('.')[0]
  const website = await getWebsiteBySlug(subdomain)
  if (website) return renderWebsite(website.id)

  // Fallback
  return render404()
}
```

---

## 💻 Stack Tecnologico

### **Frontend**

```typescript
// Core
- React 19+ (già in uso)
- TypeScript (già in uso)
- Vite (già in uso)
- React Router DOM (già in uso)

// UI Components
- TailwindCSS (utility-first per customizzazione facile)
- Headless UI (componenti accessibili)
- Radix UI (primitives per form)
- Lucide React (icone - già in uso)

// Editor Admin
- GrapesJS 0.21+ (page builder drag & drop)
- grapesjs-preset-webpage (preset componenti)
- grapesjs-blocks-basic (blocchi base)
- grapesjs-plugin-forms (form builder)
- Custom plugins per template OmnilyPro

// Animazioni
- Framer Motion (animazioni fluide)
- AOS (Animate On Scroll)

// Forms (Dashboard Cliente)
- React Hook Form (validazione performance)
- Zod (schema validation)

// SEO
- React Helmet Async (meta tags dinamici)

// Image Handling
- Sharp (optimization backend)
- React Image Gallery (gallerie)
```

### **Backend & Infrastructure**

```typescript
// Backend (Existing)
- Supabase (già in uso)
  - PostgreSQL database
  - Storage (bucket website-images)
  - Auth
  - Real-time subscriptions

// Hosting
- Vercel / Netlify
  - Static site generation
  - Edge functions
  - CDN automatico
  - SSL automatico

// Performance
- Image CDN (Cloudflare / Cloudinary)
- Edge caching
- Service Workers

// Analytics
- Google Analytics 4
- Plausible (privacy-friendly alternative)
- Custom tracking (database)

// Email
- Resend / SendGrid (già integrato per email marketing)

// Payments (Optional)
- Stripe (già pianificato per billing)
```

---

## 📋 Roadmap Implementazione

### **FASE 1: Foundation & MVP (2-3 settimane)**

#### **Settimana 1: Database & Backend**
```
✅ Giorno 1-2: Database Schema
   - Creare tutte le tabelle (organization_websites, website_content, etc)
   - RLS policies
   - Indexes
   - Trigger per updated_at

✅ Giorno 3-4: API Endpoints
   - GET /api/website/:orgSlug (public)
   - GET /api/admin/websites/:orgId (admin)
   - POST /api/admin/websites (admin create)
   - PUT /api/admin/websites/:id (admin update)
   - POST /api/websites/:id/content (client update content)
   - GET /api/websites/:id/analytics

✅ Giorno 5: Storage Setup
   - Bucket website-images
   - Upload policies
   - Image optimization pipeline
```

#### **Settimana 2: Admin Editor**
```
✅ Giorno 1-2: GrapesJS Setup
   - Installare GrapesJS + plugins
   - Configurazione base
   - Custom blocks OmnilyPro
   - Style manager personalizzato

✅ Giorno 3-4: Admin Dashboard
   - Route /admin/organizations/:id/website
   - Editor interface
   - Template selector
   - Auto-popolamento dati da organizations
   - Save/Publish buttons
   - Device preview (desktop/tablet/mobile)

✅ Giorno 5: Template Restaurant (primo)
   - Creare template restaurant-modern
   - Definire editable_fields schema
   - 3-4 pagine base (Home, Menu, About, Contact)
   - Testare end-to-end
```

#### **Settimana 3: Public Website & Client Dashboard**
```
✅ Giorno 1-2: Public Website Rendering
   - Route /site/:orgSlug
   - Component PublicWebsite
   - Merge structure + content
   - SEO meta tags
   - Mobile responsive
   - Performance optimization

✅ Giorno 3-4: Client Content Editor
   - Route /dashboard/website (per organizzazione)
   - Form dinamico basato su editable_fields
   - Upload immagini
   - Preview live
   - Save/Publish content

✅ Giorno 5: Testing & Bug Fixes
   - E2E testing
   - Cross-browser testing
   - Mobile testing
   - Performance audit
   - Bug fixes
```

**Deliverable Fase 1**:
- ✅ 1 template professionale (Restaurant)
- ✅ Admin può creare e pubblicare sito
- ✅ Cliente può modificare contenuti via form
- ✅ Sito pubblico live su {slug}.omnilypro.app
- ✅ Mobile responsive
- ✅ SEO base

---

### **FASE 2: Professional Features (2-3 settimane)**

#### **Settimana 4: Template Aggiuntivi**
```
✅ Template Retail (2 giorni)
✅ Template Services (2 giorni)
✅ Template Beauty (1 giorno)
```

#### **Settimana 5: Advanced Components**
```
✅ Form contatti → CRM integration
✅ Google Maps integration
✅ Business hours widget
✅ Gallery avanzata (masonry, lightbox)
✅ Testimonial carousel
✅ Stats counter animati
```

#### **Settimana 6: Analytics & SEO**
```
✅ Google Analytics 4 integration
✅ Website visits tracking
✅ Lead tracking
✅ Schema.org markup completo
✅ Sitemap.xml auto-generation
✅ OpenGraph + Twitter Cards
✅ Performance optimization (lazy loading, code splitting)
```

**Deliverable Fase 2**:
- ✅ 4 template professionali
- ✅ Componenti avanzati
- ✅ Analytics completi
- ✅ SEO professionale
- ✅ Form → CRM integrato
- ✅ PageSpeed > 90

---

### **FASE 3: Multi-Page & Advanced (2 settimane)**

#### **Settimana 7: Multi-Page System**
```
✅ Tabella website_pages
✅ Navigation menu builder
✅ Page manager (admin)
✅ Multi-page routing
✅ Page-specific SEO
```

#### **Settimana 8: Integrations**
```
✅ Loyalty widget (show points program)
✅ Products sync → POS catalog
✅ Newsletter signup → Email Marketing
✅ WhatsApp chat integration
✅ Instagram feed
✅ Booking system (Calendly integration)
```

**Deliverable Fase 3**:
- ✅ Siti multi-pagina completi
- ✅ Integrazioni con ecosistema OmnilyPro
- ✅ Loyalty/CRM/Email Marketing collegati
- ✅ Booking system

---

### **FASE 4: Premium Features (2-3 settimane)**

#### **Settimana 9-10: Custom Domain**
```
✅ Domain setup UI
✅ DNS verification
✅ SSL auto-provisioning
✅ Multi-domain routing
```

#### **Settimana 10-11: Blog System**
```
✅ Blog posts CRUD
✅ Categories & tags
✅ Rich text editor
✅ Blog listing + detail pages
✅ RSS feed
```

#### **Settimana 11: Advanced Analytics**
```
✅ Heatmaps integration
✅ Conversion tracking
✅ A/B testing setup
✅ UTM campaign tracking
```

**Deliverable Fase 4**:
- ✅ Custom domain support
- ✅ Blog completo
- ✅ Analytics avanzati
- ✅ A/B testing

---

## 🎯 Success Metrics

### **Qualità Tecnica**
```
✅ PageSpeed Score: > 90/100
✅ Lighthouse Performance: > 95/100
✅ Lighthouse SEO: > 95/100
✅ Lighthouse Accessibility: > 90/100
✅ Mobile Friendly Test: PASS
✅ Core Web Vitals: PASS
   - LCP (Largest Contentful Paint): < 2.5s
   - FID (First Input Delay): < 100ms
   - CLS (Cumulative Layout Shift): < 0.1
```

### **User Experience**
```
✅ Admin può creare sito in < 30 minuti
✅ Cliente può modificare contenuti in < 10 minuti
✅ Sito carica in < 3 secondi (mobile 4G)
✅ Zero errori console
✅ 100% responsive (mobile/tablet/desktop)
```

### **Business Metrics**
```
✅ Lead conversion rate > 3%
✅ Form submission rate > 2%
✅ Mobile traffic > 50%
✅ Bounce rate < 40%
✅ Average session duration > 2 min
```

---

## 🔒 Security & Privacy

```typescript
// Row Level Security (RLS)
// Solo admin può modificare struttura
CREATE POLICY admin_edit_structure ON organization_websites
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM users WHERE role = 'super_admin'
    )
  );

// Solo utenti organizzazione possono modificare contenuti
CREATE POLICY org_edit_content ON website_content
  FOR ALL USING (
    website_id IN (
      SELECT w.id FROM organization_websites w
      WHERE w.organization_id IN (
        SELECT org_id FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
  );

// Siti pubblici leggibili da tutti
CREATE POLICY public_read_websites ON organization_websites
  FOR SELECT USING (is_published = true);

// Upload immagini solo da organizzazione proprietaria
CREATE POLICY org_upload_images ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'website-images' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM organizations
      WHERE id IN (
        SELECT org_id FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
  );

// Rate limiting
// Max 10 modifiche contenuti per minuto
// Max 5 upload immagini per minuto

// XSS Prevention
// Sanitize tutti gli input HTML (DOMPurify)
// CSP headers strict

// SQL Injection Prevention
// Prepared statements (Supabase auto)
```

---

## 🚀 Go-to-Market

### **Positioning**

**Messaggio chiave**:
> "Sito vetrina professionale incluso nella tua piattaforma loyalty. Zero configurazione, tutto integrato."

**Differenziatori**:
1. ✅ Integrazione nativa con POS, CRM, Email Marketing
2. ✅ Lead automaticamente nel CRM
3. ✅ Loyalty program esposto sul sito
4. ✅ Zero competenze tecniche richieste
5. ✅ Creato da professionisti OmnilyPro

### **Pricing Strategy**

```
Piano Basic (€29/mese):
  ✅ Landing page singola
  ✅ Form contatti → CRM
  ✅ Subdomain omnilypro.app
  ✅ Analytics base
  ✅ Mobile responsive
  ❌ Multi-page
  ❌ Custom domain
  ❌ Blog

Piano Pro (€99/mese):
  ✅ Sito multi-pagina (fino a 10 pagine)
  ✅ Custom domain
  ✅ Blog
  ✅ Analytics avanzati
  ✅ Google My Business integration
  ✅ WhatsApp chat
  ❌ Multi-sito
  ❌ A/B testing

Piano Enterprise (€299/mese):
  ✅ Multi-sito (fino a 3 siti)
  ✅ A/B testing
  ✅ Heatmaps
  ✅ Priority support
  ✅ Custom development
  ✅ White-label completo
```

### **Upselling Flow**

```
Cliente inizia con Piano Basic
  ↓
Dopo 1 mese: "Aggiungi 2 pagine (Chi Siamo + Servizi) → Upgrade Pro"
  ↓
Dopo 3 mesi: "Custom domain www.tuodominio.it → Piano Pro"
  ↓
Dopo 6 mesi: "Apri secondo negozio? Crea secondo sito → Piano Enterprise"
```

---

## 📝 Note Finali

### **Ricorda**

1. **Cliente usa POS per transazioni quotidiane**
   - Sito web è vetrina online
   - POS è operatività in-store
   - CRM unifica tutto
   - Tutto interconnesso!

2. **Admin OmnilyPro è il web designer**
   - Cliente non tocca mai l'editor
   - Admin crea struttura professionale
   - Cliente aggiorna solo contenuti
   - Qualità garantita

3. **Qualità Wix-level è imperativa**
   - No compromessi su design
   - No compromessi su performance
   - No compromessi su SEO
   - Template professionali sempre

4. **Integrazione è il valore**
   - Form → CRM automatico
   - Products → POS sync
   - Newsletter → Email Marketing
   - Loyalty → Esposto sul sito
   - **Ecosistema unico!**

---

## 🎉 Conclusione

Questo sistema trasforma OmnilyPro in una **piattaforma all-in-one completa**:

```
Vetrina Online (Website) → Lead Generation
         ↓
    CRM OmnilyPro → Gestione Clienti
         ↓
   POS Integration → Transazioni in-store
         ↓
 Loyalty Points → Fidelizzazione
         ↓
 Email Marketing → Retention
         ↓
    Cliente Felice → Repeat Business
```

**Nessun competitor ha questo livello di integrazione!**

---

**Documento creato**: 2025-01-13
**Versione**: 1.0
**Autore**: OmnilyPro Team
**Status**: Ready for Implementation 🚀
