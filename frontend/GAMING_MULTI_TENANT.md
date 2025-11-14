# 🏢 GAMING MODULE - ARCHITETTURA MULTI-TENANT

Guida completa su come funziona il Gaming Module in un ambiente multi-tenant.

---

## 🎯 Overview

Il Gaming Module di OmnilyPro è **completamente multi-tenant**. Ogni organizzazione che ha un piano **Pro** (€99/mese) o **Enterprise** (€299/mese) ha accesso al proprio Gaming Module isolato e personalizzabile.

---

## 🏗️ Architettura Database

### Isolamento Dati per Organizzazione

Tutte le tabelle Gaming hanno la colonna `organization_id` come foreign key:

```sql
-- Badge System
gaming_badges (organization_id) → Badge templates per ORG
customer_badges (customer_id) → Badge progress per CUSTOMER

-- Challenge System
gaming_challenges (organization_id) → Challenge templates per ORG
customer_challenges (customer_id) → Challenge progress per CUSTOMER

-- Spin Wheel
gaming_wheel_configs (organization_id) → Ruota config per ORG
customer_wheel_spins (customer_id) → Spin history per CUSTOMER

-- Stats & Notifications
gaming_stats (organization_id) → Analytics per ORG
gaming_notifications (customer_id) → Notifiche per CUSTOMER
```

### Gerarchia Dati

```
Organization A (Pro Plan)
├── 15 Badge Templates
├── 6 Challenge Templates
├── Wheel Config (8 sectors)
├── Customer 1
│   ├── 5 Badges Unlocked
│   ├── 3 Daily Challenges (active)
│   ├── 2 Spins Used Today
│   └── Notifications
└── Customer 2
    ├── 8 Badges Unlocked
    ├── 5 Challenges Completed
    └── 3 Spins Used Today

Organization B (Enterprise Plan)
├── 15 Badge Templates (separate set)
├── 6 Challenge Templates (separate set)
├── Wheel Config (customized 10 sectors!)
└── Customer 1
    ├── 12 Badges Unlocked
    └── ...
```

**Ogni organizzazione ha dati completamente isolati.**

---

## 🔐 Plan-Based Access Control

### Permission Matrix

| Feature | Free | Basic | **Pro** | **Enterprise** |
|---------|------|-------|---------|----------------|
| Gaming Module | ❌ | ❌ | **✅** | **✅** |
| Badge System | ❌ | ❌ | ✅ | ✅ |
| Challenges | ❌ | ❌ | ✅ | ✅ |
| Spin Wheel | ❌ | ❌ | ✅ | ✅ |
| Custom Badge Config | ❌ | ❌ | ❌ | ✅ |
| Custom Wheel Sectors | ❌ | ❌ | ❌ | ✅ |

### Come Funziona

1. **GamingHubWrapper** verifica il piano dell'organizzazione
2. Se Piano = Pro/Enterprise → Mostra **GamingHub completo**
3. Se Piano = Free/Basic → Mostra **Upgrade Prompt**

```tsx
import { GamingHubWrapper } from './components/Gaming'

// Multi-tenant ready - funziona per qualsiasi organizzazione
<GamingHubWrapper
  customerId={customer.id}
  organizationId={organization.id}
  organizationPlan={organization.subscription_plan} // 'pro' | 'enterprise'
  primaryColor={organization.primary_color}
  onUpgradeClick={() => router.push('/upgrade')}
/>
```

---

## 🚀 Auto-Setup per Nuove Organizzazioni

### Setup Automatico al Primo Accesso

Il Gaming Module si **auto-configura** quando un'organizzazione Pro/Enterprise accede per la prima volta:

```typescript
// src/services/gaming/gamingSetupService.ts

async ensureSetup(organizationId: string) {
  // 1. Check if already setup
  const isSetup = await this.isSetup(organizationId)

  if (isSetup) {
    return { success: true, alreadySetup: true }
  }

  // 2. First time! Auto-setup
  await badgeService.seedPredefinedBadges(organizationId)      // 15 badges
  await challengeService.seedPredefinedChallenges(organizationId) // 6 challenges
  await spinService.seedDefaultWheelConfig(organizationId)     // 8 sectors

  return { success: true, alreadySetup: false }
}
```

