-- ============================================
-- ADD MAINTENANCE MODE TO WEBSITES
-- ============================================
-- This allows websites to show a "maintenance" page
-- instead of being completely disabled (404)

-- Add maintenance mode column to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_maintenance_mode boolean DEFAULT false;

-- Add maintenance message column (optional custom message)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_maintenance_message text;

-- Add estimated return time (optional)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_maintenance_until timestamptz;

-- Comment the columns
COMMENT ON COLUMN organizations.website_maintenance_mode IS 'When true, shows maintenance page instead of full website';
COMMENT ON COLUMN organizations.website_maintenance_message IS 'Custom message to show on maintenance page';
COMMENT ON COLUMN organizations.website_maintenance_until IS 'Estimated time when website will be back online';

-- ============================================
-- Now you have 3 states:
-- 1. website_enabled = true, maintenance_mode = false  → Site works normally
-- 2. website_enabled = true, maintenance_mode = true   → Shows maintenance page
-- 3. website_enabled = false                           → Shows 404 / Not found
-- ============================================
