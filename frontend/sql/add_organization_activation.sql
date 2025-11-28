-- Migration: Add activation and payment status to organizations
-- Purpose: Support onboarding flow with Stripe payment activation

-- Add new columns to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'active', 'suspended', 'cancelled')),
ADD COLUMN IF NOT EXISTS activation_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'unpaid')),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_activation_token ON organizations(activation_token);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer ON organizations(stripe_customer_id);

-- Update existing organizations to 'active' status (they were created before this migration)
UPDATE organizations
SET status = 'active',
    onboarding_completed = true,
    activated_at = created_at
WHERE status IS NULL OR status = 'pending_payment';

-- Add comment for documentation
COMMENT ON COLUMN organizations.status IS 'Organization status: pending_payment (waiting for payment), active (paid and active), suspended (payment issues), cancelled (subscription ended)';
COMMENT ON COLUMN organizations.activation_token IS 'Unique token used in activation URL sent to business owner';
COMMENT ON COLUMN organizations.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN organizations.stripe_subscription_id IS 'Stripe subscription ID for recurring billing';
