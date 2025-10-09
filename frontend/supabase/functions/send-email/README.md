# Edge Function: send-email

Edge Function per inviare email usando Resend API con template personalizzati.

## 🎯 Cosa Fa

1. Riceve richiesta di invio email (organizzazione, template, destinatario, dati)
2. Carica settings email dell'organizzazione (o globali)
3. Carica template email (org o globale)
4. Sostituisce variabili dinamiche nel template
5. Invia email via Resend API
6. Logga l'invio nel database
7. Aggiorna counter giornaliero

## 📋 Prerequisiti

1. ✅ Tabelle database create (FASE 1 completata)
2. ✅ Account Resend creato → [resend.com](https://resend.com)
3. ✅ API Key Resend ottenuta

## 🚀 Deploy

### 1. Configura API Key Resend come secret

```bash
# Nel terminale
supabase secrets set RESEND_API_KEY=re_your_api_key_here
```

### 2. Deploy function

```bash
# Deploy
supabase functions deploy send-email

# Verifica deployment
supabase functions list
```

## 🧪 Test

### Test con curl

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/send-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "organization_id": "your-org-uuid",
    "template_type": "receipt",
    "to_email": "test@example.com",
    "to_name": "Mario Rossi",
    "dynamic_data": {
      "store_name": "Pizzeria Da Mario",
      "receipt_number": "001",
      "timestamp": "2025-01-09 18:30",
      "total": "45.50",
      "items_html": "<div>Pizza Margherita - €8.00</div><div>Coca Cola - €3.00</div>"
    }
  }'
```

### Test dal frontend (dopo FASE 3)

```typescript
import { supabase } from './lib/supabase'

const { data, error } = await supabase.functions.invoke('send-email', {
  body: {
    organization_id: 'org-uuid',
    template_type: 'receipt',
    to_email: 'customer@example.com',
    to_name: 'Mario Rossi',
    dynamic_data: {
      store_name: 'Negozio Centro',
      receipt_number: '00123',
      total: '45.50',
      items_html: '...',
      timestamp: new Date().toLocaleString('it-IT')
    }
  }
})

if (error) console.error('Error:', error)
else console.log('Email sent:', data)
```

## 📊 Response Format

### Success

```json
{
  "success": true,
  "email_id": "resend-email-id-here",
  "message": "Email sent successfully"
}
```

### Error

```json
{
  "success": false,
  "error": "Error message here"
}
```

## 🔐 Sicurezza

- ✅ API Key Resend mai esposta al frontend (solo in secrets)
- ✅ Service Role Key per bypass RLS (solo backend)
- ✅ CORS configurato
- ✅ Validazione input
- ✅ Rate limiting (limite giornaliero per org)

## 🐛 Debug

### Logs in tempo reale

```bash
# Vedi logs della function
supabase functions logs send-email --follow
```

### Errori comuni

**"Resend API Key not configured"**
→ Hai dimenticato di settare il secret: `supabase secrets set RESEND_API_KEY=...`

**"Template not found"**
→ Verifica che il template esista nel database per quella org o globalmente

**"Daily email limit reached"**
→ L'organizzazione ha superato il limite giornaliero di email

**"Email service is disabled"**
→ Il servizio email è disabilitato nelle settings dell'org

## 📝 Variabili Template Supportate

Nel template puoi usare queste variabili che verranno sostituite:

### Generali
- `{{store_name}}` - Nome negozio
- `{{customer_name}}` - Nome cliente
- `{{timestamp}}` - Data/ora

### Scontrini
- `{{receipt_number}}` - Numero scontrino
- `{{total}}` - Totale importo
- `{{items_html}}` - Lista prodotti (HTML)
- `{{items_text}}` - Lista prodotti (testo)

### Branding (automatici)
- `{{primary_color}}` - Colore primario org
- `{{secondary_color}}` - Colore secondario org
- `{{logo_url}}` - URL logo org

## 🔄 Flusso Completo

```
Frontend/POS
    ↓ chiama supabase.functions.invoke('send-email')
Edge Function
    ↓ carica settings + template
    ↓ sostituisce variabili
    ↓ chiama Resend API
Resend
    ↓ invia email
Cliente
    ✉️ riceve email
```

## 📚 Next Steps

Dopo il deploy della function:

1. ✅ **FASE 3** - Creare Admin UI per gestire settings e template
2. ✅ **FASE 4** - Creare Organization UI per personalizzazione
3. ✅ **Integrare nel POS** - Inviare scontrini via email

## 🆘 Troubleshooting

Se l'email non arriva:

1. Controlla logs: `supabase functions logs send-email`
2. Verifica `email_logs` nel database per vedere lo status
3. Controlla Resend dashboard per bounce/errori
4. Verifica email non sia finita in spam

---

**Function creata:** 2025-01-09
**Versione:** 1.0
