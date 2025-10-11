-- Migration 021: Email Campaigns System
-- Sistema di campagne email marketing per organizzazioni
-- Data: 2025-01-11

-- ============================================
-- 1. TABELLA: email_campaigns
-- Gestione campagne email marketing
-- ============================================

CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identificazione campagna
  name TEXT NOT NULL,
  description TEXT,

  -- Template utilizzato
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  template_type TEXT NOT NULL,

  -- Contenuto personalizzato (override del template)
  subject TEXT NOT NULL,

  -- Stato campagna
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'completed', 'failed', 'paused'

  -- Targeting destinatari
  target_filter JSONB, -- Filtri per selezionare destinatari (es: {"loyalty_tier": "gold", "tags": ["vip"]})
  total_recipients INTEGER DEFAULT 0,

  -- Progress tracking
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,

  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Vincoli
  CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'failed', 'paused')),
  CHECK (length(name) > 0),
  CHECK (length(subject) > 0),
  CHECK (total_recipients >= 0),
  CHECK (sent_count >= 0),
  CHECK (failed_count >= 0)
);

-- Indici per performance
CREATE INDEX idx_email_campaigns_org ON email_campaigns(organization_id);
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_email_campaigns_created ON email_campaigns(created_at DESC);
CREATE INDEX idx_email_campaigns_template ON email_campaigns(template_id);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_email_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_email_campaigns_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_email_campaigns_updated_at();


-- ============================================
-- 2. TABELLA: email_campaign_recipients
-- Tracking invio per ogni destinatario della campagna
-- ============================================

CREATE TABLE IF NOT EXISTS email_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Destinatario (può essere un customer o email esterna)
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT,

  -- Stato invio
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'bounced', 'delivered', 'opened', 'clicked'

  -- Riferimento al log email
  email_log_id UUID REFERENCES email_logs(id) ON DELETE SET NULL,

  -- Tracking eventi
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,

  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Vincoli
  CHECK (status IN ('pending', 'sent', 'failed', 'bounced', 'delivered', 'opened', 'clicked')),
  CHECK (length(email) > 0),
  CHECK (retry_count >= 0),

  -- Un destinatario per campagna (evita duplicati)
  UNIQUE(campaign_id, email)
);

-- Indici per performance
CREATE INDEX idx_campaign_recipients_campaign ON email_campaign_recipients(campaign_id);
CREATE INDEX idx_campaign_recipients_org ON email_campaign_recipients(organization_id);
CREATE INDEX idx_campaign_recipients_customer ON email_campaign_recipients(customer_id);
CREATE INDEX idx_campaign_recipients_status ON email_campaign_recipients(status);
CREATE INDEX idx_campaign_recipients_email ON email_campaign_recipients(email);

-- Indice per query pending (per batch processing)
CREATE INDEX idx_campaign_recipients_pending ON email_campaign_recipients(campaign_id, status)
  WHERE status = 'pending';


-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access email_campaigns" ON email_campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.role = 'admin'
    )
  );

CREATE POLICY "Admin full access email_campaign_recipients" ON email_campaign_recipients
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.role = 'admin'
    )
  );

-- Org users possono vedere solo le proprie campagne
CREATE POLICY "Org users view own campaigns" ON email_campaigns
  FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Org users possono creare campagne
CREATE POLICY "Org users create campaigns" ON email_campaigns
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Org users possono aggiornare le proprie campagne
CREATE POLICY "Org users update own campaigns" ON email_campaigns
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Org users possono eliminare le proprie campagne
CREATE POLICY "Org users delete own campaigns" ON email_campaigns
  FOR DELETE
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Recipients: Org users possono vedere solo i propri
CREATE POLICY "Org users view own campaign_recipients" ON email_campaign_recipients
  FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Recipients: Org users possono inserire
CREATE POLICY "Org users insert campaign_recipients" ON email_campaign_recipients
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Recipients: Org users possono aggiornare
CREATE POLICY "Org users update campaign_recipients" ON email_campaign_recipients
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );


-- ============================================
-- 4. FUNZIONI HELPER
-- ============================================

-- Funzione per aggiornare statistiche campagna
CREATE OR REPLACE FUNCTION update_campaign_stats(campaign_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE email_campaigns
  SET
    sent_count = (
      SELECT COUNT(*) FROM email_campaign_recipients
      WHERE campaign_id = campaign_uuid AND status IN ('sent', 'delivered', 'opened', 'clicked')
    ),
    failed_count = (
      SELECT COUNT(*) FROM email_campaign_recipients
      WHERE campaign_id = campaign_uuid AND status IN ('failed', 'bounced')
    ),
    delivered_count = (
      SELECT COUNT(*) FROM email_campaign_recipients
      WHERE campaign_id = campaign_uuid AND status IN ('delivered', 'opened', 'clicked')
    ),
    opened_count = (
      SELECT COUNT(*) FROM email_campaign_recipients
      WHERE campaign_id = campaign_uuid AND status IN ('opened', 'clicked')
    ),
    clicked_count = (
      SELECT COUNT(*) FROM email_campaign_recipients
      WHERE campaign_id = campaign_uuid AND status = 'clicked'
    ),
    updated_at = NOW()
  WHERE id = campaign_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per marcare campagna come completata
CREATE OR REPLACE FUNCTION complete_campaign_if_done(campaign_uuid UUID)
RETURNS void AS $$
DECLARE
  pending_count INTEGER;
BEGIN
  -- Conta quanti recipient sono ancora pending
  SELECT COUNT(*) INTO pending_count
  FROM email_campaign_recipients
  WHERE campaign_id = campaign_uuid AND status = 'pending';

  -- Se non ci sono più pending, marca come completed
  IF pending_count = 0 THEN
    UPDATE email_campaigns
    SET
      status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = campaign_uuid AND status = 'sending';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger per aggiornare stats quando cambia uno status recipient
CREATE OR REPLACE FUNCTION trigger_update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Aggiorna stats della campagna
  PERFORM update_campaign_stats(NEW.campaign_id);

  -- Controlla se campagna è completata
  PERFORM complete_campaign_if_done(NEW.campaign_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_campaign_recipient_status_change
  AFTER INSERT OR UPDATE OF status ON email_campaign_recipients
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_campaign_stats();


-- ============================================
-- 5. COMMENTI TABELLE
-- ============================================

COMMENT ON TABLE email_campaigns IS 'Campagne email marketing per organizzazioni';
COMMENT ON TABLE email_campaign_recipients IS 'Tracking invio per ogni destinatario della campagna';

COMMENT ON COLUMN email_campaigns.status IS 'draft|scheduled|sending|completed|failed|paused';
COMMENT ON COLUMN email_campaigns.target_filter IS 'Filtri JSON per selezionare destinatari (loyalty_tier, tags, ecc.)';
COMMENT ON COLUMN email_campaigns.total_recipients IS 'Numero totale destinatari della campagna';

COMMENT ON COLUMN email_campaign_recipients.status IS 'pending|sent|failed|bounced|delivered|opened|clicked';
COMMENT ON COLUMN email_campaign_recipients.retry_count IS 'Numero di tentativi di reinvio';


-- ============================================
-- FINE MIGRATION 021
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 021 completata con successo!';
  RAISE NOTICE '📧 Tabelle create: email_campaigns, email_campaign_recipients';
  RAISE NOTICE '🔒 RLS policies configurate';
  RAISE NOTICE '⚙️ Funzioni helper e trigger creati';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Sistema campagne email pronto!';
END $$;
