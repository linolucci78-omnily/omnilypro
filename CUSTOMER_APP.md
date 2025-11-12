# 📱 OMNILY PRO - CUSTOMER APP SPECIFICATION

**Versione:** 1.0
**Data:** 11 Novembre 2025
**Tipo:** PWA (Progressive Web App) → Convertibile in React Native

---

## 🎯 OBIETTIVO

Creare una **Progressive Web App white-label** per i clienti finali che permetta di:
- Vedere e gestire i propri punti fedeltà
- Visualizzare e riscattare premi
- Utilizzare tessera virtuale per identificazione al POS
- Accedere a tutte le funzionalità customer (referral, gift, subscriptions, ecc.)
- Esperienza completamente brandizzata per ogni merchant

---

## ✅ DECISIONI ARCHITETTURALI

### 1. Tecnologia
- **Framework:** React + TypeScript + Vite
- **Backend:** Supabase (stesso del merchant dashboard)
- **Routing:** React Router v6
- **State Management:** React Context + Hooks
- **Styling:** CSS puro con CSS Variables per branding dinamico
- **PWA:** Vite-plugin-PWA per service worker e manifest

### 2. Autenticazione
- **Metodo:** Email + Password (classico)
- **Provider:** Supabase Auth
- **Features:**
  - Login
  - Register
  - Password Reset via email
  - Session management con localStorage

### 3. URL Strategy
- **Formato:** `app.omnilypro.com/{organization-slug}`
- **Esempi:**
  - `app.omnilypro.com/pizzeria-rossi`
  - `app.omnilypro.com/bar-centrale`
- **Loading:** Organization data caricati da slug nel path
- **Fallback:** Se slug non trovato → pagina errore

### 4. Design
- **Target:** Mobile-only (320px - 480px)
- **Orientation:** Portrait
- **Se aperto da desktop:** Layout mobile centrato (max-width 480px)
- **Bottom Navigation:** 4 tab fisse

### 5. Branding Dinamico
- **CSS Variables globali applicati all'avvio:**
  ```css
  :root {
    --primary: #dc2626;           /* da organization.primary_color */
    --secondary: #ef4444;         /* da organization.secondary_color */
    --logo-url: url('...');       /* da organization.logo_url */
  }
  ```
- **Componenti:** Tutti usano `var(--primary)` e `var(--secondary)`
- **Logo:** Mostrato in header con URL dinamico

### 6. Identificazione Cliente al POS - Strategia NFC/QR

#### ⚠️ LIMITAZIONE PWA
Le **Progressive Web Apps NON possono emulare carte NFC**. Solo app native hanno accesso all'HCE (Host Card Emulation).

#### 🎯 ROADMAP IDENTIFICAZIONE

**V1 - QR CODE (PWA)** ✅ Implementiamo Subito
```
Cliente → Apre app → Tab "Card" → Mostra QR Code → Operatore scansiona
```
- ✅ Funziona con PWA
- ✅ Tutti i dispositivi
- ✅ Offline ready (QR statico)
- ✅ Zero costi aggiuntivi
- ✅ Implementazione: 1 giorno

**V1.1 - WALLET PASS (Opzionale)** 📱 Dopo primi utenti
```
Cliente → "Aggiungi a Wallet" → Pass salvato → Tap & Go (se supportato)
```
- ✅ Esperienza migliorata
- ✅ NFC tap & go (dove supportato)
- ✅ Implementabile da PWA
- 💰 Costo: $99/anno Apple Developer (stesso account app future)
- ⏱️ Implementazione: 3-4 giorni

**V2 - APP NATIVA + NFC** 🚀 Quando abbiamo revenue
```
App nativa → NFC emulation → Tap & Go nativo → Zero friction
```
- ✅ Esperienza premium
- ✅ NFC nativo Android (HCE)
- ✅ Apple Wallet integration iOS
- 💰 Costo: Conversione PWA → React Native
- ⏱️ Implementazione: 2-3 settimane

#### 🔧 IMPLEMENTAZIONE V1 (QR Code)

**QR Code Content:**
```json
{
  "customer_id": "uuid",
  "organization_id": "uuid",
  "type": "customer_card",
  "timestamp": "2024-11-11T10:30:00Z"
}
```

**Flow al POS:**
1. Cliente apre app → Tab "Card"
2. Mostra QR code (grande e ben visibile)
3. Operatore scansiona con lettore POS
4. Sistema identifica customer automaticamente
5. Transazione completata (punti aggiunti/premio riscattato)

---

## 📱 STRUTTURA APP

### Navigation Architecture

```
┌─────────────────────────────────┐
│         TOP HEADER              │  ← Logo + Nome org (fisso)
│─────────────────────────────────│
│                                 │
│                                 │
│         CONTENT AREA            │  ← Cambia in base al tab
│         (scrollable)            │
│                                 │
│                                 │
│─────────────────────────────────│
│  [🏠]    [💳]    [🎁]    [👤]  │  ← Bottom Nav (fisso)
│  Home    Card   Premi  Profilo  │
└─────────────────────────────────┘
```

