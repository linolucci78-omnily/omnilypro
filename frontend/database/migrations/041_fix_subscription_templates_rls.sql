-- Migration: Fix Subscription Templates RLS Policies
-- Description: Add WITH CHECK clause to allow INSERT operations
-- Date: 2025-01-28

-- Drop existing policy
DROP POLICY IF EXISTS "Admins can manage templates" ON subscription_templates;

-- Recreate with proper WITH CHECK for INSERT
CREATE POLICY "Admins can manage templates"
  ON subscription_templates FOR ALL
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'manager', 'staff')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'manager', 'staff')
    )
  );
