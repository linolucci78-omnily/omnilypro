# 🎟️ Test Sistema Lotteria - Istruzioni Rapide

## ⚠️ PRIMA DI TESTARE

### 1. Esegui la Migration SQL
Vai su Supabase Dashboard → SQL Editor → New Query

Copia e incolla tutto il contenuto di:
`database/migrations/070_create_lottery_system.sql`

Clicca RUN per eseguire la migration.

---

## 🧪 Come Testare

### Opzione A: Dalla Console Browser (PIÙ VELOCE)

1. Apri il POS in modalità dashboard:
   ```
   http://localhost:5173/dashboard?posomnily=true
   ```

2. Apri Console (F12)

3. Esegui:
   ```javascript
   window.openLotteryModal()
   ```

4. Si aprirà il modal vendita biglietti! 🎉

---

### Opzione B: Crea Evento di Test

Prima crea un evento lotteria manualmente da console:

```javascript
// 1. Prendi l'organization ID
const orgId = 'IL-TUO-ORG-ID-QUI'

// 2. Crea evento di test
const { lotteryService } = await import('./src/services/lotteryService')

const event = await lotteryService.createEvent({
  organization_id: orgId,
  name: 'Gran Lotteria Test',
  description: 'Evento di test per la lotteria',
  event_date: new Date().toISOString(),
  extraction_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Domani
  ticket_price: 5.00,
  prize_name: 'iPhone 15 Pro',
  prize_value: 1200.00,
  prize_description: 'Un bellissimo iPhone nuovo di zecca!',
  brand_colors: {
    primary: '#e74c3c',
    secondary: '#c0392b',
    accent: '#f39c12'
  },
  status: 'active'
})

console.log('✅ Evento creato:', event)
```

---

## 🎬 Test Display Estrazione

1. Apri in una nuova tab/finestra (o meglio: schermo gigante!):
   ```
   http://localhost:5173/lottery/display/EVENT-ID-QUI
   ```

2. Dovrebbe:
   - Mostrare countdown 3-2-1
   - Girare i numeri velocemente
   - Rallentare progressivamente
   - Fare tease su numero sbagliato
   - Bloccarsi sul vincitore
   - Celebration con confetti! 🎊

---

## 🖨️ Test Stampa Biglietto

Nel modal vendita, dopo aver venduto un biglietto:
- Verrà stampato automaticamente
- Puoi cliccare "Ristampa" per stampare di nuovo
- Il biglietto è ottimizzato per stampanti termiche 58mm/80mm

---

## 📍 Dove Trovare Tutto

### File Creati:
- ✅ `database/migrations/070_create_lottery_system.sql` - Migration database
- ✅ `src/services/lotteryService.ts` - Servizio API
- ✅ `src/components/LotteryThermalTicket.tsx` - Biglietto stampabile
- ✅ `src/components/LotteryExtractionDisplay.tsx` - Display estrazione
- ✅ `src/components/LotteryExtractionDisplay.css` - Stili animazioni
- ✅ `src/components/POS/LotteryTicketSaleModal.tsx` - Modal vendita
- ✅ `src/components/POS/LotteryTicketSaleModal.css` - Stili modal
- ✅ `src/pages/LotteryDisplayPage.tsx` - Pagina display

### Routes Aggiunte:
- `/lottery/display/:eventId` - Display estrazione fullscreen

### Funzioni Globali:
- `window.openLotteryModal()` - Apre modal vendita biglietti

---

## 🐛 Troubleshooting

### "Nessun evento attivo"
- Crea un evento con status `'active'`
- Verifica che `extraction_date` sia nel futuro

### Display non parte
- Controlla che l'eventId nell'URL sia corretto
- Apri console per vedere eventuali errori
- Verifica che ci siano biglietti venduti per l'evento

### Stampa non funziona
- La stampa usa `window.print()` del browser
- Funziona solo se hai una stampante configurata
- In dev puoi vedere l'anteprima PDF

---

## 🎯 Prossimi Step

### Per Dashboard Completa:
Crea pagina admin per:
- Gestire eventi (CRUD)
- Vedere statistiche vendite
- Eseguire estrazione manuale
- Gestire vincitori

### Per Controllo Remoto:
Implementa Supabase Realtime per:
- Comandare estrazione dal POS
- Sincronizzare display gigante
- Notifiche real-time vendite

---

**Buon test! 🎰✨**
