-- Migration 020: Email Service Tables
-- Sistema di invio email con Resend per organizzazioni
-- Data: 2025-01-09

-- ============================================
-- 1. TABELLA: email_settings
-- Configurazione email globale e per organizzazione
-- ============================================

CREATE TABLE IF NOT EXISTS email_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Configurazione Resend
  -- API Key: se NULL per org, usa quella globale (organization_id = NULL)
  resend_api_key TEXT, -- Encrypted in produzione

  -- Configurazione mittente (DOMINIO CONDIVISO)
  -- Tutte le org usano lo stesso from_email globale
  -- Ma personalizzano il nome mittente
  from_name TEXT NOT NULL DEFAULT 'Omnily PRO',
  from_email TEXT NOT NULL DEFAULT 'onboarding@resend.dev', -- Dominio test Resend, poi personalizzato
  reply_to_email TEXT, -- Email organizzazione per risposte clienti

  -- Branding organizzazione
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#1e40af',

  -- Feature flags e limiti
  enabled BOOLEAN DEFAULT true,
  daily_limit INTEGER DEFAULT 1000, -- Limite giornaliero invii per org
  emails_sent_today INTEGER DEFAULT 0, -- Counter giornaliero
  last_reset_date DATE DEFAULT CURRENT_DATE, -- Per reset counter

  -- FUTURO: Supporto dominio personalizzato
  custom_domain TEXT, -- NULL per ora
  custom_domain_verified BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Vincoli
  UNIQUE(organization_id), -- Una sola config per org
  CHECK (daily_limit > 0),
  CHECK (emails_sent_today >= 0)
);

-- Indici per performance
CREATE INDEX idx_email_settings_org ON email_settings(organization_id);
CREATE INDEX idx_email_settings_enabled ON email_settings(enabled) WHERE enabled = true;

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_email_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_email_settings_updated_at
  BEFORE UPDATE ON email_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_email_settings_updated_at();

-- Settings globali di default (organization_id = NULL)
-- API Key verrà impostata dopo dall'admin
INSERT INTO email_settings (organization_id, from_name, from_email, enabled)
VALUES (NULL, 'Omnily PRO', 'onboarding@resend.dev', true)
ON CONFLICT (organization_id) DO NOTHING;


-- ============================================
-- 2. TABELLA: email_templates
-- Template personalizzabili per tipo di email
-- ============================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identificazione template
  template_type TEXT NOT NULL, -- 'receipt', 'welcome', 'notification', 'password_reset'
  name TEXT NOT NULL,
  description TEXT,

  -- Contenuto con variabili dinamiche
  -- Variabili supportate: {{store_name}}, {{customer_name}}, {{total}}, {{receipt_number}}, ecc.
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL, -- HTML con variabili
  text_body TEXT, -- Fallback testo semplice (opzionale)

  -- Metadata
  is_default BOOLEAN DEFAULT false, -- Template predefinito per questo tipo
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Vincoli
  UNIQUE(organization_id, template_type, name),
  CHECK (length(subject) > 0),
  CHECK (length(html_body) > 0)
);

-- Indici per performance
CREATE INDEX idx_email_templates_org ON email_templates(organization_id);
CREATE INDEX idx_email_templates_type ON email_templates(template_type);
CREATE INDEX idx_email_templates_active ON email_templates(is_active) WHERE is_active = true;
CREATE INDEX idx_email_templates_default ON email_templates(template_type, is_default) WHERE is_default = true;

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