### Route Structure

```
/login                          → Login page (no auth)
/register                       → Register page (no auth)
/forgot-password                → Password reset (no auth)

/                               → Home (Dashboard)
/card                           → Virtual Card
/rewards                        → Rewards Catalog
/rewards/:id                    → Reward Detail
/redeem/:id                     → Redeem Confirmation
/profile                        → Profile

/activity                       → Activity History (da Profile)
/referral                       → Referral Hub (da Profile)
/gift-certificates              → Gift Certificates (da Profile)
/membership                     → Membership/Subscriptions (da Profile)
/notifications                  → Notifications Center (da Profile)
/settings                       → Settings (da Profile)
```

---

## 📄 PAGINE DETTAGLIATE

### 🔐 **LOGIN PAGE**

```
┌─────────────────────────────────┐
│                                 │
│    [LOGO ORGANIZATION]          │
│                                 │
│    Pizzeria Rossi               │  ← Nome dynamico
│    La tua carta fedeltà         │
│                                 │
│  ═══════════════════════════    │
│                                 │
│  📧 Email                       │
│  [___________________]          │
│                                 │
│  🔒 Password                    │
│  [___________________]          │
│                                 │
│  [  ACCEDI  ]                   │  ← Bottone con --primary
│                                 │
│  Password dimenticata?          │
│                                 │
│  ─────────────────────          │
│                                 │
│  Non hai un account?            │
│  [REGISTRATI]                   │
│                                 │
└─────────────────────────────────┘
```

**Features:**
- Logo e nome organization caricati da slug nell'URL
- Colori primario/secondario per bottoni e accenti
- Form validation real-time
- Error messages
- Loading state durante login
- Redirect a Home dopo login success

---

### 🏠 **HOME (Dashboard)**

```
┌─────────────────────────────────┐
│  🍕 Pizzeria Rossi         [🔔] │  ← Header con notif badge
│  ════════════════════════════   │
│                                 │
│  Ciao Mario! 👋                │  ← Nome customer
│                                 │
│  ════════════════════════════   │
│  💎 I TUOI PUNTI                │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │       450 punti         │   │  ← Grande e visibile
│  │                         │   │
│  │  ▓▓▓▓▓▓▓░░░░░ 70%      │   │  ← Progress bar
│  │                         │   │
│  │  🏆 Livello Gold        │   │  ← Current tier
│  │  Mancano 150 per VIP    │   │  ← Next tier
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  ════════════════════════════   │
│  📊 ATTIVITÀ RECENTE            │
│  ┌─────────────────────────┐   │
│  │ +50 punti               │   │
│  │ Acquisto • Oggi 15:30   │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ -300 punti              │   │
│  │ Riscattato: Pizza       │   │
│  │ Ieri • 19:45            │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ +30 punti               │   │
│  │ Acquisto • 3 giorni fa  │   │
│  └─────────────────────────┘   │
│                                 │
│  [Vedi tutto lo storico →]     │
│                                 │
│  ════════════════════════════   │
│  🎁 PREMI DISPONIBILI           │
│  ┌───────┬─────────────────┐   │
│  │ [IMG] │ Pizza Margherita│   │
│  │       │ 300 punti       │   │
│  │       │ [Riscatta]      │   │
│  └───────┴─────────────────┘   │
│  ┌───────┬─────────────────┐   │
│  │ [IMG] │ Caffè Omaggio   │   │
│  │       │ 100 punti       │   │
│  │       │ [Riscatta]      │   │
│  └───────┴─────────────────┘   │
│                                 │
│  [Vedi tutti i premi →]        │
│                                 │
└─────────────────────────────────┘
  [🏠]    [💳]    [🎁]    [👤]
  Home    Card   Premi  Profilo
```

**Data Sources:**
- `customers` table → Nome, punti totali
- `loyalty_tiers` → Tier corrente, progress, next tier
- `customer_activities` → Ultime 3 transazioni
- `rewards` → Top 2-3 premi disponibili

**Features:**
- Greeting personalizzato con nome
- Punti in formato grande e leggibile
- Progress bar animata verso next tier
- Quick actions verso premi popolari
- Badge notifiche in header

---

### 💳 **CARD (Tessera Virtuale)**

