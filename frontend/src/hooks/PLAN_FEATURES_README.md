# Piano Features System - Guida all'Uso

Sistema automatico di controllo e enforcement delle funzionalità basate sul piano di abbonamento.

## Componenti

### 1. `usePlanFeatures` Hook

Hook React per verificare features e limiti del piano corrente.

```typescript
import { usePlanFeatures } from '../hooks/usePlanFeatures'

function MyComponent() {
  const { hasFeature, checkLimit, canUseFeature, plan } = usePlanFeatures()

  // Controlla se una feature è disponibile
  if (!hasFeature('emailMarketing')) {
    return <UpgradePrompt />
  }

  // Controlla limiti
  const { allowed, remaining } = checkLimit('maxCustomers', currentCustomerCount)
  if (!allowed) {
    return <LimitReachedMessage />
  }

  return <YourComponent />
}
```

### 2. `FeatureGate` Component

Componente wrapper che blocca automaticamente features non disponibili.

```typescript
import { FeatureGate } from '../components/FeatureGate'

function App() {
  return (
    <FeatureGate feature="emailMarketing">
      <EmailMarketingDashboard />
    </FeatureGate>
  )
}

// Con fallback personalizzato
<FeatureGate
  feature="smsMarketing"
  fallback={<div>SMS Marketing non disponibile</div>}
>
  <SMSCampaigns />
</FeatureGate>

// Nascondere senza mostrare upgrade prompt
<FeatureGate feature="apiAccess" showUpgradePrompt={false}>
  <APISettings />
</FeatureGate>
```

### 3. `LimitGate` Component

Componente per controllare i limiti e mostrare avvisi.

```typescript
import { LimitGate } from '../components/FeatureGate'

function CustomerList() {
  const customerCount = customers.length

  return (
    <LimitGate
      limit="maxCustomers"
      currentValue={customerCount}
      onLimitReached={() => console.log('Limite raggiunto!')}
    >
      <AddCustomerButton />
    </LimitGate>
  )
}
```

## Esempi di Integrazione

### Email Marketing (Con Feature + Limiti Automatici)

```typescript
// src/pages/EmailMarketing.tsx
import { FeatureWithLimitGate } from '../components/FeatureWithLimitGate'

export default function EmailMarketing() {
  const emailsSentThisMonth = 450 // Da calcolare dal DB

  return (
    <FeatureWithLimitGate
      feature="emailMarketing"
      currentUsage={{ maxEmailsPerMonth: emailsSentThisMonth }}
    >
      <div>
        <h1>Email Marketing</h1>
        <SendEmailButton />
        <EmailCampaignList />
      </div>
    </FeatureWithLimitGate>
  )
}
```

### Email Marketing (Manuale)

```typescript
// src/pages/EmailMarketing.tsx
import { FeatureGate, LimitGate } from '../components/FeatureGate'
import { usePlanFeatures } from '../hooks/usePlanFeatures'

export default function EmailMarketing() {
  const { checkLimit } = usePlanFeatures()

  return (
    <FeatureGate feature="emailMarketing">
      <div>
        <h1>Email Marketing</h1>

        <LimitGate
          limit="maxEmailsPerMonth"
          currentValue={emailsSentThisMonth}
        >
          <SendEmailButton />
        </LimitGate>

        <EmailCampaignList />
      </div>
    </FeatureGate>
  )
}
```

### POS System

```typescript
// src/pages/POS.tsx
import { usePlanFeatures } from '../hooks/usePlanFeatures'

export default function POSPage() {
  const { hasFeature } = usePlanFeatures()

  if (!hasFeature('posEnabled')) {
    return (
      <div className="upgrade-prompt">
        <h2>Sistema POS non disponibile</h2>
        <p>Effettua l'upgrade al piano Premium o Enterprise</p>
        <button onClick={() => navigate('/admin/subscriptions')}>
          Upgrade Piano
        </button>
      </div>
    )
  }

  return <POSInterface />
}
```

### Analytics Avanzate

```typescript
// src/components/Analytics/AdvancedCharts.tsx
import { FeatureGate } from '../components/FeatureGate'

export function AdvancedCharts() {
  return (
    <FeatureGate
      feature="advancedAnalytics"
      fallback={<BasicCharts />}
    >
      <div>
        <RevenueForecasting />
        <CustomerSegmentation />
        <ConversionFunnels />
      </div>
    </FeatureGate>
  )
}
```

