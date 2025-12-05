-- Create push_campaigns table for storing notification campaigns
CREATE TABLE IF NOT EXISTS push_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Campaign Details
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),

  -- Notification Content
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  deep_link TEXT,

  -- Delivery Configuration
  channels TEXT[] DEFAULT ARRAY['push'],
  segments TEXT[] DEFAULT ARRAY['all'],
  filters JSONB DEFAULT '[]'::jsonb,
  delivery_type TEXT DEFAULT 'immediate' CHECK (delivery_type IN ('immediate', 'scheduled', 'intelligent')),
  scheduled_time TIMESTAMPTZ,

  -- Results
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,

  -- Full campaign data (for editing later)
  campaign_data JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Add indexes
CREATE INDEX idx_push_campaigns_org ON push_campaigns(organization_id);
CREATE INDEX idx_push_campaigns_status ON push_campaigns(status);
CREATE INDEX idx_push_campaigns_created ON push_campaigns(created_at DESC);

-- Add RLS policies
ALTER TABLE push_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their own campaigns"
  ON push_campaigns FOR SELECT
  USING (organization_id IN (
    SELECT org_id FROM organization_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organizations can insert their own campaigns"
  ON push_campaigns FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT org_id FROM organization_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organizations can update their own campaigns"
  ON push_campaigns FOR UPDATE
  USING (organization_id IN (
    SELECT org_id FROM organization_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organizations can delete their own campaigns"
  ON push_campaigns FOR DELETE
  USING (organization_id IN (
    SELECT org_id FROM organization_users WHERE user_id = auth.uid()
  ));

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_push_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_campaigns_updated_at
  BEFORE UPDATE ON push_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_push_campaigns_updated_at();
