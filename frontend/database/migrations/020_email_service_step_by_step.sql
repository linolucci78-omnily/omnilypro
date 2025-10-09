-- Migration 020: Email Service - STEP BY STEP
-- Questo script crea le tabelle verificando prima cosa esiste
-- Data: 2025-01-09

-- ============================================
-- STEP 1: Crea SOLO la tabella email_settings
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_settings') THEN
    CREATE TABLE email_settings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      organization_id UUID,
      resend_api_key TEXT,
      from_name TEXT NOT NULL DEFAULT 'Omnily PRO',
      from_email TEXT NOT NULL DEFAULT 'onboarding@resend.dev',
      reply_to_email TEXT,
      logo_url TEXT,
      primary_color TEXT DEFAULT '#3b82f6',
      secondary_color TEXT DEFAULT '#1e40af',
      enabled BOOLEAN DEFAULT true,
      daily_limit INTEGER DEFAULT 1000,
      emails_sent_today INTEGER DEFAULT 0,
      last_reset_date DATE DEFAULT CURRENT_DATE,
      custom_domain TEXT,
      custom_domain_verified BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(organization_id),
      CHECK (daily_limit > 0),
      CHECK (emails_sent_today >= 0)
    );
    RAISE NOTICE '✅ Tabella email_settings creata';
  ELSE
    RAISE NOTICE '⚠️ Tabella email_settings esiste già';
  END IF;
END $$;

-- ============================================
-- STEP 2: Crea indici per email_settings
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_email_settings_org') THEN
    CREATE INDEX idx_email_settings_org ON email_settings(organization_id);
    RAISE NOTICE '✅ Indice idx_email_settings_org creato';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_email_settings_enabled') THEN
    CREATE INDEX idx_email_settings_enabled ON email_settings(enabled) WHERE enabled = true;
    RAISE NOTICE '✅ Indice idx_email_settings_enabled creato';
  END IF;
END $$;

-- ============================================
-- STEP 3: Crea trigger per email_settings
-- ============================================

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

-- ============================================
-- STEP 4: Inserisci settings globali
-- ============================================

INSERT INTO email_settings (organization_id, from_name, from_email, enabled)
VALUES (NULL, 'Omnily PRO', 'onboarding@resend.dev', true)
ON CONFLICT (organization_id) DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ Settings globali inserite'; END $$;

-- ============================================
-- STEP 5: Crea SOLO la tabella email_templates
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_templates') THEN
    CREATE TABLE email_templates (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      organization_id UUID,
      template_type TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      subject TEXT NOT NULL,
      html_body TEXT NOT NULL,
      text_body TEXT,
      is_default BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(organization_id, template_type, name),
      CHECK (length(subject) > 0),
      CHECK (length(html_body) > 0)
    );
    RAISE NOTICE '✅ Tabella email_templates creata';
  ELSE
    RAISE NOTICE '⚠️ Tabella email_templates esiste già';
  END IF;
END $$;

-- ============================================
-- STEP 6: Crea indici per email_templates
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_email_templates_org') THEN
    CREATE INDEX idx_email_templates_org ON email_templates(organization_id);
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_email_templates_type') THEN
    CREATE INDEX idx_email_templates_type ON email_templates(template_type);
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_email_templates_active') THEN
    CREATE INDEX idx_email_templates_active ON email_templates(is_active) WHERE is_active = true;
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_email_templates_default') THEN
    CREATE INDEX idx_email_templates_default ON email_templates(template_type, is_default) WHERE is_default = true;
  END IF;

END $$;

DO $$ BEGIN RAISE NOTICE '✅ Indici email_templates creati'; END $$;

-- ============================================
-- STEP 7: Crea trigger per email_templates
-- ============================================

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

-- ============================================
-- STEP 8: Inserisci template globale
-- ============================================

