# 📧 TODO - Implementazione Email Service con Resend

## 🎯 Obiettivo
Implementare un sistema email multi-tenant con Resend per inviare email personalizzate (scontrini, notifiche, ecc.) da ogni organizzazione ai propri clienti.

---

## 🏗️ Architettura

```
ADMIN (Super Admin)
  ↓ Configura API Key Resend + Template Base
ORGANIZZAZIONI (Ogni negozio)
  ↓ Personalizza template (logo, colori, mittente)
SUPABASE EDGE FUNCTION
  ↓ Valida + Chiama Resend API
RESEND API
  ↓ Invia email
CLIENTE (Riceve email)
```

---

## ✅ FASE 1 - Database Schema

### 1.1 Creare tabella `email_settings`
Configurazione globale e per organizzazione

```sql
CREATE TABLE email_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Configurazione Resend
  resend_api_key TEXT, -- Encrypted, nullable per org (usa quella globale se null)

  -- Configurazione mittente
  from_name TEXT NOT NULL DEFAULT 'Omnily PRO',
  from_email TEXT NOT NULL, -- es: "noreply@example.com" o dominio verificato
  reply_to_email TEXT,

  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#1e40af',

  -- Feature flags
  enabled BOOLEAN DEFAULT true,
  daily_limit INTEGER DEFAULT 1000, -- Limite giornaliero invii

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id)
);

-- Settings globali (organization_id = NULL)
INSERT INTO email_settings (organization_id, resend_api_key, from_email)
VALUES (NULL, 'YOUR_RESEND_API_KEY', 'noreply@omnilypro.com');
```

### 1.2 Creare tabella `email_templates`
Template personalizzabili per tipo di email

```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identificazione template
  template_type TEXT NOT NULL, -- 'receipt', 'welcome', 'notification', ecc.
  name TEXT NOT NULL,
  description TEXT,

  -- Contenuto
  subject TEXT NOT NULL, -- Supporta variabili: {{store_name}}, {{customer_name}}
  html_body TEXT NOT NULL, -- HTML con variabili
  text_body TEXT, -- Fallback testo semplice

  -- Metadata
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, template_type, name)
);

-- Indici
CREATE INDEX idx_email_templates_org ON email_templates(organization_id);
CREATE INDEX idx_email_templates_type ON email_templates(template_type);
```

### 1.3 Creare tabella `email_logs`
Storico invii per tracking e debug

```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Dettagli invio
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  template_type TEXT NOT NULL,

  -- Destinatario
  to_email TEXT NOT NULL,
  to_name TEXT,

  -- Contenuto
  subject TEXT NOT NULL,
  from_email TEXT NOT NULL,

  -- Stato
  status TEXT NOT NULL, -- 'pending', 'sent', 'failed', 'bounced'
  resend_email_id TEXT, -- ID da Resend per tracking
  error_message TEXT,

  -- Metadata
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Dati dinamici usati (per debug)
  payload JSONB
);

-- Indici per performance
CREATE INDEX idx_email_logs_org ON email_logs(organization_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_created ON email_logs(created_at DESC);
CREATE INDEX idx_email_logs_to_email ON email_logs(to_email);
```

### 1.4 Row Level Security (RLS)

```sql
-- email_settings
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

-- Admin può vedere tutto
CREATE POLICY "Admin full access email_settings" ON email_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      JOIN organizations o ON ou.org_id = o.id
      WHERE ou.user_id = auth.uid()
      AND ou.role = 'admin'
    )
  );

-- Org user può vedere solo la propria config
CREATE POLICY "Org users view own email_settings" ON email_settings
  FOR SELECT USING (
    organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Ripetere pattern simile per email_templates e email_logs
```

### 1.5 File Migration SQL
Creare file: `database/migrations/020_email_service.sql`

---

## ✅ FASE 2 - Supabase Edge Function

### 2.1 Creare Edge Function `send-email`

