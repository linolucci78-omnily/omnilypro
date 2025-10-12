# 🚀 Quick Start - Sistema Email Marketing

## Riepilogo Modifiche Completate

### 1. ✅ Wizard Campagne (6 Step)
**File:** `src/components/CreateCampaignWizard.tsx`

Modificato per supportare 3 modalità di invio:
- **📝 Salva come Bozza**: Status 'draft', nessun invio
- **📅 Programma Invio**: Status 'scheduled', con data/ora programmata
- **🚀 Invia Subito**: Status 'sending', invio immediato

### 2. ✅ Database Migration
**File:** `database/migrations/027_add_scheduled_for_to_campaigns.sql`

Aggiunta colonna `scheduled_for` per memorizzare timestamp invio programmato.

### 3. ✅ Edge Functions

#### `send-campaign` (AGGIORNATA)
**File:** `supabase/functions/send-campaign/index.ts`

Modificata per supportare `custom_content`:
- Se presente `campaign.custom_content`, genera HTML completo con layout branded
- Sostituisce variabili {{customer_name}}, {{organization_name}}, ecc.
- Mantiene header/footer con logo e info organizzazione

#### `check-scheduled-campaigns` (NUOVA)
**File:** `supabase/functions/check-scheduled-campaigns/index.ts`

Scheduler che:
- Query campagne con status='scheduled' e scheduled_for <= NOW()
- Invoca send-campaign per ogni campagna trovata
- Aggiorna status a 'failed' in caso di errore

### 4. ✅ Script di Setup

#### Setup Resend Config
**File:** `database/setup_resend_config.sql`

Configura:
- Email settings globali con dominio **omnilypro.com**
- Template newsletter e promozione
- Variabili dinamiche

#### Deploy Script
**File:** `deploy_functions.sh`

Script bash per deploy di tutte le Edge Functions in un comando.

#### Test Utility
**File:** `src/utils/testEmailSending.ts`

Utility TypeScript per testare:
- Invio immediato campagna
- Invio programmato
- Trigger manuale scheduler

---

## 🎯 Passi per Rendere Funzionante

### STEP 1: Ottieni Resend API Key
1. Vai su https://resend.com
2. Login → API Keys
3. Copia la tua API Key (inizia con `re_...`)

### STEP 2: Configura Secrets Supabase
```bash
cd /Users/pasqualelucci/Desktop/omnilypro/frontend

# Imposta API Key come secret
supabase secrets set RESEND_API_KEY=re_TuaApiKeyQui
```

### STEP 3: Configura Email Settings Database
1. Apri **Supabase SQL Editor**
2. Apri file: `database/setup_resend_config.sql`
3. **MODIFICA LINEA 19**: Sostituisci `'YOUR_RESEND_API_KEY_HERE'` con la tua vera API Key
4. Esegui tutto lo script
5. Verifica risultati in output

### STEP 4: Deploy Edge Functions
```bash
# Rendi eseguibile (se non lo è già)
chmod +x deploy_functions.sh

# Deploy tutte le funzioni
./deploy_functions.sh
```

Se preferisci deploy manuale:
```bash
supabase functions deploy send-campaign
supabase functions deploy send-email
supabase functions deploy check-scheduled-campaigns
```

### STEP 5: Test Invio dal Frontend

#### Test 1: Invio Immediato
1. Login come admin
2. Vai su **Email Marketing** → **Nuova Campagna**
3. Compila wizard:
   - Nome: "Test Prima Campagna"
   - Template: Newsletter Standard
   - Oggetto: "Test Invio Email"
   - Contenuto: "Ciao {{customer_name}}, questa è una email di test!"
   - Seleziona 1-2 clienti di test (con email valida)
   - **Scegli: Invia Subito 🚀**
4. Attendi progress bar
5. Controlla:
   - Email ricevuta nella inbox
   - Resend dashboard: https://resend.com/emails
   - Tab "Campagne" per vedere status

#### Test 2: Invio Programmato
1. Crea nuova campagna
2. Compila come sopra
3. **Scegli: Programma Invio 📅**
4. Imposta: Data = Oggi, Ora = Tra 2-3 minuti
5. Salva campagna
6. Verifica in DB:
```sql
SELECT id, name, status, scheduled_for
FROM email_campaigns
WHERE status = 'scheduled';
```
7. Dopo 2-3 minuti, triggerare scheduler manualmente:
```bash
# Ottieni project URL
supabase status

# Chiama scheduler (sostituisci YOUR_PROJECT_URL)
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  https://YOUR_PROJECT_URL.supabase.co/functions/v1/check-scheduled-campaigns
```

