-- Migration: Include super_admin in subscription_settings RLS policies
-- Description: Update RLS policies to include super_admin role
-- Date: 2025-01-28

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view settings of their organizations" ON subscription_settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON subscription_settings;

-- Recreate view policy (no changes needed, but recreating for consistency)
CREATE POLICY "Users can view settings of their organizations"
  ON subscription_settings FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Recreate manage policy with super_admin included
CREATE POLICY "Admins can manage settings"
  ON subscription_settings FOR ALL
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