INSERT INTO email_templates (organization_id, template_type, name, description, subject, html_body, text_body, is_default, is_active)
VALUES (
  NULL, 'receipt', 'Scontrino Standard', 'Template base per scontrini',
  '{{store_name}} - Scontrino #{{receipt_number}}',
  '<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial;background:#f4f4f4;margin:0;padding:20px}.container{max-width:600px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.1)}.header{background:{{primary_color}};color:white;padding:30px 20px;text-align:center}.header h1{margin:0 0 10px 0;font-size:24px}.content{padding:30px 20px}.receipt-details{background:#f9f9f9;padding:20px;border-radius:6px;margin:20px 0}.total{font-size:24px;font-weight:bold;color:{{primary_color}};text-align:right;margin-top:20px}.footer{background:#f9f9f9;padding:20px;text-align:center;font-size:12px;color:#666}</style></head><body><div class="container"><div class="header"><h1>{{store_name}}</h1><p>Scontrino #{{receipt_number}}</p></div><div class="content"><p>Gentile cliente, grazie per il tuo acquisto!</p><div class="receipt-details">{{items_html}}</div><div class="total">Totale: €{{total}}</div><p style="margin-top:30px;font-size:14px;color:#666">📅 {{timestamp}}<br>📍 {{store_name}}</p></div><div class="footer">Grazie! - Powered by Omnily PRO</div></div></body></html>',
  'Scontrino #{{receipt_number}}\n{{timestamp}}\n{{items_text}}\nTotale: €{{total}}', true, true
)
ON CONFLICT (organization_id, template_type, name) DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ Template globale inserito'; END $$;

-- ============================================
-- STEP 9: Crea SOLO la tabella email_logs
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_logs') THEN
    CREATE TABLE email_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      organization_id UUID,
      template_id UUID,
      template_type TEXT NOT NULL,
      to_email TEXT NOT NULL,
      to_name TEXT,
      subject TEXT NOT NULL,
      from_email TEXT NOT NULL,
      from_name TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      resend_email_id TEXT,
      error_message TEXT,
      sent_at TIMESTAMPTZ,
      delivered_at TIMESTAMPTZ,
      opened_at TIMESTAMPTZ,
      clicked_at TIMESTAMPTZ,
      bounced_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      payload JSONB,
      CHECK (status IN ('pending','sent','failed','bounced','delivered','opened','clicked')),
      CHECK (length(to_email) > 0),
      CHECK (length(subject) > 0)
    );
    RAISE NOTICE '✅ Tabella email_logs creata';
  ELSE
    RAISE NOTICE '⚠️ Tabella email_logs esiste già';
  END IF;
END $$;

-- ============================================
-- STEP 10: Crea indici per email_logs
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_email_logs_org') THEN
    CREATE INDEX idx_email_logs_org ON email_logs(organization_id);
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_email_logs_status') THEN
    CREATE INDEX idx_email_logs_status ON email_logs(status);
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_email_logs_created') THEN
    CREATE INDEX idx_email_logs_created ON email_logs(created_at DESC);
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_email_logs_to_email') THEN
    CREATE INDEX idx_email_logs_to_email ON email_logs(to_email);
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_email_logs_template') THEN
    CREATE INDEX idx_email_logs_template ON email_logs(template_id);
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_email_logs_template_type') THEN
    CREATE INDEX idx_email_logs_template_type ON email_logs(template_type);
  END IF;

  IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_email_logs_resend_id') THEN
    CREATE INDEX idx_email_logs_resend_id ON email_logs(resend_email_id) WHERE resend_email_id IS NOT NULL;
  END IF;

  -- Rimosso indice con CURRENT_DATE (non supportato in indici parziali)

END $$;

DO $$ BEGIN RAISE NOTICE '✅ Indici email_logs creati'; END $$;

-- ============================================
-- STEP 11: Abilita RLS
-- ============================================

ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN RAISE NOTICE '✅ RLS abilitato'; END $$;

-- ============================================
-- STEP 12: Crea RLS policies
-- ============================================

