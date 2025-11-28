# 💳 OMNILY PRO - Guida Implementazione Stripe

**Data:** 27 Novembre 2024  
**Obiettivo:** Implementare sistema pagamenti abbonamenti con Stripe in modalità test  
**Timeline:** 2-3 giorni di sviluppo

---

## 🎯 OBIETTIVO

Implementare il sistema di pagamenti ricorrenti per i piani OMNILY PRO:
- **Basic:** €29/mese
- **PRO:** €99/mese  
- **Enterprise:** €299/mese

**Modalità:** Test/Sandbox (nessun pagamento reale)

---

## 📋 PREREQUISITI

### Account e Chiavi
```bash
# 1. Crea account Stripe (se non ce l'hai)
https://dashboard.stripe.com/register

# 2. Ottieni chiavi API (modalità TEST)
Dashboard → Developers → API keys

STRIPE_PUBLISHABLE_KEY_TEST=pk_test_...
STRIPE_SECRET_KEY_TEST=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Variabili Ambiente
```bash
# File: supabase/.env.local
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# File: frontend/.env.local
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51...
```

---

## 🏗️ FASE 1: SETUP STRIPE DASHBOARD

### Step 1.1: Crea Prodotti

**Vai su:** Dashboard → Products → Create product

#### Prodotto 1: OMNILY PRO Basic
```
Nome: OMNILY PRO - Basic
Descrizione: Piano Basic con funzionalità essenziali
Prezzo: €29.00 EUR / mese
Ricorrenza: Mensile
ID Prezzo: price_basic_monthly (salva questo!)
```

#### Prodotto 2: OMNILY PRO Pro
```
Nome: OMNILY PRO - Pro
Descrizione: Piano Pro con AI e funzionalità avanzate
Prezzo: €99.00 EUR / mese
Ricorrenza: Mensile
ID Prezzo: price_pro_monthly (salva questo!)
```

#### Prodotto 3: OMNILY PRO Enterprise
```
Nome: OMNILY PRO - Enterprise
Descrizione: Piano Enterprise con tutto incluso
Prezzo: €299.00 EUR / mese
Ricorrenza: Mensile
ID Prezzo: price_enterprise_monthly (salva questo!)
```

### Step 1.2: Configura Webhook

**Vai su:** Dashboard → Developers → Webhooks → Add endpoint

```
Endpoint URL: https://[tuo-progetto].supabase.co/functions/v1/stripe-webhook
Eventi da ascoltare:
  ✅ checkout.session.completed
  ✅ customer.subscription.created
  ✅ customer.subscription.updated
  ✅ customer.subscription.deleted
  ✅ invoice.payment_succeeded
  ✅ invoice.payment_failed

Salva il Webhook Secret: whsec_...
```

---

## 🔧 FASE 2: BACKEND - SUPABASE EDGE FUNCTIONS

### Step 2.1: Crea Edge Function per Checkout

```bash
# Crea nuova function
cd /Users/pasqualelucci/omnilypro-clean/supabase/functions
mkdir stripe-checkout
cd stripe-checkout
```

**File:** `supabase/functions/stripe-checkout/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  try {
    const { organizationId, priceId, userEmail } = await req.json()

    // Crea sessione Checkout Stripe
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [
        {
          price: priceId, // price_basic_monthly, price_pro_monthly, etc.
          quantity: 1,
        },
      ],
      metadata: {
        organization_id: organizationId,
      },
      success_url: `${req.headers.get('origin')}/dashboard?payment=success`,
      cancel_url: `${req.headers.get('origin')}/pricing?payment=cancelled`,
    })

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url 
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
```

### Step 2.2: Crea Edge Function per Webhook

**File:** `supabase/functions/stripe-webhook/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message)
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
    })
  }

  console.log('✅ Webhook event received:', event.type)

  // Gestisci eventi
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutCompleted(session)
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionUpdated(subscription)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionDeleted(subscription)
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      await handlePaymentSucceeded(invoice)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      await handlePaymentFailed(invoice)
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
})

