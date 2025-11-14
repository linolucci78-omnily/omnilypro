# 🎮 GUIDA TEST GAMING MODULE

Guida completa step-by-step per testare il Gaming Module di OmnilyPro.

---

## 📋 Prerequisiti

1. ✅ Database Supabase attivo e configurato
2. ✅ Almeno 1 organizzazione nel database
3. ✅ Almeno 1 customer collegato all'organizzazione
4. ✅ Frontend in esecuzione (`npm run dev`)

---

## 🚀 STEP 1: Setup Database

### Opzione A: Esegui lo schema SQL (se non già fatto)

```bash
# Connettiti al tuo database Supabase e esegui lo schema
psql -h <your-supabase-host> -U postgres -d postgres -f database/gaming-module-schema.sql
```

Oppure manualmente tramite Supabase Dashboard:
1. Vai su Supabase Dashboard → SQL Editor
2. Copia e incolla il contenuto di `database/gaming-module-schema.sql`
3. Esegui la query

Questo creerà:
- ✅ 9 tabelle (gaming_config, badges, challenges, wheel, ecc.)
- ✅ 2 views per statistiche
- ✅ Triggers e indexes

### Opzione B: Verifica che lo schema esista già

```sql
-- Controlla se le tabelle esistono
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'gaming_%';

-- Dovresti vedere 9 tabelle:
-- gaming_config
-- gaming_badges
-- customer_badges
-- gaming_challenges
-- customer_challenges
-- gaming_wheel_configs
-- customer_wheel_spins
-- gaming_stats
-- gaming_notifications
```

---

## 🌱 STEP 2: Seed Dati Predefiniti

### Trova il tuo Organization ID

```sql
-- Trova tutte le organizzazioni
SELECT id, name, subscription_plan
FROM organizations
ORDER BY created_at DESC
LIMIT 10;

-- Copia l'ID dell'organizzazione che vuoi usare
```

### Esegui lo script di setup

```bash
# Metodo 1: Se hai configurato l'npm script
npm run setup-gaming <YOUR_ORGANIZATION_ID>

# Metodo 2: Esecuzione diretta
node -r esbuild-register src/scripts/setupGamingModule.ts <YOUR_ORGANIZATION_ID>

# Esempio:
npm run setup-gaming 123e4567-e89b-12d3-a456-426614174000
```

### Cosa fa lo script?

1. ✅ Verifica che l'organizzazione esista
2. ✅ Controlla i permessi del piano (Pro/Enterprise)
3. ✅ Seed 15 badge predefiniti
4. ✅ Seed 6 challenge templates
5. ✅ Seed configurazione ruota (8 settori)
6. ✅ Genera challenge di test per il primo customer
7. ✅ Sblocca badge automatici basati sull'attività del customer

### Output atteso:

```
🎮 GAMING MODULE SETUP
==================================================
Organization ID: 123e4567...

1️⃣  Verificando organizzazione...
   ✅ Organizzazione: Il Mio Ristorante
   📋 Piano: pro

2️⃣  Verificando permessi Gaming Module...
   ✅ Piano pro ha accesso al Gaming Module

3️⃣  Seeding Badge System...
   ✅ 15 badge predefiniti creati

4️⃣  Seeding Challenge Templates...
   ✅ 6 challenge templates creati

5️⃣  Seeding Spin Wheel Configuration...
   ✅ Ruota della Fortuna configurata (8 settori)

6️⃣  Cercando customer di test...
   ✅ Trovati 3 customer(s):
      1. Mario Rossi (mario@example.com)
      2. Luca Bianchi (luca@example.com)

7️⃣  Generando challenge di test per Mario...
   ✅ 3 challenge giornaliere generate
   ✅ 2 challenge settimanali generate

8️⃣  Inizializzando badge per Mario...
   ✅ 2 badge sbloccati automaticamente
      🏆 Benvenuto
      🏆 Primo Acquisto

==================================================
✅ SETUP COMPLETATO!
```

---

## 🧪 STEP 3: Testa il Gaming Module

### Metodo 1: Pagina di Test Dedicata (CONSIGLIATO)

1. **Avvia il frontend:**
   ```bash
   npm run dev
   ```

2. **Apri il browser:**
   ```
   http://localhost:5173/gaming-test
   ```

3. **Seleziona organizzazione e customer:**
   - Scegli l'organizzazione dal menu a tendina
   - Scegli un customer
   - (Opzionale) Cambia il piano per testare l'upgrade prompt

4. **Clicca "Avvia Test Gaming Module"**

### Metodo 2: URL Diretto (se conosci gli ID)

```
http://localhost:5173/gaming-test?customerId=CUSTOMER_ID&organizationId=ORG_ID
```

Esempio:
```
http://localhost:5173/gaming-test?customerId=abc-123&organizationId=xyz-789
```

---

## 🎯 STEP 4: Testa le Feature

### 1. 🏆 Badge Gallery