```
┌─────────────────────────────────┐
│  🍕 Pizzeria Rossi         [🔔] │
│  ════════════════════════════   │
│                                 │
│  LA MIA TESSERA                 │
│                                 │
│  ════════════════════════════   │
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │  🍕 Pizzeria Rossi      │   │  ← Logo merchant
│  │                         │   │
│  │                         │   │
│  │   ╔═══════════════╗     │   │
│  │   ║  [QR CODE]    ║     │   │  ← QR grande
│  │   ║               ║     │   │
│  │   ║   SCANSIONA   ║     │   │
│  │   ╚═══════════════╝     │   │
│  │                         │   │
│  │  Mario Rossi            │   │  ← Nome
│  │  450 punti • Gold       │   │  ← Punti + Tier
│  │                         │   │
│  │  #OML-12345             │   │  ← Customer ID
│  │                         │   │
│  │  Member since 01/2024   │   │  ← Data iscrizione
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  ════════════════════════════   │
│                                 │
│  💡 COME USARE LA TESSERA       │
│                                 │
│  1. Mostra questo QR al         │
│     cassiere prima di pagare    │
│                                 │
│  2. Il cassiere scannerà il     │
│     codice per identificarti    │
│                                 │
│  3. Accumuli punti o riscatti   │
│     premi automaticamente       │
│                                 │
│  ════════════════════════════   │
│                                 │
│  📱 AGGIUNGI A WALLET           │
│                                 │
│  [🍎 Aggiungi a Apple Wallet]  │
│                                 │
│  [📱 Aggiungi a Google Pay]    │
│                                 │
└─────────────────────────────────┘
  [🏠]    [💳]    [🎁]    [👤]
  Home    Card   Premi  Profilo
```

**QR Code Content:**
```json
{
  "customer_id": "uuid",
  "organization_id": "uuid",
  "type": "customer_card"
}
```

**Data Sources:**
- `customers` → ID, nome, punti, tier, created_at
- `organizations` → Logo, nome

**Features:**
- QR code generato con `qrcode.react`
- Design simile a carta fisica
- Istruzioni chiare d'uso
- Wallet integration buttons (per futuro)
- Possibilità di screenshot per uso offline

---

### 🎁 **PREMI (Catalogo)**

```
┌─────────────────────────────────┐
│  🍕 Pizzeria Rossi         [🔔] │
│  ════════════════════════════   │
│                                 │
│  CATALOGO PREMI                 │
│                                 │
│  [🔍 Cerca premi...]            │
│                                 │
│  [Tutti ▼] [Categoria ▼] [⚙️]  │  ← Filtri
│                                 │
│  ════════════════════════════   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  [IMMAGINE PREMIO]      │   │
│  │                         │   │
│  │  🍕 PIZZA MARGHERITA    │   │
│  │                         │   │
│  │  Una deliziosa pizza    │   │
│  │  margherita gratis      │   │
│  │                         │   │
│  │  💰 Gratis              │   │
│  │  🏆 300 punti           │   │
│  │  ✅ Hai 450 punti       │   │  ← Feedback se può
│  │                         │   │
│  │  [Riscatta Premio]      │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  [IMMAGINE PREMIO]      │   │
│  │                         │   │
│  │  ☕ CAFFÈ OMAGGIO       │   │
│  │                         │   │
│  │  Un caffè della casa    │   │
│  │                         │   │
│  │  💰 Gratis              │   │
│  │  🏆 100 punti           │   │
│  │  ✅ Hai 450 punti       │   │
│  │                         │   │
│  │  [Riscatta Premio]      │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  [IMMAGINE PREMIO]      │   │
│  │                         │   │
│  │  🎂 TORTA COMPLEANNO    │   │
│  │                         │   │
│  │  Torta per il tuo       │   │
│  │  compleanno             │   │
│  │                         │   │
│  │  💰 Sconto 50%          │   │
│  │  🏆 500 punti           │   │
│  │  ⚠️ Ti mancano 50 punti │   │  ← Feedback se non può
│  │                         │   │
│  │  [Non disponibile]      │   │
│  └─────────────────────────┘   │
│                                 │
│  ════════════════════════════   │
│                                 │
│  🎫 I MIEI VOUCHER ATTIVI (2)   │
│  [Vedi i voucher riscattati →] │
│                                 │
└─────────────────────────────────┘
  [🏠]    [💳]    [🎁]    [👤]
  Home    Card   Premi  Profilo
```

**Data Sources:**
- `rewards` table → Lista premi con filtri
- `customers` → Punti attuali per confronto
- `reward_redemptions` → Voucher attivi

**Features:**
- Search bar per cercare premi
- Filtri per categoria e tipo
- Card premi con immagine
- Feedback visivo se può riscattare (verde) o no (grigio)
- Calcolo automatico punti mancanti
- Link a voucher già riscattati

---

### 🎁 **DETTAGLIO PREMIO**

```
┌─────────────────────────────────┐
│  [← Indietro]              [🔔] │
│  ════════════════════════════   │
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │   [IMMAGINE GRANDE]     │   │  ← Hero image
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  🍕 PIZZA MARGHERITA            │
│                                 │
│  ════════════════════════════   │
│                                 │
│  💎 COSTO: 300 punti            │
│  ✅ Hai 450 punti disponibili   │
│                                 │
│  ════════════════════════════   │
│                                 │
│  📝 DESCRIZIONE                 │
│                                 │
│  Una deliziosa pizza            │
│  margherita con pomodoro        │
│  fresco, mozzarella di          │
│  bufala e basilico.             │
│                                 │
│  ════════════════════════════   │
│                                 │
│  📋 COME FUNZIONA               │
│                                 │
│  • Riscatta questo premio       │
│  • Ricevi un voucher con QR     │
│  • Mostra il QR al cassiere     │
│  • Ritira la tua pizza          │
│                                 │
│  ════════════════════════════   │
│                                 │
│  ⚠️ TERMINI E CONDIZIONI        │
│                                 │
│  • Valido 30 giorni             │
│  • Non cumulabile               │
│  • Non rimborsabile             │
│                                 │
│  ════════════════════════════   │
│                                 │
│  [   RISCATTA PREMIO   ]        │  ← Bottone grande
│                                 │
└─────────────────────────────────┘
```