// Handler: Checkout completato
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const orgId = session.metadata?.organization_id

  if (!orgId) {
    console.error('❌ Missing organization_id in metadata')
    return
  }

  // Determina piano dal price_id
  const priceId = session.line_items?.data[0]?.price?.id
  let planType = 'basic'
  
  if (priceId?.includes('pro')) planType = 'pro'
  if (priceId?.includes('enterprise')) planType = 'enterprise'

  // Aggiorna organizzazione
  const { error } = await supabase
    .from('organizations')
    .update({
      plan_type: planType,
      plan_status: 'active',
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('id', orgId)

  if (error) {
    console.error('❌ Error updating organization:', error)
    return
  }

  // Registra pagamento nello storico
  await supabase.from('subscription_history').insert({
    organization_id: orgId,
    event_type: 'subscription_created',
    plan_type: planType,
    amount: (session.amount_total || 0) / 100,
    currency: 'EUR',
    stripe_invoice_id: session.invoice as string,
  })

  console.log(`✅ Organization ${orgId} upgraded to ${planType}`)
}

// Handler: Subscription aggiornata
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('organizations')
    .update({
      plan_status: subscription.status,
      next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('❌ Error updating subscription:', error)
  }
}

// Handler: Subscription cancellata
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('organizations')
    .update({
      plan_type: 'free',
      plan_status: 'cancelled',
      stripe_subscription_id: null,
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('❌ Error cancelling subscription:', error)
  }

  console.log(`✅ Subscription ${subscription.id} cancelled`)
}

// Handler: Pagamento riuscito
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const { error } = await supabase
    .from('organizations')
    .update({
      plan_status: 'active',
      next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('stripe_customer_id', invoice.customer as string)

  if (error) {
    console.error('❌ Error updating payment status:', error)
  }

  console.log(`✅ Payment succeeded for invoice ${invoice.id}`)
}

// Handler: Pagamento fallito
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const { error } = await supabase
    .from('organizations')
    .update({
      plan_status: 'past_due',
    })
    .eq('stripe_customer_id', invoice.customer as string)

  if (error) {
    console.error('❌ Error updating failed payment:', error)
  }

  console.log(`⚠️ Payment failed for invoice ${invoice.id}`)
}
```

### Step 2.3: Deploy Edge Functions

```bash
# Deploy checkout function
supabase functions deploy stripe-checkout --no-verify-jwt

# Deploy webhook function
supabase functions deploy stripe-webhook --no-verify-jwt

# Verifica deployment
supabase functions list
```

---

## 🎨 FASE 3: FRONTEND - CHECKOUT FLOW

### Step 3.1: Installa Stripe.js

```bash
cd /Users/pasqualelucci/omnilypro-clean/frontend
npm install @stripe/stripe-js
```

### Step 3.2: Crea Componente Pricing

**File:** `frontend/src/components/PricingPlans.tsx`

```typescript
import React, { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '../lib/supabase'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

const PLANS = [
  {
    name: 'Basic',
    price: 29,
    priceId: 'price_basic_monthly',
    features: [
      '500 clienti',
      '5 workflow',
      'Dashboard base',
      'Supporto email',
    ],
  },
  {
    name: 'PRO',
    price: 99,
    priceId: 'price_pro_monthly',
    features: [
      '1000 clienti',
      '50 workflow',
      'AI Assistant',
      'Chatbot WhatsApp',
      'Supporto prioritario',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 299,
    priceId: 'price_enterprise_monthly',
    features: [
      'Clienti illimitati',
      'Workflow illimitati',
      'AI completa',
      'Voice Assistant',
      'Supporto dedicato 24/7',
    ],
  },
]

export default function PricingPlans({ organizationId, userEmail }: { 
  organizationId: string
  userEmail: string 
}) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleUpgrade = async (priceId: string, planName: string) => {
    try {
      setLoading(priceId)

      // Chiama Edge Function per creare sessione Checkout
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          organizationId,
          priceId,
          userEmail,
        },
      })

      if (error) throw error

      // Reindirizza a Stripe Checkout
      const stripe = await stripePromise
      if (stripe && data.sessionId) {
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        })

        if (stripeError) {
          console.error('Stripe redirect error:', stripeError)
          alert('Errore durante il reindirizzamento a Stripe')
        }
      }
    } catch (error: any) {
      console.error('Checkout error:', error)
      alert(`Errore: ${error.message}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="pricing-container">
      <h2>Scegli il Tuo Piano</h2>
      
      <div className="plans-grid">
        {PLANS.map((plan) => (
          <div 
            key={plan.priceId} 
            className={`plan-card ${plan.popular ? 'popular' : ''}`}
          >
            {plan.popular && <div className="badge">PIÙ POPOLARE</div>}
            
            <h3>{plan.name}</h3>
            <div className="price">
              <span className="amount">€{plan.price}</span>
              <span className="period">/mese</span>
            </div>

            <ul className="features">
              {plan.features.map((feature, idx) => (
                <li key={idx}>✓ {feature}</li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(plan.priceId, plan.name)}
              disabled={loading === plan.priceId}
              className="btn-upgrade"
            >
              {loading === plan.priceId ? 'Caricamento...' : `Scegli ${plan.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Step 3.3: Gestisci Redirect dopo Pagamento

**File:** `frontend/src/pages/Dashboard.tsx`

```typescript
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function Dashboard() {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const paymentStatus = searchParams.get('payment')

    if (paymentStatus === 'success') {
      // Mostra messaggio successo
      alert('🎉 Pagamento completato! Il tuo piano è stato attivato.')
      
      // Ricarica dati organizzazione
      window.location.href = '/dashboard'
    } else if (paymentStatus === 'cancelled') {
      alert('⚠️ Pagamento annullato. Puoi riprovare quando vuoi.')
    }
  }, [searchParams])

  return (
    <div>
      {/* Dashboard content */}
    </div>
  )
}
```

---

## 🧪 FASE 4: TESTING

### Step 4.1: Test Carte Stripe

Usa queste carte di test (modalità sandbox):

```
✅ SUCCESSO:
Numero: 4242 4242 4242 4242
Scadenza: 12/34
CVC: 123
CAP: 12345

❌ FALLIMENTO:
Numero: 4000 0000 0000 0002
Scadenza: 12/34
CVC: 123

⏳ RICHIEDE 3D SECURE:
Numero: 4000 0027 6000 3184
Scadenza: 12/34
CVC: 123
```

### Step 4.2: Scenario di Test Completo

#### Test 1: Upgrade a PRO
```
1. Login come business owner
2. Vai su /pricing
3. Clicca "Scegli PRO"
4. Compila form Stripe con carta 4242...
5. Conferma pagamento
6. Verifica redirect a /dashboard?payment=success
7. Controlla database:
   - plan_type = 'pro'
   - plan_status = 'active'
   - stripe_customer_id presente
   - stripe_subscription_id presente
```

#### Test 2: Webhook Payment Succeeded
```
1. Vai su Stripe Dashboard → Webhooks
2. Clicca sul webhook creato
3. Send test webhook → invoice.payment_succeeded
4. Verifica logs Supabase Edge Function
5. Controlla database:
   - plan_status = 'active'
   - next_billing_date aggiornato
```

#### Test 3: Cancellazione Subscription
```
1. Vai su Stripe Dashboard → Customers
2. Trova il customer di test
3. Cancella subscription
4. Webhook customer.subscription.deleted viene triggerato
5. Verifica database:
   - plan_type = 'free'
   - plan_status = 'cancelled'
   - stripe_subscription_id = null
```

---

## 📊 FASE 5: MONITORING

### Dashboard Stripe

**Vai su:** Dashboard → Home

Monitora:
- ✅ Pagamenti riusciti
- ❌ Pagamenti falliti
- 📊 MRR (Monthly Recurring Revenue)
- 👥 Clienti attivi

### Logs Supabase

```bash
# Visualizza logs Edge Functions
supabase functions logs stripe-webhook --tail

# Esempio output:
✅ Webhook event received: checkout.session.completed
✅ Organization abc123 upgraded to pro
```

### Query Database

```sql
-- Verifica subscription attive
SELECT 
  name,
  plan_type,
  plan_status,
  stripe_customer_id,
  next_billing_date
FROM organizations
WHERE plan_status = 'active'
ORDER BY created_at DESC;

-- Storico pagamenti
SELECT 
  o.name,
  sh.event_type,
  sh.amount,
  sh.created_at
FROM subscription_history sh
JOIN organizations o ON o.id = sh.organization_id
ORDER BY sh.created_at DESC
LIMIT 20;
```

---

## ⚠️ TROUBLESHOOTING

### Problema: Webhook non riceve eventi

**Soluzione:**
```bash
# 1. Verifica URL webhook su Stripe Dashboard
https://[tuo-progetto].supabase.co/functions/v1/stripe-webhook

# 2. Testa manualmente
curl -X POST https://[tuo-progetto].supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# 3. Controlla logs
supabase functions logs stripe-webhook
```

### Problema: Redirect a Stripe non funziona

**Soluzione:**
```typescript
// Verifica chiave publishable nel .env
console.log('Stripe Key:', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

// Deve iniziare con: pk_test_...
```

### Problema: Database non si aggiorna

**Soluzione:**
```sql
-- Verifica permessi Service Role Key
-- La Edge Function deve usare SUPABASE_SERVICE_ROLE_KEY
-- non SUPABASE_ANON_KEY
```

---

## ✅ CHECKLIST FINALE

Prima di andare in produzione:

- [ ] Tutte le Edge Functions deployate
- [ ] Webhook configurato e testato
- [ ] Carte di test funzionano
- [ ] Database si aggiorna correttamente
- [ ] Redirect post-pagamento funziona
- [ ] Logs mostrano eventi corretti
- [ ] Email di conferma Stripe attive
- [ ] Documenti pronti per passaggio a LIVE mode

---

## 🚀 PASSAGGIO A PRODUZIONE

Quando sei pronto (dopo pilot):

### Step 1: Attiva Live Mode
```
1. Stripe Dashboard → Toggle "Test mode" OFF
2. Copia nuove chiavi LIVE:
   - pk_live_...
   - sk_live_...
3. Aggiorna .env con chiavi LIVE
4. Riconfigura webhook con URL produzione
```

### Step 2: Verifica Compliance
```
- ✅ Privacy Policy aggiornata
- ✅ Terms of Service con clausole abbonamento
- ✅ Email conferma pagamento personalizzate
- ✅ Fatturazione automatica configurata
```

---

## 💡 BEST PRACTICES

1. **Sempre testare in sandbox prima**
2. **Mai committare chiavi segrete su Git**
3. **Monitorare webhook failures**
4. **Gestire gracefully i pagamenti falliti**
5. **Comunicare chiaramente con i clienti**

---

## 📞 SUPPORTO

**Stripe Docs:** https://stripe.com/docs  
**Supabase Edge Functions:** https://supabase.com/docs/guides/functions  
**Stripe Test Cards:** https://stripe.com/docs/testing

---

**Buon sviluppo! 🚀**