**File:** `supabase/functions/send-email/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_URL = 'https://api.resend.com/emails'

interface EmailRequest {
  organization_id: string
  template_type: string
  to_email: string
  to_name?: string
  dynamic_data: Record<string, any> // Dati per sostituire variabili nel template
}

serve(async (req) => {
  try {
    // 1. Parse request
    const { organization_id, template_type, to_email, to_name, dynamic_data }: EmailRequest = await req.json()

    // 2. Inizializza Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Carica email_settings dell'organizzazione
    const { data: settings, error: settingsError } = await supabaseClient
      .from('email_settings')
      .select('*')
      .eq('organization_id', organization_id)
      .single()

    if (settingsError) {
      // Fallback a settings globali se org non ha config
      const { data: globalSettings } = await supabaseClient
        .from('email_settings')
        .select('*')
        .is('organization_id', null)
        .single()

      if (!globalSettings) {
        throw new Error('No email settings found')
      }
    }

    // 4. Carica template
    const { data: template, error: templateError } = await supabaseClient
      .from('email_templates')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('template_type', template_type)
      .eq('is_active', true)
      .single()

    if (templateError) throw new Error(`Template not found: ${template_type}`)

    // 5. Replace variabili nel template
    let subject = template.subject
    let html_body = template.html_body

    Object.keys(dynamic_data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      subject = subject.replace(regex, dynamic_data[key])
      html_body = html_body.replace(regex, dynamic_data[key])
    })

    // 6. Invia via Resend
    const resendResponse = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.resend_api_key || Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${settings.from_name} <${settings.from_email}>`,
        to: [to_email],
        subject: subject,
        html: html_body,
        reply_to: settings.reply_to_email,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      throw new Error(`Resend error: ${JSON.stringify(resendData)}`)
    }

    // 7. Log invio
    await supabaseClient.from('email_logs').insert({
      organization_id,
      template_id: template.id,
      template_type,
      to_email,
      to_name,
      subject,
      from_email: settings.from_email,
      status: 'sent',
      resend_email_id: resendData.id,
      sent_at: new Date().toISOString(),
      payload: dynamic_data,
    })

    return new Response(
      JSON.stringify({ success: true, email_id: resendData.id }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### 2.2 Deploy Edge Function

```bash
# Deploy
supabase functions deploy send-email

# Set secrets
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### 2.3 Test Edge Function

```bash
curl -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/send-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "organization_id": "org-uuid",
    "template_type": "receipt",
    "to_email": "customer@example.com",
    "to_name": "Mario Rossi",
    "dynamic_data": {
      "store_name": "Negozio Centro",
      "receipt_number": "00123",
      "total": "45.50",
      "items": "..."
    }
  }'
```

---

## ✅ FASE 3 - Admin Panel UI

### 3.1 Creare componente `EmailSettingsManager.tsx`

**Posizione:** `src/components/Admin/EmailSettingsManager.tsx`

**Features:**
- Form per inserire Resend API Key globale
- Test invio email
- Visualizzazione statistiche globali
- Gestione template base

**Campi form:**
- API Key Resend (encrypted)
- From Name (default: "Omnily PRO")
- From Email (default: noreply@omnilypro.com)
- Reply To Email
- Daily Limit

### 3.2 Creare componente `EmailTemplateEditor.tsx`

**Posizione:** `src/components/Admin/EmailTemplateEditor.tsx`

**Features:**
- Editor HTML per template
- Preview in tempo reale
- Variabili disponibili ({{store_name}}, {{customer_name}}, ecc.)
- Template pre-built:
  - Receipt (scontrino)
  - Welcome (benvenuto)
  - Password Reset
  - Notification generica

### 3.3 Creare componente `EmailLogsViewer.tsx`

**Posizione:** `src/components/Admin/EmailLogsViewer.tsx`

**Features:**
- Tabella con tutti gli invii
- Filtri: stato, data, organizzazione
- Dettaglio singolo invio
- Statistiche: sent, failed, opened, clicked

### 3.4 Aggiungere tab in AdminLayout

Aggiungere nuovo tab "Email Service" con i 3 componenti

---

## ✅ FASE 4 - Organization Panel UI

### 4.1 Creare componente `OrganizationEmailSettings.tsx`

**Posizione:** `src/components/Organization/OrganizationEmailSettings.tsx`

**Features:**
- Form per personalizzare:
  - From Name (es: "Pizzeria Da Mario")
  - From Email (se hanno dominio verificato)
  - Logo URL
  - Colori brand
- Override settings globali (opzionale)
- Preview mittente

### 4.2 Creare componente `OrganizationTemplateCustomizer.tsx`

**Posizione:** `src/components/Organization/OrganizationTemplateCustomizer.tsx`

**Features:**
- Selezione template base (da admin)
- Personalizzazione:
  - Logo (carica da loro)
  - Colori header/footer
  - Testi personalizzati
  - Firma email
- Preview con dati esempio
- Test invio a se stessi

### 4.3 Service helper per invio email

**Posizione:** `src/services/emailService.ts`

```typescript
import { supabase } from '../lib/supabase'

export interface SendEmailParams {
  organization_id: string
  template_type: string
  to_email: string
  to_name?: string
  dynamic_data: Record<string, any>
}

export const sendEmail = async (params: SendEmailParams) => {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: params
  })

  if (error) throw error
  return data
}

