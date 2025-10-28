-- Migration: Create Subscriptions System
-- Description: Universal subscription system for any type of business
-- Date: 2025-01-28

-- ============================================================================
-- 1. SUBSCRIPTION TEMPLATES (Configuration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Basic Information
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Subscription Type
  subscription_type VARCHAR(50) NOT NULL,
    -- 'daily_item' = 1 item per day
    -- 'daily_multiple' = X items per day
    -- 'total_items' = X items total in period
    -- 'unlimited_access' = unlimited access
    -- 'service_bundle' = specific services included

  -- Duration Configuration
  duration_type VARCHAR(50) NOT NULL,  -- 'days', 'weeks', 'months', 'years'
  duration_value INTEGER NOT NULL CHECK (duration_value > 0),

  -- Usage Limits
  daily_limit INTEGER CHECK (daily_limit > 0),  -- NULL = unlimited
  weekly_limit INTEGER CHECK (weekly_limit > 0),
  total_limit INTEGER CHECK (total_limit > 0),

  -- Items/Services Configuration
  included_items JSONB DEFAULT '[]'::jsonb,
    -- [{product_id: "...", name: "...", quantity: 1, max_price: 50}]
  included_categories JSONB DEFAULT '[]'::jsonb,
    -- ["pizze", "bevande"]
  excluded_categories JSONB DEFAULT '[]'::jsonb,
    -- ["alcool", "premium"]

  -- Price Limits
  max_price_per_item DECIMAL(10, 2),

  -- Time Restrictions
  allowed_hours JSONB,
    -- {start: "06:00", end: "22:00"}
  allowed_days JSONB,
    -- ["monday", "tuesday", "wednesday", "thursday", "friday"]

  -- Pricing
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  original_price DECIMAL(10, 2),  -- for showing savings
  currency VARCHAR(3) DEFAULT 'EUR',

  -- Renewal Settings
  auto_renewable BOOLEAN DEFAULT false,
  renewable_manually BOOLEAN DEFAULT true,

  -- Extra Benefits (additional discounts, etc.)
  extra_benefits JSONB DEFAULT '[]'::jsonb,
    -- [{type: "discount", categories: ["calzini"], discount_percent: 10}]

  -- Status & Visibility
  is_active BOOLEAN DEFAULT true,
  visibility VARCHAR(50) DEFAULT 'public',  -- 'public', 'hidden', 'vip_only'

  -- UI/UX
  image_url TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  badge_text VARCHAR(50),  -- "BEST VALUE", "POPULAR", "NEW"
  sort_order INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Indexes
  CONSTRAINT valid_subscription_type CHECK (
    subscription_type IN ('daily_item', 'daily_multiple', 'total_items', 'unlimited_access', 'service_bundle')
  ),
  CONSTRAINT valid_duration_type CHECK (
    duration_type IN ('days', 'weeks', 'months', 'years')
  ),
  CONSTRAINT valid_visibility CHECK (
    visibility IN ('public', 'hidden', 'vip_only')
  )
);

CREATE INDEX idx_subscription_templates_org ON subscription_templates(organization_id);
CREATE INDEX idx_subscription_templates_active ON subscription_templates(is_active);
CREATE INDEX idx_subscription_templates_visibility ON subscription_templates(visibility);

-- ============================================================================
-- 2. CUSTOMER SUBSCRIPTIONS (Active Instances)
-- ============================================================================
CREATE TABLE IF NOT EXISTS customer_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES subscription_templates(id),

  -- Subscription Code
  subscription_code VARCHAR(50) UNIQUE NOT NULL,

  -- Dates
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  next_renewal_date TIMESTAMPTZ,

  -- Status
  status VARCHAR(50) DEFAULT 'active',
    -- 'active', 'paused', 'expired', 'cancelled'

  -- Usage Tracking
  usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
  daily_usage_count INTEGER DEFAULT 0 CHECK (daily_usage_count >= 0),
  weekly_usage_count INTEGER DEFAULT 0 CHECK (weekly_usage_count >= 0),
  last_usage_date DATE,
  last_usage_reset_at TIMESTAMPTZ DEFAULT NOW(),
  last_weekly_reset_at TIMESTAMPTZ DEFAULT NOW(),

  -- Payment Info
  payment_method VARCHAR(50),  -- 'cash', 'card', 'wallet', 'bank_transfer'
  amount_paid DECIMAL(10, 2) NOT NULL CHECK (amount_paid >= 0),
  currency VARCHAR(3) DEFAULT 'EUR',

  -- Renewal Tracking
  renewal_count INTEGER DEFAULT 0 CHECK (renewal_count >= 0),
  total_amount_paid DECIMAL(10, 2) CHECK (total_amount_paid >= 0),

  -- Pause Tracking
  paused_at TIMESTAMPTZ,
  pause_reason TEXT,
  pause_days_used INTEGER DEFAULT 0,

  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT valid_status CHECK (
    status IN ('active', 'paused', 'expired', 'cancelled')
  ),
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_customer_subscriptions_org ON customer_subscriptions(organization_id);
CREATE INDEX idx_customer_subscriptions_customer ON customer_subscriptions(customer_id);
CREATE INDEX idx_customer_subscriptions_template ON customer_subscriptions(template_id);
CREATE INDEX idx_customer_subscriptions_code ON customer_subscriptions(subscription_code);
CREATE INDEX idx_customer_subscriptions_status ON customer_subscriptions(status);
CREATE INDEX idx_customer_subscriptions_dates ON customer_subscriptions(start_date, end_date);