**Cosa testare:**
- [ ] Vedi tutti i 15 badge predefiniti
- [ ] Badge sbloccati hanno effetto dorato
- [ ] Badge locked hanno effetto grayscale
- [ ] Filtri per categoria funzionano (First Steps, Loyalty, ecc.)
- [ ] Filtri per rarità funzionano (Common, Rare, Epic, Legendary)
- [ ] Progress bar mostra avanzamento
- [ ] Hover effect su badge

**Come testare unlock automatico:**
```javascript
// Da console browser:
// 1. Fai un'attività (es. acquisto)
// 2. Chiama auto-unlock
const { badgeService } = await import('./services/gaming/badgeService')
const results = await badgeService.checkAndUnlockBadges('CUSTOMER_ID', 'ORG_ID')
console.log('Badge unlocked:', results.filter(r => r.unlocked))
```

### 2. 🎯 Challenges Hub

**Cosa testare:**
- [ ] Vedi challenge giornaliere (3)
- [ ] Vedi challenge settimanali (2)
- [ ] Progress bar si aggiorna
- [ ] Time remaining countdown funziona
- [ ] Filtri (Tutte/Attive/Completate) funzionano
- [ ] Rewards sono mostrati correttamente

**Come testare progress update:**
```javascript
// Da console browser:
const { challengeService } = await import('./services/gaming/challengeService')

// Simula un acquisto (incrementa progress)
await challengeService.updateChallengeProgress(
  'CUSTOMER_ID',
  'make_purchases',
  1  // incremento
)

// Ricarica la pagina per vedere l'aggiornamento
location.reload()
```

### 3. 🎡 Spin the Wheel

**Cosa testare:**
- [ ] Ruota visualizzata con 8 settori
- [ ] Counter "Spin disponibili: X/3" corretto
- [ ] Click su "GIRA!" avvia animazione
- [ ] Rotazione 4 secondi realistica
- [ ] Prize reveal modal appare
- [ ] Confetti animation
- [ ] Premio viene assegnato (controlla punti customer)
- [ ] Spin counter decrementa
- [ ] Dopo 3 spin, bottone diventa "FINITI"

**Come resettare gli spin giornalieri:**
```sql
-- Da Supabase SQL Editor
DELETE FROM customer_wheel_spins
WHERE customer_id = 'CUSTOMER_ID'
AND spun_at::date = CURRENT_DATE;
```

### 4. 🎮 Gaming Hub (Dashboard Principale)

**Cosa testare:**
- [ ] Stats cards mostrano dati corretti:
  - Badge Progress (X/15)
  - Challenge Attive
  - Spin Disponibili (X/3)
- [ ] Recent badges preview funziona
- [ ] Active challenges preview funziona
- [ ] Spin wheel preview animato
- [ ] Click su "Vedi Galleria" apre BadgeGallery
- [ ] Click su "Vedi Tutte" apre ChallengesHub
- [ ] Click su "Gira Ora!" apre SpinWheel

---

## 🔐 STEP 5: Testa Plan Permissions

### Test Piano Free/Basic (NO ACCESS)

1. Nella pagina di test, seleziona "Free" o "Basic" dal menu piano
2. Clicca "Avvia Test"

**Risultato atteso:**
- ❌ Gaming Hub NON visibile
- ✅ Upgrade prompt mostrato
- ✅ Lista features visualizzata
- ✅ Badge "PRO" o "ENTERPRISE" mostrato
- ✅ Prezzo mostrato (€99/mese o €299/mese)
- ✅ Bottone "Passa a Pro per sbloccare"

### Test Piano Pro/Enterprise (ACCESS)

1. Seleziona "Pro" o "Enterprise"
2. Clicca "Avvia Test"

**Risultato atteso:**
- ✅ Gaming Hub completamente visibile
- ✅ Tutte le feature accessibili
- ✅ Nessun upgrade prompt

---

## 🐛 Troubleshooting

### ❌ "Tabelle non trovate"

**Problema:** Schema SQL non eseguito

**Soluzione:**
```bash
# Esegui lo schema
psql ... -f database/gaming-module-schema.sql

# Oppure da Supabase Dashboard > SQL Editor
```

### ❌ "Nessun badge/challenge visualizzato"

**Problema:** Dati non seeded

**Soluzione:**
```bash
# Esegui setup script
npm run setup-gaming YOUR_ORG_ID
```

### ❌ "Spin non funziona"

**Problema:** Wheel config mancante

**Soluzione:**
```javascript
// Da console browser
const { spinService } = await import('./services/gaming/spinService')
await spinService.seedDefaultWheelConfig('ORG_ID')
```

### ❌ "Badge non si sbloccano automaticamente"

**Problema:** Customer activities non registrate

**Soluzione:**
1. Assicurati che ogni acquisto/attività venga registrata in `customer_activities`
2. Chiama `checkAndUnlockBadges()` dopo ogni attività:

