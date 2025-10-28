-- Migration: Include super_admin in RLS policies
-- Description: Update RLS policy to include super_admin role
-- Date: 2025-01-28

-- Drop existing policy
DROP POLICY IF EXISTS "Admins can manage templates" ON subscription_templates;

-- Recreate with super_admin included
CREATE POLICY "Admins can manage templates"
  ON subscription_templates FOR ALL
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'manager', 'staff', 'super_admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'manager', 'staff', 'super_admin')
    )
  );
