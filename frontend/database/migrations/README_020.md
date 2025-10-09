# Migration 020 - Email Service con Resend

## 📋 Descrizione

Questa migration crea l'infrastruttura completa per il **servizio di invio email** tramite **Resend API**, con supporto multi-tenant per le organizzazioni.

## 🗄️ Tabelle Create

### 1. `email_settings`
Configurazione email globale e per organizzazione.

**Campi principali:**
- `organization_id` - NULL per config globale, UUID per config org specifica
- `resend_api_key` - API Key Resend (NULL per org = usa quella globale)
- `from_name` - Nome mittente personalizzabile (es: "Pizzeria Da Mario")
- `from_email` - Email mittente condivisa (es: "onboarding@resend.dev")
- `reply_to_email` - Email per risposte clienti
- `daily_limit` - Limite giornaliero invii
- `emails_sent_today` - Counter (reset automatico ogni giorno)

### 2. `email_templates`
Template email personalizzabili con variabili dinamiche.

**Campi principali:**
- `template_type` - Tipo: `receipt`, `welcome`, `notification`, `password_reset`
- `subject` - Oggetto email con variabili `{{store_name}}`, `{{customer_name}}`, ecc.
- `html_body` - Corpo HTML con variabili
- `text_body` - Fallback testo semplice
- `is_default` - Template predefinito per questo tipo
- `is_active` - Attivo/disattivo

**Template globale incluso:**
- Template "Scontrino Standard" per `receipt` già inserito

### 3. `email_logs`
Storico invii per tracking, analytics e debug.

**Campi principali:**
- `status` - `pending`, `sent`, `failed`, `bounced`, `delivered`, `opened`, `clicked`
- `resend_email_id` - ID Resend per tracking
- `to_email` / `to_name` - Destinatario
- `sent_at`, `opened_at`, `clicked_at` - Timestamp eventi
- `payload` - Dati dinamici usati (JSON)

## 🔒 Row Level Security (RLS)

**Policies configurate:**

✅ **Admin** (ruolo `admin`):
- Full access a tutte le tabelle

✅ **Organization Users**:
- Possono vedere/modificare solo le proprie configurazioni
- Possono vedere template globali + propri
- Possono vedere solo i propri log

## ⚙️ Funzioni Helper

### `reset_daily_email_counter()`
Resetta il counter giornaliero di tutte le org (eseguita automaticamente).

### `increment_email_counter(org_id)`
Incrementa il counter email inviate per una org.

### `can_send_email(org_id)`
Verifica se un'org può inviare email (enabled + sotto limite).

```sql
-- Esempio uso
SELECT can_send_email('org-uuid-here');
-- Ritorna: true/false
```

## 📊 Indici Creati

Per performance ottimali:
- Indici su `organization_id` in tutte le tabelle
- Indici su `status`, `template_type`, `created_at` in `email_logs`
- Indici per analytics (email inviate oggi per org)

## 🚀 Come Usare Questa Migration

### 1. Esegui la migration

```bash
# Via Supabase CLI
supabase db push

# O manualmente nel SQL Editor di Supabase
# Copia e incolla il contenuto di 020_email_service.sql
```

### 2. Verifica creazione tabelle

```sql
-- Verifica tabelle
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'email%';

-- Dovrebbe mostrare:
-- email_settings
-- email_templates
-- email_logs
```

### 3. Configura API Key Resend

```sql
-- Aggiorna config globale con la tua API Key Resend
UPDATE email_settings
SET resend_api_key = 'YOUR_RESEND_API_KEY_HERE',
    from_email = 'onboarding@resend.dev' -- Dominio test Resend
WHERE organization_id IS NULL;
```

### 4. (Opzionale) Crea config per una org

```sql
-- Crea config personalizzata per un'organizzazione
INSERT INTO email_settings (
  organization_id,
  from_name,
  reply_to_email,
  primary_color,
  secondary_color
) VALUES (
  'your-org-uuid-here',
  'Pizzeria Da Mario',
  'info@pizzeriadamario.com',
  '#ff6b35',
  '#004e89'
);
```

## 📧 Template Variabili Supportate

Nei template puoi usare queste variabili che verranno sostituite dinamicamente:

**Generali:**
- `{{store_name}}` - Nome negozio
- `{{customer_name}}` - Nome cliente
- `{{timestamp}}` - Data/ora

**Scontrini:**
- `{{receipt_number}}` - Numero scontrino
- `{{total}}` - Totale importo
- `{{items_html}}` - Lista prodotti (HTML)
- `{{items_text}}` - Lista prodotti (testo)

**Branding:**
- `{{primary_color}}` - Colore primario org
- `{{secondary_color}}` - Colore secondario org
- `{{logo_url}}` - URL logo org

## 📈 Query Analytics Utili

```sql
-- Email inviate oggi per organizzazione
SELECT
  o.name AS organization_name,
  COUNT(*) AS emails_sent_today,
  es.daily_limit,
  es.emails_sent_today AS counter_value
FROM email_logs el
JOIN organizations o ON el.organization_id = o.id
JOIN email_settings es ON es.organization_id = o.id
WHERE el.created_at >= CURRENT_DATE
GROUP BY o.name, es.daily_limit, es.emails_sent_today
ORDER BY emails_sent_today DESC;

-- Tasso apertura per template
SELECT
  template_type,
  COUNT(*) AS total_sent,
  COUNT(opened_at) AS total_opened,
  ROUND(COUNT(opened_at)::numeric / COUNT(*) * 100, 2) AS open_rate_percent
FROM email_logs
WHERE status = 'sent'
GROUP BY template_type
ORDER BY open_rate_percent DESC;

-- Email fallite ultime 24h
SELECT
  to_email,
  subject,
  error_message,
  created_at
FROM email_logs
WHERE status = 'failed'
AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

## 🔄 Rollback (se necessario)

```sql
-- ATTENZIONE: Elimina tutte le tabelle email
DROP TABLE IF EXISTS email_logs CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS email_settings CASCADE;

DROP FUNCTION IF EXISTS reset_daily_email_counter();
DROP FUNCTION IF EXISTS increment_email_counter(UUID);
DROP FUNCTION IF EXISTS can_send_email(UUID);
```

## 📝 Prossimi Passi

Dopo aver eseguito questa migration:

1. ✅ **Creare account Resend**: [resend.com](https://resend.com)
2. ✅ **Ottenere API Key**: Dashboard Resend → API Keys
3. ✅ **Aggiornare `email_settings`** con la tua API Key
4. ⏭️ **Creare Edge Function** `send-email` (prossima fase)
5. ⏭️ **Creare UI Admin** per gestione template
6. ⏭️ **Creare UI Organization** per personalizzazione

## ❓ Troubleshooting

### Errore: "relation email_settings already exists"

Le tabelle esistono già. Puoi:
- Saltare questa migration
- O fare DROP delle tabelle esistenti e rieseguire

### Errore: RLS policy violato

Verifica che l'utente abbia il ruolo corretto in `organization_users`:
```sql
SELECT * FROM organization_users WHERE user_id = auth.uid();
```

### Counter email non si resetta

Esegui manualmente:
```sql
SELECT reset_daily_email_counter();
```

## 📚 Documentazione

- [Resend API Docs](https://resend.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [File todoemail.md](../../todoemail.md) - Piano completo implementazione

---

**Migration creata il:** 2025-01-09
**Autore:** Sistema Email Service
**Versione:** 1.0
