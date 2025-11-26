# 🎯 Sistema Dinamico Features Piani - Setup

## ✅ Cosa Permette di Fare

Con questo sistema puoi **modificare le features dei piani dall'Admin Panel** senza toccare il codice:

- ✅ Aggiungere feature a un piano (es: "Coupons" gratis per BASIC)
- ✅ Rimuovere feature da un piano
- ✅ Promozioni temporanee con scadenza automatica
- ✅ Override visibili e tracciabili
- ✅ Gestione completa da interfaccia web

---

## 📋 Setup Iniziale

### Step 1: Esegui Migration Database

Apri Supabase SQL Editor e esegui:

```sql
-- Copia e incolla il contenuto di:
-- supabase/migrations/create_plan_feature_overrides.sql
```

Oppure esegui direttamente da terminale:

```bash
# Se hai Supabase CLI installato
supabase db push

# Oppure copia manualmente nel SQL Editor di Supabase
cat supabase/migrations/create_plan_feature_overrides.sql
```

### Step 2: Verifica Tabella Creata

```sql
-- Controlla che la tabella esista
SELECT * FROM plan_feature_overrides;

-- Dovrebbe essere vuota all'inizio
```

### Step 3: Riavvia Frontend

Il sistema si attiverà automaticamente quando ricarichi il frontend.

---

## 🎮 Come Usare il Sistema

### Accesso Admin Panel

1. Vai su: `http://localhost:5176/admin/plan-features`
2. Login come super admin
3. Vedrai 4 tab (FREE, BASIC, PRO, ENTERPRISE)

### Esempio: Dare "Coupons" gratis al piano BASIC per Black Friday

```
1. Vai su Admin Panel → Plan Features
2. Seleziona tab "BASIC"
3. Cerca feature "coupons" nella lista
4. Vedi che è DISABILITATA (default)
5. Clicca "Override"
6. Abilita: ON
7. Descrizione: "Promo Black Friday 2025"
8. Scadenza: 30/11/2025
9. Salva
10. ✅ BASIC ora ha coupons fino al 30/11!
```

### Esempio: Rimuovere temporaneamente "Marketing" da PRO

```
1. Tab "PRO"
2. Feature "marketingCampaigns" (ABILITATA di default)
3. Clicca "Override"
4. Abilita: OFF
5. Descrizione: "Manutenzione server email"
6. Scadenza: 25/11/2025
7. Salva
8. ✅ PRO perde marketing fino al 25/11
```

---

## 📊 Come Funziona Tecnicamente

### 1. Configurazione Base (Codice)

```typescript
// planPermissions.ts
PLAN_FEATURES[PlanType.BASIC] = {
  coupons: false,  // ❌ Default: non disponibile
  rewards: true,   // ✅ Default: disponibile
}
```

### 2. Override Database

```sql
-- Admin aggiunge override
INSERT INTO plan_feature_overrides (plan_type, feature_name, enabled)
VALUES ('basic', 'coupons', true);
```

### 3. Logica Applicazione

```typescript
// Sistema legge prima dal database, poi dal codice
async function getPlanFeatures(planType: string) {
  const baseFeatures = PLAN_FEATURES[planType]  // Codice
  const overrides = await fetchOverrides(planType)  // Database

  return { ...baseFeatures, ...overrides }  // Merge (DB vince)
}
```

### 4. Risultato

```typescript
// BASIC ora ha coupons!
getPlanFeatures('basic')
// { coupons: true ✅, rewards: true ✅, ... }
```

---

## 🔍 Features Disponibili per Override

Puoi fare override di tutte queste features:

**Dashboard Sections:**
- `loyaltyTiers` - Livelli Fedeltà
- `rewards` - Premi
- `categories` - Categorie
- `marketingCampaigns` - Campagne Marketing
- `teamManagement` - Gestione Team
- `posIntegration` - Integrazione POS
- `notifications` - Notifiche
- `analyticsReports` - Analytics & Report
- `brandingSocial` - Branding & Social
- `channelsIntegration` - Canali Integrazione

