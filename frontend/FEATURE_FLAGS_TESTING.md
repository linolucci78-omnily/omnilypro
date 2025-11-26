# 🔐 Feature Flags System - Guida Testing

## ✅ Sistema Implementato

Il sistema di feature flags è ora **ATTIVO** e funzionante!

### 📋 Cosa è stato implementato:

1. **✅ UpgradeModal Component** (`src/components/UI/UpgradeModal.tsx`)
   - Modal professionale con confronto piani
   - Mostra benefici di ogni piano
   - Design responsive e animato
   - Call-to-action upgrade

2. **✅ Feature Locking Logic** (`src/components/OrganizationsDashboard.tsx`)
   - Menu items mostrano lucchetto 🔒 per features locked
   - Click su feature locked apre UpgradeModal
   - Controllo basato su `planPermissions.ts`

3. **✅ Plan Permissions** (`src/utils/planPermissions.ts`)
   - FREE: 50 clienti, 1 workflow
   - BASIC: 100 clienti, 5 workflows, loyalty tiers, rewards
   - PRO: 1000 clienti, 50 workflows, marketing, analytics, gaming
   - ENTERPRISE: Unlimited, tutti i canali, white label, SSO

---

## 🧪 Come Testare

### Metodo 1: **Via Admin Panel (Consigliato)** ✅

Il modo più semplice è usare l'Admin Panel:

1. **Accedi come Admin**
   - Vai su `http://localhost:5176/admin/subscription-plans`
   - Login con account super admin

2. **Seleziona Organizzazione**
   - Trova l'organizzazione da testare nella tabella
   - Clicca su "Modifica Piano"

3. **Cambia Piano**
   - Seleziona nuovo piano dal dropdown (FREE, BASIC, PRO, ENTERPRISE)
   - Preview features che verranno sbloccate/locked
   - Clicca "Salva"

4. **Verifica sul Dashboard**
   - Login con account dell'organizzazione
   - Vai su `/dashboard`
   - Osserva sidebar: le features locked avranno icona 🔒
   - Clicca su feature locked → appare UpgradeModal

### Metodo 2: **Via Database (SQL Diretto)**

Se preferisci modificare direttamente il database:

```sql
-- Testa piano FREE (vedi lucchetti)
UPDATE organizations
SET plan_type = 'free'
WHERE id = 'YOUR_ORG_ID';

-- Testa piano BASIC (alcune features sbloccate)
UPDATE organizations
SET plan_type = 'basic'
WHERE id = 'YOUR_ORG_ID';

-- Testa piano PRO (quasi tutto sbloccato)
UPDATE organizations
SET plan_type = 'pro'
WHERE id = 'YOUR_ORG_ID';

-- Testa piano ENTERPRISE (tutto sbloccato)
UPDATE organizations
SET plan_type = 'enterprise'
WHERE id = 'YOUR_ORG_ID';
```

Dopo aver cambiato il piano:
1. Ricarica pagina dashboard (`F5`)
2. Osserva sidebar: le voci locked avranno icona 🔒
3. Clicca su una voce locked → appare UpgradeModal

---

## 🎯 Features Protette per Piano

### FREE Plan - Features Locked:
- ❌ Livelli Fedeltà
- ❌ Premi
- ❌ Email Automations
- ❌ Categorie
- ❌ Campagne Marketing
- ❌ Analytics & Report
- ❌ Branding & Social
- ❌ Canali Integrazione

### BASIC Plan - Features Locked:
- ❌ Email Automations
- ❌ Campagne Marketing
- ❌ Analytics & Report
- ❌ Branding & Social
- ❌ Canali Integrazione

### PRO Plan - Features Locked:
- ❌ Canali Integrazione (solo Enterprise)

### ENTERPRISE Plan:
- ✅ Tutto sbloccato!

---

## 🔍 Features Sempre Disponibili (Tutti i Piani)

- ✅ Dashboard
- ✅ Tessere Punti
- ✅ Clienti
- ✅ Lotterie
- ✅ Sistema Referral
- ✅ Gift Certificates
- ✅ Wallet
- ✅ Coupons
- ✅ Membership
- ✅ Gestione Team
- ✅ Integrazione POS
- ✅ Il Mio Sito Web
- ✅ Impostazioni
- ✅ Aiuto & Supporto

---

## 📸 Come Dovrebbe Apparire

### Piano FREE:
```
Dashboard              [✓]
Tessere Punti         [✓]
Clienti               [✓]
Livelli Fedeltà       [🔒]  ← LOCKED
Premi                 [🔒]  ← LOCKED
Marketing Campaigns   [🔒]  ← LOCKED
...
```

### Quando clicchi su voce locked:
```
┌─────────────────────────────────────┐
│     👑 Funzionalità Premium         │
│                                     │
│  "Livelli Fedeltà" è disponibile   │
│      dal piano BASIC                │
│                                     │
│  Piano Attuale: FREE                │
│                                     │
│  [Rimani FREE] [⚡ Passa a BASIC]   │
└─────────────────────────────────────┘
```

