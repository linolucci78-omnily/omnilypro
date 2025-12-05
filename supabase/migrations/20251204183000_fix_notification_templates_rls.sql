-- Fix RLS policies for notification_templates to use correct organization_users table reference

-- Drop existing policies
DROP POLICY IF EXISTS "Organizations can view their own templates" ON notification_templates;
DROP POLICY IF EXISTS "Organizations can insert their own templates" ON notification_templates;
DROP POLICY IF EXISTS "Organizations can update their own templates" ON notification_templates;
DROP POLICY IF EXISTS "Organizations can delete their own templates" ON notification_templates;

-- Recreate policies with correct table reference (organization_users with org_id column)
CREATE POLICY "Organizations can view their own templates"
  ON notification_templates FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users WHERE user_id = auth.uid()
    )
    OR is_predefined = true -- Everyone can see predefined templates
  );

CREATE POLICY "Organizations can insert their own templates"
  ON notification_templates FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT org_id FROM organization_users WHERE user_id = auth.uid()
    )
    AND is_predefined = false -- Can't create predefined templates
  );

CREATE POLICY "Organizations can update their own templates"
  ON notification_templates FOR UPDATE
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users WHERE user_id = auth.uid()
    )
    AND is_predefined = false -- Can't edit predefined templates
  );

CREATE POLICY "Organizations can delete their own templates"
  ON notification_templates FOR DELETE
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users WHERE user_id = auth.uid()
    )
    AND is_predefined = false -- Can't delete predefined templates
  );
