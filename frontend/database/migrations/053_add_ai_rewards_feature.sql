-- Add AI Rewards Feature to OmnilyPro Plans
-- This migration adds the AI rewards generation feature to the plans system

-- Update Free Plan - NO AI
UPDATE omnilypro_plans
SET features = jsonb_set(
  features,
  '{aiRewardsEnabled}',
  'false'::jsonb
),
limits = jsonb_set(
  limits,
  '{maxAIGenerationsPerMonth}',
  '0'::jsonb
)
WHERE slug = 'free';

-- Update Basic Plan - NO AI
UPDATE omnilypro_plans
SET features = jsonb_set(
  features,
  '{aiRewardsEnabled}',
  'false'::jsonb
),
limits = jsonb_set(
  limits,
  '{maxAIGenerationsPerMonth}',
  '0'::jsonb
)
WHERE slug = 'basic';

-- Update Pro Plan - LIMITED AI (10 generations per month)
UPDATE omnilypro_plans
SET features = jsonb_set(
  features,
  '{aiRewardsEnabled}',
  'true'::jsonb
),
limits = jsonb_set(
  limits,
  '{maxAIGenerationsPerMonth}',
  '10'::jsonb
)
WHERE slug = 'pro';

-- Update Enterprise Plan - UNLIMITED AI
UPDATE omnilypro_plans
SET features = jsonb_set(
  features,
  '{aiRewardsEnabled}',
  'true'::jsonb
),
limits = jsonb_set(
  limits,
  '{maxAIGenerationsPerMonth}',
  'null'::jsonb
)
WHERE slug = 'enterprise';

-- Create table to track AI usage
CREATE TABLE IF NOT EXISTS ai_rewards_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rewards_count INTEGER NOT NULL DEFAULT 8,
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 4),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_rewards_usage_org ON ai_rewards_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_rewards_usage_date ON ai_rewards_usage(generated_at);

-- Enable RLS
ALTER TABLE ai_rewards_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_rewards_usage
DROP POLICY IF EXISTS "Users can view their org AI usage" ON ai_rewards_usage;
CREATE POLICY "Users can view their org AI usage"
  ON ai_rewards_usage FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations
      WHERE id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "System can insert AI usage" ON ai_rewards_usage;
CREATE POLICY "System can insert AI usage"
  ON ai_rewards_usage FOR INSERT
  WITH CHECK (true);

-- Function to check AI usage limit
CREATE OR REPLACE FUNCTION check_ai_rewards_limit(org_id UUID)
RETURNS JSONB AS $$
DECLARE
  plan_record RECORD;
  usage_count INTEGER;
  max_limit INTEGER;
  result JSONB;
BEGIN
  -- Get organization plan and limits
  SELECT
    op.features->>'aiRewardsEnabled' as ai_enabled,
    op.limits->>'maxAIGenerationsPerMonth' as max_generations,
    op.slug as plan_slug
  INTO plan_record
  FROM organizations o
  JOIN omnilypro_plans op ON o.plan_id = op.id
  WHERE o.id = org_id;

  -- If plan not found or AI not enabled
  IF plan_record IS NULL OR plan_record.ai_enabled = 'false' THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'AI Rewards feature not available in your plan',
      'upgradeRequired', true
    );
  END IF;

  -- If unlimited (Enterprise)
  IF plan_record.max_generations IS NULL OR plan_record.max_generations = 'null' THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'unlimited', true
    );
  END IF;

  -- Check usage for current month
  max_limit := (plan_record.max_generations)::INTEGER;

  SELECT COUNT(*)
  INTO usage_count
  FROM ai_rewards_usage
  WHERE organization_id = org_id
    AND generated_at >= date_trunc('month', NOW());

  -- Return result
  IF usage_count >= max_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Monthly AI generation limit reached',
      'usage', usage_count,
      'limit', max_limit,
      'upgradeRequired', true
    );
  ELSE
    RETURN jsonb_build_object(
      'allowed', true,
      'usage', usage_count,
      'limit', max_limit,
      'remaining', max_limit - usage_count
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'AI Rewards feature added to plans successfully! ✅' as message;