---

## 🛠️ Modifica Permissions

Per cambiare quali features sono locked per ogni piano, modifica:

**File**: `src/utils/planPermissions.ts`

```typescript
export const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  [PlanType.FREE]: {
    loyaltyTiers: false,  // ❌ Cambia in true per sbloccare
    rewards: false,        // ❌ Cambia in true per sbloccare
    // ...
  },
  [PlanType.BASIC]: {
    loyaltyTiers: true,   // ✅ Sbloccato in BASIC
    rewards: true,         // ✅ Sbloccato in BASIC
    marketingCampaigns: false,  // ❌ Solo da PRO
    // ...
  }
}
```

---

## ⚠️ Note Importanti

### 1. **Stripe Integration Mancante**
Il bottone "Passa a [PIANO]" nell'UpgradeModal attualmente mostra un alert:
```javascript
alert(`L'upgrade a ${PLAN_NAMES[plan]} sarà disponibile presto con l'integrazione Stripe!`)
```

**Per implementare payment flow**:
- Installare Stripe SDK
- Creare checkout session
- Implementare webhook handler
- Auto-upgrade piano dopo payment success

### 2. **Backend Validation (TODO)**
Attualmente il controllo è solo frontend. Serve aggiungere:
- RLS policies su Supabase basate su plan_type
- Server-side validation prima delle operazioni
- Rate limiting basato su plan limits

### 3. **Plan Limits (TODO)**
I limiti (maxCustomers, maxWorkflows, etc.) sono definiti ma non enforced:
```typescript
maxCustomers: 50,  // FREE plan limit (non ancora verificato)
```

Serve implementare:
- Check before creating customer
- Show "upgrade to add more" when limit reached
- Real-time quota monitoring

---

## 🐛 Troubleshooting

### Lock icon non appare?
1. Verifica che `plan_type` in database sia lowercase ('free', non 'FREE')
2. Controlla console browser per errori
3. Verifica che feature sia mappata in `allItems` array

### Modal non si apre?
1. Controlla che `handleRestrictedSectionChange` sia chiamato
2. Verifica che `showUpgradePrompt` state sia aggiornato
3. Controlla console per log "🔒 Feature locked"

### Tutti i menu sono locked?
- Verifica `currentOrganization?.plan_type` non sia undefined
- Default dovrebbe essere 'free' se non impostato

---

## 📊 Prossimi Step

1. **✅ FATTO** - Feature flags frontend
2. **✅ FATTO** - Upgrade modal
3. **✅ FATTO** - Admin panel per gestione piani (`/admin/subscription-plans`)
4. **✅ FATTO** - Sistema unificato con `planPermissions.ts`
5. **⏳ TODO** - Stripe payment integration
6. **⏳ TODO** - Backend validation RLS
7. **⏳ TODO** - Enforce plan limits (max customers, etc.)
8. **⏳ TODO** - Usage analytics per piano
9. **⏳ TODO** - Auto-downgrade su subscription cancel

---

## 🎉 Test Rapido

### Test Completo End-to-End:

1. **Accedi Admin Panel**
   ```
   http://localhost:5176/admin/subscription-plans
   ```

2. **Cambia Piano**
   - Trova organizzazione test
   - Modifica Piano → FREE
   - Salva

3. **Verifica Dashboard**
   - Login con account organizzazione
   - Vai su `/dashboard`
   - Verifica lucchetti 🔒 su features premium

4. **Test UpgradeModal**
   - Clicca su "Livelli Fedeltà" (locked)
   - Verifica modal appare con confronto FREE vs BASIC

5. **Upgrade a PRO**
   - Torna su Admin Panel
   - Cambia piano → PRO
   - Salva

6. **Verifica Unlock**
   - Refresh dashboard organizzazione
   - Verifica lucchetti spariti
   - "Livelli Fedeltà" ora accessibile

### Test SQL Alternativo:

```sql
-- Cambia piano direttamente
UPDATE organizations
SET plan_type = 'free'
WHERE id = (SELECT organization_id FROM staff WHERE id = auth.uid() LIMIT 1);

-- Refresh dashboard → Vedi lucchetti
-- Clicca "Livelli Fedeltà" → UpgradeModal appare!
```

---

**Status**: ✅ **SISTEMA COMPLETO E UNIFICATO**
**Testato**: 25 Novembre 2025
**Versione**: 2.0.0 (Sistema Unificato)

**Components**:
- ✅ Feature Flags (`planPermissions.ts`)
- ✅ UpgradeModal (`UpgradeModal.tsx`)
- ✅ Dashboard Locking (`OrganizationsDashboard.tsx`)
- ✅ Admin Management (`SubscriptionFeaturesManagerV2.tsx`)

**Documentazione Completa**:
- 📄 `FEATURE_FLAGS_TESTING.md` - Testing guide
- 📄 `ADMIN_PLAN_MANAGEMENT.md` - Admin guide completa