-- ============================================================================
-- 3. SUBSCRIPTION USAGES (Detailed Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES customer_subscriptions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Usage Details
  used_at TIMESTAMPTZ DEFAULT NOW(),
  item_name VARCHAR(255) NOT NULL,
  item_id UUID,  -- reference to product/service (optional)
  item_category VARCHAR(100),
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),

  -- Context
  cashier_name VARCHAR(255),
  cashier_id UUID REFERENCES auth.users(id),
  pos_device_id VARCHAR(255),

  -- Value
  item_value DECIMAL(10, 2),  -- value of consumed item

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_usages_subscription ON subscription_usages(subscription_id);
CREATE INDEX idx_subscription_usages_customer ON subscription_usages(customer_id);
CREATE INDEX idx_subscription_usages_org ON subscription_usages(organization_id);
CREATE INDEX idx_subscription_usages_date ON subscription_usages(used_at);

-- ============================================================================
-- 4. SUBSCRIPTION RENEWALS (History)
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_renewals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES customer_subscriptions(id) ON DELETE CASCADE,

  -- Renewal Info
  renewed_at TIMESTAMPTZ DEFAULT NOW(),
  previous_end_date TIMESTAMPTZ NOT NULL,
  new_end_date TIMESTAMPTZ NOT NULL,

  -- Payment
  payment_method VARCHAR(50),
  amount_paid DECIMAL(10, 2) NOT NULL CHECK (amount_paid >= 0),
  currency VARCHAR(3) DEFAULT 'EUR',

  -- Tracking
  renewal_type VARCHAR(50) NOT NULL,  -- 'auto', 'manual'
  processed_by VARCHAR(255),  -- cashier name or "system"
  processed_by_id UUID REFERENCES auth.users(id),

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_renewal_type CHECK (
    renewal_type IN ('auto', 'manual')
  )
);

CREATE INDEX idx_subscription_renewals_subscription ON subscription_renewals(subscription_id);
CREATE INDEX idx_subscription_renewals_date ON subscription_renewals(renewed_at);

