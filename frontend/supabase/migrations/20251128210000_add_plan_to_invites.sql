-- Add plan_type to organization_invites
ALTER TABLE organization_invites 
ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'premium';

-- Add comment
COMMENT ON COLUMN organization_invites.plan_type IS 'Piano selezionato per l''organizzazione: basic, premium, enterprise';
