# 🌐 GUIDA SEMPLICE - Website Builder OmnilyPro

## 🎯 COSA VOGLIAMO OTTENERE

Un sistema dove:
1. **Admin (TU)** crea template professionali con Directus
2. **Cliente** modifica SOLO i contenuti (testi, foto) dal POS
3. **Pubblico** vede un sito bellissimo su `nomecliente.omnilypro.com`

---

## 🏗️ COME FUNZIONA (Spiegazione Semplice)

```
┌─────────────────────────────────────────────────┐
│  ADMIN (TU) - Directus CMS                      │
│  https://omnilypro-directus.onrender.com       │
│                                                 │
│  1. Crei un TEMPLATE (esempio: "Ristorante")   │
│     - Struttura: Hero, Menu, Gallery, Footer   │
│     - Design: Colori, layout, stile            │
│     - Contenuto ESEMPIO pre-compilato          │
│                                                 │
│  2. Assegni template a un'organizzazione        │
│     - Scegli "Pizzeria Napoli"                 │
│     - Assegni template "Ristorante"            │
│     - Genera subdomain: pizzeria-napoli        │
│     - Il sito viene creato!                    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  CLIENTE - POS Dashboard                        │
│  (Schermata "Il Mio Sito Web")                  │
│                                                 │
│  Vede SOLO form semplici:                      │
│                                                 │
│  📝 Sezione Hero                                │
│     Titolo: [Pizzeria Napoli________]          │
│     Sottotitolo: [Dal 1960 a Roma___]          │
│     Foto: [📷 Cambia Foto]                      │
│                                                 │
│  🍕 Menu                                        │
│     Pizza Margherita - €8.00                    │
│     [✏️ Modifica] [🗑️ Elimina]                   │
│     [+ Aggiungi Pizza]                          │
│                                                 │
│  📸 Gallery                                     │
│     [Upload da Camera] [Upload da Gallery]     │
│                                                 │
│  [💾 Salva] [👁️ Anteprima] [🚀 Pubblica]        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  PUBBLICO - Sito Web Live                       │
│  https://pizzeria-napoli.omnilypro.com         │
│                                                 │
│  Vede il sito BELLISSIMO con:                  │
│  - Template professionale (creato da admin)    │
│  - Contenuti personalizzati (dal cliente)      │
│  - Performance ottimali                        │
│  - Mobile responsive                           │
└─────────────────────────────────────────────────┘
```

---

## 🔧 STATO ATTUALE

### ✅ Cosa FUNZIONA già:
1. ✅ Directus CMS configurato e online
2. ✅ Database Neon con tutte le tabelle
3. ✅ Template React (RestaurantClassic) che mostra il sito
4. ✅ PublicSite che legge da Directus e mostra il sito
5. ✅ Sistema per assegnare siti alle organizzazioni

### ❌ Cosa MANCA:
1. ❌ Form nel POS per il cliente (modifica contenuti)
2. ❌ Sistema anteprima live prima di pubblicare
3. ❌ UI admin per assegnare template più facilmente

### ⚠️ Cosa CONFONDE:
- **GrapesJS** è stato aggiunto ma NON serve!
- Crea confusione perché:
  - Non si integra bene con Directus
  - Genera HTML pesante e non ottimizzato
  - Cliente avrebbe troppo controllo (può rompere il design)

---

## 🚀 PIANO D'AZIONE (Cosa Facciamo Ora)

### **DECISIONE: Rimuovere GrapesJS, Completare Directus**

**Perché:**
- ✅ Directus è già configurato (70% fatto)
- ✅ Template React sono ottimizzati e veloci
- ✅ Cliente non può rompere il design
- ✅ Più veloce da completare (2-3 giorni vs settimane)

---

## 📋 TASK DA COMPLETARE

### **1. Rimuovere GrapesJS** ⏱️ 30 minuti
```bash
# Rimuovere:
- frontend/src/components/Admin/WebsiteGrapesJSEditor.tsx
- frontend/src/components/Admin/WebsiteVisualEditor.tsx
- frontend/src/components/Admin/template-css.ts
- Pulsante "Editor Visuale" in WebsiteManager.tsx
- npm uninstall @grapesjs/studio-sdk
```

### **2. Creare Form POS per Cliente** ⏱️ 1 giorno
```typescript
// frontend/src/components/Dashboard/MyWebsite.tsx
// Form touch-friendly per Android POS

<WebsiteEditor organizationId={org.id}>
  {/* Hero Section */}
  <FormSection title="Sezione Principale">
    <Input label="Titolo" value={hero.title} onChange={...} />
    <Input label="Sottotitolo" value={hero.subtitle} onChange={...} />
    <ImageUpload label="Immagine" value={hero.image} onChange={...} />
  </FormSection>

  {/* Menu Section */}
  <FormSection title="Menu">
    <MenuItemsList items={menu.items} onAdd={...} onEdit={...} onDelete={...} />
  </FormSection>

  {/* Gallery Section */}
  <FormSection title="Gallery Foto">
    <ImageGalleryUpload images={gallery.images} onChange={...} />
  </FormSection>

  <Button onClick={handleSave}>💾 Salva Bozza</Button>
  <Button onClick={handlePreview}>👁️ Anteprima</Button>
  <Button onClick={handlePublish}>🚀 Pubblica</Button>
</WebsiteEditor>
```

### **3. Sistema Anteprima Live** ⏱️ 4 ore
```typescript
// Mostra anteprima senza pubblicare
<Preview>
  <iframe src={`/preview/${websiteId}?draft=true`} />
</Preview>
```

