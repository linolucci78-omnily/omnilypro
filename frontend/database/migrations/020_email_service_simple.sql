-- Migration 020: Email Service Tables (VERSIONE SEMPLIFICATA)
-- Senza foreign key constraints per evitare problemi
-- Data: 2025-01-09

-- ============================================
-- 1. TABELLA: email_settings
-- ============================================

CREATE TABLE IF NOT EXISTS email_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID, -- Riferimento a organizations (senza FK per ora)

  -- Configurazione Resend
  resend_api_key TEXT,

  -- Configurazione mittente
  from_name TEXT NOT NULL DEFAULT 'Omnily PRO',
  from_email TEXT NOT NULL DEFAULT 'onboarding@resend.dev',
  reply_to_email TEXT,

  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#1e40af',

  -- Feature flags e limiti
  enabled BOOLEAN DEFAULT true,
  daily_limit INTEGER DEFAULT 1000,
  emails_sent_today INTEGER DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,

  -- FUTURO: Supporto dominio personalizzato
  custom_domain TEXT,
  custom_domain_verified BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Vincoli
  UNIQUE(organization_id),
  CHECK (daily_limit > 0),
  CHECK (emails_sent_today >= 0)
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_email_settings_org ON email_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_settings_enabled ON email_settings(enabled) WHERE enabled = true;

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_email_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_email_settings_updated_at ON email_settings;
CREATE TRIGGER trigger_email_settings_updated_at
  BEFORE UPDATE ON email_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_email_settings_updated_at();

-- Settings globali di default
INSERT INTO email_settings (organization_id, from_name, from_email, enabled)
VALUES (NULL, 'Omnily PRO', 'onboarding@resend.dev', true)
ON CONFLICT (organization_id) DO NOTHING;


-- ============================================
-- 2. TABELLA: email_templates
-- ============================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID, -- Riferimento a organizations (senza FK)

  -- Identificazione template
  template_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Contenuto
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,

  -- Metadata
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Vincoli
  UNIQUE(organization_id, template_type, name),
  CHECK (length(subject) > 0),
  CHECK (length(html_body) > 0)
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_email_templates_org ON email_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_email_templates_default ON email_templates(template_type, is_default) WHERE is_default = true;

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_email_templates_updated_at ON email_templates;
CREATE TRIGGER trigger_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

-- Template globale scontrino
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
    .receipt-details { background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .total { font-size: 24px; font-weight: bold; color: {{primary_color}}; text-align: right; margin-top: 20px; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{store_name}}</h1>
      <p>Scontrino #{{receipt_number}}</p>
    </div>
    <div class="content">
      <p>Gentile cliente, grazie per il tuo acquisto!</p>
      <div class="receipt-details">{{items_html}}</div>
      <div class="total">Totale: €{{total}}</div>
      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        📅 {{timestamp}}<br>📍 {{store_name}}
      </p>
    </div>
    <div class="footer">Grazie! - Powered by Omnily PRO</div>
  </div>
</body>
</html>',
  'Grazie per il tuo acquisto!
Scontrino #{{receipt_number}}
Data: {{timestamp}}
{{items_text}}
Totale: €{{total}}',
  true,
  true
)
ON CONFLICT (organization_id, template_type, name) DO NOTHING;


-- ============================================
-- 3. TABELLA: email_logs
-- ============================================

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID, -- Riferimento a organizations (senza FK)

  -- Riferimenti
  template_id UUID, -- Riferimento a email_templates (senza FK)
  template_type TEXT NOT NULL,

  -- Destinatario
  to_email TEXT NOT NULL,
  to_name TEXT,

  -- Contenuto
  subject TEXT NOT NULL,
  from_email TEXT NOT NULL,
  from_name TEXT,

  -- Stato
  status TEXT NOT NULL DEFAULT 'pending',
  resend_email_id TEXT,
  error_message TEXT,

  -- Tracking
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  payload JSONB,

  -- Vincoli
  CHECK (status IN ('pending', 'sent', 'failed', 'bounced', 'delivered', 'opened', 'clicked')),
  CHECK (length(to_email) > 0),
  CHECK (length(subject) > 0)
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_email_logs_org ON email_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_template ON email_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_type ON email_logs(template_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_resend_id ON email_logs(resend_email_id) WHERE resend_email_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_logs_org_today ON email_logs(organization_id, created_at) WHERE created_at >= CURRENT_DATE;


-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS: email_settings
DROP POLICY IF EXISTS "Admin full access email_settings" ON email_settings;
CREATE POLICY "Admin full access email_settings" ON email_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid() AND ou.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Org users view own email_settings" ON email_settings;
CREATE POLICY "Org users view own email_settings" ON email_settings
  FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Org users update own email_settings" ON email_settings;
CREATE POLICY "Org users update own email_settings" ON email_settings
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

-- RLS: email_templates
DROP POLICY IF EXISTS "Admin full access email_templates" ON email_templates;
CREATE POLICY "Admin full access email_templates" ON email_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid() AND ou.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Org users view templates" ON email_templates;
CREATE POLICY "Org users view templates" ON email_templates
  FOR SELECT
  USING (
    organization_id IS NULL
    OR organization_id IN (
      SELECT org_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Org users manage own templates" ON email_templates;
CREATE POLICY "Org users manage own templates" ON email_templates
  FOR ALL
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

-- RLS: email_logs
DROP POLICY IF EXISTS "Admin full access email_logs" ON email_logs;
CREATE POLICY "Admin full access email_logs" ON email_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid() AND ou.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Org users view own email_logs" ON email_logs;
CREATE POLICY "Org users view own email_logs" ON email_logs
  FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Org users insert email_logs" ON email_logs;
CREATE POLICY "Org users insert email_logs" ON email_logs
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT org_id FROM organization_users WHERE user_id = auth.uid()
    )
  );


-- ============================================
-- 5. FUNZIONI HELPER
-- ============================================

CREATE OR REPLACE FUNCTION reset_daily_email_counter()
RETURNS void AS $$
BEGIN
  UPDATE email_settings
  SET emails_sent_today = 0, last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_email_counter(org_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM reset_daily_email_counter();
  UPDATE email_settings
  SET emails_sent_today = emails_sent_today + 1, updated_at = NOW()
  WHERE organization_id = org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_send_email(org_id UUID)
RETURNS boolean AS $$
DECLARE
  settings_record RECORD;
BEGIN
  PERFORM reset_daily_email_counter();

  SELECT * INTO settings_record
  FROM email_settings
  WHERE organization_id = org_id;

  IF NOT FOUND THEN
    SELECT * INTO settings_record
    FROM email_settings
    WHERE organization_id IS NULL;
  END IF;

  RETURN settings_record.enabled
    AND settings_record.emails_sent_today < settings_record.daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- FINE MIGRATION
-- ============================================

SELECT '✅ Migration 020 completata!' AS status;
