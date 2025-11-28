# 💳 Setup Integrazione Stripe

Questa guida spiega come configurare l'integrazione Stripe per gestire i pagamenti delle organizzazioni.

## 📋 Prerequisiti

1. Account Stripe (https://stripe.com)
2. Supabase CLI installato
3. Progetto Supabase configurato

## 🔧 Step 1: Configurazione Stripe

### 1.1 Ottieni le API Keys

1. Vai su https://dashboard.stripe.com/test/apikeys
2. Copia la **Secret Key** (inizia con `sk_test_...`)
3. Copia la **Publishable Key** (inizia con `pk_test_...`)

### 1.2 Configura Webhook

1. Vai su https://dashboard.stripe.com/test/webhooks
2. Clicca "Add endpoint"
3. URL endpoint: `https://[TUO-PROGETTO].supabase.co/functions/v1/stripe-webhook`
4. Seleziona questi eventi:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copia il **Webhook signing secret** (inizia con `whsec_...`)

## 🔑 Step 2: Configurazione Environment Variables

### 2.1 Supabase Secrets (per Edge Functions)

```bash
# Nel terminale, dalla directory del progetto:

# Stripe Secret Key
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE

# Stripe Webhook Secret
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE

# App URL (per i redirect)
supabase secrets set APP_URL=https://omnilypro.app
```

### 2.2 Frontend Environment Variables

Crea/modifica il file `.env` nella cartella `frontend/`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

## 🚀 Step 3: Deploy Edge Functions

```bash
# Deploy create-checkout-session function
supabase functions deploy create-checkout-session

# Deploy stripe-webhook function
supabase functions deploy stripe-webhook
```

## 📊 Step 4: Verifica Tabelle Database

Assicurati che la tabella `organizations` abbia questi campi:

```sql
-- Se non ci sono, esegui:
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_payment',
ADD COLUMN IF NOT EXISTS activation_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'pending';
```

## ✅ Step 5: Test del Flusso

### 5.1 Crea un'organizzazione come admin

1. Login come admin
2. Vai su `/admin/new-organization`
3. Seleziona un piano (Basic/Pro/Enterprise)
4. Compila il wizard
5. Copia il link di attivazione generato

### 5.2 Test pagamento

1. Apri il link di attivazione in una nuova finestra incognito
2. Clicca "Attiva e Paga"
3. Usa una carta test di Stripe:
   - Numero: `4242 4242 4242 4242`
   - Data: qualsiasi futura
   - CVC: qualsiasi 3 cifre
   - ZIP: qualsiasi 5 cifre

### 5.3 Verifica

1. Dopo il pagamento, dovresti essere reindirizzato a `/activation-success`
2. Nel database Supabase, verifica che l'organizzazione sia `status: 'active'`
3. In Stripe Dashboard, verifica che:
   - Il customer sia stato creato
   - La subscription sia attiva
   - Il webhook sia stato chiamato con successo

## 🐛 Debugging

### Logs Edge Functions

```bash
# Visualizza logs della funzione checkout
supabase functions logs create-checkout-session

# Visualizza logs del webhook
supabase functions logs stripe-webhook
```

### Stripe Dashboard

1. Vai su https://dashboard.stripe.com/test/logs
2. Verifica le chiamate API
3. Controlla gli eventi webhook in https://dashboard.stripe.com/test/webhooks

### Common Issues

**Errore: "Stripe secret key not configured"**
- Verifica di aver eseguito `supabase secrets set`
- Redeploy le functions dopo aver settato i secrets

**Webhook non funziona**
- Verifica che l'URL del webhook in Stripe sia corretto
- Controlla che il webhook secret sia configurato correttamente
- Verifica che gli eventi selezionati siano quelli giusti

**Redirect a Stripe non funziona**
- Verifica che `VITE_SUPABASE_ANON_KEY` sia configurato
- Controlla la console del browser per errori

## 📈 Prezzi Configurati

I prezzi sono definiti in `create-checkout-session/index.ts`:

```typescript
const PLAN_PRICES = {
  basic: 2900,      // €29.00/mese
  pro: 9900,        // €99.00/mese
  enterprise: 29900 // €299.00/mese
}
```

Per modificare i prezzi, aggiorna questi valori e redeploy la function.

## 🔐 Sicurezza

- ✅ Le API keys non devono MAI essere committate nel repository
- ✅ Usa sempre le chiavi TEST in sviluppo
- ✅ Le chiavi PRODUCTION vanno configurate solo in produzione
- ✅ Il webhook signature viene sempre verificato
- ✅ Tutte le chiamate alle Edge Functions richiedono autenticazione

## 📚 Risorse

- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