### Quando Viene Chiamato?

**Automaticamente** quando:
1. Un customer apre il GamingHub per la prima volta
2. GamingHub.tsx chiama `gamingSetupService.ensureSetup()`
3. Se l'organizzazione NON ha ancora dati Gaming → auto-setup!

**Nessun intervento manuale richiesto!** ✨

---

## 👥 Auto-Setup per Nuovi Customer

Quando un customer accede al Gaming per la prima volta:

```typescript
async ensureCustomerInitialized(customerId: string, organizationId: string) {
  const isInitialized = await this.isCustomerInitialized(customerId)

  if (!isInitialized) {
    // Generate initial challenges
    await challengeService.generateDailyChallenges(customerId, organizationId)
    await challengeService.generateWeeklyChallenges(customerId, organizationId)

    // Check for auto-unlock badges (e.g., "Welcome" badge)
    await badgeService.checkAndUnlockBadges(customerId, organizationId)
  }
}
```

Ogni customer riceve automaticamente:
- ✅ 3 challenge giornaliere
- ✅ 2 challenge settimanali
- ✅ Badge "Benvenuto" sbloccato
- ✅ Altri badge basati su attività esistenti

---

## 🛠️ Setup Manuale (Opzionale)

### Setup Singola Organizzazione

Se vuoi fare setup manuale per testing:

```bash
npm run setup-gaming YOUR_ORG_ID
```

Esempio:
```bash
npm run setup-gaming a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### Setup TUTTE le Organizzazioni Pro/Enterprise

Per fare setup bulk di tutte le org eligibili:

```bash
npm run setup-gaming-all
```

Questo script:
1. ✅ Trova tutte le organizzazioni con piano Pro/Enterprise
2. ✅ Fa setup Gaming per ognuna (se non già fatto)
3. ✅ Genera challenge per tutti i customer esistenti
4. ✅ Sblocca badge automatici
5. ✅ Mostra report completo

Output esempio:
```
🎮 GAMING MODULE MULTI-TENANT SETUP
==================================================

1️⃣  Trovate 45 organizzazioni totali

2️⃣  Organizzazioni con accesso Gaming Module:
   ✅ 12 organizzazioni Pro/Enterprise
   ℹ️  33 organizzazioni senza accesso (Free/Basic)

3️⃣  Setup in corso...
   📦 Ristorante La Dolce Vita (pro)
      ✅ 15 badge | 6 challenges | Ruota configurata

   📦 Bar Centrale (enterprise)
      ✅ 15 badge | 6 challenges | Ruota configurata

   ... (altre 10 organizzazioni)

📊 RIEPILOGO:
   ✅ 12/12 setup completati
   👤 156 customer processati
```

---

## 🔄 Workflow Multi-Tenant

### Scenario: Nuova Organizzazione si Iscrive a Pro

1. **Admin crea organizzazione** con piano "Pro"
2. **Organizzazione fa onboarding** e crea primi customer
3. **Customer apre l'app** e naviga alla sezione Gaming
4. **GamingHubWrapper** verifica piano → ✅ Pro
5. **GamingHub** si carica → chiama `ensureSetup(organizationId)`
6. **Auto-setup** rileva prima volta → crea badge/challenges/wheel
7. **Customer vede Gaming Hub** completamente funzionante!

**Nessun intervento manuale!** 🎉

### Scenario: Organizzazione Upgrade da Basic a Pro

1. **Admin aggiorna piano** da Basic → Pro
2. **Customer apre Gaming** (ora disponibile)
3. **Auto-setup** configura Gaming Module
4. **Customer inizia a usare** badge/challenges/spin

### Scenario: Organizzazione Downgrade da Pro a Basic

1. **Admin downgrade piano** Pro → Basic
2. **GamingHubWrapper** rileva piano Basic
3. **Mostra upgrade prompt** invece del Gaming Hub
4. **Dati Gaming restano** nel database (non vengono cancellati)
5. **Se ri-upgrade a Pro** → tutto torna disponibile!

---

## 🎨 Personalizzazione per Organizzazione

### 1. Colori Personalizzati

Ogni organizzazione può avere il proprio colore primario:

```tsx
<GamingHub
  customerId={customer.id}
  organizationId={org.id}
  primaryColor={org.primary_color} // Es: "#10b981" per verde
