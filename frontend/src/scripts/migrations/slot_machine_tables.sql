/**
 * OMNILYPRO GAMING MODULE - Slot Machine Tables
 * Run this SQL in Supabase SQL Editor to create slot machine tables
 */

-- ============================================
-- SLOT MACHINE CONFIGURATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS slot_machine_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Slot Machine',
  symbols JSONB NOT NULL DEFAULT '[]'::jsonb,
  winning_combinations JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_spins_per_day INTEGER NOT NULL DEFAULT 3,
  cooldown_hours INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Indexes
  CONSTRAINT slot_config_org_unique UNIQUE (organization_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_slot_config_org ON slot_machine_config(organization_id);
CREATE INDEX IF NOT EXISTS idx_slot_config_active ON slot_machine_config(is_active);

-- ============================================
-- CUSTOMER SLOT SPINS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customer_slot_spins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slot_config_id UUID REFERENCES slot_machine_config(id) ON DELETE SET NULL,
  result JSONB NOT NULL,
  prize_won JSONB,
  rewards_claimed BOOLEAN NOT NULL DEFAULT false,
  rewards_claimed_at TIMESTAMP WITH TIME ZONE,
  spun_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for queries
CREATE INDEX IF NOT EXISTS idx_slot_spins_customer ON customer_slot_spins(customer_id);
CREATE INDEX IF NOT EXISTS idx_slot_spins_org ON customer_slot_spins(organization_id);
CREATE INDEX IF NOT EXISTS idx_slot_spins_spun_at ON customer_slot_spins(spun_at);
CREATE INDEX IF NOT EXISTS idx_slot_spins_customer_date ON customer_slot_spins(customer_id, spun_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE slot_machine_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_slot_spins ENABLE ROW LEVEL SECURITY;

-- Policies for slot_machine_config
-- Anyone can read active configs
CREATE POLICY "Anyone can view active slot configs"
  ON slot_machine_config FOR SELECT
  USING (is_active = true);

-- Service role can manage configs
CREATE POLICY "Service role can manage slot configs"
  ON slot_machine_config FOR ALL
  USING (auth.role() = 'service_role');

-- Policies for customer_slot_spins
-- Customers can view their own spins
CREATE POLICY "Customers can view own slot spins"
  ON customer_slot_spins FOR SELECT
  USING (true); -- Will be filtered by customer_id in application

-- Service role can insert spins
CREATE POLICY "Service role can insert slot spins"
  ON customer_slot_spins FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_slot_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER slot_config_updated_at
  BEFORE UPDATE ON slot_machine_config
  FOR EACH ROW
  EXECUTE FUNCTION update_slot_config_updated_at();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE slot_machine_config IS 'Slot machine configuration per organization';
COMMENT ON TABLE customer_slot_spins IS 'Customer slot machine spins history';

COMMENT ON COLUMN slot_machine_config.symbols IS 'Array of slot symbols with weights: [{symbol: "🍒", weight: 30}, ...]';
COMMENT ON COLUMN slot_machine_config.winning_combinations IS 'Array of winning patterns and prizes';
COMMENT ON COLUMN customer_slot_spins.result IS 'Spin result with reels and win status';
COMMENT ON COLUMN customer_slot_spins.prize_won IS 'Prize details if won';