```typescript
// Dopo un acquisto
await supabase.from('customer_activities').insert({
  organization_id: orgId,
  customer_id: customerId,
  activity_type: 'transaction',
  points_earned: 10,
  created_at: new Date().toISOString()
})

// Check unlock
await badgeService.checkAndUnlockBadges(customerId, orgId)
```

### ❌ "Challenge non si auto-generano"

**Problema:** Nessun template challenge esistente

**Soluzione:**
```javascript
const { challengeService } = await import('./services/gaming/challengeService')
await challengeService.seedPredefinedChallenges('ORG_ID')
```

### ❌ "Errore CORS / Supabase connection"

**Problema:** Configurazione Supabase

**Soluzione:**
1. Verifica `src/lib/supabase.ts`
2. Controlla `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` in `.env`

---

## 🔍 Verifica Manuale Database

### Controlla Badge

```sql
-- Vedi tutti i badge dell'org
SELECT * FROM gaming_badges
WHERE organization_id = 'YOUR_ORG_ID';

-- Vedi badge customer
SELECT cb.*, b.name, b.icon_emoji
FROM customer_badges cb
JOIN gaming_badges b ON cb.badge_id = b.id
WHERE cb.customer_id = 'YOUR_CUSTOMER_ID';
```

### Controlla Challenges

```sql
-- Vedi challenge templates
SELECT * FROM gaming_challenges
WHERE organization_id = 'YOUR_ORG_ID';

-- Vedi challenge customer
SELECT cc.*, c.title, c.description
FROM customer_challenges cc
JOIN gaming_challenges c ON cc.challenge_id = c.id
WHERE cc.customer_id = 'YOUR_CUSTOMER_ID';
```

### Controlla Spin

```sql
-- Vedi wheel config
SELECT * FROM gaming_wheel_configs
WHERE organization_id = 'YOUR_ORG_ID';

-- Vedi spin history
SELECT * FROM customer_wheel_spins
WHERE customer_id = 'YOUR_CUSTOMER_ID'
ORDER BY spun_at DESC;
```

---

## 📊 Test Completi - Checklist

### Setup
- [ ] Database schema creato
- [ ] Badge predefiniti seeded (15)
- [ ] Challenge templates seeded (6)
- [ ] Wheel config creata (8 settori)
- [ ] Test customer ha challenge generate
- [ ] Test customer ha alcuni badge unlocked

### Badge System
- [ ] Gallery mostra tutti i badge
- [ ] Filtri categoria funzionano
- [ ] Filtri rarità funzionano
- [ ] Badge locked/unlocked visuali corretti
- [ ] Progress tracking funziona
- [ ] Auto-unlock funziona
- [ ] Badge notification appare
- [ ] Rewards assegnati correttamente

### Challenge System
- [ ] Daily challenges (3) visualizzate
- [ ] Weekly challenges (2) visualizzate
- [ ] Progress bars accurate
- [ ] Time remaining countdown
- [ ] Filtri funzionano
- [ ] Completion tracking
- [ ] Rewards on complete
- [ ] Challenge scadute vengono rimosse

### Spin Wheel
- [ ] Ruota renderizzata correttamente
- [ ] 8 settori con colori diversi
- [ ] Animazione rotazione smooth
- [ ] Probability-based selection
- [ ] Prize reveal funziona
- [ ] Confetti animation
- [ ] Prizes assegnati (punti/discount/ecc.)
- [ ] Daily limit funziona (3 spin)
- [ ] Discount codes generati

### Gaming Hub
- [ ] Stats cards accurate
- [ ] Badge preview funziona
- [ ] Challenges preview funziona
- [ ] Spin preview animato
- [ ] Navigation verso singole feature
- [ ] Refresh automatico stats

### Permissions
- [ ] Free plan → upgrade prompt
- [ ] Basic plan → upgrade prompt
- [ ] Pro plan → full access
- [ ] Enterprise plan → full access
- [ ] Upgrade button funziona

---

## 🎉 Test Completato!

Se tutti i test passano, il Gaming Module è **production-ready**! 🚀

### Next Steps

1. **Integrazione nell'app principale:**
   - Aggiungi GamingHubWrapper nel customer dashboard
   - Aggiungi link nel menu navigation

2. **Setup Cron Jobs (opzionale):**
   - Auto-generate daily challenges (midnight)
   - Auto-generate weekly challenges (Monday)
   - Clean expired challenges

3. **Monitoring:**
   - Setup analytics per tracking usage
   - Monitor badge unlock rate
   - Monitor spin conversion
   - A/B test wheel probabilities

4. **Marketing:**
   - Announce Gaming Module come feature Pro+
   - Create demo video
   - Add to pricing page

---

## 📚 Risorse

- **Documentazione completa:** `src/components/Gaming/README.md`
- **Schema database:** `database/gaming-module-schema.sql`
- **Test page:** `http://localhost:5173/gaming-test`
- **Support:** support@omnilypro.com

---

© 2025 OmnilyPro - Gaming Module MVP