### **4. Admin UI Migliorata** ⏱️ 4 ore
```typescript
// Interfaccia per assegnare template facilmente
<AdminPanel>
  <OrganizationSelector />
  <TemplateSelector templates={['restaurant', 'retail', 'services']} />
  <SubdomainInput />
  <Button>🚀 Crea Sito</Button>
</AdminPanel>
```

---

## 💾 STRUTTURA DATI (Come Salvare)

### **Directus Collections:**

```javascript
// organizations_websites (tabella principale)
{
  id: 1,
  organization_id: "abc-123",
  site_name: "Pizzeria Napoli",
  domain: "pizzeria-napoli.omnilypro.com",
  template: { name: "Restaurant Classic" },
  published: true
}

// website_pages (pagine del sito)
{
  id: 1,
  website_id: 1,
  slug: "home",
  title: "Home",
  is_homepage: true
}

// page_sections (sezioni della pagina)
{
  id: 1,
  page_id: 1,
  section_type: "hero",
  section_title: "Pizzeria Napoli",
  section_subtitle: "Dal 1960 a Roma",
  sort_order: 1
}

// section_components (componenti della sezione)
{
  id: 1,
  section_id: 1,
  component_type: "heading",
  content_text: "Benvenuti da Pizzeria Napoli",
  sort_order: 1
}
```

### **Come il Cliente Modifica:**

```javascript
// Cliente modifica "Titolo Hero" dal POS
await directusClient.updateComponent(componentId, {
  content_text: "Nuovo Titolo" // ← Solo questo campo!
})

// Template React legge e mostra
const hero = page.sections.find(s => s.section_type === 'hero')
const title = hero.components.find(c => c.component_type === 'heading')

<h1>{title.content_text}</h1> // ← Mostra "Nuovo Titolo"
```

---

## 🎨 ESEMPIO COMPLETO: Modifica Hero

### **1. Cliente apre POS Dashboard**
```
📱 POS: Il Mio Sito Web
   └─ Sezione Principale
      ├─ Titolo: [Pizzeria Napoli________]
      ├─ Sottotitolo: [Dal 1960 a Roma___]
      └─ Foto: [📷 Cambia Foto]
```

### **2. Cliente modifica titolo**
```typescript
// Frontend invia a Directus
PUT /items/section_components/123
{
  content_text: "La Vera Pizza Napoletana"
}
```

### **3. Template React renderizza**
```typescript
// PublicSite.tsx
const RestaurantClassic = ({ website }) => {
  const hero = getSection(website, 'hero')
  const title = getComponent(hero, 'heading')

  return (
    <section className="hero-section">
      <h1>{title.content_text}</h1>
      {/* ↑ Mostra "La Vera Pizza Napoletana" */}
    </section>
  )
}
```

### **4. Pubblico vede sito aggiornato**
```
🌐 https://pizzeria-napoli.omnilypro.com

   ┌─────────────────────────────────────┐
   │                                     │
   │   La Vera Pizza Napoletana   ← AGGIORNATO!
   │   Dal 1960 a Roma                   │
   │                                     │
   └─────────────────────────────────────┘
```

---

## ✅ VANTAGGI DI QUESTO SISTEMA

1. **Cliente non può rompere nulla**
   - Vede solo form con campi specifici
   - Non può modificare struttura/layout
   - Design sempre perfetto

2. **Performance ottimali**
   - Template React compilati e veloci
   - CSS ottimizzato
   - Immagini ottimizzate automaticamente
   - PageSpeed > 90

3. **Manutenzione semplice**
   - Un solo sistema (Directus)
   - Template React familiari
   - Facile debuggare

4. **Flessibilità futura**
   - Facile aggiungere nuovi template
   - Facile aggiungere nuovi campi editabili
   - Sistema scalabile

---

## 🚨 COSA EVITARE

### ❌ NON usare GrapesJS perché:
- Genera HTML/CSS non ottimizzato
- Bundle JavaScript enorme (2MB+)
- Incompatibile con componenti React dinamici
- Cliente ha troppo controllo
- Difficile integrare con Directus

### ❌ NON far modificare direttamente Directus al cliente:
- Interfaccia Directus troppo complessa
- Cliente vedrebbe troppe opzioni
- Rischio di errori

### ✅ USA invece:
- Form custom nel POS (touch-friendly)
- Campi specifici e limitati
- Anteprima prima di pubblicare

---

## 📞 DOMANDE FREQUENTI

### **Q: Ma se voglio un editor drag & drop?**
A: Non serve! Il cliente modifica solo contenuti, non layout. Admin crea template una volta, cliente riempe contenuti.

### **Q: Come aggiungo un nuovo template?**
A:
1. Crei componente React (es: `CafeModern.tsx`)
2. Crei sezioni/componenti in Directus
3. Assegni template a organizzazione

### **Q: Cliente può aggiungere pagine?**
A: No, solo admin. Cliente modifica contenuti di pagine già create da admin.

### **Q: Come faccio anteprima?**
A: URL speciale con parametro `?draft=true` che mostra contenuti non pubblicati.

---

## 🎯 CONCLUSIONE

**Sistema Finale:**
```
Directus CMS (struttura)
    +
Form POS (contenuti cliente)
    +
Template React (rendering)
    =
SITO PROFESSIONALE 🚀
```

**Tempo implementazione: 2-3 giorni**
**Performance: Ottimali (PageSpeed > 90)**
**Manutenibilità: Alta**
**Complessità: Bassa**

---

**Prossimo step: Rimuovere GrapesJS e completare form POS?**
