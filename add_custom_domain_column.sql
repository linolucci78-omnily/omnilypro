-- Add custom_domain column to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS custom_domain TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_custom_domain
ON organizations(custom_domain);

-- Add comment
COMMENT ON COLUMN organizations.custom_domain IS 'Custom subdomain for the organization (e.g., pizzeria-roma.omnilypro.com)';
