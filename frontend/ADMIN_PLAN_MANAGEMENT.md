# 👑 Admin Plan Management - Sistema Unificato

## ✅ SISTEMA UNIFICATO IMPLEMENTATO

Il sistema di gestione piani è stato **unificato** con `planPermissions.ts`!

### 🔄 Cosa è cambiato:

**PRIMA** (Sistema Duplicato):
- ❌ `subscriptionFeaturesService.ts` → Solo 4 features (tier system)
- ❌ `subscription_features` table → Dati separati
- ❌ Piani: free, **starter**, pro, enterprise
- ❌ Non sincronizzato con feature flags

**ADESSO** (Sistema Unificato):
- ✅ `planPermissions.ts` → 15+ features complete
- ✅ `organizations.plan_type` → Unica fonte di verità
- ✅ Piani: free, **basic**, pro, enterprise
- ✅ 100% sincronizzato con feature locking

---

## 🎯 Come Funziona

### 1. Admin cambia piano in `/admin/subscription-plans`

```
Admin Panel
  ↓
Cambia plan_type in organizations table
  ↓
organizations.plan_type = 'pro'
  ↓
OrganizationsDashboard legge plan_type
  ↓
Features sbloccate automaticamente!
```

### 2. Flow Completo

```sql
-- Admin cambia piano
UPDATE organizations
SET plan_type = 'pro'
WHERE id = 'org-123';

-- Feature flags si aggiornano automaticamente
-- (nessuna cache, legge direttamente da DB)
```

---

## 📊 Admin Panel Features

### Accesso: `/admin/subscription-plans`

**Funzionalità**:
1. ✅ **Visualizza tutte le organizzazioni**
   - Nome, logo, email
   - Piano attuale
   - Prezzo piano
   - Count features attive
   - Limiti (clienti, workflows)

2. ✅ **Modifica Piano**
   - Dropdown con 4 piani
   - Preview features che verranno sbloccate
   - Salvataggio immediato nel database

3. ✅ **Stats Cards**
   - FREE: Features, limiti, prezzo
   - BASIC: Features, limiti, prezzo
   - PRO: Features, limiti, prezzo
   - ENTERPRISE: Features, limiti, prezzo

4. ✅ **Features Details Panel**
   - Quando modifichi un piano
   - Mostra tutte le features con ✅/🔒
   - Feedback visuale immediato

---

## 🔐 Piani e Features

### FREE Plan (€0)
**Limiti**:
- 50 clienti max
- 1 workflow
- 100 notifiche/mese

**Features Locked** 🔒:
- Livelli Fedeltà
- Premi
- Email Automations
- Categorie
- Marketing Campaigns
- Analytics & Report
- Branding & Social
- Canali Integrazione

---

### BASIC Plan (€29/mese)
**Limiti**:
- 100 clienti max
- 5 workflows
- 1,000 notifiche/mese

**Features Unlocked** ✅:
- ✅ Livelli Fedeltà
- ✅ Premi
- ✅ Categorie
- ✅ Notifiche Base

**Features Locked** 🔒:
- Marketing Campaigns
- Analytics & Report
- Branding & Social
- Canali Integrazione

---

### PRO Plan (€99/mese)
**Limiti**:
- 1,000 clienti max
- 50 workflows
- 10,000 notifiche/mese

**Features Unlocked** ✅:
- ✅ TUTTE le features di BASIC
- ✅ Marketing Campaigns
- ✅ Analytics & Report
- ✅ Branding & Social
- ✅ Gaming Module
- ✅ API Access
- ✅ Webhooks

**Features Locked** 🔒:
- Canali Integrazione (solo Enterprise)

---

### ENTERPRISE Plan (€299/mese)
**Limiti**:
- ∞ Clienti illimitati
- ∞ Workflows illimitati
- ∞ Notifiche illimitate

**Features** ✅:
- ✅ TUTTE LE FEATURES
- ✅ Canali Integrazione
- ✅ White Label
- ✅ Custom Domain
- ✅ SSO Enterprise
- ✅ Priority Support 24/7

---

## 🧪 Testing

### 1. Testa Cambio Piano

```bash
# 1. Vai su http://localhost:5176/admin/subscription-plans
# 2. Login come super admin
# 3. Clicca "Modifica Piano" su un'organizzazione
# 4. Cambia piano da FREE → PRO
# 5. Clicca "Salva"
# 6. Refresh dashboard dell'organizzazione
# 7. Le features PRO sono ora sbloccate!
```

### 2. Verifica Feature Locking

```bash
# 1. Cambia piano a FREE in admin panel
# 2. Vai su dashboard organization
# 3. Vedi lucchetti 🔒 su features premium
# 4. Clicca su feature locked → UpgradeModal
# 5. Cambia piano a PRO in admin panel
# 6. Refresh dashboard
# 7. Lucchetti spariti, features sbloccate!
```

---

## 📝 Come Cambiare Piano (Admin)

### Via Admin Panel (Recommended)

