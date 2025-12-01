-- Migration: Add plan_id to organizations table
-- This replaces the old plan_type string with a UUID foreign key to omnilypro_plans

-- Add plan_id column as nullable UUID (we'll migrate existing data first)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES omnilypro_plans(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_organizations_plan_id ON organizations(plan_id);

-- Comment for documentation
COMMENT ON COLUMN organizations.plan_id IS 'Foreign key to omnilypro_plans table - replaces the old plan_type string field';

-- Note: plan_type column is kept for backward compatibility during migration
-- Once all data is migrated and all code updated, plan_type can be dropped in a future migration
