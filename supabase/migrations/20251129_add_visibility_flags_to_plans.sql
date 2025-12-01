-- Add visibility flags to omnilypro_plans table

-- Add show_in_wizard column (default true for backwards compatibility)
ALTER TABLE omnilypro_plans
ADD COLUMN IF NOT EXISTS show_in_wizard BOOLEAN DEFAULT true;

-- Add show_in_landing column (same as visibility='public' for backwards compatibility)
ALTER TABLE omnilypro_plans
ADD COLUMN IF NOT EXISTS show_in_landing BOOLEAN DEFAULT true;

-- Update existing plans to match current visibility settings
UPDATE omnilypro_plans
SET show_in_landing = (visibility = 'public')
WHERE show_in_landing IS NULL;

COMMENT ON COLUMN omnilypro_plans.show_in_wizard IS 'If true, plan appears in the organization creation wizard';
COMMENT ON COLUMN omnilypro_plans.show_in_landing IS 'If true, plan appears on the public landing/pricing page';
