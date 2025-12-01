-- OMNILYPRO Plans Table - Fixed Version
-- Copy this entire file and paste in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS omnilypro_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0,
  setup_fee DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'EUR',
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),
  stripe_product_id VARCHAR(255),
  features JSONB DEFAULT '{}'::jsonb,
  limits JSONB DEFAULT '{}'::jsonb,
  color VARCHAR(7) DEFAULT '#3B82F6',
  badge_text VARCHAR(50),
  is_popular BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  visibility VARCHAR(50) DEFAULT 'public',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_omnilypro_plans_slug ON omnilypro_plans(slug);
CREATE INDEX IF NOT EXISTS idx_omnilypro_plans_active ON omnilypro_plans(is_active);

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES omnilypro_plans(id);
CREATE INDEX IF NOT EXISTS idx_organizations_plan ON organizations(plan_id);

CREATE OR REPLACE FUNCTION update_omnilypro_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS omnilypro_plans_updated_at ON omnilypro_plans;
CREATE TRIGGER omnilypro_plans_updated_at
  BEFORE UPDATE ON omnilypro_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_omnilypro_plans_updated_at();

ALTER TABLE omnilypro_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view plans" ON omnilypro_plans;
CREATE POLICY "Anyone can view plans"
  ON omnilypro_plans FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage plans" ON omnilypro_plans;
CREATE POLICY "Authenticated users can manage plans"
  ON omnilypro_plans FOR ALL
  USING (auth.role() = 'authenticated');

-- Insert Free Plan
INSERT INTO omnilypro_plans (name, slug, description, price_monthly, price_yearly, setup_fee, features, limits, color, is_popular, sort_order)
SELECT 'Free', 'free', 'Piano gratuito per iniziare', 0, 0, 0,
'{"posEnabled":false,"emailMarketing":false,"smsMarketing":false,"whatsappMarketing":false,"customBranding":false,"customDomain":false,"apiAccess":false,"advancedAnalytics":false,"automations":false,"loyaltyPrograms":true,"giftCards":false,"subscriptions":false,"multiLocation":false,"teamManagement":false,"prioritySupport":false,"websiteBuilder":false,"mobileApp":false}'::jsonb,
'{"maxCustomers":100,"maxTeamMembers":1,"maxLocations":1,"maxEmailsPerMonth":100,"maxSMSPerMonth":0,"maxAutomations":0,"maxLoyaltyPrograms":1,"maxWorkflows":0,"maxNotifications":50}'::jsonb,
'#64748b', false, 1
WHERE NOT EXISTS (SELECT 1 FROM omnilypro_plans WHERE slug = 'free');

-- Insert Basic Plan
INSERT INTO omnilypro_plans (name, slug, description, price_monthly, price_yearly, setup_fee, features, limits, color, is_popular, sort_order)
SELECT 'Basic', 'basic', 'Perfetto per piccole attività', 49, 490, 299,
'{"posEnabled":true,"emailMarketing":true,"smsMarketing":false,"whatsappMarketing":false,"customBranding":false,"customDomain":false,"apiAccess":false,"advancedAnalytics":false,"automations":true,"loyaltyPrograms":true,"giftCards":true,"subscriptions":true,"multiLocation":false,"teamManagement":true,"prioritySupport":false,"websiteBuilder":true,"mobileApp":true}'::jsonb,
'{"maxCustomers":500,"maxTeamMembers":3,"maxLocations":1,"maxEmailsPerMonth":5000,"maxSMSPerMonth":0,"maxAutomations":5,"maxLoyaltyPrograms":3,"maxWorkflows":3,"maxNotifications":500}'::jsonb,
'#3b82f6', false, 2
WHERE NOT EXISTS (SELECT 1 FROM omnilypro_plans WHERE slug = 'basic');

-- Insert Pro Plan
INSERT INTO omnilypro_plans (name, slug, description, price_monthly, price_yearly, setup_fee, features, limits, color, is_popular, sort_order, badge_text)
SELECT 'Pro', 'pro', 'Per aziende in crescita', 99, 990, 299,
'{"posEnabled":true,"emailMarketing":true,"smsMarketing":true,"whatsappMarketing":true,"customBranding":true,"customDomain":false,"apiAccess":true,"advancedAnalytics":true,"automations":true,"loyaltyPrograms":true,"giftCards":true,"subscriptions":true,"multiLocation":true,"teamManagement":true,"prioritySupport":true,"websiteBuilder":true,"mobileApp":true}'::jsonb,
'{"maxCustomers":2000,"maxTeamMembers":10,"maxLocations":3,"maxEmailsPerMonth":20000,"maxSMSPerMonth":2000,"maxAutomations":20,"maxLoyaltyPrograms":10,"maxWorkflows":10,"maxNotifications":5000}'::jsonb,
'#8b5cf6', true, 3, 'Più Popolare'
WHERE NOT EXISTS (SELECT 1 FROM omnilypro_plans WHERE slug = 'pro');

-- Insert Enterprise Plan
INSERT INTO omnilypro_plans (name, slug, description, price_monthly, price_yearly, setup_fee, features, limits, color, is_popular, sort_order)
SELECT 'Enterprise', 'enterprise', 'Soluzione completa per grandi organizzazioni', 199, 1990, 299,
'{"posEnabled":true,"emailMarketing":true,"smsMarketing":true,"whatsappMarketing":true,"customBranding":true,"customDomain":true,"apiAccess":true,"advancedAnalytics":true,"automations":true,"loyaltyPrograms":true,"giftCards":true,"subscriptions":true,"multiLocation":true,"teamManagement":true,"prioritySupport":true,"websiteBuilder":true,"mobileApp":true}'::jsonb,
'{"maxCustomers":null,"maxTeamMembers":null,"maxLocations":null,"maxEmailsPerMonth":null,"maxSMSPerMonth":null,"maxAutomations":null,"maxLoyaltyPrograms":null,"maxWorkflows":null,"maxNotifications":null}'::jsonb,
'#ec4899', false, 4
WHERE NOT EXISTS (SELECT 1 FROM omnilypro_plans WHERE slug = 'enterprise');

SELECT 'OMNILYPRO Plans created successfully! ✅' as message;
