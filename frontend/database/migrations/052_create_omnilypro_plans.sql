-- Migration: Create OMNILYPRO Plans System
-- Description: Tabella per gestire i piani di abbonamento di OMNILYPRO (Free, Pro, Enterprise, ecc.)
-- Date: 2025-01-29

-- ============================================================================
-- 1. OMNILYPRO PLANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS omnilypro_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Information
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,

  -- Pricing
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  setup_fee DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',

  -- Stripe Integration
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),
  stripe_product_id VARCHAR(255),

  -- Features (JSON object with boolean values)
  features JSONB DEFAULT '{
    "posEnabled": false,
    "emailMarketing": false,
    "smsMarketing": false,
    "whatsappMarketing": false,
    "customBranding": false,
    "customDomain": false,
    "apiAccess": false,
    "advancedAnalytics": false,
    "automations": false,
    "loyaltyPrograms": true,
    "giftCards": false,
    "subscriptions": false,
    "multiLocation": false,
    "teamManagement": false,
    "prioritySupport": false,
    "websiteBuilder": false,
    "mobileApp": false
  }'::jsonb,

  -- Limits (JSON object with numeric values, null = unlimited)
  limits JSONB DEFAULT '{
    "maxCustomers": 100,
    "maxTeamMembers": 1,
    "maxLocations": 1,
    "maxEmailsPerMonth": 1000,
    "maxSMSPerMonth": 0,
    "maxAutomations": 0,
    "maxLoyaltyPrograms": 1,
    "maxWorkflows": 0,
    "maxNotifications": 100
  }'::jsonb,

  -- UI/UX
  color VARCHAR(7) DEFAULT '#3B82F6',
  badge_text VARCHAR(50),
  is_popular BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,

  -- Visibility & Status
  is_active BOOLEAN DEFAULT true,
  visibility VARCHAR(50) DEFAULT 'public',
  sort_order INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_visibility CHECK (visibility IN ('public', 'hidden', 'internal')),
  CONSTRAINT positive_prices CHECK (
    price_monthly >= 0 AND
    price_yearly >= 0 AND
    setup_fee >= 0
  )
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================
CREATE INDEX idx_omnilypro_plans_slug ON omnilypro_plans(slug);
CREATE INDEX idx_omnilypro_plans_active ON omnilypro_plans(is_active);
CREATE INDEX idx_omnilypro_plans_visibility ON omnilypro_plans(visibility);
CREATE INDEX idx_omnilypro_plans_sort ON omnilypro_plans(sort_order);

-- ============================================================================
-- 3. UPDATE ORGANIZATIONS TABLE
-- ============================================================================
-- Aggiungi colonna plan_id alle organizations (se non esiste già)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'plan_id'
  ) THEN
    ALTER TABLE organizations ADD COLUMN plan_id UUID REFERENCES omnilypro_plans(id);
    CREATE INDEX idx_organizations_plan ON organizations(plan_id);
  END IF;
END $$;

-- ============================================================================
-- 4. TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_omnilypro_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER omnilypro_plans_updated_at
  BEFORE UPDATE ON omnilypro_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_omnilypro_plans_updated_at();

-- ============================================================================
-- 5. SEED INITIAL PLANS
-- ============================================================================

-- Free Plan
INSERT INTO omnilypro_plans (
  name, slug, description,
  price_monthly, price_yearly, setup_fee,
  features, limits,
  color, badge_text, is_popular, sort_order, is_active
) VALUES (
  'Free',
  'free',
  'Piano gratuito per iniziare',
  0, 0, 0,
  '{
    "posEnabled": false,
    "emailMarketing": false,
    "smsMarketing": false,
    "whatsappMarketing": false,
    "customBranding": false,
    "customDomain": false,
    "apiAccess": false,
    "advancedAnalytics": false,
    "automations": false,
    "loyaltyPrograms": true,
    "giftCards": false,
    "subscriptions": false,
    "multiLocation": false,
    "teamManagement": false,
    "prioritySupport": false,
    "websiteBuilder": false,
    "mobileApp": false
  }'::jsonb,
  '{
    "maxCustomers": 100,
    "maxTeamMembers": 1,
    "maxLocations": 1,
    "maxEmailsPerMonth": 100,
    "maxSMSPerMonth": 0,
    "maxAutomations": 0,
    "maxLoyaltyPrograms": 1,
    "maxWorkflows": 0,
    "maxNotifications": 50
  }'::jsonb,
  '#64748b', NULL, false, 1, true
) ON CONFLICT (slug) DO NOTHING;

