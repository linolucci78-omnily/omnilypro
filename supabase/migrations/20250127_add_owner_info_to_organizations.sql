-- Migration: Add Owner Information to Organizations Table
-- Date: 2025-01-27
-- Description: Adds owner details (name, email, phone, avatar) to organizations table

-- Add owner information columns
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS owner_first_name TEXT,
ADD COLUMN IF NOT EXISTS owner_last_name TEXT,
ADD COLUMN IF NOT EXISTS owner_email TEXT,
ADD COLUMN IF NOT EXISTS owner_phone TEXT,
ADD COLUMN IF NOT EXISTS owner_avatar_url TEXT;

-- Add comment to document the purpose
COMMENT ON COLUMN organizations.owner_first_name IS 'First name of the business owner';
COMMENT ON COLUMN organizations.owner_last_name IS 'Last name of the business owner';
COMMENT ON COLUMN organizations.owner_email IS 'Email address of the business owner';
COMMENT ON COLUMN organizations.owner_phone IS 'Phone number of the business owner';
COMMENT ON COLUMN organizations.owner_avatar_url IS 'Avatar/profile picture URL of the business owner';

-- Create index on owner_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_owner_email ON organizations(owner_email);

-- Log the migration
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Added owner information columns to organizations table';
END $$;
