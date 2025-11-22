# 🎟️ Sistema Lotteria OmnilyPRO - Guida Setup

## 📋 Panoramica

Ho implementato un sistema completo di lotteria integrato in OmnilyPRO con:
- ✅ Database completo (eventi, biglietti, estrazioni)
- ✅ Servizio TypeScript per tutte le operazioni
- ✅ Biglietto termico stampabile (58mm/80mm)
- ✅ Display gigante con animazione cinematica (identica a lottogenius)
- ✅ Modal POS per vendita biglietti

## 🗂️ File Creati

### 1. Database Migration
**File:** `database/migrations/070_create_lottery_system.sql`

**Tabelle:**
- `lottery_events` - Eventi lotteria
- `lottery_tickets` - Biglietti venduti
- `lottery_extractions` - Storico estrazioni

**Funzionalità:**
- Generazione automatica numeri biglietto (formato: `XXX-XXX`)
- RLS policies per multi-tenant
- Trigger per aggiornamento automatico statistiche
- Colori brand personalizzabili per organizzazione

### 2. Servizio Lottery
**File:** `src/services/lotteryService.ts`

**Operazioni:**
- CRUD eventi lotteria
- Creazione e vendita biglietti
- Algoritmo estrazione vincitore
- Validazione QR code
- Generatore messaggi fortuna
- Gestione premi

### 3. Biglietto Termico
**File:** `src/components/LotteryThermalTicket.tsx`

**Caratteristiche:**
- Design verticale per stampanti 58mm/80mm
- Bianco e nero (compatibile stampanti termiche)
- QR code per validazione
- Sezione talloncino staccabile
- Hook `usePrintLotteryTicket()` per stampa diretta

### 4. Display Estrazione Gigante
**Files:**
- `src/components/LotteryExtractionDisplay.tsx`
- `src/components/LotteryExtractionDisplay.css`

**Animazioni Cinematiche:**
1. **Countdown** - Conto alla rovescia 3-2-1
2. **Spinning** - Rotazione veloce numeri
3. **Slowing** - Decelerazione progressiva
4. **Tease** - Stop su numero sbagliato (suspense!)
5. **Locked** - Blocco su numero vincitore
6. **Celebrating** - Celebrazione con confetti

**Personalizzazione:**
- Colori brand dall'evento
- Statistiche in tempo reale
- Animazioni fluide e professionali
- Schermo intero per display gigante

### 5. Modal Vendita POS
**Files:**
- `src/components/POS/LotteryTicketSaleModal.tsx`
- `src/components/POS/LotteryTicketSaleModal.css`

**Funzionalità:**
- Selezione evento attivo
- Form dati cliente (nome, email, telefono)
- Anteprima info evento e premio
- Vendita biglietto + stampa automatica
- Stato successo con info biglietto

## 🚀 Prossimi Step

### Step 1: Esegui Migration Database ✅
1. Vai su Supabase Dashboard
2. SQL Editor → New Query
3. Copia/incolla il contenuto di `database/migrations/070_create_lottery_system.sql`
4. Esegui la query

### Step 2: Installa Dipendenze NPM
```bash
npm install qrcode
npm install --save-dev @types/qrcode
```

### Step 3: Integra Modal nel POS

Nel file che gestisce il POS (es. `POSLayout.tsx` o simile), aggiungi:

```tsx
import { LotteryTicketSaleModal } from './POS/LotteryTicketSaleModal'

// Nello state
const [lotteryModalOpen, setLotteryModalOpen] = useState(false)

// Nel JSX
<LotteryTicketSaleModal
  isOpen={lotteryModalOpen}
  onClose={() => setLotteryModalOpen(false)}
  organizationId={currentOrganization.id}
  staffId={currentUser?.id}
  staffName={currentUser?.full_name}
  onTicketSold={(ticket) => {
    console.log('Biglietto venduto:', ticket)
    // Opzionale: aggiorna display, registra vendita, ecc.
  }}
/>

// Pulsante per aprire modal
<button onClick={() => setLotteryModalOpen(true)}>
  <Ticket /> Vendi Biglietto Lotteria
</button>
```

### Step 4: Crea Pagina Display Estrazione

Crea una nuova route per il display gigante:

```tsx
// src/pages/LotteryDisplayPage.tsx
import { LotteryExtractionFullPage } from '../components/LotteryExtractionDisplay'

export const LotteryDisplayPage = () => {
  // Prendi eventId da URL params
  const { eventId } = useParams()

  return <LotteryExtractionFullPage eventId={eventId} />
}

// Aggiungi route in App.tsx o router
<Route path="/lottery/display/:eventId" element={<LotteryDisplayPage />} />
```

### Step 5: Dashboard Gestione Lotterie (TODO)

Crea una pagina dashboard per:
- ✅ Creare nuovi eventi lotteria
- ✅ Gestire eventi esistenti (attivare, chiudere)
- ✅ Visualizzare biglietti venduti
- ✅ Eseguire estrazione
- ✅ Gestire vincitori e premi