### Menu Condizionale

```typescript
// src/components/Sidebar.tsx
import { usePlanFeatures } from '../hooks/usePlanFeatures'

export function Sidebar() {
  const { hasFeature } = usePlanFeatures()

  return (
    <nav>
      <MenuItem to="/dashboard">Dashboard</MenuItem>
      <MenuItem to="/customers">Clienti</MenuItem>

      {hasFeature('emailMarketing') && (
        <MenuItem to="/email-marketing">Email Marketing</MenuItem>
      )}

      {hasFeature('smsMarketing') && (
        <MenuItem to="/sms-campaigns">SMS Campaigns</MenuItem>
      )}

      {hasFeature('advancedAnalytics') && (
        <MenuItem to="/analytics">Analytics Avanzate</MenuItem>
      )}

      {hasFeature('apiAccess') && (
        <MenuItem to="/api">API</MenuItem>
      )}
    </nav>
  )
}
```

## Features Disponibili

Da `PlanFeatures`:
- `posEnabled` - Sistema POS
- `emailMarketing` - Email Marketing
- `smsMarketing` - SMS Marketing
- `whatsappMarketing` - WhatsApp Marketing
- `customBranding` - Branding personalizzato
- `customDomain` - Dominio personalizzato
- `apiAccess` - Accesso API
- `advancedAnalytics` - Analytics avanzate
- `automations` - Automazioni
- `loyaltyPrograms` - Programmi fedeltà
- `giftCards` - Gift Cards
- `subscriptions` - Abbonamenti clienti
- `multiLocation` - Multi-sede
- `teamManagement` - Gestione team
- `prioritySupport` - Supporto prioritario
- `websiteBuilder` - Website Builder
- `mobileApp` - App Mobile

## Limiti Disponibili

Da `PlanLimits`:
- `maxCustomers` - Max clienti
- `maxTeamMembers` - Max membri team
- `maxLocations` - Max sedi
- `maxEmailsPerMonth` - Max email al mese
- `maxSMSPerMonth` - Max SMS al mese
- `maxAutomations` - Max automazioni
- `maxLoyaltyPrograms` - Max programmi fedeltà
- `maxWorkflows` - Max workflows
- `maxNotifications` - Max notifiche al mese

### Controllo Feature + Limiti con Hook

```typescript
import { useFeatureWithLimit } from '../components/FeatureWithLimitGate'

function SendEmailButton() {
  const emailsSent = 450
  const { canUse, reason, limitReached } = useFeatureWithLimit(
    'emailMarketing',
    { maxEmailsPerMonth: emailsSent }
  )

  if (!canUse) {
    return (
      <button disabled title={reason}>
        ❌ {reason}
      </button>
    )
  }

  return <button onClick={sendEmail}>Invia Email</button>
}
```

## Best Practices

1. **Usa `FeatureWithLimitGate` per controlli completi**
   ```typescript
   <FeatureWithLimitGate
     feature="emailMarketing"
     currentUsage={{ maxEmailsPerMonth: count }}
   >
     <EmailFeatures />
   </FeatureWithLimitGate>
   ```

2. **Usa `FeatureGate` per UI Components senza limiti**
   ```typescript
   <FeatureGate feature="emailMarketing">
     <EmailDashboard />
   </FeatureGate>
   ```

2. **Usa `hasFeature` per logica condizionale**
   ```typescript
   if (hasFeature('apiAccess')) {
     // Enable API features
   }
   ```

3. **Usa `checkLimit` prima di operazioni**
   ```typescript
   const { allowed } = checkLimit('maxCustomers', currentCount)
   if (!allowed) {
     showUpgradeDialog()
     return
   }
   // Proceed with adding customer
   ```

4. **Mostra upgrade prompts contestuali**
   ```typescript
   <FeatureGate feature="smsMarketing" showUpgradePrompt={true}>
     <SMSFeatures />
   </FeatureGate>
   ```

5. **Nascondi features premium nei menu**
   ```typescript
   {hasFeature('advancedAnalytics') && <AnalyticsMenuItem />}
   ```