-- ============================================================================
-- 5. SUBSCRIPTION SETTINGS (Organization Configuration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Code Configuration
  code_prefix VARCHAR(10) DEFAULT 'SUB',
  next_code_number INTEGER DEFAULT 1,

  -- Notifications
  notify_on_expiry BOOLEAN DEFAULT true,
  notify_days_before INTEGER DEFAULT 3 CHECK (notify_days_before >= 0),
  notify_on_usage BOOLEAN DEFAULT false,

  -- Usage Policies
  allow_exceed_daily_limit BOOLEAN DEFAULT false,
  allow_exceed_weekly_limit BOOLEAN DEFAULT false,

  -- Features
  allow_pause BOOLEAN DEFAULT true,
  max_pause_days INTEGER DEFAULT 30 CHECK (max_pause_days >= 0),
  allow_transfer BOOLEAN DEFAULT false,  -- transfer to another customer
  require_payment_upfront BOOLEAN DEFAULT true,

  -- Auto-renewal
  enable_auto_renewal BOOLEAN DEFAULT false,
  auto_renewal_reminder_days INTEGER DEFAULT 7,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_settings_org ON subscription_settings(organization_id);

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_templates_updated_at
  BEFORE UPDATE ON subscription_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

CREATE TRIGGER customer_subscriptions_updated_at
  BEFORE UPDATE ON customer_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

CREATE TRIGGER subscription_settings_updated_at
  BEFORE UPDATE ON subscription_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- Auto-generate subscription code
CREATE OR REPLACE FUNCTION generate_subscription_code()
RETURNS TRIGGER AS $$
DECLARE
  settings_record RECORD;
  new_code VARCHAR(50);
BEGIN
  -- Get settings for organization
  SELECT * INTO settings_record
  FROM subscription_settings
  WHERE organization_id = NEW.organization_id;

  -- If no settings, use defaults
  IF NOT FOUND THEN
    INSERT INTO subscription_settings (organization_id)
    VALUES (NEW.organization_id)
    RETURNING * INTO settings_record;
  END IF;

  -- Generate code
  new_code := settings_record.code_prefix || '-' ||
              TO_CHAR(EXTRACT(YEAR FROM NOW()), 'FM0000') || '-' ||
              LPAD(settings_record.next_code_number::TEXT, 5, '0');

  -- Update next number
  UPDATE subscription_settings
  SET next_code_number = next_code_number + 1
  WHERE organization_id = NEW.organization_id;

  -- Assign code
  NEW.subscription_code = new_code;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_subscriptions_generate_code
  BEFORE INSERT ON customer_subscriptions
  FOR EACH ROW
  WHEN (NEW.subscription_code IS NULL OR NEW.subscription_code = '')
  EXECUTE FUNCTION generate_subscription_code();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE subscription_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_settings ENABLE ROW LEVEL SECURITY;

-- Policies for subscription_templates
CREATE POLICY "Users can view templates of their organizations"
  ON subscription_templates FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage templates"
  ON subscription_templates FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Policies for customer_subscriptions
CREATE POLICY "Users can view subscriptions of their organizations"
  ON customer_subscriptions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage subscriptions of their organizations"
  ON customer_subscriptions FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Policies for subscription_usages
CREATE POLICY "Users can view usages of their organizations"
  ON subscription_usages FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert usages for their organizations"
  ON subscription_usages FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Policies for subscription_renewals
CREATE POLICY "Users can view renewals of their organizations"
  ON subscription_renewals FOR SELECT
  USING (
    subscription_id IN (
      SELECT id FROM customer_subscriptions
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert renewals for their organizations"
  ON subscription_renewals FOR INSERT
  WITH CHECK (
    subscription_id IN (
      SELECT id FROM customer_subscriptions
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policies for subscription_settings
CREATE POLICY "Users can view settings of their organizations"
  ON subscription_settings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage settings"
  ON subscription_settings FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Function to check if subscription is valid and can be used
CREATE OR REPLACE FUNCTION check_subscription_validity(
  p_subscription_id UUID,
  OUT is_valid BOOLEAN,
  OUT reason TEXT
)
AS $$
DECLARE
  sub_record RECORD;
BEGIN
  -- Get subscription
  SELECT * INTO sub_record
  FROM customer_subscriptions
  WHERE id = p_subscription_id;

  -- Check if exists
  IF NOT FOUND THEN
    is_valid := false;
    reason := 'Subscription not found';
    RETURN;
  END IF;

  -- Check status
  IF sub_record.status != 'active' THEN
    is_valid := false;
    reason := 'Subscription is ' || sub_record.status;
    RETURN;
  END IF;

  -- Check expiry
  IF sub_record.end_date < NOW() THEN
    is_valid := false;
    reason := 'Subscription expired on ' || sub_record.end_date::DATE;
    RETURN;
  END IF;

  is_valid := true;
  reason := 'Valid';
END;
$$ LANGUAGE plpgsql;

-- Function to get subscription statistics
CREATE OR REPLACE FUNCTION get_subscription_stats(p_organization_id UUID)
RETURNS TABLE (
  total_active INTEGER,
  total_revenue DECIMAL,
  total_usages INTEGER,
  expiring_soon INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_active,
    COALESCE(SUM(total_amount_paid), 0)::DECIMAL AS total_revenue,
    COALESCE(SUM(usage_count), 0)::INTEGER AS total_usages,
    COUNT(*) FILTER (
      WHERE end_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
    )::INTEGER AS expiring_soon
  FROM customer_subscriptions
  WHERE organization_id = p_organization_id
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE subscription_templates IS 'Templates for subscription packages - configured by organization admins';
COMMENT ON TABLE customer_subscriptions IS 'Active subscription instances purchased by customers';
COMMENT ON TABLE subscription_usages IS 'Detailed tracking of each subscription usage';
COMMENT ON TABLE subscription_renewals IS 'History of subscription renewals';
COMMENT ON TABLE subscription_settings IS 'Organization-level subscription settings';

COMMENT ON COLUMN subscription_templates.subscription_type IS 'Type of subscription: daily_item, daily_multiple, total_items, unlimited_access, service_bundle';
COMMENT ON COLUMN customer_subscriptions.subscription_code IS 'Unique code for customer to use subscription (QR code / NFC)';
COMMENT ON COLUMN customer_subscriptions.usage_count IS 'Total number of times subscription has been used';
