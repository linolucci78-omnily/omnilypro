-- Migration: Add Win-back Campaign Settings to Organizations
-- Date: 2025-01-28
-- Description: Adds configuration fields for automated win-back campaigns

-- Add win-back configuration columns to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS winback_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS winback_days_threshold INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS winback_bonus_points INTEGER DEFAULT 50;

-- Add comments for documentation
COMMENT ON COLUMN organizations.winback_enabled IS 'Enable/disable automated win-back campaigns for inactive customers';
COMMENT ON COLUMN organizations.winback_days_threshold IS 'Number of days of inactivity before triggering win-back campaign (default: 30)';
COMMENT ON COLUMN organizations.winback_bonus_points IS 'Bonus points offered in win-back campaign (default: 50)';

-- Create index for win-back enabled organizations
CREATE INDEX IF NOT EXISTS idx_organizations_winback_enabled
ON organizations(winback_enabled)
WHERE winback_enabled = true AND is_active = true;

-- Create index on customers last_visit for efficient inactive customer queries
CREATE INDEX IF NOT EXISTS idx_customers_last_visit_org
ON customers(organization_id, last_visit, is_active)
WHERE is_active = true;

-- Update email_automations table to include winback type if not exists
-- Drop existing constraint if exists
ALTER TABLE email_automations DROP CONSTRAINT IF EXISTS email_automations_automation_type_check;

-- Add new constraint including winback
ALTER TABLE email_automations ADD CONSTRAINT email_automations_automation_type_check
CHECK (automation_type IN ('welcome', 'birthday', 'tier_upgrade', 'special_event', 'winback'));

-- Add metadata column if not exists (for storing win-back specific data)
ALTER TABLE email_automations
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index on winback automations for analytics
CREATE INDEX IF NOT EXISTS idx_email_automations_winback
ON email_automations(organization_id, automation_type, sent_at)
WHERE automation_type = 'winback';

-- Sample data: Enable win-back for existing organizations with default settings
UPDATE organizations
SET
  winback_enabled = true,
  winback_days_threshold = 30,
  winback_bonus_points = 50
WHERE is_active = true
  AND winback_enabled IS NULL;

COMMENT ON TABLE email_automations IS 'Tracks all automated email campaigns including welcome, birthday, tier upgrades, and win-back campaigns';
