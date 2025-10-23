# 🌐 Website Builder - Decisioni Architetturali

**Data**: 14 Ottobre 2025  
**Status**: ✅ Architettura Definita - Pronto per Sviluppo

---

## 🎯 DECISIONI FINALI

### 1. **CMS: Strapi (Open Source)**

**Scelta**: Strapi self-hosted su Railway.app  
**Motivo**: 
- ✅ 100% gratis (open source)
- ✅ Admin panel già pronto (risparmio 2 settimane sviluppo)
- ✅ API REST/GraphQL automatiche
- ✅ Permissions granulari (Admin vs Cliente perfette)
- ✅ Media Library integrata
- ✅ i18n nativo (italiano + multilingua)
- ✅ Community grande, mature & stabile

**Alternative scartate**:
- ❌ Custom CMS: 3-4 settimane sviluppo
- ❌ Sanity: $99/mese (costo)
- ❌ Contentful: $300/mese (costo)
- ❌ GrapesJS/Craft.js: troppo complessi per cliente finale

---

### 2. **Domini: Subdomain System**

**Scelta**: `*.omnilypro.com` (wildcard subdomain)

**Struttura**:
```
omnilypro.com                    → Dashboard/POS
admin.omnilypro.com              → Admin Panel

pizzerianapoli.omnilypro.com     → Cliente 1
barcentrale.omnilypro.com        → Cliente 2
trattoriamario.omnilypro.com     → Cliente 3
```

**Setup DNS** (una tantum):
```
Type:  CNAME
Name:  *
Value: cname.vercel-dns.com
```

**Vantaggi**:
- ✅ Più professionale di `/sites/slug`
- ✅ SEO migliore
- ✅ SSL automatico Vercel per ogni subdomain
- ✅ Branding: cliente può stampare su biglietti
- ✅ Futuro: upgrade a custom domain (`www.pizzeria.it`)

**Alternative scartate**:
- ❌ Path-based (`/sites/pizzeria`): meno professionale
- ❌ Custom domain obbligatorio: troppo complesso all'inizio

---

### 3. **Architettura: Admin Crea, Cliente Modifica Solo Contenuti**

**Principio**:
```
ADMIN (tu)
  ↓ Crea TEMPLATE completi in Strapi
  ↓ Definisce struttura, design, sezioni
  ↓ Marca campi editabili (JSON schema)
  
CLIENTE
  ↓ Vede solo FORM touch-friendly
  ↓ Modifica testi, immagini, prodotti
  ↓ NON può modificare struttura/codice
  
PUBBLICO
  ↓ Vede sito su subdomain.omnilypro.com
  ↓ Template + Contenuti = Sito finale
```

**Separazione netta**:
- ✅ Admin = Strapi Admin Panel (controllo totale)
- ✅ Cliente = Form POS (solo contenuti)
- ❌ Cliente NON vede mai Strapi
- ❌ Cliente NON può modificare layout

---

### 4. **Hosting & Infrastructure**

| Componente | Soluzione | Costo |
|------------|-----------|-------|
| **Strapi CMS** | Railway.app | $0-10/mese |
| **PostgreSQL** | Railway (incluso) | $0 |
| **Frontend Next.js** | Vercel (esistente) | $0 |
| **Media/Immagini** | Strapi Media Library | $0-1/mese |
| **SSL Certificati** | Vercel (auto) | $0 |
| **Supabase** | Esistente | $0 |

**Totale**: $0-11/mese (vs $99-299/mese SaaS alternative)

**Scale Path**:
- 1-20 org: $0/mese (Railway free tier)
- 20-100 org: $10/mese
- 100-500 org: $20/mese
- 500+ org: $50-100/mese o VPS dedicato

---

### 5. **Localizzazione: Italiano First**

**Strapi Admin**:
```javascript
// config/admin.js
locales: ['it'],
defaultLocale: 'it'
```

**Contenuti Multilingua**:
```javascript
// config/plugins.js
i18n: {
  enabled: true,
  locales: ['it', 'en', 'de', 'fr'],
  defaultLocale: 'it'
}
```

**POS Interface**: 100% italiano
- Form in italiano
- Messaggi in italiano  
- Notifiche in italiano

---

## 🏗️ STACK TECNOLOGICO COMPLETO

```
┌─────────────────────────────────────────────────┐
│         STRAPI CMS (Railway.app)                │
│  cms.omnilypro.com (interno, opzionale)         │
│                                                 │
│  • PostgreSQL database                          │
│  • Admin Panel (solo admin)                     │
│  • API REST/GraphQL                             │
│  • Media Library                                │
│  • i18n multilingua                             │
│  • Roles & Permissions                          │
└──────────────────┬──────────────────────────────┘
                   │ API
                   ↓
┌─────────────────────────────────────────────────┐
│       NEXT.JS FRONTEND (Vercel)                 │
│  omnilypro.com + *.omnilypro.com                │
│                                                 │
│  • Middleware (subdomain routing)               │
│  • Admin Panel (assegna siti)                   │
│  • POS Interface (form touch)                   │
│  • Public Sites (SSR rendering)                 │
│  • SEO optimization                             │
└──────────────────┬──────────────────────────────┘
                   │ Auth
                   ↓
┌─────────────────────────────────────────────────┐
│       SUPABASE (esistente)                      │
│                                                 │
│  • Auth (users, organizations)                  │
│  • Loyalty program                              │
│  • CRM (customers, campaigns)                   │
│  • Email marketing                              │
│  • Transactions                                 │
└─────────────────────────────────────────────────┘
```

