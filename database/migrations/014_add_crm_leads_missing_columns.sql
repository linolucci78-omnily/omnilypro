-- Add missing columns to crm_leads table for full CRM functionality

-- Add assigned_to column (sales agent assigned to this lead)
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add organization_id if not exists (should already exist but just in case)
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Add estimated_value for deal value tracking
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(10, 2) DEFAULT 0;

-- Add last_activity_date to track when lead was last contacted
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS last_activity_date TIMESTAMPTZ;

-- Add source tracking
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS source VARCHAR(100); -- 'website', 'referral', 'cold_call', 'event', 'other'

-- Add lost_reason for when deals are lost
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS lost_reason TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_crm_leads_assigned_to ON crm_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_leads_organization ON crm_leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_last_activity ON crm_leads(last_activity_date DESC);

-- Update existing leads to have a default organization_id (use first organization if exists)
-- This is safe because IF NOT EXISTS will skip if column already has data
DO $$
DECLARE
  first_org_id UUID;
BEGIN
  -- Get first organization ID
  SELECT id INTO first_org_id FROM organizations LIMIT 1;

  -- Update leads without organization
  IF first_org_id IS NOT NULL THEN
    UPDATE crm_leads
    SET organization_id = first_org_id
    WHERE organization_id IS NULL;
  END IF;
END $$;

-- Make organization_id NOT NULL after setting defaults
ALTER TABLE crm_leads
ALTER COLUMN organization_id SET NOT NULL;