**Flow:**
1. User clicca su premio dal catalogo
2. Vede dettaglio completo
3. Clicca "Riscatta Premio"
4. Modale di conferma
5. Redirect a voucher page

---

### 🎫 **CONFERMA RISCATTO (Voucher)**

```
┌─────────────────────────────────┐
│  [✕ Chiudi]                     │
│  ════════════════════════════   │
│                                 │
│  ✅ PREMIO RISCATTATO!          │
│                                 │
│  ════════════════════════════   │
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │  🍕 Pizza Margherita    │   │
│  │                         │   │
│  │   ╔═══════════════╗     │   │
│  │   ║  [QR CODE]    ║     │   │  ← QR del voucher
│  │   ║               ║     │   │
│  │   ║   VOUCHER     ║     │   │
│  │   ╚═══════════════╝     │   │
│  │                         │   │
│  │  Codice: VOC-12345      │   │  ← Codice backup
│  │                         │   │
│  │  📅 Valido fino al      │   │
│  │     15 Dicembre 2024    │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  ════════════════════════════   │
│                                 │
│  💡 COME USARE IL VOUCHER       │
│                                 │
│  1. Mostra questo QR al         │
│     cassiere                    │
│                                 │
│  2. Il cassiere scannerà e      │
│     validerà il voucher         │
│                                 │
│  3. Ritira il tuo premio!       │
│                                 │
│  ⚠️ Attenzione:                 │
│  Il voucher può essere usato    │
│  una sola volta                 │
│                                 │
│  ════════════════════════════   │
│                                 │
│  [📥 Salva in Wallet]           │
│                                 │
│  [🏠 Torna alla Home]           │
│                                 │
└─────────────────────────────────┘
```

**QR Code Content:**
```json
{
  "voucher_id": "uuid",
  "reward_id": "uuid",
  "customer_id": "uuid",
  "organization_id": "uuid",
  "code": "VOC-12345",
  "expires_at": "2024-12-15T23:59:59Z",
  "type": "reward_voucher"
}
```

**Data Sources:**
- `reward_redemptions` → Nuovo record creato
- Update `customers.loyalty_points` → Sottrae punti

**Features:**
- QR code del voucher
- Codice alfanumerico backup
- Scadenza chiara
- Istruzioni d'uso
- Possibilità di salvare

---

### 👤 **PROFILO**

```
┌─────────────────────────────────┐
│  🍕 Pizzeria Rossi         [🔔] │
│  ════════════════════════════   │
│                                 │
│  IL MIO PROFILO                 │
│                                 │
│  ┌─────────────────────────┐   │
│  │  [👤]                   │   │  ← Avatar
│  │                         │   │
│  │  Mario Rossi            │   │
│  │  mario.rossi@email.com  │   │
│  │  +39 333 1234567        │   │
│  │                         │   │
│  │  [Modifica Profilo]     │   │
│  └─────────────────────────┘   │
│                                 │
│  ════════════════════════════   │
│                                 │
│  📊 STORICO ATTIVITÀ            │
│     Vedi tutte le tue           │
│     transazioni e attività      │
│     [Vai allo storico →]        │
│                                 │
│  ════════════════════════════   │
│                                 │
│  🤝 SISTEMA REFERRAL            │
│     Il tuo codice: MARIO50      │
│     Amici invitati: 3           │
│     Bonus guadagnati: 150 pt    │
│     [Condividi il tuo codice →] │
│                                 │
│  ════════════════════════════   │
│                                 │
│  🎁 GIFT CERTIFICATES           │
│     Gift attivi: 1              │
│     Valore totale: 50€          │
│     [Gestisci i tuoi gift →]    │
│                                 │
│  ════════════════════════════   │
│                                 │
│  💎 MEMBERSHIP                  │
│     Piano: Gold Membership      │
│     Rinnovo: 15 Dicembre 2024   │
│     [Gestisci abbonamento →]    │
│                                 │
│  ════════════════════════════   │
│                                 │
│  🔔 NOTIFICHE                   │
│     Nuove notifiche: 2          │
│     [Vedi tutte →]              │
│                                 │
│  ════════════════════════════   │
│                                 │
│  ⚙️ IMPOSTAZIONI                │
│     Gestisci le preferenze      │
│     dell'account                │
│     [Vai alle impostazioni →]   │
│                                 │
│  ════════════════════════════   │
│                                 │
│  🔒 PRIVACY                     │
│     Gestisci privacy e dati     │
│     [Vai alla privacy →]        │
│                                 │
│  ════════════════════════════   │
│                                 │
│  🚪 LOGOUT                      │
│     [Esci dall'account]         │
│                                 │
└─────────────────────────────────┘
  [🏠]    [💳]    [🎁]    [👤]
  Home    Card   Premi  Profilo
```