#### Test 3: Da Console DevTools
```javascript
// Apri DevTools console sul frontend
import { testEmailCampaign } from './utils/testEmailSending'

// Test invio (sostituisci con veri IDs)
await testEmailCampaign('your-org-id', ['customer-id-1', 'customer-id-2'])
```

---

## 📊 Monitoraggio

### Query Utili

```sql
-- Verifica email settings
SELECT
  from_email,
  enabled,
  daily_limit,
  emails_sent_today,
  CASE WHEN resend_api_key IS NOT NULL THEN '✅' ELSE '❌' END as api_key
FROM email_settings
WHERE organization_id IS NULL;

-- Campagne recenti
SELECT
  name,
  status,
  scheduled_for,
  sent_count,
  failed_count,
  total_recipients,
  created_at
FROM email_campaigns
ORDER BY created_at DESC
LIMIT 5;

-- Email inviate oggi
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'sent') as sent,
  COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM email_logs
WHERE sent_at >= CURRENT_DATE;

-- Ultime email inviate
SELECT
  to_email,
  subject,
  status,
  sent_at,
  resend_email_id
FROM email_logs
ORDER BY created_at DESC
LIMIT 10;
```

### Logs Functions
```bash
# Logs send-campaign
supabase functions logs send-campaign --tail

# Logs scheduler
supabase functions logs check-scheduled-campaigns --tail
```

### Resend Dashboard
- Emails: https://resend.com/emails
- Analytics: https://resend.com/analytics
- Logs: https://resend.com/logs

---

## 🔧 Setup Scheduler Automatico

### Opzione A: Cron Job Esterno (GitHub Actions)

Crea `.github/workflows/email-scheduler.yml`:

```yaml
name: Email Scheduler
on:
  schedule:
    - cron: '*/5 * * * *' # Ogni 5 minuti
  workflow_dispatch:

jobs:
  check-scheduled:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Scheduler
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            ${{ secrets.SUPABASE_URL }}/functions/v1/check-scheduled-campaigns
```

Aggiungi secrets in GitHub:
- `SUPABASE_URL`: https://your-project.supabase.co
- `SUPABASE_SERVICE_ROLE_KEY`: dalla dashboard Supabase

### Opzione B: Worker Locale
Crea `worker/email-scheduler.js`:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co'
const SERVICE_ROLE_KEY = 'your-service-role-key'

async function checkScheduled() {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/check-scheduled-campaigns`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  )
  const data = await response.json()
  console.log(new Date().toISOString(), data)
}

// Esegui ogni minuto
setInterval(checkScheduled, 60 * 1000)
checkScheduled() // Prima esecuzione immediata
```

Run con:
```bash
node worker/email-scheduler.js
```

### Opzione C: Supabase pg_cron (Quando Disponibile)
```sql
SELECT cron.schedule(
  'email-scheduler',
  '* * * * *', -- Ogni minuto
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/check-scheduled-campaigns',
    headers := jsonb_build_object(
      'Authorization', 'Bearer your-service-role-key'
    )
  );
  $$
);
```

---

## 🎉 Sistema Pronto!

Dopo aver completato i 5 step sopra, il sistema sarà completamente funzionante:

✅ Wizard a 6 step con 3 modalità invio
✅ Invio immediato funzionante
✅ Invio programmato configurato
✅ Custom content con layout branded
✅ Variabili dinamiche {{customer_name}}, ecc.
✅ Rate limiting e retry logic
✅ Logging completo in database
✅ Dashboard stats su Resend

## 🆘 Troubleshooting

**Errore: "Resend API Key not configured"**
→ Verifica secrets Supabase: `supabase secrets list`

**Email non arrivano**
→ Controlla Resend dashboard e spam folder

**Campagna resta "scheduled"**
→ Scheduler non è attivo, chiamalo manualmente o configura cron job

**Dominio non verificato**
→ Già configurato! ✅ omnilypro.com è verificato su Resend

---

**Autore:** Claude Code
**Data:** 2025-01-12
**Status:** ✅ Ready to Deploy