**Advanced Features:**
- `advancedAnalytics` - Analytics Avanzate
- `apiAccess` - Accesso API
- `webhookSupport` - Supporto Webhook
- `whiteLabel` - White Label
- `customDomain` - Dominio Personalizzato
- `prioritySupport` - Supporto Prioritario
- `sso` - Single Sign-On

**Gaming:**
- `gamingModule` - Modulo Gaming

---

## 🎯 Use Cases Comuni

### Promozione Temporanea

```
Piano: BASIC
Feature: marketingCampaigns (normalmente solo PRO)
Abilitata: ✅
Scadenza: 31/12/2025
Descrizione: "Promo Natale - Marketing gratis per tutti BASIC"
```

Dopo il 31/12/2025 → La feature torna automaticamente a come era nel codice (disabled per BASIC).

### Manutenzione Temporanea

```
Piano: PRO
Feature: apiAccess
Abilitata: ❌
Scadenza: 26/11/2025
Descrizione: "Manutenzione API server"
```

PRO perde accesso API temporaneamente, si riattiva automaticamente il 26/11.

### Upgrade Permanente Piano

```
Piano: FREE
Feature: rewards
Abilitata: ✅
Scadenza: NULL (permanente)
Descrizione: "FREE tier upgrade - rewards sempre disponibili"
```

FREE ora ha rewards per sempre (finché non rimuovi l'override).

---

## ⚠️ Note Importanti

### Priorità Override

1. **Override Database** (massima priorità)
2. **Configurazione Codice** (fallback)

Se esiste un override nel database, quello vince sempre sul codice.

### Scadenza Automatica

Gli override con `expires_at` passato vengono **automaticamente ignorati**.
Non serve rimuoverli manualmente.

### Cache

Il sistema rilegge dal database ad ogni richiesta (no cache).
I cambiamenti sono **immediati**.

---

## 🧪 Testing

### Test 1: Override Temporaneo

```sql
-- Aggiungi override manuale
INSERT INTO plan_feature_overrides (plan_type, feature_name, enabled, description, expires_at)
VALUES ('basic', 'marketingCampaigns', true, 'Test promo', NOW() + INTERVAL '1 day');

-- Login come org BASIC → Vedi marketing campaigns disponibile!
```

### Test 2: Rimozione Feature

```sql
-- Rimuovi rewards da BASIC
INSERT INTO plan_feature_overrides (plan_type, feature_name, enabled, description)
VALUES ('basic', 'rewards', false, 'Test disabilitazione');

-- Login come org BASIC → Rewards ora è locked!
```

### Test 3: Verifica Scadenza

```sql
-- Override scaduto (non deve applicarsi)
INSERT INTO plan_feature_overrides (plan_type, feature_name, enabled, expires_at)
VALUES ('free', 'rewards', true, NOW() - INTERVAL '1 day');

-- FREE NON ha rewards (override scaduto)
```

---

## 📂 File Coinvolti

### Database:
- `supabase/migrations/create_plan_feature_overrides.sql` - Migration tabella

### Frontend:
- `src/utils/planPermissions.ts` - Logica lettura override
- `src/components/Admin/PlanFeaturesManager.tsx` - Admin panel UI
- `src/components/OrganizationsDashboard.tsx` - Applicazione locks

### Routes:
- `/admin/plan-features` - Gestione override

---

## 🚀 Vantaggi

✅ **Zero modifiche codice** per cambiare features
✅ **Promozioni temporanee** con scadenza automatica
✅ **Audit trail** completo (chi, quando, perché)
✅ **Rollback istantaneo** (rimuovi override)
✅ **Testing facile** (attiva/disattiva senza deploy)
✅ **Multi-tenant safe** (ogni org vede solo il suo piano)

---

**Status**: 🚧 **IN IMPLEMENTAZIONE**
**Versione**: 3.0.0 (Sistema Dinamico)
**Data**: 25 Novembre 2025
