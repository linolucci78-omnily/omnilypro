# Setup Sistema Invio Email con Resend

## 1. Configurazione Resend API Key

### Ottieni API Key da Resend
1. Vai su https://resend.com
2. Accedi con il tuo account
3. Vai su API Keys
4. Copia la tua API Key

### Configura il dominio verificato
1. In Resend, vai su Domains
2. Assicurati che il dominio `omnilypro` sia verificato
3. Annota l'email mittente (es: `noreply@omnilypro.com`)

## 2. Configura Variabili d'Ambiente Supabase

### Da CLI Supabase:
```bash
# Naviga nella cartella del progetto
cd /Users/pasqualelucci/Desktop/omnilypro/frontend

# Imposta la API Key Resend come secret
supabase secrets set RESEND_API_KEY=re_YourResendAPIKey
```

### Da Dashboard Supabase:
1. Vai su https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/functions
2. Nella sezione "Environment variables" aggiungi:
   - Nome: `RESEND_API_KEY`
   - Valore: la tua API key di Resend (es: `re_ABC123...`)

## 3. Configura Email Settings nel Database

### Opzione A: Da Supabase SQL Editor
```sql
-- Inserisci/aggiorna settings globali con Resend API Key
INSERT INTO email_settings (
  organization_id,
  resend_api_key,
  from_name,
  from_email,
  reply_to_email,
  primary_color,
  secondary_color,
  enabled,
  daily_limit
) VALUES (
  NULL, -- NULL = settings globali
  'YOUR_RESEND_API_KEY', -- Sostituisci con la tua chiave
  'OmnilyPRO',
  'noreply@omnilypro.com', -- Usa il tuo dominio verificato
  'support@omnilypro.com',
  '#ef4444',
  '#dc2626',
  true,
  1000
)
ON CONFLICT (organization_id)
DO UPDATE SET
  resend_api_key = EXCLUDED.resend_api_key,
  from_email = EXCLUDED.from_email,
  reply_to_email = EXCLUDED.reply_to_email,
  updated_at = NOW();
```

### Opzione B: Da Frontend (TODO - creare UI per settings)
Prossimamente creeremo una UI amministrativa per gestire le email settings.

## 4. Deploy delle Edge Functions

### Deploy tutte le funzioni:
```bash
cd /Users/pasqualelucci/Desktop/omnilypro/frontend

# Deploy send-campaign (aggiornata con custom_content)
supabase functions deploy send-campaign

# Deploy check-scheduled-campaigns (nuova per scheduler)
supabase functions deploy check-scheduled-campaigns

# Deploy send-email (già esistente)
supabase functions deploy send-email
```

## 5. Test Invio Email

### Test 1: Invia Email Singola (Manuale)
```bash
# Test con send-email function
curl -i --location --request POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-email' \
  --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "organization_id": "YOUR_ORG_ID",
    "template_type": "receipt",
    "to_email": "test@example.com",
    "to_name": "Test User",
    "dynamic_data": {
      "customer_name": "Test User",
      "store_name": "Test Store",
      "receipt_number": "12345",
      "total": "50.00",
      "timestamp": "2025-01-12 10:30",
      "items_html": "<p>Prodotto 1 x1 - €50.00</p>",
      "items_text": "Prodotto 1 x1 - €50.00"
    }
  }'
```

### Test 2: Crea Campagna e Invia dal Frontend
1. Login nel frontend come admin
2. Vai su "Email Marketing"
3. Click su "Nuova Campagna"
4. Compila il wizard a 6 step:
   - **Step 1**: Nome campagna "Test Invio"
   - **Step 2**: Seleziona template (usa "Newsletter" o "Promozione")
   - **Step 3**: Scrivi oggetto e contenuto personalizzato
   - **Step 4**: Visualizza anteprima
   - **Step 5**: Seleziona 1-2 clienti di test
   - **Step 6**: Scegli "Invia Subito"

### Test 3: Test Invio Programmato
1. Crea una campagna come sopra
2. Allo Step 6 scegli "Programma Invio"
3. Imposta una data/ora tra 2-3 minuti
4. Salva campagna
5. Dopo 2-3 minuti, chiama manualmente lo scheduler:

```bash
curl -i --location --request POST 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/check-scheduled-campaigns' \
  --header 'Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY' \
  --header 'Content-Type: application/json'
```

## 6. Setup Cron Job per Scheduler (Automatico)

### Opzione A: Supabase Cron (Beta)
Supabase sta introducendo pg_cron per scheduled jobs. Quando disponibile:

```sql
-- Esegui check-scheduled-campaigns ogni minuto
SELECT cron.schedule(
  'check-scheduled-campaigns',
  '* * * * *', -- Ogni minuto
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/check-scheduled-campaigns',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    ) AS request_id;
  $$
);
```

### Opzione B: Servizio Esterno (GitHub Actions)
Crea un workflow GitHub Actions che gira ogni minuto:

```yaml
# .github/workflows/check-scheduled-campaigns.yml
name: Check Scheduled Campaigns
on:
  schedule:
    - cron: '* * * * *' # Ogni minuto
  workflow_dispatch: # Trigger manuale

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Check Scheduled Campaigns
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            https://YOUR_PROJECT_ID.supabase.co/functions/v1/check-scheduled-campaigns
```

### Opzione C: Cron Job Manuale (per test immediati)
Aggiungi uno script nel frontend:

```typescript
// src/utils/checkScheduledCampaigns.ts
import { supabase } from '../lib/supabase'

export async function checkScheduledCampaigns() {
  const { data, error } = await supabase.functions.invoke('check-scheduled-campaigns', {
    body: {}
  })

  if (error) {
    console.error('Error checking scheduled campaigns:', error)
    return { success: false, error }
  }

  console.log('✅ Scheduled campaigns checked:', data)
  return data
}
```

Poi puoi chiamare questa funzione:
- Ogni X minuti con setInterval nel frontend
- Manualmente da un pulsante admin
- Con un worker service esterno

## 7. Monitoraggio

### Verifica Logs delle Funzioni
```bash
# Logs send-campaign
supabase functions logs send-campaign

# Logs scheduler
supabase functions logs check-scheduled-campaigns
```

### Query Database per Stats
```sql
-- Verifica campagne pending
SELECT id, name, status, scheduled_for, created_at
FROM email_campaigns
WHERE status = 'scheduled'
ORDER BY scheduled_for;

-- Verifica email inviate oggi
SELECT COUNT(*) as emails_sent_today
FROM email_logs
WHERE sent_at >= CURRENT_DATE;

-- Verifica stats campagna specifica
SELECT
  c.name,
  c.status,
  c.total_recipients,
  c.sent_count,
  c.failed_count,
  c.scheduled_for,
  c.started_at,
  c.completed_at
FROM email_campaigns c
WHERE c.id = 'YOUR_CAMPAIGN_ID';
```

## 8. Troubleshooting

### Problema: "Resend API Key not configured"
- Verifica che RESEND_API_KEY sia impostata nelle variabili d'ambiente Supabase
- Oppure verifica che email_settings abbia resend_api_key popolato

### Problema: "Daily email limit reached"
```sql
-- Reset counter manualmente
UPDATE email_settings
SET emails_sent_today = 0, last_reset_date = CURRENT_DATE
WHERE organization_id IS NULL;
```

### Problema: Campagna rimane "scheduled" anche dopo l'ora
- Verifica che check-scheduled-campaigns sia deployata
- Verifica che il cron job stia girando
- Chiama manualmente la funzione scheduler per test

### Problema: Email non arrivano
1. Verifica Resend Dashboard per vedere se le email sono inviate
2. Controlla spam folder
3. Verifica che il dominio sia verificato in Resend
4. Controlla email_logs per errori:
```sql
SELECT * FROM email_logs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

## 9. Prossimi Passi

- [ ] Creare UI per gestire email_settings da admin panel
- [ ] Implementare webhook Resend per tracking (opened, clicked, bounced)
- [ ] Aggiungere template newsletter e promozione
- [ ] Implementare A/B testing per campagne
- [ ] Dashboard analytics per email marketing
- [ ] Supporto allegati
- [ ] Supporto immagini inline

---

**Autore:** Claude Code
**Data:** 2025-01-12
**Versione:** 1.0