// Helper per scontrino via email
export const sendReceiptEmail = async (
  organizationId: string,
  customerEmail: string,
  receiptData: any
) => {
  return sendEmail({
    organization_id: organizationId,
    template_type: 'receipt',
    to_email: customerEmail,
    dynamic_data: {
      store_name: receiptData.store_name,
      receipt_number: receiptData.receipt_number,
      total: receiptData.total,
      items_html: receiptData.items_html, // HTML già formattato
      timestamp: receiptData.timestamp
    }
  })
}
```

---

## 📊 FASE 5 - Integrazione con POS

### 5.1 Aggiungere campo email nel checkout

Nel componente POS, aggiungere input email opzionale al checkout.

### 5.2 Dopo pagamento, inviare email

```typescript
// In handlePaymentComplete
if (customerEmail) {
  try {
    await sendReceiptEmail(organizationId, customerEmail, receiptData)
    showSuccess('Scontrino inviato via email!')
  } catch (error) {
    console.error('Email send failed:', error)
    // Non bloccare il checkout per errore email
  }
}
```

---

## 🎨 Template Email Receipt HTML

### Template Base Receipt

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      background: {{primary_color}};
      color: white;
      padding: 20px;
      text-align: center;
    }
    .content {
      padding: 20px;
    }
    .footer {
      background: #f9f9f9;
      padding: 15px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    td {
      padding: 8px;
      border-bottom: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{store_name}}</h1>
      <p>Scontrino #{{receipt_number}}</p>
    </div>

    <div class="content">
      <p>Gentile cliente,</p>
      <p>Grazie per il tuo acquisto! Ecco il dettaglio del tuo scontrino:</p>

      <table>
        {{items_html}}
      </table>

      <h2 style="text-align: right; color: {{primary_color}};">
        Totale: €{{total}}
      </h2>

      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        Data: {{timestamp}}<br>
        Negozio: {{store_name}}
      </p>
    </div>

    <div class="footer">
      Powered by Omnily PRO<br>
      <a href="mailto:{{reply_to_email}}">Contattaci</a>
    </div>
  </div>
</body>
</html>
```

---

## 🔒 Security Checklist

- [ ] API Key Resend mai esposta al frontend
- [ ] RLS policies su tutte le tabelle
- [ ] Rate limiting su Edge Function (Supabase ha built-in)
- [ ] Validazione email addresses (regex)
- [ ] Sanitizzazione input dynamic_data (XSS prevention)
- [ ] Daily limit per organizzazione
- [ ] Webhook Resend per tracking (opened, clicked, bounced)

---

## 📈 Metriche da Tracciare

- Numero email inviate (per org, globale)
- Tasso apertura (open rate)
- Tasso click (click rate)
- Email fallite (bounce rate)
- Top template usati
- Costo mensile Resend (esterno)

---

## 🚀 Roadmap Future Features

1. **Template Marketplace** - Template pronti da importare
2. **A/B Testing** - Test 2 varianti subject/contenuto
3. **Automazioni** - Email automatiche (compleanno, carrello abbandonato)
4. **Personalizzazione Avanzata** - Drag & drop editor
5. **Multi-lingua** - Template in più lingue
6. **Allegati** - PDF scontrino allegato
7. **SMS Integration** - Notifiche via SMS (Twilio)

---

## 📝 Note Implementazione

### Perché Resend?
- API semplice e moderna
- Pricing competitivo
- Ottimo per transactional emails
- SDK ben documentato
- Webhook per tracking

### Alternative considerate:
- SendGrid (più complesso)
- Mailgun (buono ma UI datata)
- AWS SES (troppo low-level)

### Dominio Email
- Usare dominio verificato per deliverability
- Setup SPF, DKIM, DMARC records
- Evitare @gmail.com, @yahoo.com come mittente

---

## ✅ Checklist Finale

**Database:**
- [ ] Tabella email_settings
- [ ] Tabella email_templates
- [ ] Tabella email_logs
- [ ] RLS policies
- [ ] Migration SQL

**Backend:**
- [ ] Edge Function send-email
- [ ] Deploy function
- [ ] Set secrets Resend API
- [ ] Test con curl

**Admin UI:**
- [ ] EmailSettingsManager
- [ ] EmailTemplateEditor
- [ ] EmailLogsViewer
- [ ] Tab in AdminLayout

**Organization UI:**
- [ ] OrganizationEmailSettings
- [ ] OrganizationTemplateCustomizer
- [ ] Email service helper
- [ ] Test invio

**Integration:**
- [ ] Campo email in checkout
- [ ] Invio automatico post-pagamento
- [ ] Error handling graceful

**Testing:**
- [ ] Test invio email reale
- [ ] Test template rendering
- [ ] Test variabili dinamiche
- [ ] Test limiti rate
- [ ] Test RLS policies

---

**PRONTO PER INIZIARE L'IMPLEMENTAZIONE! 🚀**
