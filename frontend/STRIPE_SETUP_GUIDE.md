# GUIDA IMPLEMENTAZIONE STRIPE - OmnilyPro

## STEP 1: Crea Account Stripe (GRATUITO)

1. Vai su https://stripe.com/it
2. Clicca "Inizia ora"
3. Registrati con email
4. **NON servono dati aziendali per testare!**
5. Attiva "Modalità di test" (toggle in alto a destra)

## STEP 2: Ottieni le Chiavi API

1. Dashboard Stripe → **Sviluppatori** → **Chiavi API**
2. Copia queste chiavi:
   - **Publishable key** (pk_test_...) → Usata nel frontend
   - **Secret key** (sk_test_...) → Usata nel backend

## STEP 3: Aggiungi Chiavi al Progetto

Nel file `.env`:
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...
```

Nel Supabase Dashboard → Edge Functions → Secrets:
```
STRIPE_SECRET_KEY = sk_test_51...
```

## STEP 4: Installa Stripe SDK

```bash
npm install @stripe/stripe-js stripe
```

## WORKFLOW PAGAMENTO PER OMNILYPRO

### Scenario: Cliente firma contratto e paga

```
1. Cliente firma contratto con OTP ✅ (FATTO)
2. Contratto passa a stato "signed" ✅ (FATTO)
3. Sistema mostra pagina pagamento 🔄 (DA IMPLEMENTARE)
4. Cliente paga con Stripe
5. Webhook Stripe notifica pagamento
6. Contratto passa a stato "completed" + "paid"
7. Sistema attiva servizio per cliente
```

## CARTE DI TEST STRIPE

Puoi testare GRATIS con queste carte:

### Pagamento Riuscito
```
Numero: 4242 4242 4242 4242
Data: Qualsiasi data futura (es. 12/28)
CVV: Qualsiasi 3 cifre (es. 123)
```

### Pagamento Fallito
```
Numero: 4000 0000 0000 0002
```

### 3D Secure (autenticazione forte)
```
Numero: 4000 0027 6000 3184
```

### Più carte test: https://stripe.com/docs/testing

## ARCHITETTURA SUGGERITA

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ Contratto  │→ │ Firma OTP    │→ │ Pagina Pagamento│ │
│  │ Creato     │  │ Completata   │  │ (Stripe Checkout)│ │
│  └────────────┘  └──────────────┘  └─────────────────┘ │
└────────────────────────────────┬────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   STRIPE CHECKOUT       │
                    │   (Hosted by Stripe)    │
                    └────────────┬────────────┘
                                 │
┌────────────────────────────────▼────────────────────────┐
│              BACKEND (Supabase Edge Functions)          │
│  ┌──────────────────┐      ┌──────────────────────────┐│
│  │ create-checkout  │      │ stripe-webhook           ││
│  │ (crea sessione)  │      │ (riceve notifica pagam.) ││
│  └──────────────────┘      └──────────────────────────┘│
└─────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   DATABASE (Supabase)   │
                    │  - Update contract      │
                    │  - Save payment record  │
                    └─────────────────────────┘
```

## VANTAGGI STRIPE CHECKOUT

✅ **Sicurezza**: PCI-compliant automaticamente
✅ **UI Pronta**: Pagina pagamento bella e responsive
✅ **Multi-metodo**: Carta, Google Pay, Apple Pay, SEPA
✅ **Localizzazione**: Italiano automatico
✅ **Mobile-friendly**: Funziona perfettamente su mobile
✅ **SCA Compliant**: Strong Customer Authentication EU

## ALTERNATIVA SEMPLICE: Payment Links

Se vuoi ancora più semplice (senza codice):

1. Crea "Payment Link" su Stripe Dashboard
2. Invia link al cliente dopo firma contratto
3. Stripe notifica quando pagato
4. Tu aggiorni manualmente lo stato

**Pro**: Zero codice
**Contro**: Meno automatizzato

## COSTI

### Modalità TEST (sempre gratuita)
- ✅ Carte di prova illimitate
- ✅ Tutte le funzionalità
- ✅ Nessun costo

### Modalità LIVE
- 💰 1.4% + €0.25 per transazione europea con carta
- 💰 0.8% per SEPA Direct Debit (max €5)
- 💰 Nessun canone mensile
- 💰 Paghi solo se incassi

## PROSSIMI PASSI

1. ✅ Crea account Stripe (5 min)
2. ✅ Ottieni chiavi test (2 min)
3. 🔄 Implementa Edge Function per checkout (15 min)
4. 🔄 Aggiungi pagina pagamento React (20 min)
5. 🔄 Implementa webhook per conferma (15 min)
6. ✅ Testa con carte di prova (5 min)

**TEMPO TOTALE: ~1 ora per implementazione completa**

Vuoi che procediamo con l'implementazione?
