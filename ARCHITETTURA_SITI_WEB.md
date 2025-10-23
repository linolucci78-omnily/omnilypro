# Architettura Sistema Siti Web per Organizzazioni

## 🎯 Obiettivo
Ogni organizzazione cliente di OmnilyPro può avere il suo sito web vetrina personalizzabile, accessibile tramite sottodominio.

---

## 📊 Flusso Completo del Sistema

### 1️⃣ **CREAZIONE SITO (Admin)**

```
Admin OmnilyPro
    ↓
Seleziona Organizzazione: "Pizzeria Da Mario"
    ↓
Seleziona Template: "Restaurant Classic"
    ↓
Genera Sottodominio: "pizzeriadamario"
    ↓
Crea Sito in Strapi ✅
```

**Database Strapi:**
```json
{
  "id": 1,
  "organization_id": "uuid-123",
  "subdomain": "pizzeriadamario",
  "template": { "nome": "Restaurant Classic" },
  "nome": "Sito di Pizzeria Da Mario",
  "is_published": false,
  "contenuto": {
    "hero": { "titolo": "Pizzeria Da Mario", "immagine": "..." },
    "menu": { "piatti": [...] },
    "contatti": { "email": "...", "telefono": "..." }
  }
}
```

---

### 2️⃣ **PERSONALIZZAZIONE (Cliente - Touch Interface)**

```
Cliente "Pizzeria Da Mario" fa login su OmnilyPro POS
    ↓
Accede alla sezione "Il Mio Sito Web"
    ↓
Vede form touch-friendly per modificare:
  - Titolo homepage
  - Foto della pizzeria
  - Menu piatti (con prezzi)
  - Orari di apertura
  - Info contatti
    ↓
Salva modifiche → Aggiorna contenuto in Strapi ✅
```

**Il sistema aggiorna il JSON `contenuto` nel database:**
```json
{
  "contenuto": {
    "hero": {
      "titolo": "Pizzeria Da Mario - Dal 1985",
      "sottotitolo": "La vera pizza napoletana",
      "immagine_url": "https://upload.strapi.com/foto_pizzeria_123.jpg"
    },
    "menu": {
      "piatti": [
        { "nome": "Margherita", "prezzo": "8.00", "descrizione": "..." },
        { "nome": "Diavola", "prezzo": "10.00", "descrizione": "..." }
      ]
    },
    "orari": {
      "lunedi": "18:00-23:00",
      "martedi": "18:00-23:00",
      "chiuso": ["mercoledi"]
    },
    "contatti": {
      "telefono": "+39 081 123456",
      "email": "info@pizzeriadamario.it",
      "indirizzo": "Via Roma 123, Napoli"
    }
  }
}
```

---

### 3️⃣ **PUBBLICAZIONE**

```
Cliente clicca "Pubblica Sito"
    ↓
Sistema aggiorna: is_published = true
    ↓
Sito diventa pubblicamente accessibile ✅
```

---

### 4️⃣ **VISUALIZZAZIONE PUBBLICA (Utenti Finali)**

**Opzione A - Sottodominio OmnilyPro:**
```
Cliente finale visita: https://pizzeriadamario.omnilypro.com
    ↓
Frontend React:
  1. Estrae sottodominio: "pizzeriadamario"
  2. Chiama API Strapi: GET /api/organization-websites?filters[subdomain][$eq]=pizzeriadamario
  3. Riceve dati del sito + template
  4. Carica componente React: <RestaurantClassic contenuto={...} />
  5. Renderizza sito con dati personalizzati ✅
```

**Opzione B - Dominio Custom (futuro):**
```
Cliente configura DNS: www.pizzeriadamario.it → OmnilyPro
    ↓
Frontend riceve richiesta da dominio custom
    ↓
Cerca in DB: custom_domain = "www.pizzeriadamario.it"
    ↓
Carica sito corretto ✅
```

---

## 🏗️ Struttura Tecnica

### **Database Strapi (cms/)**

```
organization_websites/
├── id: 1
│   ├── organization_id: "uuid-pizzeria-mario"
│   ├── subdomain: "pizzeriadamario"
│   ├── template: Restaurant Classic
│   ├── contenuto: { hero: {...}, menu: {...} }
│   └── is_published: true
│
├── id: 2
│   ├── organization_id: "uuid-bar-centrale"
│   ├── subdomain: "barcentrale"
│   ├── template: Cafe Modern
│   ├── contenuto: { hero: {...}, drinks: {...} }
│   └── is_published: true
│
└── id: 3
    ├── organization_id: "uuid-salone-bella"
    ├── subdomain: "salonebella"
    ├── template: Beauty & Wellness
    ├── contenuto: { hero: {...}, servizi: {...} }
    └── is_published: false (bozza)
```

---

### **Frontend React (frontend/)**