### Step 6: Comunicazione POS → Display Gigante (TODO)

Usa Supabase Realtime per controllare il display dal POS:

```tsx
// Nel POS - invia comando
await supabase
  .from('lottery_extraction_commands')
  .insert({
    event_id: eventId,
    command: 'START_EXTRACTION',
    timestamp: new Date().toISOString()
  })

// Nel Display - ascolta comandi
supabase
  .channel('lottery_commands')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'lottery_extraction_commands'
  }, (payload) => {
    if (payload.new.command === 'START_EXTRACTION') {
      runLotterySequence()
    }
  })
  .subscribe()
```

## 🎨 Design & UX

### Biglietto Termico
- **Formato:** Verticale, lunghezza illimitata
- **Colori:** Bianco/Nero (stampante termica)
- **Elementi:**
  - Nome evento (in alto)
  - Numero biglietto GRANDE e ben visibile
  - Nome cliente
  - Messaggio fortuna
  - Info premio
  - Data estrazione
  - QR code per validazione
  - Talloncino staccabile

### Display Gigante
- **Colori:** Brand personalizzati dall'evento
- **Animazioni:** Identiche a lottogenius
- **Fasi:** Countdown → Spin → Tease → Winner → Celebration
- **Effetti:** Confetti, spotlight, blur, scale, pulsazioni

### Modal POS
- **Style:** Sistema Referral OmnilyPRO
- **Colori:** Dinamici basati su evento
- **UX:** Form veloce, stampa automatica
- **Feedback:** Success state con info biglietto

## 💡 Funzionalità Chiave

### QR Code Validation
Ogni biglietto ha un QR code unico:
```
LOTTERY:{event_id}:{ticket_number}
```

Puoi usarlo per:
- Validare biglietti all'ingresso
- Verificare vincitori
- Tracking partecipanti

### Messaggi Fortuna
Generati automaticamente in italiano:
- "La fortuna ti sorride!"
- "Oggi è il tuo giorno fortunato!"
- "Le stelle sono dalla tua parte!"
- ... e altri 7 messaggi!

### Estrazione Algoritmo
```typescript
// Random selection from available (non-winner) tickets
const availableTickets = tickets.filter(t => !t.is_winner)
const randomIndex = Math.floor(Math.random() * availableTickets.length)
const winner = availableTickets[randomIndex]
```

## 🎯 Caso d'Uso Finale

1. **Preparazione Evento**
   - Admin crea evento lotteria dalla dashboard
   - Imposta: nome, data estrazione, prezzo biglietto, premio, colori brand

2. **Giorno Evento**
   - Cliente acquista prodotti/assaggi nuovi
   - Staff vende biglietto lotteria dal POS
   - Biglietto stampato immediatamente su termica
   - Cliente conserva biglietto

3. **Estrazione Live**
   - PC collegato a schermo gigante nel negozio
   - Apre `/lottery/display/{eventId}` in fullscreen
   - Dal POS: trigger estrazione
   - Display: animazione cinematica con countdown, spin, suspense
   - Vincitore annunciato con effetti speciali!

4. **Premiazione**
   - Cliente mostra biglietto vincitore
   - Staff scansiona QR code per validare
   - Premio consegnato
   - Sistema segna premio come reclamato

## 📱 Compatibilità

- ✅ Stampanti termiche 58mm/80mm
- ✅ Tablet POS (Android/iOS)
- ✅ Display giganti (qualsiasi risoluzione)
- ✅ Multi-tenant (ogni organizzazione ha proprie lotterie)
- ✅ Responsive (mobile, tablet, desktop, giant screen)

## 🔐 Sicurezza

- ✅ Row Level Security (RLS) per multi-tenant
- ✅ Solo staff autorizzato può vendere biglietti
- ✅ Solo admin può creare/gestire eventi
- ✅ QR code univoci per validazione
- ✅ Storico completo di tutte le operazioni

## 🎨 Colori Brand

Ogni evento può avere colori personalizzati:
```typescript
brand_colors: {
  primary: '#e74c3c',    // Colore principale
  secondary: '#c0392b',  // Colore secondario
  accent: '#f39c12'      // Colore accent (premi, highlights)
}
```

Questi colori sono usati nel:
- Display gigante (gradienti, spotlight, UI)
- Modal vendita POS (header, buttons)
- Success states

## 📊 Statistiche Evento

Automaticamente tracciate:
- `total_tickets_sold` - Biglietti venduti
- `total_revenue` - Incasso totale
- Vincitori ed estrazioni (con timestamp)
- Premi reclamati/non reclamati

---

## ✨ Pronto per il Test!

Una volta completati gli step 1-4, il sistema è pronto per essere testato:

1. Esegui migration
2. Installa `qrcode`
3. Integra modal nel POS
4. Crea route display
5. Testa vendita biglietto
6. Testa animazione estrazione

**Buona fortuna con il tuo sistema lotteria! 🎰🍀**
