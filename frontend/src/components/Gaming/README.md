# 🎮 OMNILYPRO GAMING MODULE

Sistema completo di gamification per OmnilyPro. Include Badge System, Challenges, e Spin the Wheel.

## 📋 Indice

- [Caratteristiche](#caratteristiche)
- [Architettura](#architettura)
- [Installazione](#installazione)
- [Utilizzo](#utilizzo)
- [Componenti](#componenti)
- [Servizi](#servizi)
- [Permessi](#permessi)
- [Database](#database)

---

## ✨ Caratteristiche

### 1. 🏆 Badge System
- **15 badge predefiniti** con categorie (First Steps, Loyalty, Spending, Frequency, Social, Special)
- **Auto-unlock intelligente** basato su regole personalizzabili
- **4 livelli di rarità**: Common, Rare, Epic, Legendary
- **Rewards automatici**: punti, spin gratuiti, sconti
- **Notifiche animate** con confetti
- **Galleria visuale** con filtri e progress tracking

### 2. 🎯 Challenge System
- **Challenge giornaliere** (3) e **settimanali** (2)
- **Auto-generation** con 6 tipi di sfide predefinite
- **Progress tracking real-time**
- **Rewards on completion**: punti e spin gratuiti
- **Scadenza automatica** con countdown
- **Dashboard dedicata** con filtri

### 3. 🎡 Spin the Wheel
- **Ruota animata** con rotazione realistica (4s cubic-bezier)
- **8 settori configurabili** con probabilità personalizzate
- **Prize distribution**: punti, sconti, badge, spin gratuiti
- **Daily limits** (default 3 spin/giorno)
- **Discount code generation** automatica
- **Prize reveal modal** con confetti animation

---

## 🏗️ Architettura

```
Gaming Module
├── Components/
│   ├── GamingHub.tsx              # Dashboard principale
│   ├── GamingHubWrapper.tsx       # Wrapper con plan permissions
│   ├── BadgeGallery.tsx           # Galleria badge
│   ├── BadgeUnlockNotification.tsx # Toast notification
│   ├── ChallengesHub.tsx          # Dashboard challenges
│   └── SpinWheel.tsx              # Ruota animata
│
├── Services/
│   ├── badgeService.ts            # Badge CRUD + auto-unlock
│   ├── challengeService.ts        # Challenges CRUD + auto-gen
│   ├── spinService.ts             # Spin logic + prize distribution
│   └── types.ts                   # TypeScript interfaces
│
├── Database/
│   └── gaming-module-schema.sql   # 9 tabelle + views + triggers
│
└── Data/
    ├── gaming-predefined-badges.json    # 15 badge defaults
    └── gaming-predefined-challenges.json # 6 challenge templates
```

---

## 📦 Installazione

### 1. Database Setup

Esegui lo schema SQL:

```sql
-- Importa lo schema completo
psql -d omnilypro < database/gaming-module-schema.sql
```

Questo crea:
- 9 tabelle (configs, badges, challenges, wheel, spins, stats, notifications)
- 2 views (badge_stats_view, challenge_stats_view)
- Triggers per timestamp automatici
- Indici per performance

### 2. Seed Predefined Data

```typescript
import { badgeService } from './services/gaming/badgeService'
import { challengeService } from './services/gaming/challengeService'
import { spinService } from './services/gaming/spinService'

// Seed badges (15 predefiniti)
await badgeService.seedPredefinedBadges(organizationId)

// Seed challenges (6 templates)
await challengeService.seedPredefinedChallenges(organizationId)

// Seed wheel config (8 settori default)
await spinService.seedDefaultWheelConfig(organizationId)
```

### 3. Plan Permissions

Il Gaming Module è disponibile solo per piani **Professional** (€99/mese) ed **Enterprise** (€299/mese).

Permessi già configurati in `src/utils/planPermissions.ts`:

```typescript
[PlanType.PRO]: {
  gamingModule: true  // ✅ Abilitato
}

[PlanType.ENTERPRISE]: {
  gamingModule: true  // ✅ Abilitato
}
```

---

## 🚀 Utilizzo

### Gaming Hub (Dashboard Principale)

```tsx
import { GamingHubWrapper } from './components/Gaming'

function CustomerApp() {
  return (
    <GamingHubWrapper
      customerId={currentCustomer.id}
      organizationId={organization.id}
      organizationPlan={organization.subscription_plan}
      primaryColor="#dc2626"
      onUpgradeClick={() => router.push('/upgrade')}
    />
  )
}
```

Se l'organization NON ha il piano Pro+, verrà mostrato un upgrade prompt automaticamente.

### Badge Gallery (Standalone)

```tsx
import { BadgeGallery } from './components/Gaming'

<BadgeGallery
  customerId={customer.id}
  organizationId={org.id}
  primaryColor="#dc2626"
  onClose={() => setShowBadges(false)}
/>
```

### Challenges Hub (Standalone)

```tsx
import { ChallengesHub } from './components/Gaming'

<ChallengesHub
  customerId={customer.id}
  organizationId={org.id}
  primaryColor="#dc2626"
/>
```

### Spin Wheel (Standalone)

```tsx
import { SpinWheel } from './components/Gaming'

<SpinWheel
  customerId={customer.id}
  organizationId={org.id}
  primaryColor="#dc2626"
  onClose={() => setShowWheel(false)}
  onSpinComplete={(prize) => {
    console.log('Prize won:', prize)
  }}
/>
```

---

## 🧩 Componenti

### GamingHub

Dashboard principale che mostra overview di tutte le funzionalità gaming.

**Props:**
- `customerId` (string): ID del cliente
- `organizationId` (string): ID dell'organizzazione
- `primaryColor` (string, optional): Colore primario

**Features:**
- Stats cards (badge progress, challenges attive, spin disponibili)
- Preview recenti badge sbloccati
- Preview challenges in corso
- Spin wheel status
- CTAs per aprire singole feature

### GamingHubWrapper

Wrapper che gestisce plan-based access control.

**Props:**
- `customerId` (string)
- `organizationId` (string)
- `organizationPlan` (string): Piano subscription
- `primaryColor` (string, optional)
- `onUpgradeClick` (function, optional): Callback per upgrade

**Behavior:**
- Se plan = Pro/Enterprise → mostra `GamingHub`
- Altrimenti → mostra upgrade prompt con feature list

### BadgeGallery

Galleria visuale di tutti i badge (locked/unlocked).

**Features:**
- Filtri per categoria e rarità
- Badge cards con progress bar
- Animazioni unlock
- Legendary badges con pulse effect

### BadgeUnlockNotification

Toast notification animata per badge unlock.

**Features:**
- Confetti animation (20 pezzi)
- Badge icon + nome + descrizione
- Rewards display
- Auto-close dopo 5 secondi

### ChallengesHub

Dashboard delle challenge giornaliere e settimanali.

**Features:**
- Separazione daily/weekly
- Progress bars con percentuale
- Time remaining countdown
- Filtri: all/active/completed
- Completion badges

### SpinWheel

Ruota della fortuna animata.

**Features:**
- Rotazione 4s con cubic-bezier easing
- 8 settori con colori custom
- Pointer animato
- Prize reveal modal
- Spins counter
- Disabled state quando finiti

---

## ⚙️ Servizi

### badgeService

```typescript
// Get customer badges
const badges = await badgeService.getCustomerBadges(customerId)

// Check and unlock badges
const results = await badgeService.checkAndUnlockBadges(customerId, organizationId)

// Get badge stats
const stats = await badgeService.getBadgeStats(customerId)

// Seed predefined
await badgeService.seedPredefinedBadges(organizationId)
```

**Auto-unlock Rules:**
- `registration`: Al momento della registrazione
- `purchase_count`: Dopo N acquisti
- `total_spent`: Dopo aver speso €X
- `visit_count`: Dopo N visite
- `points_reached`: Dopo aver raggiunto X punti
- `days_since_registration`: Dopo X giorni
- `reward_redeemed`: Dopo aver riscattato un premio
- `referrals`: Dopo X referral
- `challenges_completed`: Dopo X challenges
- `streak_days`: Dopo X giorni consecutivi
- `tier_reached`: Al raggiungimento tier loyalty

### challengeService

```typescript
// Get customer challenges
const challenges = await challengeService.getCustomerChallenges(customerId)

// Generate daily challenges
await challengeService.generateDailyChallenges(customerId, organizationId)

// Generate weekly challenges
await challengeService.generateWeeklyChallenges(customerId, organizationId)

// Update progress
await challengeService.updateChallengeProgress(
  customerId,
  'make_purchases',
  1
)

// Seed templates
await challengeService.seedPredefinedChallenges(organizationId)
```

**Challenge Types:**
- `make_purchases`: Completa N acquisti
- `spend_amount`: Spendi €X
- `earn_points`: Guadagna X punti
- `redeem_rewards`: Riscatta N premi
- `visit_count`: Visita N volte
- `referrals`: Invita N amici

### spinService

```typescript
// Check if can spin
const { canSpin, spinsToday, maxSpins } = await spinService.canSpin(
  customerId,
  organizationId
)

// Spin the wheel
const result = await spinService.spinWheel(customerId, organizationId)

if (result.success) {
  console.log('Prize:', result.prize_won)
  console.log('Sector:', result.sector_landed)
}

// Get wheel config
const config = await spinService.getWheelConfig(organizationId)

// Update config
await spinService.updateWheelConfig(organizationId, {
  name: 'Ruota Custom',
  sectors: customSectors,
  max_spins_per_day: 5
})
```

**Prize Types:**
- `points`: Punti loyalty (auto-aggiunti)
- `discount`: Sconto % con codice generato
- `free_spin`: Spin gratuiti extra
- `badge`: Badge speciale
- `reward`: Premio auto-riscattato
- `nothing`: Riprova (nessun premio)

---

## 🔐 Permessi

### Plan-Based Access

```typescript
import { hasAccess, getPlanFeatures } from './utils/planPermissions'

// Check access
const canUseGaming = hasAccess(organization.subscription_plan, 'gamingModule')

// Get all features for plan
const features = getPlanFeatures(organization.subscription_plan)
console.log(features.gamingModule) // true/false

// Get required upgrade plan
const upgradeTo = getUpgradePlan(currentPlan, 'gamingModule')
// Returns: 'pro' | 'enterprise' | null
```

### Plan Matrix

| Feature | Free | Basic | **Pro** | Enterprise |
|---------|------|-------|---------|------------|
| Gaming Module | ❌ | ❌ | **✅** | **✅** |

---

## 🗃️ Database

### Tabelle Principali

**gaming_config**
- Configurazione generale gaming per org
- Active/inactive status

**gaming_badges**
- Badge definitions (15 predefiniti)
- Unlock rules + rewards

**customer_badges**
- Badge unlocked per customer
- Progress tracking

**gaming_challenges**
- Challenge templates (6 predefiniti)

**customer_challenges**
- Challenges assegnate a customer
- Progress + status

**gaming_wheel_configs**
- Configurazione ruota per org
- 8 settori + probabilità

**customer_wheel_spins**
- Storia spin del customer
- Prize won + sector landed

**gaming_stats**
- Statistiche aggregate

**gaming_notifications**
- Notifiche gaming (badge unlock, etc.)

### Views

**badge_stats_view**
```sql
SELECT
  customer_id,
  COUNT(*) as total_badges,
  COUNT(CASE WHEN unlocked THEN 1 END) as unlocked_count,
  ROUND(AVG(CASE WHEN unlocked THEN progress ELSE 0 END), 2) as avg_progress
FROM customer_badges
GROUP BY customer_id
```

**challenge_stats_view**
```sql
SELECT
  customer_id,
  COUNT(*) as total_challenges,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
  ROUND(AVG(progress_percentage), 2) as avg_progress
FROM customer_challenges
GROUP BY customer_id
```

---

## 🎨 Customization

### Theme Colors

Tutti i componenti supportano `primaryColor` prop:

```tsx
<GamingHub primaryColor="#10b981" /> // Verde
<SpinWheel primaryColor="#a855f7" /> // Viola
```

I colori vengono applicati tramite CSS variables:

```css
--primary-color: #dc2626;
```

### Wheel Configuration

Personalizza i settori della ruota:

```typescript
await spinService.updateWheelConfig(organizationId, {
  name: 'Ruota Personalizzata',
  sectors: [
    { id: 1, label: 'Prize 1', type: 'points', value: 50, color: '#3b82f6', probability: 30 },
    { id: 2, label: 'Prize 2', type: 'discount', value: 15, color: '#10b981', probability: 20 },
    // ... altri settori
  ],
  max_spins_per_day: 5,
  cooldown_hours: 0
})
```

### Badge Custom

Aggiungi nuovi badge:

```typescript
await badgeService.createBadge(organizationId, {
  name: 'Super VIP',
  description: 'Hai raggiunto lo status VIP!',
  icon_emoji: '👑',
  category: 'special',
  rarity: 'legendary',
  unlock_rules: {
    type: 'total_spent',
    target_value: 1000
  },
  rewards: {
    points: 500,
    free_spins: 3
  }
})
```

### Challenge Templates

Aggiungi nuove challenge:

```typescript
await challengeService.createChallenge(organizationId, {
  title: 'Shopping Spree',
  description: 'Fai 5 acquisti in una settimana',
  type: 'weekly',
  icon_emoji: '🛍️',
  challenge_type: 'make_purchases',
  target_value: 5,
  rewards: {
    points: 200,
    free_spins: 2
  }
})
```

---

## 🔧 Cron Jobs

Per auto-generare challenges giornaliere/settimanali:

```typescript
// cron/daily-challenges.ts
import { challengeService } from '../services/gaming/challengeService'

export async function generateDailyChallenges() {
  // Get all organizations with gaming enabled
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, customers(id)')
    .eq('subscription_plan', 'pro')

  for (const org of orgs) {
    for (const customer of org.customers) {
      await challengeService.generateDailyChallenges(
        customer.id,
        org.id
      )
    }
  }
}

// Run at midnight
// 0 0 * * * node cron/daily-challenges.js
```

---

## 📊 Analytics

### Statistiche Disponibili

```typescript
// Badge stats
const badgeStats = await badgeService.getBadgeStats(customerId)
// { total_badges, unlocked_count, avg_progress, completion_rate }

// Challenge stats
const challengeStats = await challengeService.getChallengeStats(customerId)
// { total_challenges, completed_count, avg_progress }

// Spin stats
const spinHistory = await spinService.getCustomerSpins(customerId, 50)
// Array di tutti gli spin con prize won
```

### Dashboard Widgets

Integra nel dashboard analytics:

```tsx
<div className="gaming-analytics">
  <StatCard title="Badge Unlocked" value={`${stats.unlocked}/${stats.total}`} />
  <StatCard title="Challenges Completate" value={stats.challengesCompleted} />
  <StatCard title="Total Spins" value={stats.totalSpins} />
  <StatCard title="Premi Vinti" value={stats.prizesWon} />
</div>
```

---

## 🐛 Troubleshooting

### Badge non si sbloccano automaticamente

Verifica che:
1. Customer activities vengano registrate correttamente
2. Auto-unlock rules siano corrette
3. `checkAndUnlockBadges()` venga chiamato dopo le attività

```typescript
// Dopo un acquisto
await supabase.from('customer_activities').insert({ ... })
await badgeService.checkAndUnlockBadges(customerId, organizationId)
```

### Challenges non si auto-generano

1. Verifica che esistano i template: `seedPredefinedChallenges()`
2. Controlla che il cron job sia attivo
3. Verifica che le challenges scadute vengano rimosse

### Spin wheel non gira

1. Verifica `canSpin()` → spinsLeft > 0
2. Controlla wheel config esiste: `getWheelConfig()`
3. Seed default config: `seedDefaultWheelConfig()`

---

## 📝 TODO Future

- [ ] Leaderboards (classifica globale)
- [ ] Achievements multi-step (progressivi)
- [ ] Daily login streaks UI
- [ ] Push notifications per badge unlock
- [ ] Social sharing (badge ottenuti)
- [ ] Reward marketplace integration
- [ ] Multiplayer challenges
- [ ] Seasonal events
- [ ] Admin dashboard per configurazione
- [ ] A/B testing per probabilità wheel

---

## 🤝 Support

Per domande o problemi:
- Documentation: `/docs/gaming-module`
- Support: support@omnilypro.com
- GitHub Issues: [omnilypro/issues](https://github.com/omnilypro/issues)

---

## 📄 License

© 2025 OmnilyPro - Tutti i diritti riservati
