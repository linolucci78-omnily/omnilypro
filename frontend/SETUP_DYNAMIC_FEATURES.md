# ✅ Setup Sistema Features Dinamiche - Istruzioni Finali

## 🎯 Cosa Hai Ora

Ho implementato un sistema **completo** che ti permette di modificare i piani dall'Admin Panel senza toccare il codice!

### File Creati:

1. ✅ `supabase/migrations/create_plan_feature_overrides.sql` - Migration database
2. ✅ `src/utils/planPermissions.ts` - Aggiornato per leggere dal DB
3. ✅ `src/components/Admin/PlanFeaturesManager.tsx` - Nuovo admin panel
4. ✅ `src/App.tsx` - Aggiunta route `/admin/plan-features`
5. ✅ `DYNAMIC_PLAN_FEATURES_SETUP.md` - Documentazione completa

---

## 🚀 Setup Rapido (3 Steps)

### Step 1: Esegui Migration Database

Devi creare la tabella `plan_feature_overrides` nel database.

**Opzione A - Via Supabase Dashboard (Consigliato):**

1. Vai su [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleziona il tuo progetto
3. Vai su "SQL Editor"
4. Clicca "New Query"
5. Copia e incolla tutto il contenuto di:
   ```
   supabase/migrations/create_plan_feature_overrides.sql
   ```
6. Clicca "Run" (▶️)
7. Dovresti vedere: "Success. No rows returned"

**Opzione B - Via Terminale (se hai Supabase CLI):**

```bash
cd /Users/pasqualelucci/omnilypro-clean/frontend
supabase db push
```

### Step 2: Verifica Tabella Creata

Esegui questo nel SQL Editor di Supabase:

```sql
-- Controlla che la tabella esista
SELECT * FROM plan_feature_overrides;

-- Dovrebbe tornare vuoto (0 rows) ma senza errori
```

### Step 3: Riavvia Frontend

Il server dev dovrebbe rilevare i cambiamenti automaticamente, ma per sicurezza:

```bash
# Vai su http://localhost:5176/admin/plan-features
# Dovresti vedere il nuovo pannello!
```

---

## 🎮 Come Usarlo

### Esempio Pratico: Dare "Coupons" al piano BASIC per promo

1. **Accedi Admin Panel**
   ```
   http://localhost:5176/admin/plan-features
   ```

2. **Seleziona Piano BASIC**
   - Clicca sul tab "Basic"

3. **Aggiungi Override**
   - Clicca "Aggiungi Override per Basic"
   - Feature: Seleziona "coupons" dal dropdown
   - Abilita Feature: ✅ (checked)
   - Descrizione: "Promo Black Friday 2025"
   - Scadenza: 30/11/2025 (opzionale)
   - Clicca "Salva Override"

4. **Verifica**
   - Nella tabella vedrai "coupons" con override ENABLED
   - Login come organizzazione BASIC
   - Vai su `/dashboard`
   - Coupons ora è sbloccato! 🎉

---

## 📊 Screenshot Atteso

```
┌─────────────────────────────────────────────────────────────────────┐
│  👑 Gestione Features Dinamiche                                     │
│                                                                      │
│  [FREE]  [BASIC]  [PRO]  [ENTERPRISE]  ← Tabs                      │
│                                                                      │
│  [+ Aggiungi Override per BASIC]  ← Button                         │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Feature       │ Valore Base │ Override │ Descrizione │ Azioni  │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ coupons       │ ❌ Disabled │ ✅ Enabled│ Promo BF    │ [🗑]    │ │
│  │ rewards       │ ✅ Enabled  │ -         │ -           │ -       │ │
│  │ loyaltyTiers  │ ✅ Enabled  │ -         │ -           │ -       │ │
│  │ marketing...  │ ❌ Disabled │ -         │ -           │ -       │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔥 Use Cases

### 1. Promo Temporanea

**Scenario:** Black Friday - Marketing gratis per tutti per 1 settimana

```
Piano: FREE, BASIC, PRO
Feature: marketingCampaigns
Abilitata: ✅
Scadenza: 30/11/2025
Descrizione: "Black Friday 2025 - Marketing gratis"
```

**Risultato:** Tutti i piani hanno marketing campaigns fino al 30/11, poi torna automaticamente normale.

### 2. Beta Test Feature

**Scenario:** Vuoi testare "Gaming Module" con utenti FREE prima di rilasciarlo ufficialmente

```
Piano: FREE
Feature: gamingModule
Abilitata: ✅
Scadenza: null (permanente per ora)
Descrizione: "Beta test gaming con utenti FREE"
```

**Risultato:** FREE ha gaming module. Quando finisci beta, rimuovi override.

### 3. Manutenzione Temporanea

**Scenario:** Server email in manutenzione, disabilita marketing per tutti

```
Piano: PRO, ENTERPRISE
Feature: marketingCampaigns
Abilitata: ❌
Scadenza: 26/11/2025
Descrizione: "Manutenzione server email"
```

**Risultato:** Anche PRO/ENTERPRISE perdono marketing temporaneamente, si riattiva il 26/11.

### 4. Piano Custom per Cliente VIP

**Scenario:** Cliente paga FREE ma vuoi dargli alcune features PRO

```
Piano: FREE
Feature: analyticsReports
Abilitata: ✅
Scadenza: 31/12/2025
Descrizione: "Cliente VIP - Analytics gratis per 1 anno"
```

**Risultato:** Questo override si applica a **TUTTI** i FREE. Se vuoi solo 1 organizzazione specifica, serve altro sistema (per-org overrides).

---

## ⚠️ Note Importanti

### Override Globali per Piano

Gli override che crei si applicano a **TUTTE le organizzazioni** con quel piano.

**Esempio:**
```
Override: BASIC → coupons = true
```
→ TUTTE le org con piano BASIC avranno coupons

### Priorità

1. **Override Database** (massima priorità)
2. **Codice planPermissions.ts** (fallback se nessun override)

### Cache

- Cache di 1 minuto per performance
- Cambiamenti visibili massimo dopo 1 min
- Per refresh immediato: ricarica pagina

### Scadenza Automatica

- Override con `expires_at` passato vengono **ignorati automaticamente**
- Non serve rimuoverli manualmente
- Ma puoi rimuoverli per pulizia database

---

## 🧪 Test Rapido

### 1. Crea Override

```sql
-- Via SQL (alternativa rapida al pannello)
INSERT INTO plan_feature_overrides (plan_type, feature_name, enabled, description)
VALUES ('basic', 'marketingCampaigns', true, 'Test override');
```

### 2. Verifica

```
1. Login come org BASIC
2. Vai su /dashboard
3. "Marketing Campaigns" ora è sbloccato (no lucchetto)!
```

### 3. Rimuovi Override

```sql
-- Via SQL
DELETE FROM plan_feature_overrides
WHERE plan_type = 'basic' AND feature_name = 'marketingCampaigns';
```

Oppure usa il bottone 🗑️ nel pannello admin.

---

## 🐛 Troubleshooting

### Override non si applica?

1. **Controlla cache (1 min)** - Aspetta 60 secondi o ricarica
2. **Verifica spelling** - `featureName` deve corrispondere esattamente
3. **Check scadenza** - `expires_at` deve essere futuro o NULL
4. **Guarda console** - Eventuali errori database

### Tabella non esiste?

```sql
-- Verifica esistenza
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'plan_feature_overrides';

-- Dovrebbe tornare 1 row
-- Se vuoto → migration non eseguita
```

### Permission denied?

- Solo **super_admin** può modificare override
- Tutti possono leggerli (necessario per feature checks)

---

## 📂 Riferimenti

**Documentazione Completa:**
- `DYNAMIC_PLAN_FEATURES_SETUP.md` - Come funziona tecnicamente
- `ADMIN_PLAN_MANAGEMENT.md` - Gestione piani (cambio piano org)
- `FEATURE_FLAGS_TESTING.md` - Testing feature locks

**Files Chiave:**
- `src/utils/planPermissions.ts:207` - Funzione `fetchPlanOverrides()`
- `src/components/Admin/PlanFeaturesManager.tsx` - Admin UI
- `supabase/migrations/create_plan_feature_overrides.sql` - Schema DB

**Routes:**
- `/admin/plan-features` - Gestione feature override (NUOVO!)
- `/admin/subscription-plans` - Cambio piano org (esistente)

---

## ✅ Checklist Setup

- [ ] Migration SQL eseguita nel database
- [ ] Tabella `plan_feature_overrides` creata
- [ ] Frontend riavviato
- [ ] Vai su `/admin/plan-features`
- [ ] Vedi pannello con tabs FREE/BASIC/PRO/ENTERPRISE
- [ ] Prova a creare un override di test
- [ ] Verifica override appare nella tabella
- [ ] Login come org con quel piano
- [ ] Verifica feature sbloccata/locked correttamente
- [ ] Rimuovi override di test
- [ ] ✅ **SISTEMA PRONTO!**

---

**Status**: 🚀 **PRONTO PER L'USO**
**Versione**: 3.0.0 (Dynamic Features System)
**Data**: 25 Novembre 2025

**Prossimi step (opzionali):**
- [ ] Override per-organization (non solo per-plan)
- [ ] Audit log modifiche override
- [ ] Notifiche email quando override scade
- [ ] UI per vedere quante org sono affette da override
