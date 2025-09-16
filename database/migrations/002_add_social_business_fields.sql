-- Migration: Add social media and business contact fields to organizations
-- Date: 2025-09-05  
-- Description: Adds missing fields for complete business profile

-- Add business contact fields
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS business_email VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS tagline VARCHAR(500);

-- Add social media fields
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS twitter_url TEXT;

-- Update comment
COMMENT ON TABLE organizations IS 'Multi-tenant organizations table - Updated 2025-09-05 with social and contact fields';