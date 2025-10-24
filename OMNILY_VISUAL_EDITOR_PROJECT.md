# 🎨 Omnily Visual Editor - Documento di Progettazione

**Data:** 2025-01-24
**Versione:** 1.0
**Autore:** Pasquale Lucci & Claude

---

## 📋 Indice

1. [Panoramica](#panoramica)
2. [Obiettivi](#obiettivi)
3. [Architettura](#architettura)
4. [Interfacce Utente](#interfacce-utente)
5. [Flusso Dati](#flusso-dati)
6. [Sezioni Supportate](#sezioni-supportate)
7. [Componenti React](#componenti-react)
8. [API Directus](#api-directus)
9. [Timeline Implementazione](#timeline-implementazione)

---

## 🎯 Panoramica

### Problema Attuale
- **GrapesJS** è troppo complesso e salva HTML/CSS statico
- Non si integra bene con la struttura Directus (sections/components)
- Non è ottimizzato per POS 8 pollici
- Disallineamento tra dati GrapesJS e struttura Directus

### Soluzione
Creare **Omnily Visual Editor** - un editor custom che:
- Carica/salva dati direttamente da/verso Directus
- Ha due interfacce: **Admin** (PC) e **Organization** (POS 8")
- Editing visuale con preview real-time
- Supporta tutte le sezioni del website builder

---

## 🎯 Obiettivi

### Funzionali
1. ✅ Sostituire completamente GrapesJS
2. ✅ Editor visuale drag & drop per riordinare sezioni
3. ✅ Modifica contenuti con preview live
4. ✅ Supporto completo per tutte le sezioni esistenti
5. ✅ Salvataggio automatico su Directus
6. ✅ Interfaccia responsive (PC + tablet 8")

### Non Funzionali
1. ✅ Performance: caricamento < 2 secondi
2. ✅ UX: interfaccia intuitiva per utenti non tecnici
3. ✅ Compatibilità: Firefox, Chrome, Safari
4. ✅ Touch-friendly per POS

---

## 🏗️ Architettura

### Stack Tecnologico
```
┌─────────────────────────────────────────┐
│  Frontend (React + TypeScript)          │
│  - Omnily Visual Editor (Admin)         │
│  - Omnily POS Editor (Organization)     │
└─────────────────────────────────────────┘
              ↕️ REST API
┌─────────────────────────────────────────┐
│  Directus CMS (Render Cloud)            │
│  - organizations_websites               │
│  - website_pages                        │
│  - website_sections                     │
│  - website_components                   │
└─────────────────────────────────────────┘
              ↕️ REST API
┌─────────────────────────────────────────┐
│  Sito Pubblico                          │
│  - RestaurantClassic.tsx                │
│  - RestaurantModern.tsx                 │
│  - Altri template                       │
└─────────────────────────────────────────┘
```

### Struttura Database (Directus)

#### Tabella: `organizations_websites`
```sql
id                  INTEGER PRIMARY KEY
organization_id     UUID
site_name           TEXT
domain              TEXT
published           BOOLEAN
template_id         INTEGER
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

#### Tabella: `website_pages`
```sql
id                  INTEGER PRIMARY KEY
website_id          INTEGER (FK)
page_name           TEXT
slug                TEXT
title               TEXT
meta_description    TEXT
is_homepage         BOOLEAN
published           BOOLEAN
sort_order          INTEGER
```

#### Tabella: `website_sections`
```sql
id                  INTEGER PRIMARY KEY
page_id             INTEGER (FK)
section_type        TEXT (hero, menu, about, gallery, etc.)
section_title       TEXT
sort_order          INTEGER
is_visible          BOOLEAN
settings            JSON (colori, layout, etc.)
```

#### Tabella: `website_components`
```sql
id                  INTEGER PRIMARY KEY
section_id          INTEGER (FK)
component_type      TEXT (heading, text, button, image, etc.)
content             TEXT
content_text        TEXT
image_url           TEXT
sort_order          INTEGER
settings            JSON
```

---

## 🖥️ Interfacce Utente

### 1️⃣ Admin Visual Editor (PC - Grande Schermo)

**Layout:**
```
┌──────────────────────────────────────────────────────────────────┐
│  🎨 Omnily Visual Editor - Pizzeria Napoli            [💾][👁️][❌]│
├────────────┬─────────────────────────────────────────────────────┤
│            │                                                     │
│  📄 PAGINE │              PREVIEW LIVE                           │
│            │                                                     │
│  🏠 Home   │  Pagina: [Home ▼] [+ Nuova Pagina]                 │
│  📖 Chi    │                                                     │
│     Siamo  │  ┌───────────────────────────────────────────────┐ │
│  📞 Contat.│  │ 🏠 HERO SECTION                               │ │
│  [+ Pagina]│  │ "Benvenuti da Pizzeria Napoli"                │ │
│            │  │ [Immagine hero bellissima]                    │ │
│  SEZIONI   │  │                                                │ │
│  (Home)    │  └───────────────────────────────────────────────┘ │
│            │                                                     │
│  [+ Nuova] │  ┌───────────────────────────────────────────────┐ │
│            │  │ 🏠 HERO SECTION                               │ │
│  ☰ Hero    │  │ "Benvenuti da Pizzeria Napoli"                │ │
│  ✏️ 👁️ 🗑️   │  │ [Immagine hero bellissima]                    │ │
│            │  │                                                │ │
│  ☰ About   │  └───────────────────────────────────────────────┘ │
│  ✏️ 👁️ 🗑️   │                                                     │
│            │  ┌───────────────────────────────────────────────┐ │
│  ☰ Menu    │  │ 📖 CHI SIAMO                                  │ │
│  ✏️ 👁️ 🗑️   │  │ La nostra storia inizia nel 1985...           │ │
│  + Piatto  │  │                                                │ │
│            │  └───────────────────────────────────────────────┘ │
│  ☰ Gallery │                                                     │
│  ✏️ 👁️ 🗑️   │  ┌───────────────────────────────────────────────┐ │
│            │  │ 🍕 IL NOSTRO MENU                             │ │
│  ☰ Contact │  │ • Pizza Margherita - €8.00                    │ │
│  ✏️ 👁️ 🗑️   │  │ • Pizza Marinara - €7.00                      │ │
│            │  │ • Calzone - €9.00                             │ │
│            │  └───────────────────────────────────────────────┘ │
│            │                                                     │
│            │  ┌───────────────────────────────────────────────┐ │
│            │  │ 📷 GALLERY                                    │ │
│            │  │ [img][img][img][img]                          │ │
│            │  └───────────────────────────────────────────────┘ │
│            │                                                     │
│            │  ┌───────────────────────────────────────────────┐ │
│            │  │ 📞 CONTATTI                                   │ │
│            │  │ Tel: 333-1234567                              │ │
│            │  │ Email: info@pizzerianapoli.it                 │ │
│            │  └───────────────────────────────────────────────┘ │
│            │                                                     │
└────────────┴─────────────────────────────────────────────────────┘
```

**Pannello Modifica (Slide-in laterale):**
```
┌──────────────────────────────────┐
│  ✏️ MODIFICA: Hero Section       │
│                            [❌]   │
├──────────────────────────────────┤
│                                  │
│  📝 Titolo Principale:           │
│  ┌────────────────────────────┐ │
│  │ Benvenuti da Pizzeria...   │ │
│  └────────────────────────────┘ │
│                                  │
│  📝 Sottotitolo:                 │
│  ┌────────────────────────────┐ │
│  │ La vera pizza napoletana   │ │
│  └────────────────────────────┘ │
│                                  │
│  🖼️ Immagine di Sfondo:          │
│  ┌────────────────────────────┐ │
│  │ [Preview immagine]         │ │
│  └────────────────────────────┘ │
│  [📁 Carica] [🗑️ Rimuovi]       │
│                                  │
│  🎨 Colore Testo:                │
│  ⬜ Bianco  ⬛ Nero  🎨 Custom   │
│                                  │
│  📏 Altezza Sezione:             │
│  ○ Normale (500px)               │
│  ● Full Screen (100vh)           │
│  ○ Custom: [___] px              │
│                                  │
│  🔘 Allineamento Testo:          │
│  ○ Sinistra ● Centro ○ Destra   │
│                                  │
│  ┌────────────────────────────┐ │
│  │ [✅ Salva]  [❌ Annulla]   │ │
│  └────────────────────────────┘ │
└──────────────────────────────────┘
```

### 2️⃣ Organization POS Editor (8 pollici - Touch)

**Layout Semplificato:**
```
┌─────────────────────────────────────┐
│  🍕 Modifica Sito - POS        [❌] │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🏠 INTESTAZIONE            │   │
│  │ Benvenuti da Pizzeria...   │   │
│  │                      [✏️]  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📖 CHI SIAMO               │   │
│  │ La nostra storia...        │   │
│  │                      [✏️]  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🍕 MENU (12 piatti)        │   │
│  │ • Margherita €8.00         │   │
│  │ • Marinara €7.00           │   │
│  │              [✏️] [+ Nuovo]│   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📞 CONTATTI                │   │
│  │ Tel: 333-1234567           │   │
│  │                      [✏️]  │   │
│  └─────────────────────────────┘   │
│                                     │
│  [💾 Salva Modifiche]              │
└─────────────────────────────────────┘
```

**Form Modifica (Full Screen):**
```
┌─────────────────────────────────────┐
│  ✏️ Modifica Menu           [←][✅] │
├─────────────────────────────────────┤
│                                     │
│  📸 Foto Piatto:                    │
│  ┌───────────────────────────────┐ │
│  │                               │ │
│  │    [Tocca per caricare]       │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
│  🍕 Nome Piatto:                    │
│  ┌───────────────────────────────┐ │
│  │ Pizza Margherita              │ │
│  └───────────────────────────────┘ │
│                                     │
│  📝 Descrizione:                    │
│  ┌───────────────────────────────┐ │
│  │ Pomodoro, mozzarella,         │ │
│  │ basilico fresco               │ │
│  └───────────────────────────────┘ │
│                                     │
│  💰 Prezzo:                         │
│  ┌───────────────────────────────┐ │
│  │ € 8.00                        │ │
│  └───────────────────────────────┘ │
│                                     │
│  [✅ Salva]  [🗑️ Elimina]         │
└─────────────────────────────────────┘
```

---

## 🔄 Flusso Dati

### Caricamento Editor
```
1. Utente clicca "Page Builder" in WebsiteManager
   ↓
2. OmnilyVisualEditor carica website da Directus
   GET /items/organizations_websites/{id}
   ↓
3. Carica pages del website
   GET /items/website_pages?filter[website_id]={id}
   ↓
4. Carica sections di ogni page
   GET /items/website_sections?filter[page_id]={id}
   ↓
5. Carica components di ogni section
   GET /items/website_components?filter[section_id]={id}
   ↓
6. Renderizza preview + pannello sezioni
```

### Modifica Sezione
```
1. Utente clicca "✏️ Modifica" su una sezione
   ↓
2. Si apre pannello laterale con form
   ↓
3. Utente modifica campi (titolo, immagine, etc.)
   ↓
4. Preview si aggiorna in tempo reale (stato React)
   ↓
5. Utente clicca "Salva"
   ↓
6. PATCH /items/website_sections/{section_id}
   PATCH /items/website_components/{component_id}
   ↓
7. Successo → chiude pannello, aggiorna preview
```

### Aggiunta Nuova Sezione
```
1. Utente clicca "[+ Nuova Sezione]"
   ↓
2. Si apre modal con scelta tipo sezione
   [Hero] [About] [Menu] [Gallery] [Contact] ...
   ↓
3. Utente sceglie tipo (es. "Gallery")
   ↓
4. POST /items/website_sections
   {
     page_id: X,
     section_type: 'gallery',
     section_title: 'Galleria Foto',
     sort_order: next_order,
     is_visible: true
   }
   ↓
5. Crea componenti di default per quella sezione
   POST /items/website_components (bulk)
   ↓
6. Aggiorna preview con nuova sezione
```

### Riordino Sezioni (Drag & Drop)
```
1. Utente trascina sezione "Menu" sopra "About"
   ↓
2. Ricalcola sort_order di tutte le sezioni
   ↓
3. PATCH /items/website_sections (batch update)
   [
     { id: 1, sort_order: 1 },
     { id: 3, sort_order: 2 },
     { id: 2, sort_order: 3 }
   ]
   ↓
4. Aggiorna preview con nuovo ordine
```

---

## 📄 Gestione Multi-Pagina

### Tipi di Pagine Supportate

1. **🏠 Homepage** (`is_homepage: true`)
   - Pagina principale del sito
   - Sempre presente (creata automaticamente)
   - URL: `/` o `/home`

2. **📖 Chi Siamo / About**
   - Storia dell'attività
   - URL: `/chi-siamo` o `/about`

3. **📞 Contatti**
   - Informazioni di contatto dettagliate
   - Form contatto
   - Mappa
   - URL: `/contatti` o `/contact`

4. **🍕 Menu / Prodotti**
   - Catalogo completo prodotti/servizi
   - URL: `/menu` o `/prodotti`

5. **📅 Prenotazioni**
   - Sistema prenotazione online
   - URL: `/prenota` o `/booking`

6. **📰 Blog / News**
   - Articoli e notizie
   - URL: `/blog` o `/news`

7. **📷 Gallery**
   - Galleria foto completa
   - URL: `/gallery` o `/foto`

8. **💼 Lavora con Noi**
   - Posizioni aperte
   - URL: `/lavora-con-noi` or `/careers`

9. **🆕 Pagina Custom**
   - Pagina personalizzata creata dall'utente
   - URL personalizzabile

### Workflow Creazione Pagina

```
1. Click "[+ Nuova Pagina]" nell'editor
   ↓
2. Si apre modal:
   ┌────────────────────────────────────┐
   │  📄 Crea Nuova Pagina             │
   ├────────────────────────────────────┤
   │  Nome Pagina:                      │
   │  [________________]                │
   │                                    │
   │  Tipo Pagina:                      │
   │  ○ Chi Siamo                       │
   │  ○ Contatti                        │
   │  ○ Menu/Prodotti                   │
   │  ● Pagina Custom                   │
   │                                    │
   │  URL (slug):                       │
   │  /[________________]               │
   │                                    │
   │  Template Iniziale:                │
   │  ○ Vuota                           │
   │  ● Con sezioni predefinite         │
   │                                    │
   │  [Crea Pagina] [Annulla]          │
   └────────────────────────────────────┘
   ↓
3. Pagina creata con sezioni di default
   ↓
4. Admin personalizza sezioni per quella pagina
   ↓
5. Pagina disponibile nel menu del sito
```

### Navigazione tra Pagine nell'Editor

```
┌─────────────────────────────────┐
│  📄 PAGINE                      │
├─────────────────────────────────┤
│  🏠 Home              [👁️][🗑️] │ ← is_homepage
│  📖 Chi Siamo         [👁️][🗑️] │
│  🍕 Menu              [👁️][🗑️] │
│  📞 Contatti          [👁️][🗑️] │
│  📷 Gallery           [👁️][🗑️] │
│                                 │
│  [+ Aggiungi Pagina]            │
└─────────────────────────────────┘
```

Click su una pagina → Mostra sezioni di quella pagina

### Menu di Navigazione Automatico

Il sito genera automaticamente un menu di navigazione con tutte le pagine pubblicate:

```html
<nav>
  <a href="/">Home</a>
  <a href="/chi-siamo">Chi Siamo</a>
  <a href="/menu">Menu</a>
  <a href="/gallery">Gallery</a>
  <a href="/contatti">Contatti</a>
</nav>
```

### Gestione Ordine Pagine nel Menu

```typescript
// Ogni pagina ha un campo sort_order
interface WebsitePage {
  id: number;
  page_name: string;
  slug: string;
  sort_order: number;  // Ordine nel menu (1, 2, 3...)
  show_in_menu: boolean; // Mostra nel menu di navigazione
}
```

Drag & drop nell'editor per riordinare pagine nel menu.

---

## 📦 Sezioni Supportate

### 1. Hero Section (`section_type: 'hero'`)
**Componenti:**
- `heading` → Titolo principale
- `text` → Sottotitolo
- `button` → CTA button
- `image` → Immagine di sfondo

**Campi Modificabili:**
- Titolo (text)
- Sottotitolo (text)
- Testo bottone (text)
- Link bottone (text)
- Immagine sfondo (image upload)
- Colore testo (color picker)
- Altezza sezione (select: normal/fullscreen/custom)
- Allineamento (select: left/center/right)

### 2. About / Chi Siamo (`section_type: 'about'`)
**Componenti:**
- `heading` → Titolo sezione
- `text/paragraph` → Testo descrittivo
- `image` (opzionale) → Immagine laterale

**Campi Modificabili:**
- Titolo (text)
- Testo (rich text editor)
- Immagine (image upload)
- Layout (select: text-left/text-right/text-center)

### 3. Menu / Prodotti (`section_type: 'menu' | 'menu_food'`)
**Componenti:**
- `heading` → Titolo sezione
- `menu_item` (multipli) → Ogni piatto/prodotto
  - nome (text)
  - descrizione (text)
  - prezzo (number)
  - immagine (image url)

**Campi Modificabili:**
- Titolo sezione (text)
- Lista prodotti:
  - Nome prodotto
  - Descrizione
  - Prezzo
  - Foto
- Pulsanti: [+ Aggiungi Prodotto] [🗑️ Elimina]

### 4. Gallery (`section_type: 'gallery'`)
**Componenti:**
- `heading` → Titolo sezione
- `image` (multipli) → Immagini galleria

**Campi Modificabili:**
- Titolo sezione (text)
- Upload multiplo immagini
- Riordino immagini (drag & drop)
- Elimina immagini

### 5. Services / Servizi (`section_type: 'services'`)
**Componenti:**
- `heading` → Titolo sezione
- `service_item` (multipli)
  - titolo (text)
  - descrizione (text)
  - icona (icon picker)

**Campi Modificabili:**
- Titolo sezione
- Lista servizi (nome, descrizione, icona)

### 6. Testimonials / Recensioni (`section_type: 'testimonials'`)
**Componenti:**
- `heading` → Titolo sezione
- `testimonial_item` (multipli)
  - nome cliente (text)
  - recensione (text)
  - rating (number 1-5)
  - foto cliente (image)

### 7. Opening Hours / Orari (`section_type: 'hours'`)
**Componenti:**
- `heading` → Titolo sezione
- `hours_item` (multipli)
  - giorno (text)
  - orario (text)
  - chiuso (boolean)

### 8. Contact / Footer (`section_type: 'contact'`)
**Componenti:**
- `contact_phone` → Telefono
- `contact_email` → Email
- `contact_address` → Indirizzo
- `social_links` → Link social media

**Campi Modificabili:**
- Telefono
- Email
- Indirizzo
- Facebook URL
- Instagram URL
- Twitter URL

---

## 🧩 Componenti React

### Struttura File
```
frontend/src/components/
├── Admin/
│   ├── WebsiteManager.tsx              ← ⚠️ BACKUP (vecchio, manteniamo)
│   ├── WebsiteManagerV2.tsx            ← 🆕 NUOVO gestore siti
│   ├── WebsiteManagerV2.css
│   ├── OmnilyVisualEditor.tsx          ← Editor principale (Admin)
│   ├── OmnilyVisualEditor.css
│   ├── SectionsList.tsx                ← Lista sezioni laterale
│   ├── SectionPreview.tsx              ← Preview sezione singola
│   ├── SectionEditPanel.tsx            ← Pannello modifica laterale
│   ├── SectionTypeSelector.tsx         ← Modal scelta tipo sezione
│   └── sections/                       ← Editor specifici per tipo
│       ├── HeroEditor.tsx
│       ├── AboutEditor.tsx
│       ├── MenuEditor.tsx
│       ├── GalleryEditor.tsx
│       ├── ServicesEditor.tsx
│       ├── TestimonialsEditor.tsx
│       ├── HoursEditor.tsx
│       └── ContactEditor.tsx
│
├── POS/
│   ├── POSWebsiteEditor.tsx            ← Editor POS (8 pollici)
│   ├── POSWebsiteEditor.css
│   ├── POSSectionCard.tsx              ← Card sezione touch-friendly
│   └── POSSectionEditForm.tsx          ← Form modifica full-screen
│
└── UI/
    ├── RichTextEditor.tsx              ← Editor testo formattato
    ├── ImageUploader.tsx               ← Upload immagini
    ├── ColorPicker.tsx                 ← Selettore colori
    └── IconPicker.tsx                  ← Selettore icone
```

### Component Props

#### OmnilyVisualEditor
```typescript
interface OmnilyVisualEditorProps {
  websiteId: number;
  onClose: () => void;
  onSave?: () => void;
}
```

#### SectionEditPanel
```typescript
interface SectionEditPanelProps {
  section: WebsiteSection;
  components: WebsiteComponent[];
  onSave: (updatedSection: WebsiteSection, updatedComponents: WebsiteComponent[]) => void;
  onCancel: () => void;
}
```

#### POSWebsiteEditor
```typescript
interface POSWebsiteEditorProps {
  websiteId: number;
  organizationId: string;
  onClose: () => void;
}
```

---

## 🔌 API Directus

### Endpoints Utilizzati

#### Websites
```http
GET    /items/organizations_websites/:id
PATCH  /items/organizations_websites/:id
```

#### Pages
```http
GET    /items/website_pages?filter[website_id][_eq]=:id
POST   /items/website_pages
PATCH  /items/website_pages/:id
DELETE /items/website_pages/:id
```

#### Sections
```http
GET    /items/website_sections?filter[page_id][_eq]=:id
POST   /items/website_sections
PATCH  /items/website_sections/:id
DELETE /items/website_sections/:id
```

#### Components
```http
GET    /items/website_components?filter[section_id][_eq]=:id
POST   /items/website_components
PATCH  /items/website_components/:id
DELETE /items/website_components/:id
```

### Metodi directusClient da Usare/Creare

```typescript
// Esistenti (già in directus.ts)
directusClient.getWebsiteComplete(websiteId)
directusClient.updateWebsite(websiteId, data)

// Da creare
directusClient.createSection(pageId, sectionData)
directusClient.updateSection(sectionId, sectionData)
directusClient.deleteSection(sectionId)
directusClient.reorderSections(pageId, sectionsOrder)

directusClient.createComponent(sectionId, componentData)
directusClient.updateComponent(componentId, componentData)
directusClient.deleteComponent(componentId)

directusClient.uploadImage(file) → returns image_url
```

---

## 🔄 Nuovo Flusso Creazione Siti (WebsiteManagerV2)

### Stati del Sito

```typescript
type WebsiteStatus =
  | 'draft_design'        // Admin sta lavorando al design
  | 'design_complete'     // Design pronto, aspetta contenuti org
  | 'content_ready'       // Org ha personalizzato i contenuti
  | 'published'           // Sito pubblicato e live
  | 'suspended'           // Sito sospeso temporaneamente
```

### Workflow Completo

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Admin Crea Sito (WebsiteManagerV2)                │
├─────────────────────────────────────────────────────────────┤
│  1. Seleziona Organizzazione                                │
│  2. Sceglie Template (Ristorante, Salon, Gym, Shop)        │
│  3. Inserisce Nome Sito                                     │
│  4. Click "Crea e Personalizza"                             │
│     ↓                                                        │
│  5. Si apre OmnilyVisualEditor                              │
│     - Modifica layout sezioni                               │
│     - Personalizza colori brand                             │
│     - Carica logo organizzazione                            │
│     - Imposta font                                          │
│  6. Salva Design                                            │
│     ↓                                                        │
│  Stato: 'design_complete'                                   │
│  ✅ Sito pronto per contenuti                               │
└─────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Organizzazione Personalizza (POS)                 │
├─────────────────────────────────────────────────────────────┤
│  1. Accede al POS                                           │
│  2. Va in "Il Mio Sito Web"                                 │
│  3. Vede card con sezioni modificabili                      │
│  4. Modifica contenuti:                                     │
│     - Testo hero                                            │
│     - Menu/Prodotti                                         │
│     - Foto                                                  │
│     - Orari e contatti                                      │
│  5. Salva                                                   │
│     ↓                                                        │
│  Stato: 'content_ready'                                     │
│  ✅ Sito pronto per pubblicazione                           │
└─────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Pubblicazione                                      │
├─────────────────────────────────────────────────────────────┤
│  OPZIONE A (Admin Approva):                                 │
│  - Org clicca "Richiedi Pubblicazione"                     │
│  - Admin riceve notifica                                    │
│  - Admin revisiona e pubblica                               │
│                                                             │
│  OPZIONE B (Auto-pubblicazione):                            │
│  - Org clicca "Pubblica Sito"                               │
│  - Sito va live immediatamente                              │
│                                                             │
│  Stato: 'published'                                         │
│  🚀 Sito pubblico e accessibile                             │
└─────────────────────────────────────────────────────────────┘
```

### UI WebsiteManagerV2 (Admin)

```
┌──────────────────────────────────────────────────────────────┐
│  🎨 Gestione Siti Web - Dashboard Admin                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ➕ CREA NUOVO SITO PROFESSIONALE                      │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                        │ │
│  │  🏢 Organizzazione:                                    │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │ Pizzeria Napoli                              ▼   │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                        │ │
│  │  🎨 Template:                                          │ │
│  │  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐            │ │
│  │  │  🍕   │ │  💇   │ │  💪   │ │  🏪   │            │ │
│  │  │Rist.  │ │Salon  │ │Gym    │ │Shop   │            │ │
│  │  │Modern │ │Chic   │ │Sporty │ │Clean  │            │ │
│  │  └───────┘ └───────┘ └───────┘ └───────┘            │ │
│  │     ●                                                 │ │
│  │                                                        │ │
│  │  📝 Nome Sito:                                         │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │ Sito Pizzeria Napoli                             │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                        │ │
│  │  [🎨 Crea Sito e Personalizza Design →]              │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  📊 SITI IN GESTIONE                    [🔍 Cerca...] │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                        │ │
│  │  🍕 Pizzeria Napoli                                   │ │
│  │  ┌────────────────────────────────────────────────┐  │ │
│  │  │ Stato: 🟡 Design Completato                    │  │ │
│  │  │ Contenuti: ⚠️ In attesa personalizzazione org  │  │ │
│  │  │ Pubblicato: ❌ No                              │  │ │
│  │  │ Creato: 20/01/2025                             │  │ │
│  │  │                                                 │  │ │
│  │  │ [🎨 Modifica Design] [👁️ Anteprima]            │  │ │
│  │  │ [📝 Vedi Contenuti]  [🗑️ Elimina]              │  │ │
│  │  └────────────────────────────────────────────────┘  │ │
│  │                                                        │ │
│  │  💇 Salone Bellezza Lucia                             │ │
│  │  ┌────────────────────────────────────────────────┐  │ │
│  │  │ Stato: 🟢 Pubblicato                           │  │ │
│  │  │ Contenuti: ✅ Personalizzati                   │  │ │
│  │  │ Pubblicato: ✅ Sì (dal 15/01/2025)            │  │ │
│  │  │ Visite (30gg): 1,240                          │  │ │
│  │  │                                                 │  │ │
│  │  │ [🎨 Modifica Design] [🌐 Vedi Sito Live]       │  │ │
│  │  │ [⏸️ Sospendi]        [📊 Statistiche]          │  │ │
│  │  └────────────────────────────────────────────────┘  │ │
│  │                                                        │ │
│  │  💪 Palestra FitZone                                  │ │
│  │  ┌────────────────────────────────────────────────┐  │ │
│  │  │ Stato: 🟠 Contenuti Pronti                     │  │ │
│  │  │ Contenuti: ✅ Personalizzati dall'org          │  │ │
│  │  │ Pubblicato: ⏳ In attesa approvazione admin    │  │ │
│  │  │ Richiesta: 22/01/2025 alle 14:30              │  │ │
│  │  │                                                 │  │ │
│  │  │ [✅ Approva e Pubblica] [👁️ Revisiona]         │  │ │
│  │  │ [🎨 Modifica Design]    [❌ Rifiuta]           │  │ │
│  │  └────────────────────────────────────────────────┘  │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Permessi e Controlli

| Azione | Admin | Organization |
|--------|-------|--------------|
| Creare nuovo sito | ✅ | ❌ |
| Modificare design (layout, colori, struttura) | ✅ | ❌ |
| Modificare contenuti (testi, menu, foto) | ✅ (read-only) | ✅ |
| Pubblicare sito | ✅ | ⏳ Richiesta |
| Sospendere sito | ✅ | ❌ |
| Eliminare sito | ✅ | ❌ |
| Vedere statistiche | ✅ | ✅ (solo proprio sito) |

---

## 📅 Timeline Implementazione

### Fase 1: Setup Base (Giorno 1-2)
- [ ] Creare `OmnilyVisualEditor.tsx` con layout base
- [ ] Implementare caricamento dati da Directus
- [ ] Mostrare lista sezioni nel pannello laterale
- [ ] Mostrare preview statica delle sezioni

### Fase 2: Modifica Sezioni (Giorno 3-4)
- [ ] Implementare `SectionEditPanel.tsx`
- [ ] Creare editor per ogni tipo di sezione:
  - [ ] HeroEditor
  - [ ] AboutEditor
  - [ ] MenuEditor
  - [ ] ContactEditor
- [ ] Implementare salvataggio su Directus
- [ ] Preview real-time mentre modifichi

### Fase 3: Gestione Sezioni (Giorno 5)
- [ ] Aggiunta nuova sezione (`SectionTypeSelector`)
- [ ] Eliminazione sezione (con conferma)
- [ ] Mostra/Nascondi sezione (toggle visibility)
- [ ] Drag & Drop riordino sezioni

### Fase 4: Componenti UI (Giorno 6)
- [ ] `ImageUploader` con preview
- [ ] `RichTextEditor` (TinyMCE o Quill)
- [ ] `ColorPicker`
- [ ] `IconPicker`

### Fase 5: Editor POS (Giorno 7-8)
- [ ] Creare `POSWebsiteEditor.tsx`
- [ ] Layout ottimizzato per 8 pollici
- [ ] Form touch-friendly
- [ ] Testare su tablet

### Fase 6: Testing & Polish (Giorno 9-10)
- [ ] Test su tutti i browser
- [ ] Test touch su tablet
- [ ] Gestione errori
- [ ] Loading states
- [ ] Validazione form
- [ ] Documentazione uso

### Fase 7: WebsiteManagerV2 (Giorno 11)
- [ ] Creare `WebsiteManagerV2.tsx` (nuovo gestore siti)
- [ ] Implementare creazione sito con workflow nuovo
- [ ] Card siti con stati (draft/complete/published)
- [ ] Bottoni condizionali in base allo stato
- [ ] Integrazione con OmnilyVisualEditor
- [ ] Sistema notifiche richieste pubblicazione
- [ ] ⚠️ Mantenere `WebsiteManager.tsx` come backup

### Fase 8: Deploy (Giorno 12)
- [ ] Test finale
- [ ] Commit e push
- [ ] Deploy su produzione
- [ ] Monitoraggio

---

## ✅ Checklist Pre-Implementazione

Prima di iniziare a scrivere codice, verificare:

- [ ] Tutti i campi necessari esistono nel database Directus
- [ ] I metodi API in `directus.ts` sono completi
- [ ] Le sezioni supportate sono definite chiaramente
- [ ] Il design UI è approvato
- [ ] La struttura componenti è chiara
- [ ] Le dipendenze necessarie sono installate

---

## 📝 Note Implementative

### Librerie da Usare
- **Drag & Drop:** `@dnd-kit/core` (già installata)
- **Rich Text:** TinyMCE o Quill.js
- **Color Picker:** `react-color`
- **Icons:** `lucide-react` (già in uso)
- **Image Upload:** Custom con preview

### Performance
- Usare `React.memo` per SectionPreview
- Debounce auto-save (2 secondi)
- Lazy load immagini nella preview
- Virtual scrolling per liste lunghe di sezioni

### Accessibilità
- Keyboard navigation
- ARIA labels
- Focus management
- Screen reader support

---

## 🚀 Go/No-Go Decision

**Prima di procedere con l'implementazione, confermare:**

1. ✅ Il design proposto è accettabile?
2. ✅ La struttura dati Directus è confermata?
3. ✅ Le sezioni supportate sono complete?
4. ✅ Il piano di implementazione è realistico?
5. ✅ Abbiamo 12 giorni per completare il progetto?

---

**Stato Progetto:** 📋 IN PIANIFICAZIONE
**Prossimo Step:** Approvazione design e inizio Fase 1

---

_Documento aggiornato il 2025-01-24_