-- Basic Plan
INSERT INTO omnilypro_plans (
  name, slug, description,
  price_monthly, price_yearly, setup_fee,
  features, limits,
  color, badge_text, is_popular, sort_order, is_active
) VALUES (
  'Basic',
  'basic',
  'Perfetto per piccole attività',
  49, 490, 299,
  '{
    "posEnabled": true,
    "emailMarketing": true,
    "smsMarketing": false,
    "whatsappMarketing": false,
    "customBranding": false,
    "customDomain": false,
    "apiAccess": false,
    "advancedAnalytics": false,
    "automations": true,
    "loyaltyPrograms": true,
    "giftCards": true,
    "subscriptions": true,
    "multiLocation": false,
    "teamManagement": true,
    "prioritySupport": false,
    "websiteBuilder": true,
    "mobileApp": true
  }'::jsonb,
  '{
    "maxCustomers": 500,
    "maxTeamMembers": 3,
    "maxLocations": 1,
    "maxEmailsPerMonth": 5000,
    "maxSMSPerMonth": 0,
    "maxAutomations": 5,
    "maxLoyaltyPrograms": 3,
    "maxWorkflows": 3,
    "maxNotifications": 500
  }'::jsonb,
  '#3b82f6', NULL, false, 2, true
) ON CONFLICT (slug) DO NOTHING;

-- Pro Plan
INSERT INTO omnilypro_plans (
  name, slug, description,
  price_monthly, price_yearly, setup_fee,
  features, limits,
  color, badge_text, is_popular, sort_order, is_active
) VALUES (
  'Pro',
  'pro',
  'Per aziende in crescita',
  99, 990, 299,
  '{
    "posEnabled": true,
    "emailMarketing": true,
    "smsMarketing": true,
    "whatsappMarketing": true,
    "customBranding": true,
    "customDomain": false,
    "apiAccess": true,
    "advancedAnalytics": true,
    "automations": true,
    "loyaltyPrograms": true,
    "giftCards": true,
    "subscriptions": true,
    "multiLocation": true,
    "teamManagement": true,
    "prioritySupport": true,
    "websiteBuilder": true,
    "mobileApp": true
  }'::jsonb,
  '{
    "maxCustomers": 2000,
    "maxTeamMembers": 10,
    "maxLocations": 3,
    "maxEmailsPerMonth": 20000,
    "maxSMSPerMonth": 2000,
    "maxAutomations": 20,
    "maxLoyaltyPrograms": 10,
    "maxWorkflows": 10,
    "maxNotifications": 5000
  }'::jsonb,
  '#8b5cf6', 'Più Popolare', true, 3, true
) ON CONFLICT (slug) DO NOTHING;

-- Enterprise Plan
INSERT INTO omnilypro_plans (
  name, slug, description,
  price_monthly, price_yearly, setup_fee,
  features, limits,
  color, badge_text, is_popular, sort_order, is_active
) VALUES (
  'Enterprise',
  'enterprise',
  'Soluzione completa per grandi organizzazioni',
  199, 1990, 299,
  '{
    "posEnabled": true,
    "emailMarketing": true,
    "smsMarketing": true,
    "whatsappMarketing": true,
    "customBranding": true,
    "customDomain": true,
    "apiAccess": true,
    "advancedAnalytics": true,
    "automations": true,
    "loyaltyPrograms": true,
    "giftCards": true,
    "subscriptions": true,
    "multiLocation": true,
    "teamManagement": true,
    "prioritySupport": true,
    "websiteBuilder": true,
    "mobileApp": true
  }'::jsonb,
  '{
    "maxCustomers": null,
    "maxTeamMembers": null,
    "maxLocations": null,
    "maxEmailsPerMonth": null,
    "maxSMSPerMonth": null,
    "maxAutomations": null,
    "maxLoyaltyPrograms": null,
    "maxWorkflows": null,
    "maxNotifications": null
  }'::jsonb,
  '#ec4899', NULL, false, 4, true
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE omnilypro_plans ENABLE ROW LEVEL SECURITY;

-- Everyone can view active public plans
CREATE POLICY "Public plans are viewable by everyone"
  ON omnilypro_plans FOR SELECT
  USING (is_active = true AND visibility = 'public');

-- Only super admins can manage plans (you'll need to create a super_admins table or use specific user IDs)
CREATE POLICY "Only super admins can manage plans"
  ON omnilypro_plans FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM super_admins
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE omnilypro_plans IS 'Piani di abbonamento OMNILYPRO - gestiti dinamicamente dall''admin panel';
COMMENT ON COLUMN omnilypro_plans.features IS 'Features del piano (JSON object con boolean)';
COMMENT ON COLUMN omnilypro_plans.limits IS 'Limiti del piano (JSON object con numeri, null = illimitato)';
COMMENT ON COLUMN omnilypro_plans.visibility IS 'Visibilità: public (landing page), hidden (non mostrato), internal (solo admin)';

-- Migration completed
SELECT 'Migration 052 completed successfully - OMNILYPRO Plans created' as message;