```
src/
├── templates/
│   ├── RestaurantClassic.tsx    ← Render template ristorante
│   ├── CafeModern.tsx            ← Render template bar
│   └── BeautyWellness.tsx        ← Render template beauty
│
├── pages/
│   ├── PublicSite.tsx            ← Route: /sites/:subdomain
│   │                                Logica:
│   │                                1. Legge :subdomain dalla URL
│   │                                2. Fetch dati da Strapi
│   │                                3. Carica template corretto
│   │                                4. Pass dati al template
│   │
│   └── OrganizationWebsites.tsx  ← Route: /org/:orgId/website
│                                    Interface touch per cliente
│                                    Per modificare contenuto sito
│
└── components/Admin/
    └── WebsiteManager.tsx        ← Dashboard admin per creare siti
```

---

## 🔄 Esempio Pratico: 3 Organizzazioni

### **Organizzazione 1: Pizzeria Da Mario**
- **Sottodominio**: `pizzeriadamario.omnilypro.com`
- **Template**: Restaurant Classic
- **URL pubblica**: `https://pizzeriadamario.omnilypro.com`
- **Contenuto personalizzato**:
  - Logo pizzeria
  - 15 piatti del menu
  - Foto della pizza
  - Orari apertura
  - Mappa Google Maps

### **Organizzazione 2: Bar Centrale**
- **Sottodominio**: `barcentrale.omnilypro.com`
- **Template**: Cafe Modern
- **URL pubblica**: `https://barcentrale.omnilypro.com`
- **Contenuto personalizzato**:
  - Foto del locale
  - Lista cocktail e drink
  - Eventi settimanali
  - Aperitivo menu

### **Organizzazione 3: Salone Bella Vita**
- **Sottodominio**: `salonebellavita.omnilypro.com`
- **Template**: Beauty & Wellness
- **URL pubblica**: `https://salonebellavita.omnilypro.com`
- **Contenuto personalizzato**:
  - Servizi offerti (taglio, colore, manicure)
  - Listino prezzi
  - Foto galleria lavori
  - Prenotazione online (integrato con OmnilyPro)

---

## 🚀 Come Scala il Sistema

### **Scenario: 1000 Organizzazioni**

```
Database Strapi contiene 1000 record in organization_websites

Quando utente visita: https://pizzeria123.omnilypro.com
    ↓
Frontend fa query SQL ultra-veloce:
SELECT * FROM organization_websites
WHERE subdomain = 'pizzeria123'
AND is_published = true
LIMIT 1;
    ↓
Trova record in ~5ms
    ↓
Carica template corretto
    ↓
Renderizza pagina in ~100ms totali ✅
```

**Performance:**
- ✅ Strapi + SQLite/PostgreSQL: gestisce facilmente 10.000+ siti
- ✅ Query indicizzate su `subdomain` (UNIQUE index)
- ✅ React lazy-loading dei template: carica solo quello necessario
- ✅ CDN per immagini e asset statici

---

## 🎨 Template System

Ogni template è un **componente React riutilizzabile**:

```tsx
// templates/RestaurantClassic.tsx
export default function RestaurantClassic({ contenuto }) {
  return (
    <div className="restaurant-template">
      {/* Hero Section */}
      <section className="hero" style={{ backgroundImage: contenuto.hero.immagine }}>
        <h1>{contenuto.hero.titolo}</h1>
        <p>{contenuto.hero.sottotitolo}</p>
      </section>

      {/* Menu Section */}
      <section className="menu">
        <h2>Il Nostro Menu</h2>
        {contenuto.menu.piatti.map(piatto => (
          <div className="piatto">
            <h3>{piatto.nome} - €{piatto.prezzo}</h3>
            <p>{piatto.descrizione}</p>
          </div>
        ))}
      </section>

      {/* Contatti Section */}
      <section className="contatti">
        <h2>Contattaci</h2>
        <p>📞 {contenuto.contatti.telefono}</p>
        <p>📧 {contenuto.contatti.email}</p>
        <p>📍 {contenuto.contatti.indirizzo}</p>
      </section>
    </div>
  );
}
```

**Vantaggi:**
- ✅ **Un template → infinite organizzazioni**: lo stesso codice serve 1000 pizzerie
- ✅ **Personalizzazione totale**: ogni org ha i suoi dati nel JSON `contenuto`
- ✅ **Manutenzione facile**: fix un bug → risolto per tutti
- ✅ **Nuovi template**: crei 1 componente React → disponibile per tutti

---

## 🔐 Sicurezza e Permessi

### **Admin OmnilyPro (tu)**
- ✅ Può creare/eliminare qualsiasi sito
- ✅ Può vedere tutti i siti
- ✅ Può modificare template globali

### **Cliente Organizzazione**
- ✅ Vede solo IL SUO sito
- ✅ Può modificare solo il contenuto (non la struttura)
- ✅ Può pubblicare/depubblicare
- ❌ Non può accedere a Strapi Admin
- ❌ Non può vedere/modificare siti di altre org

**Controllo accesso:**
```typescript
// Nel frontend, quando il cliente modifica il sito
const { data: user } = await supabase.auth.getUser();
const { data: org } = await supabase
  .from('organizations')
  .select('id')
  .eq('user_id', user.id)
  .single();

// Fetch solo il sito della SUA organizzazione
const { data: website } = await fetch(
  `${STRAPI_URL}/api/organization-websites?filters[organization_id][$eq]=${org.id}`
);
```

