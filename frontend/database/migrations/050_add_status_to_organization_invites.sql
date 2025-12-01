-- Migration: Add status and plan_type columns to organization_invites table

-- Add status column if it doesn't exist
ALTER TABLE organization_invites
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'));

-- Add plan_type column if it doesn't exist
ALTER TABLE organization_invites
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'basic' CHECK (plan_type IN ('basic', 'premium', 'enterprise', 'pro', 'free'));

-- Add index for faster lookups by status
CREATE INDEX IF NOT EXISTS idx_organization_invites_status
ON organization_invites(status);

-- Add index for faster lookups by email and status
CREATE INDEX IF NOT EXISTS idx_organization_invites_email_status
ON organization_invites(email, status);

-- Migration completed
SELECT 'Migration 050 completed successfully' as message;