-- Template globale di default per scontrini (organization_id = NULL)
INSERT INTO email_templates (organization_id, template_type, name, description, subject, html_body, text_body, is_default, is_active)
VALUES (
  NULL,
  'receipt',
  'Scontrino Standard',
  'Template di base per invio scontrino via email',
  '{{store_name}} - Scontrino #{{receipt_number}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: {{primary_color}}; color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 24px; }
    .header p { margin: 0; font-size: 16px; opacity: 0.9; }
    .content { padding: 30px 20px; }
    .content p { color: #333; line-height: 1.6; }
    .receipt-details { background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .total { font-size: 24px; font-weight: bold; color: {{primary_color}}; text-align: right; margin-top: 20px; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .footer a { color: {{primary_color}}; text-decoration: none; }
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

      <div class="receipt-details">
        {{items_html}}
      </div>

      <div class="total">
        Totale: €{{total}}
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        📅 Data: {{timestamp}}<br>
        📍 Negozio: {{store_name}}
      </p>
    </div>

    <div class="footer">
      Grazie per aver scelto {{store_name}}!<br>
      Powered by Omnily PRO
    </div>
  </div>
</body>
</html>',
  'Grazie per il tuo acquisto presso {{store_name}}!

Scontrino #{{receipt_number}}
Data: {{timestamp}}

{{items_text}}

Totale: €{{total}}

Grazie e a presto!',
  true,
  true
)
ON CONFLICT (organization_id, template_type, name) DO NOTHING;


-- ============================================
-- 3. TABELLA: email_logs
-- Storico invii per tracking, analytics e debug
-- ============================================

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Riferimenti
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  template_type TEXT NOT NULL,

  -- Destinatario
  to_email TEXT NOT NULL,
  to_name TEXT,

  -- Contenuto inviato
  subject TEXT NOT NULL,
  from_email TEXT NOT NULL,
  from_name TEXT,

  -- Stato invio
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'bounced', 'delivered'
  resend_email_id TEXT, -- ID da Resend per tracking
  error_message TEXT,

  -- Tracking eventi (via webhook Resend)
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Dati dinamici usati nel template (per debug/audit)
  payload JSONB,

  -- Vincoli
  CHECK (status IN ('pending', 'sent', 'failed', 'bounced', 'delivered', 'opened', 'clicked')),
  CHECK (length(to_email) > 0),
  CHECK (length(subject) > 0)
);

-- Indici per performance e analytics
CREATE INDEX idx_email_logs_org ON email_logs(organization_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_created ON email_logs(created_at DESC);
CREATE INDEX idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX idx_email_logs_template ON email_logs(template_id);
CREATE INDEX idx_email_logs_template_type ON email_logs(template_type);
CREATE INDEX idx_email_logs_resend_id ON email_logs(resend_email_id) WHERE resend_email_id IS NOT NULL;

-- Indice per analytics: email inviate oggi per org
CREATE INDEX idx_email_logs_org_today ON email_logs(organization_id, created_at)
  WHERE created_at >= CURRENT_DATE;


-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Abilita RLS su tutte le tabelle
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;


-- ============================================
-- RLS POLICIES: email_settings
-- ============================================

-- Admin (ruolo 'admin') può vedere e gestire tutto
CREATE POLICY "Admin full access email_settings" ON email_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      JOIN organizations o ON ou.org_id = o.id
      WHERE ou.user_id = auth.uid()
      AND ou.role = 'admin'
    )
  );

-- Org users possono vedere solo la propria configurazione
CREATE POLICY "Org users view own email_settings" ON email_settings
  FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Org users possono aggiornare solo la propria configurazione
CREATE POLICY "Org users update own email_settings" ON email_settings
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );


-- ============================================
-- RLS POLICIES: email_templates
-- ============================================

-- Admin full access
CREATE POLICY "Admin full access email_templates" ON email_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.role = 'admin'
    )
  );

-- Org users possono vedere template globali (organization_id = NULL) e propri
CREATE POLICY "Org users view templates" ON email_templates
  FOR SELECT
  USING (
    organization_id IS NULL
    OR organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Org users possono creare/modificare solo i propri template
CREATE POLICY "Org users manage own templates" ON email_templates
  FOR ALL
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );


-- ============================================
-- RLS POLICIES: email_logs
-- ============================================

-- Admin full access
CREATE POLICY "Admin full access email_logs" ON email_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.role = 'admin'
    )
  );