**Integrazione**:
- Strapi = solo website content (separato)
- Supabase = tutto il resto (auth, loyalty, CRM, email)
- Next.js = orchestratore (chiama entrambi)

---

## 📊 WORKFLOW COMPLETO

### **1. Admin Crea Template**

```
Strapi Admin Panel
  ↓ Crea Content Type "Website Template"
  ↓ Define Dynamic Zones (Hero, Menu, Gallery, ecc.)
  ↓ Schema campi editabili (JSON)
  ↓ Upload anteprima template
  ↓ Pubblica template
  
✅ Template disponibile per assegnazione
```

### **2. Admin Assegna Sito a Organizzazione**

```
Omnily Admin Panel
  ↓ Seleziona organizzazione da Supabase
  ↓ Sceglie template da Strapi
  ↓ Genera subdomain (auto da nome org)
  ↓ Pre-compila contenuti (logo, indirizzo, tel, colori)
  ↓ Crea sito via API Strapi
  
✅ Sito creato, cliente può editare
```

### **3. Cliente Edita dal POS**

```
POS Dashboard > "Il Mio Sito Web"
  ↓ Vede info sito (URL, visite, lead)
  ↓ Form touch-friendly per contenuti
  ↓ Upload immagini da camera/gallery Android
  ↓ Modifica testi, prodotti, orari
  ↓ Preview real-time
  ↓ Salva bozza / Pubblica
  
✅ Modifiche live su subdomain.omnilypro.com
```

### **4. Pubblico Visita Sito**

```
Browser → pizzerianapoli.omnilypro.com
  ↓
Vercel Next.js
  ↓ Middleware legge subdomain
  ↓ Fetch contenuto da Strapi API
  ↓ Renderizza template React
  ↓ SEO optimization (meta tags)
  
✅ Sito live, veloce, SEO-friendly
```

---

## ⏱️ TIMELINE SVILUPPO

| Fase | Durata | Dettaglio |
|------|--------|-----------|
| **Setup Strapi** | 2h | Install, config, Railway deploy |
| **Content Types** | 1h | Template + Website schema |
| **API Integration** | 2h | Next.js ↔ Strapi fetch/update |
| **Admin Panel** | 3h | Assegna sito, genera subdomain |
| **POS Interface** | 4h | Form touch, upload immagini |
| **Middleware Routing** | 1h | Subdomain → dynamic pages |
| **Template #1** | 3h | Restaurant Classic (React) |
| **Public Rendering** | 2h | SSR, SEO, performance |
| **Testing** | 2h | QA completo |
| **TOTALE** | **20h** | **2.5 giorni lavorativi** |

**vs Costruire CMS custom**: 3-4 settimane (120-160 ore)

**Risparmio**: 100-140 ore di sviluppo

---

## 🎨 PRIMI TEMPLATE DA CREARE

### **1. Restaurant Classic** (Priority 1)
- Hero fullscreen + menu tabs + gallery + contatti
- Per: ristoranti, pizzerie, trattorie

### **2. Cafe Modern** (Priority 2)
- Layout Instagram-style + prodotti grid + orari
- Per: bar, caffetterie, pasticcerie

### **3. Retail Shop** (Priority 3)
- E-commerce style + catalogo prodotti + categorie
- Per: negozi, boutique, artigiani

### **4. Beauty Salon** (Priority 4)
- Servizi + team + booking + gallery
- Per: parrucchieri, centri estetici, spa

### **5. Corporate/Services** (Priority 5)
- Minimal + portfolio + team + CTA
- Per: studi professionali, consulenti

---

## 📝 PROSSIMI PASSI

### **Immediate** (oggi/domani):
1. ✅ ROADMAPSITE.md aggiornato con decisioni
2. ✅ Documento decisioni architetturali (questo file)
3. [ ] Setup Strapi progetto locale
4. [ ] Deploy Strapi su Railway
5. [ ] Configurare Content Types base

### **Settimana 1**:
- [ ] Integrazione API Strapi in Next.js
- [ ] Admin panel (assegna sito)
- [ ] POS interface (form base)
- [ ] Middleware subdomain routing

### **Settimana 2**:
- [ ] Template Restaurant Classic
- [ ] Public rendering + SEO
- [ ] Testing con 2-3 organizzazioni test
- [ ] Documentazione cliente

### **Settimana 3**:
- [ ] Template Cafe Modern
- [ ] Template Retail Shop
- [ ] Analytics integration
- [ ] Deploy production

---

## ✅ APPROVAZIONI

- [x] CMS: Strapi (vs custom build)
- [x] Hosting: Railway.app (vs altre alternative)
- [x] Domini: Subdomain system (vs path-based)
- [x] Architettura: Admin crea, Cliente edita solo contenuti
- [x] Localizzazione: Italiano first con i18n
- [x] Timeline: 2.5 giorni (vs 3-4 settimane custom)

**Status**: ✅ **PRONTO PER SVILUPPO**

---

## 📚 RIFERIMENTI

- **ROADMAPSITE.md**: Specifica completa (1800+ righe)
- **Strapi Docs**: https://docs.strapi.io
- **Railway Deploy**: https://docs.railway.app
- **Next.js Middleware**: https://nextjs.org/docs/middleware
- **Vercel Wildcard Domains**: https://vercel.com/docs/custom-domains

---

**Ultimo aggiornamento**: 14 Ottobre 2025  
**Prossima revisione**: Al completamento Fase 1 (Setup Strapi)
