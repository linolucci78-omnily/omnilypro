-- ============================================
-- FIREBASE CLOUD MESSAGING - PUSH NOTIFICATIONS
-- Multi-tenant notification system for OmnilyPro
-- ============================================

-- Tabella per Device Tokens (FCM)
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Token FCM
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),

  -- Device Info
  device_info JSONB DEFAULT '{}'::jsonb,
  app_version TEXT,
  os_version TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  CONSTRAINT unique_customer_device UNIQUE (customer_id, token)
);

-- Indexes per performance
CREATE INDEX IF NOT EXISTS idx_device_tokens_customer ON device_tokens(customer_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_organization ON device_tokens(organization_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_active ON device_tokens(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_device_tokens_platform ON device_tokens(platform);

-- ============================================
-- NOTIFICATION PREFERENCES
-- ============================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Tipi di notifiche (default: tutte abilitate)
  loyalty_updates BOOLEAN DEFAULT true,
  promotions BOOLEAN DEFAULT true,
  order_updates BOOLEAN DEFAULT true,
  wallet_transactions BOOLEAN DEFAULT true,
  rewards_unlocked BOOLEAN DEFAULT true,
  birthday_wishes BOOLEAN DEFAULT true,
  events BOOLEAN DEFAULT true,

  -- Orari silenziosi (quiet hours)
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un record per customer+organization
  CONSTRAINT unique_customer_org_prefs UNIQUE (customer_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_customer ON notification_preferences(customer_id);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_organization ON notification_preferences(organization_id);

-- ============================================
-- NOTIFICATION LOG (Storico)
-- ============================================

CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Contenuto notifica
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  data JSONB DEFAULT '{}'::jsonb,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'clicked')),
  error_message TEXT,

  -- FCM response
  fcm_message_id TEXT,

  -- Timestamps
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  -- Campagna (se parte di una campagna)
  campaign_id UUID
);

CREATE INDEX IF NOT EXISTS idx_notification_log_organization ON notification_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_customer ON notification_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_status ON notification_log(status);
CREATE INDEX IF NOT EXISTS idx_notification_log_type ON notification_log(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_log_sent_at ON notification_log(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_log_campaign ON notification_log(campaign_id) WHERE campaign_id IS NOT NULL;

-- ============================================
-- PUSH CAMPAIGNS (Campagne Marketing)
-- ============================================

CREATE TABLE IF NOT EXISTS push_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Contenuto
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  action_url TEXT,

  -- Targeting
  target_all BOOLEAN DEFAULT false,
  target_tier TEXT, -- 'bronze', 'silver', 'gold', 'platinum'
  target_min_points INTEGER,
  target_max_points INTEGER,
  target_customer_ids UUID[], -- Specifici customer IDs

  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),

  -- Metriche
  total_targeted INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,

  -- Metadata
  created_by UUID, -- Rimuovo la FOREIGN KEY per ora
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_campaigns_organization ON push_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_push_campaigns_status ON push_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_push_campaigns_scheduled ON push_campaigns(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- ============================================
-- ORGANIZATION NOTIFICATION SETTINGS
-- ============================================

-- Aggiungi colonna per impostazioni notifiche organizzazione
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "enabled": true,
  "max_daily_notifications": 10,
  "allow_promotional": true,
  "quiet_hours_start": null,
  "quiet_hours_end": null
}'::jsonb;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Aggiorna timestamp updated_at
CREATE OR REPLACE FUNCTION update_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers per updated_at
DROP TRIGGER IF EXISTS update_device_tokens_updated_at ON device_tokens;
CREATE TRIGGER update_device_tokens_updated_at
  BEFORE UPDATE ON device_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_updated_at();

DROP TRIGGER IF EXISTS update_notification_prefs_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_prefs_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_updated_at();

DROP TRIGGER IF EXISTS update_push_campaigns_updated_at ON push_campaigns;
CREATE TRIGGER update_push_campaigns_updated_at
  BEFORE UPDATE ON push_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_updated_at();

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- Device Tokens RLS
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own device tokens" ON device_tokens;
CREATE POLICY "Customers can view own device tokens"
  ON device_tokens FOR SELECT
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers can insert own device tokens" ON device_tokens;
CREATE POLICY "Customers can insert own device tokens"
  ON device_tokens FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers can update own device tokens" ON device_tokens;
CREATE POLICY "Customers can update own device tokens"
  ON device_tokens FOR UPDATE
  USING (auth.uid() = customer_id);

-- Notification Preferences RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can manage own notification preferences" ON notification_preferences;
CREATE POLICY "Customers can manage own notification preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- Notification Log RLS
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own notification log" ON notification_log;
CREATE POLICY "Customers can view own notification log"
  ON notification_log FOR SELECT
  USING (auth.uid() = customer_id);

-- Push Campaigns RLS - Per ora solo lettura pubblica, aggiungeremo policy quando avremo staff table
ALTER TABLE push_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view campaigns" ON push_campaigns;
CREATE POLICY "Anyone can view campaigns"
  ON push_campaigns FOR SELECT
  USING (true);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE device_tokens IS 'Firebase Cloud Messaging device tokens for push notifications';
COMMENT ON TABLE notification_preferences IS 'Customer preferences for receiving notifications';
COMMENT ON TABLE notification_log IS 'Historical log of all sent notifications';
COMMENT ON TABLE push_campaigns IS 'Marketing campaigns for targeted push notifications';