/>
```

Tutti i componenti Gaming usano CSS variables:
```css
--primary-color: #10b981;
```

### 2. Badge Personalizzati (Enterprise Only)

Le organizzazioni Enterprise possono creare badge custom:

```typescript
await badgeService.createBadge(organizationId, {
  name: 'VIP Cliente',
  description: 'Sei un cliente VIP del nostro ristorante!',
  icon_emoji: '👑',
  category: 'special',
  rarity: 'legendary',
  unlock_rules: {
    type: 'total_spent',
    target_value: 1000  // €1000 spesi
  },
  rewards: {
    points: 500,
    free_spins: 5
  }
})
```

### 3. Challenge Personalizzate (Enterprise Only)

```typescript
await challengeService.createChallenge(organizationId, {
  title: 'Weekend Warrior',
  description: 'Visita il ristorante 3 volte nel weekend',
  type: 'weekly',
  icon_emoji: '🍽️',
  challenge_type: 'visit_count',
  target_value: 3,
  custom_rules: {
    only_weekend: true  // Sabato/Domenica
  },
  rewards: {
    points: 300,
    free_spins: 2
  }
})
```

### 4. Ruota Personalizzata (Enterprise Only)

```typescript
await spinService.updateWheelConfig(organizationId, {
  name: 'Ruota VIP',
  sectors: [
    { id: 1, label: 'Pizza Gratis!', type: 'reward', value: 'pizza_gratis', color: '#ef4444', probability: 5 },
    { id: 2, label: '100 Punti', type: 'points', value: 100, color: '#3b82f6', probability: 20 },
    // ... custom sectors
  ],
  max_spins_per_day: 5,  // Pro: 3, Enterprise: 5+
  trigger_rules: {
    on_purchase: true,
    min_purchase_amount: 20  // Spin gratis sopra €20
  }
})
```

---

## 📊 Analytics Multi-Tenant

### Dashboard Admin

Ogni organizzazione vede solo le proprie stats:

```sql
-- Stats organization-specific
SELECT
  COUNT(*) as total_customers,
  SUM(unlocked_badges) as total_badges_unlocked,
  SUM(challenges_completed) as total_challenges_completed,
  SUM(spins_used) as total_spins
FROM gaming_stats
WHERE organization_id = 'ORG_ID';
```

### Global Admin (Super Admin)

Il super admin può vedere stats aggregate di tutte le org:

```sql
-- Top organizations by Gaming engagement
SELECT
  o.name,
  COUNT(DISTINCT cb.customer_id) as active_gamers,
  SUM(cb.unlocked) as badges_unlocked,
  COUNT(DISTINCT cws.customer_id) as spin_users
FROM organizations o
LEFT JOIN gaming_badges gb ON o.id = gb.organization_id
LEFT JOIN customer_badges cb ON gb.id = cb.badge_id
LEFT JOIN customer_wheel_spins cws ON o.id = cws.organization_id
WHERE o.subscription_plan IN ('pro', 'enterprise')
GROUP BY o.id, o.name
ORDER BY active_gamers DESC
LIMIT 10;
```

---

## 🔒 Sicurezza & Privacy

### Row Level Security (RLS)

Tutte le tabelle Gaming hanno RLS policies:

```sql
-- Esempio: customer_badges
CREATE POLICY "Users can only see own badges"
  ON customer_badges
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers
      WHERE organization_id = auth.jwt() ->> 'organization_id'
    )
  );

-- Admin can see all badges of their organization
CREATE POLICY "Org admin sees all org badges"
  ON gaming_badges
  FOR SELECT
  USING (organization_id = auth.jwt() ->> 'organization_id');