**Data Sources:**
- `customers` → Info profilo
- `customer_activities` → Count transazioni
- `referral_codes` → Codice referral, stats
- `gift_certificates` → Gift attivi
- `subscriptions` → Membership attiva
- `notifications` → Count non lette

**Features:**
- Hub centrale per tutte le features extra
- Card linkabili verso pagine dettaglio
- Badge con contatori (es. notifiche, gift)
- Quick stats per ogni sezione

---

### 📊 **STORICO ATTIVITÀ**

```
┌─────────────────────────────────┐
│  [← Profilo]               [🔔] │
│  ════════════════════════════   │
│                                 │
│  STORICO ATTIVITÀ               │
│                                 │
│  [Tutti ▼] [Novembre 2024 ▼]   │  ← Filtri
│                                 │
│  ════════════════════════════   │
│                                 │
│  🗓️ OGGI                        │
│                                 │
│  ┌─────────────────────────┐   │
│  │ +50 punti               │   │
│  │ 💳 Acquisto             │   │
│  │ 15:30 • POS #3          │   │
│  │ Valore: 25€             │   │
│  └─────────────────────────┘   │
│                                 │
│  🗓️ IERI                        │
│                                 │
│  ┌─────────────────────────┐   │
│  │ -300 punti              │   │
│  │ 🎁 Riscatto Premio      │   │
│  │ Pizza Margherita        │   │
│  │ 19:45                   │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ +30 punti               │   │
│  │ 💳 Acquisto             │   │
│  │ 12:15 • POS #1          │   │
│  │ Valore: 15€             │   │
│  └─────────────────────────┘   │
│                                 │
│  🗓️ 3 GIORNI FA                 │
│                                 │
│  ┌─────────────────────────┐   │
│  │ +100 punti              │   │
│  │ 🤝 Bonus Referral       │   │
│  │ Amico iscritto: Luca    │   │
│  │ 16:00                   │   │
│  └─────────────────────────┘   │
│                                 │
│  [Carica altre attività...]     │
│                                 │
│  ════════════════════════════   │
│                                 │
│  📥 ESPORTA STORICO             │
│  [Scarica PDF]                  │
│                                 │
└─────────────────────────────────┘
```

**Data Sources:**
- `customer_activities` → Tutte le transazioni
- Tipi: `points_earned`, `points_spent`, `reward_redeemed`, `referral_bonus`, ecc.

**Features:**
- Lista completa transazioni
- Raggruppate per data
- Filtri per tipo e periodo
- Infinite scroll / pagination
- Export PDF (opzionale V1.1)

---

### 🤝 **REFERRAL HUB**

```
┌─────────────────────────────────┐
│  [← Profilo]               [🔔] │
│  ════════════════════════════   │
│                                 │
│  INVITA AMICI                   │
│                                 │
│  ════════════════════════════   │
│                                 │
│  🎁 COME FUNZIONA               │
│                                 │
│  1. Condividi il tuo codice     │
│  2. L'amico si iscrive          │
│  3. Entrambi ricevete bonus!    │
│                                 │
│  ════════════════════════════   │
│                                 │
│  IL TUO CODICE                  │
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │      MARIO50            │   │  ← Codice grande
│  │                         │   │
│  │  [Copia Codice]         │   │
│  └─────────────────────────┘   │
│                                 │
│  ════════════════════════════   │
│                                 │
│  CONDIVIDI                      │
│                                 │
│  [📱 WhatsApp]                  │
│  [📧 Email]                     │
│  [💬 SMS]                       │
│  [🔗 Copia Link]                │
│                                 │
│  ════════════════════════════   │
│                                 │
│  📊 LE TUE STATISTICHE          │
│                                 │
│  ┌───────┬───────┬───────┐     │
│  │ Amici │ Bonus │ Totale│     │
│  │ invit.│ ricevuti│punti│     │
│  ├───────┼───────┼───────┤     │
│  │   3   │   3   │ +150  │     │
│  └───────┴───────┴───────┘     │
│                                 │
│  ════════════════════════════   │
│                                 │
│  👥 AMICI INVITATI              │
│                                 │
│  ✅ Luca Bianchi                │
│     Iscritto 3 giorni fa        │
│     Bonus: +50 punti            │
│                                 │
│  ✅ Anna Verdi                  │
│     Iscritto 1 settimana fa     │
│     Bonus: +50 punti            │
│                                 │
│  ⏳ Marco Neri                  │
│     Registrato (in attesa)      │
│                                 │
└─────────────────────────────────┘
```