-- Policies per email_settings
DROP POLICY IF EXISTS "Admin full access email_settings" ON email_settings;
CREATE POLICY "Admin full access email_settings" ON email_settings FOR ALL
USING (EXISTS (SELECT 1 FROM organization_users WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Org users view own email_settings" ON email_settings;
CREATE POLICY "Org users view own email_settings" ON email_settings FOR SELECT
USING (organization_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Org users update own email_settings" ON email_settings;
CREATE POLICY "Org users update own email_settings" ON email_settings FOR UPDATE
USING (organization_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid()));

-- Policies per email_templates
DROP POLICY IF EXISTS "Admin full access email_templates" ON email_templates;
CREATE POLICY "Admin full access email_templates" ON email_templates FOR ALL
USING (EXISTS (SELECT 1 FROM organization_users WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Org users view templates" ON email_templates;
CREATE POLICY "Org users view templates" ON email_templates FOR SELECT
USING (organization_id IS NULL OR organization_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Org users manage own templates" ON email_templates;
CREATE POLICY "Org users manage own templates" ON email_templates FOR ALL
USING (organization_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid()));

-- Policies per email_logs
DROP POLICY IF EXISTS "Admin full access email_logs" ON email_logs;
CREATE POLICY "Admin full access email_logs" ON email_logs FOR ALL
USING (EXISTS (SELECT 1 FROM organization_users WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Org users view own email_logs" ON email_logs;
CREATE POLICY "Org users view own email_logs" ON email_logs FOR SELECT
USING (organization_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Org users insert email_logs" ON email_logs;
CREATE POLICY "Org users insert email_logs" ON email_logs FOR INSERT
WITH CHECK (organization_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid()));

DO $$ BEGIN RAISE NOTICE '✅ Policies RLS create'; END $$;

-- ============================================
-- STEP 13: Crea funzioni helper
-- ============================================

CREATE OR REPLACE FUNCTION reset_daily_email_counter()
RETURNS void AS $$
BEGIN
  UPDATE email_settings SET emails_sent_today = 0, last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_email_counter(org_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM reset_daily_email_counter();
  UPDATE email_settings SET emails_sent_today = emails_sent_today + 1, updated_at = NOW()
  WHERE organization_id = org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_send_email(org_id UUID)
RETURNS boolean AS $$
DECLARE settings_record RECORD;
BEGIN
  PERFORM reset_daily_email_counter();
  SELECT * INTO settings_record FROM email_settings WHERE organization_id = org_id;
  IF NOT FOUND THEN
    SELECT * INTO settings_record FROM email_settings WHERE organization_id IS NULL;
  END IF;
  RETURN settings_record.enabled AND settings_record.emails_sent_today < settings_record.daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN RAISE NOTICE '✅ Funzioni helper create'; END $$;

-- ============================================
-- VERIFICA FINALE
-- ============================================

DO $$
DECLARE
  settings_count INT;
  templates_count INT;
  logs_count INT;
BEGIN
  SELECT COUNT(*) INTO settings_count FROM information_schema.tables WHERE table_name = 'email_settings';
  SELECT COUNT(*) INTO templates_count FROM information_schema.tables WHERE table_name = 'email_templates';
  SELECT COUNT(*) INTO logs_count FROM information_schema.tables WHERE table_name = 'email_logs';

  IF settings_count = 1 AND templates_count = 1 AND logs_count = 1 THEN
    RAISE NOTICE '';
    RAISE NOTICE '🎉🎉🎉 MIGRATION 020 COMPLETATA CON SUCCESSO! 🎉🎉🎉';
    RAISE NOTICE '';
    RAISE NOTICE '✅ email_settings: OK';
    RAISE NOTICE '✅ email_templates: OK';
    RAISE NOTICE '✅ email_logs: OK';
    RAISE NOTICE '✅ Indici: OK';
    RAISE NOTICE '✅ RLS: OK';
    RAISE NOTICE '✅ Funzioni: OK';
    RAISE NOTICE '';
    RAISE NOTICE '📧 Prossimi passi:';
    RAISE NOTICE '1. Vai su resend.com e crea account';
    RAISE NOTICE '2. Ottieni API Key';
    RAISE NOTICE '3. Aggiorna email_settings con: UPDATE email_settings SET resend_api_key = ''YOUR_KEY'' WHERE organization_id IS NULL;';
  ELSE
    RAISE EXCEPTION 'Alcune tabelle non sono state create correttamente';
  END IF;
END $$;