1. **Login** come super admin
2. **Vai** su `/admin/subscription-plans`
3. **Trova** l'organizzazione
4. **Clicca** "Modifica Piano"
5. **Seleziona** nuovo piano dal dropdown
6. **Review** features che verranno abilitate
7. **Clicca** "Salva"
8. ✅ **Done** - Piano aggiornato!

### Via SQL (Solo per testing rapido)

```sql
-- Cambia piano direttamente
UPDATE organizations
SET plan_type = 'pro'
WHERE id = 'YOUR_ORG_ID';

-- Verifica cambio
SELECT name, plan_type FROM organizations;
```

---

## 🔍 Debugging

### Feature non si sblocca?

1. **Verifica plan_type nel database**:
```sql
SELECT id, name, plan_type FROM organizations WHERE id = 'YOUR_ORG_ID';
```

2. **Controlla planPermissions.ts**:
```typescript
// Verifica che la feature sia marcata come true per quel piano
PLAN_FEATURES['pro'].loyaltyTiers  // deve essere true
```

3. **Controlla mapping in OrganizationsDashboard**:
```typescript
// Verifica che il menu item abbia il giusto feature name
{ id: 'loyalty-tiers', feature: 'loyaltyTiers' }  // deve corrispondere
```

4. **Hard refresh del browser**: `Ctrl+Shift+R` o `Cmd+Shift+R`

---

## 🚀 Workflow Completo

### Scenario: Cliente vuole upgrade da FREE a PRO

**1. Cliente richiede upgrade**
- Email/ticket support
- "Voglio sbloccare Marketing Campaigns"

**2. Admin verifica richiesta**
- Login admin panel
- Controlla organizzazione
- Verifica piano attuale: FREE

**3. Admin approva upgrade**
- Va su `/admin/subscription-plans`
- Modifica piano → PRO
- Salva cambio

**4. Cliente riceve notifica**
- Email automatica (TODO: da implementare)
- "Il tuo piano è stato aggiornato a PRO!"

**5. Cliente usa nuove features**
- Login dashboard
- Vede features PRO sbloccate
- Inizia a usare Marketing Campaigns

**6. Billing** (TODO: Stripe integration)
- Stripe crea subscription
- Addebito €99/mese
- Invoice automatica

---

## ⚠️ Importante

### 1. Cambio Piano è Immediato
- Nessuna cache
- Effetto immediato alla prossima richiesta
- User deve fare refresh per vedere cambiamenti

### 2. Downgrade Considerazioni
- Features locked immediatamente
- Dati NON cancellati (solo non accessibili)
- Es: PRO → FREE, marketing campaigns salvate ma locked

### 3. Stripe Integration (TODO)
Quando implementato:
- Cambio piano triggera Stripe subscription update
- Billing automatico
- Downgrade cancella subscription
- Upgrade crea nuova subscription

---

## 📊 Database Schema

### Table: `organizations`
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  plan_type VARCHAR(20) DEFAULT 'free',  -- free | basic | pro | enterprise
  email VARCHAR(255),
  logo_url TEXT,
  created_at TIMESTAMP
);
```

**Note**:
- `plan_type` è l'unica fonte di verità
- NO `subscription_features` table (deprecata)
- Sincronizzato con Stripe quando implementato

---

## 🎉 Vantaggi Sistema Unificato

1. ✅ **Unica fonte verità**: `organizations.plan_type`
2. ✅ **Sincronizzazione automatica**: Admin ↔ Dashboard
3. ✅ **15+ features**: Molto più completo del vecchio sistema
4. ✅ **Pronto per Stripe**: Basta collegare webhook
5. ✅ **Nessuna cache**: Sempre aggiornato
6. ✅ **Facile debugging**: Un solo posto da controllare
7. ✅ **Scalabile**: Aggiungi features in `planPermissions.ts`

---

## 📚 File Coinvolti

### Core System
- `src/utils/planPermissions.ts` - Definizione piani e features
- `src/components/Admin/SubscriptionFeaturesManagerV2.tsx` - Admin panel
- `src/components/OrganizationsDashboard.tsx` - Feature locking
- `src/components/UI/UpgradeModal.tsx` - Modal upgrade

### Database
- `organizations.plan_type` - Piano corrente
- ~~`subscription_features`~~ - DEPRECATA (non più usata)

### Routes
- `/admin/subscription-plans` - Gestione piani admin
- `/dashboard` - Dashboard organization con feature locks

---

## 🔮 Prossimi Step

1. **Stripe Integration** (Priorità Alta)
   - Collegare cambio piano → Stripe subscription
   - Webhook per sync automatico
   - Auto-billing mensile

2. **Email Notifications** (Priorità Media)
   - Email su cambio piano
   - Reminder scadenza trial
   - Upgrade/downgrade confirmations

3. **Usage Limits Enforcement** (Priorità Media)
   - Check maxCustomers prima di aggiungere
   - Block creation quando limite raggiunto
   - Show "upgrade to add more" prompts

4. **Analytics Dashboard** (Priorità Bassa)
   - Track upgrades/downgrades
   - Revenue per piano
   - Churn analysis

---

**Status**: ✅ **SISTEMA UNIFICATO ATTIVO**
**Testato**: 25 Novembre 2025
**Versione**: 2.0.0