**Data Sources:**
- `referral_codes` → Codice personale, stats
- `customers` → Lista referral tracking

**Features:**
- Codice referral personale
- Condivisione multi-canale
- Stats real-time
- Lista amici invitati
- Bonus tracking

---

### 🎁 **GIFT CERTIFICATES**

```
┌─────────────────────────────────┐
│  [← Profilo]               [🔔] │
│  ════════════════════════════   │
│                                 │
│  I MIEI GIFT CERTIFICATES       │
│                                 │
│  [Attivi] [Usati] [Inviati]    │  ← Tab
│                                 │
│  ════════════════════════════   │
│                                 │
│  💳 GIFT ATTIVI (2)             │
│                                 │
│  ┌─────────────────────────┐   │
│  │  🎁 GIFT CERTIFICATE    │   │
│  │                         │   │
│  │  Valore: 50€            │   │
│  │  Codice: GFT-ABC123     │   │
│  │                         │   │
│  │   ╔═══════════════╗     │   │
│  │   ║  [QR CODE]    ║     │   │
│  │   ╚═══════════════╝     │   │
│  │                         │   │
│  │  Scadenza: 31/12/2024   │   │
│  │  Da: Giovanni R.        │   │
│  │                         │   │
│  │  [Usa Gift] [Dettagli]  │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  🎁 GIFT CERTIFICATE    │   │
│  │                         │   │
│  │  Valore: 25€            │   │
│  │  Codice: GFT-XYZ789     │   │
│  │                         │   │
│  │   ╔═══════════════╗     │   │
│  │   ║  [QR CODE]    ║     │   │
│  │   ╚═══════════════╝     │   │
│  │                         │   │
│  │  Scadenza: 15/01/2025   │   │
│  │  Acquistato da me       │   │
│  │                         │   │
│  │  [Usa Gift] [Invia]     │   │
│  └─────────────────────────┘   │
│                                 │
│  ════════════════════════════   │
│                                 │
│  [+ Acquista Gift Certificate]  │
│                                 │
└─────────────────────────────────┘
```

**Data Sources:**
- `gift_certificates` → Gift ricevuti/acquistati
- Stati: `active`, `used`, `expired`

**Features:**
- Lista gift con QR
- Uso diretto al POS
- Invio gift ad amici
- Acquisto nuovi gift

---

### 💎 **MEMBERSHIP**

```
┌─────────────────────────────────┐
│  [← Profilo]               [🔔] │
│  ════════════════════════════   │
│                                 │
│  LA MIA MEMBERSHIP              │
│                                 │
│  ════════════════════════════   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  👑 GOLD MEMBERSHIP     │   │
│  │                         │   │
│  │  Piano attivo           │   │
│  │  Rinnovo: 15/12/2024    │   │
│  │                         │   │
│  │  9,99€/mese             │   │
│  └─────────────────────────┘   │
│                                 │
│  ════════════════════════════   │
│                                 │
│  ✨ I TUOI VANTAGGI             │
│                                 │
│  ✅ 20% bonus punti             │
│  ✅ Premi esclusivi             │
│  ✅ Priorità assistenza         │
│  ✅ Sconti dedicati             │
│                                 │
│  ════════════════════════════   │
│                                 │
│  📊 STATISTICHE                 │
│                                 │
│  • Membro da: 3 mesi            │
│  • Bonus ricevuti: 245 punti    │
│  • Premi riscattati: 12         │
│  • Risparmio totale: 87€        │
│                                 │
│  ════════════════════════════   │
│                                 │
│  💳 METODO PAGAMENTO            │
│  •••• 1234 Visa                 │
│  [Modifica]                     │
│                                 │
│  ════════════════════════════   │
│                                 │
│  [Modifica Piano]               │
│  [Annulla Abbonamento]          │
│                                 │
└─────────────────────────────────┘
```

**Data Sources:**
- `subscriptions` → Membership attiva
- Benefits e stats

**Features:**
- Dettagli membership
- Lista vantaggi
- Statistiche utilizzo
- Gestione pagamento
- Upgrade/downgrade

---

### 🔔 **NOTIFICHE**