-- Org users possono vedere solo i propri log
CREATE POLICY "Org users view own email_logs" ON email_logs
  FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Org users possono inserire log (per tracking)
CREATE POLICY "Org users insert email_logs" ON email_logs
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );


-- ============================================
-- 5. FUNZIONI HELPER
-- ============================================

-- Funzione per resettare il counter giornaliero
CREATE OR REPLACE FUNCTION reset_daily_email_counter()
RETURNS void AS $$
BEGIN
  UPDATE email_settings
  SET emails_sent_today = 0,
      last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per incrementare counter email inviata
CREATE OR REPLACE FUNCTION increment_email_counter(org_id UUID)
RETURNS void AS $$
BEGIN
  -- Reset se necessario
  PERFORM reset_daily_email_counter();

  -- Incrementa counter
  UPDATE email_settings
  SET emails_sent_today = emails_sent_today + 1,
      updated_at = NOW()
  WHERE organization_id = org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per verificare se org può inviare email (sotto limite)
CREATE OR REPLACE FUNCTION can_send_email(org_id UUID)
RETURNS boolean AS $$
DECLARE
  settings_record RECORD;
BEGIN
  -- Reset counter se necessario
  PERFORM reset_daily_email_counter();

  -- Carica settings
  SELECT * INTO settings_record
  FROM email_settings
  WHERE organization_id = org_id;

  -- Se non esiste config, usa quella globale
  IF NOT FOUND THEN
    SELECT * INTO settings_record
    FROM email_settings
    WHERE organization_id IS NULL;
  END IF;

  -- Verifica enabled e limite
  RETURN settings_record.enabled
    AND settings_record.emails_sent_today < settings_record.daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 6. COMMENTI TABELLE
-- ============================================

COMMENT ON TABLE email_settings IS 'Configurazione email globale e per organizzazione (Resend)';
COMMENT ON TABLE email_templates IS 'Template email personalizzabili con variabili dinamiche';
COMMENT ON TABLE email_logs IS 'Storico invii email per tracking e analytics';

COMMENT ON COLUMN email_settings.organization_id IS 'NULL = config globale, altrimenti config specifica org';
COMMENT ON COLUMN email_settings.resend_api_key IS 'API Key Resend (encrypted), NULL per org usa quella globale';
COMMENT ON COLUMN email_settings.daily_limit IS 'Limite giornaliero email inviabili da questa org';
COMMENT ON COLUMN email_settings.emails_sent_today IS 'Counter email inviate oggi (reset automatico)';

COMMENT ON COLUMN email_templates.template_type IS 'Tipo template: receipt, welcome, notification, password_reset';
COMMENT ON COLUMN email_templates.html_body IS 'HTML con variabili {{store_name}}, {{total}}, ecc.';
COMMENT ON COLUMN email_templates.is_default IS 'Template predefinito per questo tipo';

COMMENT ON COLUMN email_logs.status IS 'pending|sent|failed|bounced|delivered|opened|clicked';
COMMENT ON COLUMN email_logs.resend_email_id IS 'ID email da Resend per tracking webhook';
COMMENT ON COLUMN email_logs.payload IS 'Dati dinamici usati nel template (JSON)';


-- ============================================
-- FINE MIGRATION 020
-- ============================================

-- Verifica tabelle create
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 020 completata con successo!';
  RAISE NOTICE '📧 Tabelle create: email_settings, email_templates, email_logs';
  RAISE NOTICE '🔒 RLS policies configurate';
  RAISE NOTICE '⚙️ Funzioni helper create';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Prossimi passi:';
  RAISE NOTICE '1. Creare account Resend (resend.com)';
  RAISE NOTICE '2. Ottenere API Key da Resend dashboard';
  RAISE NOTICE '3. Aggiornare email_settings con API Key';
  RAISE NOTICE '4. Creare Edge Function send-email';
END $$;