---

## 📱 Interface Touch per Clienti

I clienti modificano il sito tramite **form touch-friendly** dentro OmnilyPro:

```
┌─────────────────────────────────────┐
│  🏠 Il Mio Sito Web                 │
├─────────────────────────────────────┤
│                                     │
│  Titolo Homepage:                   │
│  [Pizzeria Da Mario - Dal 1985   ]  │
│                                     │
│  Sottotitolo:                       │
│  [La vera pizza napoletana       ]  │
│                                     │
│  📸 Foto Homepage:                  │
│  [foto_attuale.jpg]  [Cambia Foto] │
│                                     │
│  🍕 Menu Piatti:                    │
│  ┌─────────────────────────────┐   │
│  │ Margherita    €8.00  [Edit] │   │
│  │ Diavola       €10.00 [Edit] │   │
│  │ [+ Aggiungi Piatto]          │   │
│  └─────────────────────────────┘   │
│                                     │
│  ⏰ Orari:                           │
│  [Lunedì: 18:00-23:00]              │
│  [Martedì: 18:00-23:00]             │
│  ...                                │
│                                     │
│  [💾 Salva Modifiche]               │
│  [👁️ Anteprima Sito]                │
│  [🚀 Pubblica Sito]                 │
└─────────────────────────────────────┘
```

---

## 🌐 Routing e Accesso Pubblico

### **Sviluppo/Testing Locale:**
```
http://localhost:5173/sites/pizzeriadamario
http://localhost:5173/sites/barcentrale
http://localhost:5173/sites/salonebellavita
```

### **Produzione - Sottodomini Wildcard:**
```
https://pizzeriadamario.omnilypro.com
https://barcentrale.omnilypro.com
https://salonebellavita.omnilypro.com
```

**Configurazione DNS:**
```
*.omnilypro.com  →  A record → 123.45.67.89 (server)
```

**Middleware Express/Vercel:**
```typescript
// middleware.ts (Vercel Edge)
export function middleware(request) {
  const hostname = request.headers.get('host');

  if (hostname.endsWith('.omnilypro.com')) {
    const subdomain = hostname.split('.')[0];

    // Rewrite a /sites/:subdomain internamente
    return NextResponse.rewrite(
      new URL(`/sites/${subdomain}`, request.url)
    );
  }
}
```

---

## 📈 Roadmap Implementazione

### ✅ **FASE 1 - Completata (Oggi)**
- ✅ Strapi CMS configurato
- ✅ Content Types creati (website-template, organization-website)
- ✅ Dashboard admin per creare siti
- ✅ API Token e CORS configurati
- ✅ Primo sito creato in database

### 🚧 **FASE 2 - Prossimi Step (Da fare ora)**
- ❌ Componente template RestaurantClassic.tsx
- ❌ Route `/sites/:subdomain` per visualizzare siti
- ❌ Fetch dati da Strapi e rendering
- ❌ Styling template con Tailwind CSS

### 📅 **FASE 3 - Futuro Prossimo**
- ❌ Interface touch per clienti (modifica contenuto)
- ❌ Upload immagini
- ❌ Preview sito prima di pubblicare
- ❌ Analytics visite sito

### 🚀 **FASE 4 - Produzione**
- ❌ Deploy su Vercel/Railway
- ❌ Configurazione DNS wildcard
- ❌ Dominio custom per clienti
- ❌ CDN per performance

---

## 💡 Domande Frequenti

### **Q: Ogni organizzazione ha il suo database?**
❌ No! Tutti i siti sono nello **stesso database Strapi**, filtrati per `organization_id`.

### **Q: Come si isolano i dati tra organizzazioni?**
✅ Tramite `organization_id` in ogni query. Il frontend garantisce che ogni org veda solo i suoi dati.

### **Q: Quanti siti posso creare?**
✅ Illimitati! Il database scala facilmente a migliaia di siti.

### **Q: Posso avere più template?**
✅ Sì! Crei nuovi componenti React in `templates/` e li aggiungi come record in `website-templates`.

### **Q: I clienti possono cambiare template dopo?**
✅ Sì! Basta aggiornare il campo `template` nel database e il sito userà il nuovo layout.

### **Q: Come funzionano le immagini?**
✅ Strapi ha un sistema di upload integrato. Le immagini vengono salvate in `public/uploads/` e referenziate nel JSON `contenuto`.

---

## 🎯 Conclusione

**Sistema Multi-Tenant per Siti Web:**
- 1️⃣ **Admin crea sito** → Record in database
- 2️⃣ **Cliente personalizza** → Aggiorna JSON contenuto
- 3️⃣ **Cliente pubblica** → is_published = true
- 4️⃣ **Utenti visitano** → Frontend renderizza template con dati org

**Scalabilità:**
- ✅ 1 organizzazione = 1 record database
- ✅ 1000 organizzazioni = 1000 record (super veloce)
- ✅ Stesso codice React serve tutti i siti
- ✅ Ogni org ha dati isolati e sicuri

**Pronto per produzione? Sì!**
Quando completi Fase 2 + 3, il sistema è operativo al 100% 🚀