```
┌─────────────────────────────────┐
│  [← Profilo]                    │
│  ════════════════════════════   │
│                                 │
│  NOTIFICHE                      │
│                                 │
│  [Tutte] [Non lette (2)]        │  ← Tab
│                                 │
│  ════════════════════════════   │
│                                 │
│  🗓️ OGGI                        │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🎁 Nuovo Premio!        │   │  ← Non letto
│  │                         │   │
│  │ È disponibile un nuovo  │   │
│  │ premio: Caffè Omaggio   │   │
│  │                         │   │
│  │ 2 ore fa                │   │
│  └─────────────────────────┘   │
│                                 │
│  🗓️ IERI                        │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 💰 Punti Guadagnati     │   │  ← Letto
│  │                         │   │
│  │ Hai guadagnato 50 punti │   │
│  │ con il tuo acquisto!    │   │
│  │                         │   │
│  │ Ieri alle 15:30         │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ ⭐ Congratulazioni!     │   │  ← Non letto
│  │                         │   │
│  │ Sei passato al livello  │   │
│  │ Gold! 🏆                │   │
│  │                         │   │
│  │ Ieri alle 12:00         │   │
│  └─────────────────────────┘   │
│                                 │
│  🗓️ 3 GIORNI FA                 │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🤝 Amico Iscritto       │   │  ← Letto
│  │                         │   │
│  │ Luca si è iscritto con  │   │
│  │ il tuo codice referral! │   │
│  │ Hai guadagnato 50 pt    │   │
│  │                         │   │
│  │ 3 giorni fa             │   │
│  └─────────────────────────┘   │
│                                 │
│  ════════════════════════════   │
│                                 │
│  [Segna tutte come lette]       │
│                                 │
└─────────────────────────────────┘
```

**Data Sources:**
- `notifications` table (da creare)
- Tipi: `new_reward`, `points_earned`, `tier_upgrade`, `referral`, ecc.

**Features:**
- Lista notifiche cronologica
- Badge non lette
- Mark as read
- Raggruppamento per data
- Deep link verso azione

---

## 🗄️ DATABASE

### Tabelle Esistenti (OK per V1)

```sql
-- Customers
customers (
  id,
  organization_id,
  email,
  full_name,
  phone,
  loyalty_points,
  current_tier,
  created_at,
  ...
)

-- Organizations
organizations (
  id,
  slug,              -- per URL routing
  name,
  logo_url,
  primary_color,
  secondary_color,
  ...
)

-- Rewards
rewards (
  id,
  organization_id,
  name,
  description,
  image_url,
  points_required,
  type,
  value,
  is_active,
  ...
)

-- Customer Activities
customer_activities (
  id,
  customer_id,
  organization_id,
  activity_type,
  points_change,
  description,
  created_at,
  ...
)

-- Gift Certificates
gift_certificates (
  id,
  organization_id,
  code,
  value,
  status,
  recipient_email,
  ...
)

-- Subscriptions
subscriptions (
  id,
  customer_id,
  organization_id,
  plan_name,
  status,
  renewal_date,
  ...
)

-- Referral Codes
referral_codes (
  id,
  customer_id,
  code,
  uses_count,
  ...
)
```

### Nuove Tabelle da Creare

```sql
-- Reward Redemptions (Voucher)
CREATE TABLE reward_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  customer_id UUID REFERENCES customers(id),
  reward_id UUID REFERENCES rewards(id),
  voucher_code VARCHAR(20) UNIQUE NOT NULL,
  points_spent INT NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- active, used, expired
  redeemed_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  organization_id UUID REFERENCES organizations(id),
  type VARCHAR(50) NOT NULL, -- new_reward, points_earned, tier_upgrade, etc.
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(500), -- deep link
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_redemptions_customer ON reward_redemptions(customer_id);
CREATE INDEX idx_redemptions_status ON reward_redemptions(status);
CREATE INDEX idx_notifications_customer ON notifications(customer_id);
CREATE INDEX idx_notifications_read ON notifications(customer_id, is_read);
```

---

## 🎨 DESIGN SYSTEM

### Colors (Dinamici da Organization)

```css
:root {
  /* Branding dinamico */
  --primary: #dc2626;           /* organization.primary_color */
  --secondary: #ef4444;         /* organization.secondary_color */

  /* Grays */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;

  /* Semantic */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;

  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}
```

### Typography

```css
/* Headings */
h1 { font-size: 2rem; font-weight: 700; }
h2 { font-size: 1.5rem; font-weight: 600; }
h3 { font-size: 1.25rem; font-weight: 600; }

/* Body */
body { font-size: 1rem; line-height: 1.5; }
small { font-size: 0.875rem; }
```

### Spacing

```css
/* Padding/Margin scale */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
```

### Components

```css
/* Buttons */
.btn-primary {
  background: var(--primary);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
}

/* Cards */
.card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

/* Bottom Nav */
.bottom-nav {
  position: fixed;
  bottom: 0;
  width: 100%;
  max-width: 480px;
  background: white;
  border-top: 1px solid var(--gray-200);
  display: flex;
  justify-content: space-around;
  padding: 0.75rem 0;
}
```

---

## 🚀 TECH STACK

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router v6** - Routing
- **React Context** - State management
- **CSS Modules / Pure CSS** - Styling

### Backend
- **Supabase** - Backend as a Service
  - Auth
  - Database (PostgreSQL)
  - Storage
  - Realtime (per notifiche)

### Libraries
- **qrcode.react** - QR code generation
- **lucide-react** - Icons
- **date-fns** - Date formatting

### PWA
- **vite-plugin-pwa** - Service worker
- **Workbox** - Caching strategies

---

## 📁 FOLDER STRUCTURE