```

### Isolamento Garantito

- ❌ Organization A **NON può vedere** dati di Organization B
- ❌ Customer di Org A **NON può sbloccare** badge di Org B
- ❌ Admin di Org A **NON può modificare** config di Org B
- ✅ Ogni org ha **spazio isolato e sicuro**

---

## 🚀 Deployment & Scalabilità

### Performance Multi-Tenant

Il Gaming Module è ottimizzato per migliaia di organizzazioni:

**Database Indexes:**
```sql
CREATE INDEX idx_gaming_badges_org ON gaming_badges(organization_id);
CREATE INDEX idx_customer_badges_customer ON customer_badges(customer_id);
CREATE INDEX idx_challenges_org ON gaming_challenges(organization_id);
CREATE INDEX idx_customer_challenges_customer ON customer_challenges(customer_id);
CREATE INDEX idx_wheel_spins_customer ON customer_wheel_spins(customer_id, spun_at);
```

**Caching Strategy:**
- Badge templates: cache 1 ora (raramente cambiano)
- Customer badges: real-time (cambiano spesso)
- Wheel config: cache 30 min
- Challenge templates: cache 1 ora

### Horizontal Scaling

Il Gaming Module può scalare orizzontalmente:
- **Database**: Supabase auto-scaling
- **Frontend**: CDN per assets statici
- **API**: Serverless functions per auto-unlock

---

## 📋 Checklist Setup Produzione

### Pre-Launch

- [ ] Database schema eseguito (gaming-module-schema.sql)
- [ ] RLS policies attive su tutte le tabelle
- [ ] Indexes creati per performance
- [ ] Backup policy configurata

### Launch

- [ ] Script setup-gaming-all eseguito per org esistenti
- [ ] Auto-setup testato per nuove org
- [ ] Plan permissions verificate (Free/Basic = no access)
- [ ] Upgrade flow testato

### Post-Launch

- [ ] Monitoring analytics attivo
- [ ] Badge unlock rate monitorato
- [ ] Spin conversion tracked
- [ ] Customer feedback raccolto

### Opzionale

- [ ] Cron job per auto-generate daily challenges (midnight)
- [ ] Cron job per auto-generate weekly challenges (Monday)
- [ ] Cron job per cleanup expired challenges
- [ ] Alert per anomalie (es: spin rate troppo alto)

---

## 🎯 Best Practices

### 1. **Sempre Usa organization_id**

```typescript
// ❌ WRONG - no organization isolation
const badges = await supabase
  .from('gaming_badges')
  .select('*')

// ✅ CORRECT - organization-specific
const badges = await supabase
  .from('gaming_badges')
  .select('*')
  .eq('organization_id', organizationId)
```

### 2. **Verifica Piano Prima di Mostrare UI**

```typescript
// ✅ CORRECT
if (hasAccess(organization.subscription_plan, 'gamingModule')) {
  return <GamingHub ... />
} else {
  return <UpgradePrompt ... />
}
```

### 3. **Affidati all'Auto-Setup**

```typescript
// ✅ CORRECT - auto-setup gestisce tutto
await gamingSetupService.ensureSetup(organizationId)

// ❌ WRONG - setup manuale non necessario
// await badgeService.seedPredefinedBadges(organizationId)
```

### 4. **Non Mixare Dati Cross-Organization**

```typescript
// ❌ WRONG - leaderboard cross-org
const topUsers = await supabase
  .from('customer_badges')
  .select('*, customer:customers(*)')
  .eq('unlocked', true)
  .order('unlocked_at', { ascending: false })

// ✅ CORRECT - leaderboard per organization
const topUsers = await supabase
  .from('customer_badges')
  .select('*, customer:customers!inner(*)')
  .eq('customer.organization_id', organizationId)
  .eq('unlocked', true)
  .order('unlocked_at', { ascending: false })
```

---

## 🎉 Conclusione

Il Gaming Module è **production-ready** e **multi-tenant compliant**!

### Key Points:

✅ **Auto-setup** per nuove organizzazioni Pro/Enterprise
✅ **Isolamento completo** dei dati tra organizzazioni
✅ **Plan-based access** con upgrade prompts
✅ **Scalabile** per migliaia di organizzazioni
✅ **Sicuro** con RLS e validazioni
✅ **Personalizzabile** (Enterprise custom configs)
✅ **Zero configurazione** manuale richiesta

---

## 📚 Risorse

- **Setup Singola Org:** `npm run setup-gaming ORG_ID`
- **Setup Tutte le Org:** `npm run setup-gaming-all`
- **Test Page:** `http://localhost:5173/gaming-test`
- **Docs Completa:** `src/components/Gaming/README.md`
- **Guide Testing:** `GAMING_TESTING_GUIDE.md`

---

© 2025 OmnilyPro - Multi-Tenant Gaming Module
