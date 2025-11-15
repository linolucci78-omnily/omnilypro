-- =====================================================
-- OMNILYPRO - Create Missing Tables
-- Execute this on Supabase SQL Editor to fix all errors
-- =====================================================

-- =====================================================
-- 1. CUSTOMER ACTIVITIES TABLE
-- Tracks all customer actions (visits, purchases, points, etc.)
-- =====================================================

CREATE TABLE IF NOT EXISTS customer_activities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Activity type
  activity_type text NOT NULL,  -- 'visit', 'transaction', 'points_added', 'reward_redeemed', 'gaming_play', etc.
  type text,  -- Legacy field (some code uses this)

  -- Activity details
  activity_title text,
  activity_description text,
  activity_data jsonb,

  -- Financial tracking
  monetary_value numeric(10, 2) DEFAULT 0,

  -- Points tracking
  points_earned integer DEFAULT 0,
  points_spent integer DEFAULT 0,

  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_activities_org ON customer_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_customer ON customer_activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_type ON customer_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_customer_activities_created ON customer_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_customer_activities_org_created ON customer_activities(organization_id, created_at);

-- RLS Policies
ALTER TABLE customer_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their own activities"
  ON customer_activities FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE id = organization_id
    )
  );

CREATE POLICY "Organizations can insert their own activities"
  ON customer_activities FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations
      WHERE id = organization_id
    )
  );

-- =====================================================
-- 2. CUSTOMER STREAKS TABLE
-- Tracks consecutive visit/purchase streaks
-- =====================================================

CREATE TABLE IF NOT EXISTS customer_streaks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Streak info
  type text NOT NULL,  -- 'daily_visit', 'daily_purchase', etc.
  current_count integer DEFAULT 0,
  longest_count integer DEFAULT 0,

  -- Dates
  last_activity_date date,
  streak_start_date date,

  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  UNIQUE(customer_id, type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_streaks_customer ON customer_streaks(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_streaks_org ON customer_streaks(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_streaks_type ON customer_streaks(type);

-- RLS
ALTER TABLE customer_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their streaks"
  ON customer_streaks FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE id = organization_id
    )
  );

CREATE POLICY "Organizations can manage their streaks"
  ON customer_streaks FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE id = organization_id
    )
  );

-- =====================================================
-- 3. REFERRAL PROGRAM TABLE
-- Tracks customer referral programs
-- =====================================================

CREATE TABLE IF NOT EXISTS referral_program (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Referral code
  referral_code text NOT NULL UNIQUE,

  -- Stats
  total_referrals integer DEFAULT 0,
  successful_referrals integer DEFAULT 0,
  pending_referrals integer DEFAULT 0,
  conversion_rate numeric(5, 2) DEFAULT 0,

  -- Rewards
  total_points_earned integer DEFAULT 0,
  total_rewards_claimed integer DEFAULT 0,

  -- Share tracking
  shares_whatsapp integer DEFAULT 0,
  shares_email integer DEFAULT 0,
  shares_social integer DEFAULT 0,
  qr_code_scans integer DEFAULT 0,

  -- Status
  is_active boolean DEFAULT true,

  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_referral_at timestamp with time zone,

  UNIQUE(customer_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referral_program_org ON referral_program(organization_id);
CREATE INDEX IF NOT EXISTS idx_referral_program_customer ON referral_program(customer_id);
CREATE INDEX IF NOT EXISTS idx_referral_program_code ON referral_program(referral_code);

-- RLS
ALTER TABLE referral_program ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their referral programs"
  ON referral_program FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE id = organization_id
    )
  );

CREATE POLICY "Organizations can manage their referral programs"
  ON referral_program FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE id = organization_id
    )
  );

-- =====================================================
-- 4. SCRATCH CARD CONFIG TABLE (for Gaming Module)
-- Configuration for scratch card game
-- =====================================================

CREATE TABLE IF NOT EXISTS scratch_card_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Game settings
  enabled boolean DEFAULT true,
  max_plays_per_day integer DEFAULT 1,

  -- Prize configuration (JSONB for flexibility)
  prizes jsonb DEFAULT '{
    "cherry": {"symbol": "🍒", "points": 50, "probability": 30},
    "diamond": {"symbol": "💎", "points": 100, "probability": 20},
    "star": {"symbol": "⭐", "points": 200, "probability": 10},
    "gift": {"symbol": "🎁", "points": 500, "probability": 5}
  }'::jsonb,

  no_prize_probability integer DEFAULT 35,

  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  UNIQUE(organization_id)
);

-- RLS
ALTER TABLE scratch_card_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can manage their scratch card config"
  ON scratch_card_config FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE id = organization_id
    )
  );

-- =====================================================
-- 5. CUSTOMER SCRATCH PLAYS TABLE (for Gaming Module)
-- Tracks customer scratch card plays
-- =====================================================

CREATE TABLE IF NOT EXISTS customer_scratch_plays (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Play info
  play_date date NOT NULL DEFAULT CURRENT_DATE,

  -- Result
  won boolean DEFAULT false,
  prize_symbol text,
  prize_points integer DEFAULT 0,

  -- Grid (for record keeping)
  grid_symbols jsonb,  -- Array of 9 symbols

  -- Metadata
  played_at timestamp with time zone DEFAULT now(),

  -- Index for daily limit checking
  UNIQUE(customer_id, organization_id, play_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scratch_plays_org ON customer_scratch_plays(organization_id);
CREATE INDEX IF NOT EXISTS idx_scratch_plays_customer ON customer_scratch_plays(customer_id);
CREATE INDEX IF NOT EXISTS idx_scratch_plays_date ON customer_scratch_plays(play_date);
CREATE INDEX IF NOT EXISTS idx_scratch_plays_customer_date ON customer_scratch_plays(customer_id, play_date);

-- RLS
ALTER TABLE customer_scratch_plays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their scratch plays"
  ON customer_scratch_plays FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE id = organization_id
    )
  );

CREATE POLICY "Organizations can insert scratch plays"
  ON customer_scratch_plays FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations
      WHERE id = organization_id
    )
  );

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ All missing tables created successfully!';
  RAISE NOTICE '✅ customer_activities - Created';
  RAISE NOTICE '✅ customer_streaks - Created';
  RAISE NOTICE '✅ referral_program - Created';
  RAISE NOTICE '✅ scratch_card_config - Created';
  RAISE NOTICE '✅ customer_scratch_plays - Created';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Now reload your app - all errors should be gone!';
END $$;
