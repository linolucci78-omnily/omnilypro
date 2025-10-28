-- Migration: Auto-add organization creator as owner
-- Description: Automatically add the user who creates an organization as owner in organization_users
-- Date: 2025-01-28

-- Create function to add creator as owner
CREATE OR REPLACE FUNCTION add_organization_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the creator as owner in organization_users
  INSERT INTO organization_users (user_id, org_id, role)
  VALUES (NEW.owner_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires after organization insert
DROP TRIGGER IF EXISTS trigger_add_organization_owner ON organizations;
CREATE TRIGGER trigger_add_organization_owner
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION add_organization_creator_as_owner();

-- Fix existing organizations: add current owner_id to organization_users if missing
INSERT INTO organization_users (user_id, org_id, role)
SELECT o.owner_id, o.id, 'owner'
FROM organizations o
WHERE o.owner_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM organization_users ou
    WHERE ou.org_id = o.id
    AND ou.user_id = o.owner_id
  )
ON CONFLICT (user_id, org_id) DO NOTHING;
