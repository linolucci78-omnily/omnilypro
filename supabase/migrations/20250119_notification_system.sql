-- Migration: OneSignal Notification System for OmnilyPro
-- Description: Tables for managing notification campaigns, templates, and tracking

-- =====================================================
-- Table: notification_templates
-- Purpose: Reusable notification templates per organization
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Template info
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'welcome', 'points_earned', 'tier_upgrade', 'promotion', 'custom'

  -- Notification content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon_url TEXT,
  image_url TEXT,

  -- Animation settings (optional)
  animation_type TEXT, -- 'points', 'confetti', 'trophy', 'tier_upgrade', null
  animation_data JSONB DEFAULT '{}', -- {points: 50, tier: 'gold', etc.}

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- Table: notification_campaigns
-- Purpose: Marketing campaigns and scheduled notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Campaign info
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'marketing', 'transactional', 'automation'
  template_id UUID REFERENCES notification_templates(id) ON DELETE SET NULL,

  -- Notification content (can override template)
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon_url TEXT,
  image_url TEXT,
  url TEXT, -- Deep link or web URL

  -- Targeting
  target_segment TEXT DEFAULT 'all', -- 'all', 'tier_bronze', 'tier_silver', 'tier_gold', 'active_customers', 'inactive_customers', 'custom'
  target_customer_ids UUID[], -- Specific customer IDs (if custom targeting)
  target_filters JSONB DEFAULT '{}', -- Advanced filters {min_points: 100, last_purchase_days: 30}

  -- Animation
  animation_type TEXT,
  animation_data JSONB DEFAULT '{}',

  -- Scheduling
  send_immediately BOOLEAN DEFAULT false,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'cancelled'

  -- Statistics
  total_recipients INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- Table: notification_logs
-- Purpose: Track individual notification deliveries
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES notification_campaigns(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- OneSignal tracking
  onesignal_notification_id TEXT,
  external_user_id TEXT, -- OneSignal external user ID

  -- Status
  status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'clicked', 'failed'
  error_message TEXT,

  -- Tracking timestamps
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,

  -- Metadata
  device_type TEXT, -- 'web', 'ios', 'android'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_notification_templates_org
  ON notification_templates(organization_id);

CREATE INDEX IF NOT EXISTS idx_notification_campaigns_org
  ON notification_campaigns(organization_id);

CREATE INDEX IF NOT EXISTS idx_notification_campaigns_status
  ON notification_campaigns(status);

CREATE INDEX IF NOT EXISTS idx_notification_campaigns_scheduled
  ON notification_campaigns(scheduled_at)
  WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_notification_logs_campaign
  ON notification_logs(campaign_id);

CREATE INDEX IF NOT EXISTS idx_notification_logs_customer
  ON notification_logs(customer_id);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Templates: Only organization members can access
CREATE POLICY "Organization members can view templates"
  ON notification_templates FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage templates"
  ON notification_templates FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Campaigns: Only organization members can access
CREATE POLICY "Organization members can view campaigns"
  ON notification_campaigns FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can manage campaigns"
  ON notification_campaigns FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Logs: Read-only for organization members
CREATE POLICY "Organization members can view logs"
  ON notification_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- Functions
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_campaigns_updated_at
  BEFORE UPDATE ON notification_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Sample data (optional - for testing)
-- =====================================================

-- Insert default templates (will be added after organizations exist)
-- You can uncomment and customize these after running the migration

/*
INSERT INTO notification_templates (organization_id, name, category, title, message, animation_type)
VALUES
  (
    'YOUR_ORG_ID_HERE',
    'Welcome New Customer',
    'welcome',
    'Benvenuto in {organization_name}!',
    'Grazie per esserti unito a noi! Inizia a guadagnare punti con ogni acquisto.',
    'confetti'
  ),
  (
    'YOUR_ORG_ID_HERE',
    'Points Earned',
    'points_earned',
    'Hai guadagnato {points} punti!',
    'Continua così! Sei più vicino al prossimo premio.',
    'points'
  ),
  (
    'YOUR_ORG_ID_HERE',
    'Tier Upgrade',
    'tier_upgrade',
    'Congratulazioni! Livello {tier} sbloccato!',
    'Ora hai accesso a vantaggi esclusivi e premi speciali.',
    'trophy'
  );
*/