```
/customer-app/
├── public/
│   ├── manifest.json
│   ├── pwa-192x192.png
│   └── pwa-512x512.png
├── src/
│   ├── assets/
│   │   └── icons/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ForgotPassword.tsx
│   │   ├── Layout/
│   │   │   ├── Header.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   └── Container.tsx
│   │   ├── Home/
│   │   │   ├── PointsCard.tsx
│   │   │   ├── RecentActivity.tsx
│   │   │   └── FeaturedRewards.tsx
│   │   ├── Card/
│   │   │   ├── VirtualCard.tsx
│   │   │   └── QRCode.tsx
│   │   ├── Rewards/
│   │   │   ├── RewardsList.tsx
│   │   │   ├── RewardCard.tsx
│   │   │   ├── RewardDetail.tsx
│   │   │   └── VoucherModal.tsx
│   │   ├── Profile/
│   │   │   ├── ProfileHeader.tsx
│   │   │   ├── ProfileMenu.tsx
│   │   │   └── FeatureCard.tsx
│   │   └── UI/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Card.tsx
│   │       └── Loading.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── OrganizationContext.tsx
│   │   └── NotificationContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useBranding.ts
│   │   ├── useCustomer.ts
│   │   └── useRewards.ts
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Home.tsx
│   │   ├── Card.tsx
│   │   ├── Rewards.tsx
│   │   ├── RewardDetail.tsx
│   │   ├── Profile.tsx
│   │   ├── ActivityHistory.tsx
│   │   ├── ReferralHub.tsx
│   │   ├── GiftCertificates.tsx
│   │   ├── Membership.tsx
│   │   └── Notifications.tsx
│   ├── services/
│   │   ├── supabase.ts
│   │   ├── auth.ts
│   │   ├── rewards.ts
│   │   └── notifications.ts
│   ├── types/
│   │   ├── customer.ts
│   │   ├── reward.ts
│   │   └── organization.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   └── validators.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── styles/
│       ├── global.css
│       ├── variables.css
│       └── components.css
├── .env
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🔧 IMPLEMENTAZIONE - ROADMAP

### Phase 1: Setup & Core (Giorno 1-2)
- [x] Setup progetto Vite + React + TS
- [x] Configurazione Supabase
- [ ] OrganizationContext + useBranding hook
- [ ] AuthContext + useAuth hook
- [ ] Layout base (Header + BottomNav + Container)
- [ ] Routing setup

### Phase 2: Autenticazione (Giorno 2-3)
- [ ] Login page
- [ ] Register page
- [ ] Forgot password
- [ ] Protected routes
- [ ] Auth flow completo

### Phase 3: Core Pages (Giorno 3-5)
- [ ] Home (Dashboard)
- [ ] Card (Virtual Card + QR)
- [ ] Rewards (Catalog + Detail)
- [ ] Reward Redemption flow
- [ ] Profile hub

### Phase 4: Extra Features (Giorno 6-7)
- [ ] Activity History
- [ ] Referral System
- [ ] Gift Certificates
- [ ] Membership view
- [ ] Notifications center

### Phase 5: PWA & Polish (Giorno 8)
- [ ] PWA manifest
- [ ] Service worker
- [ ] Install prompt
- [ ] Offline support
- [ ] Testing mobile
- [ ] Bug fixes

### Phase 6: Deploy (Giorno 9)
- [ ] Build ottimizzato
- [ ] Deploy su Vercel/Netlify
- [ ] Test produzione
- [ ] Documentation

---

## 🎯 SUCCESS CRITERIA

### Must Have per V1
- ✅ Login funzionante
- ✅ Dashboard mostra punti e livello
- ✅ Tessera virtuale con QR funzionante
- ✅ Catalogo premi navigabile
- ✅ Riscatto premi genera voucher
- ✅ Branding dinamico per ogni merchant
- ✅ Responsive mobile perfetto
- ✅ PWA installabile

### Nice to Have per V1
- ✅ Storico completo transazioni
- ✅ Sistema referral funzionante
- ✅ Gift certificates view
- ✅ Membership view
- ✅ Notifiche in-app

### Future (V1.1+)
- [ ] Push notifications
- [ ] Wallet integration (Apple/Google)
- [ ] Offline mode avanzato
- [ ] Conversione React Native
- [ ] Deep linking completo

---

## 📝 NOTE FINALI

### Approccio Sviluppo
1. **Mobile-first sempre**
2. **Progressive enhancement**
3. **Testare su device reale** (non solo Chrome DevTools)
4. **Branding dinamico fin da subito** (non hardcodare colori)
5. **Preparare per React Native** (evitare CSS troppo complesso)

### Qualità
- TypeScript strict mode
- Componenti riutilizzabili
- Codice pulito e commentato
- Error handling robusto
- Loading states ovunque

### Performance
- Lazy loading delle route
- Immagini ottimizzate
- Bundle splitting
- Caching intelligente

---

**Pronto per iniziare l'implementazione!** 🚀
