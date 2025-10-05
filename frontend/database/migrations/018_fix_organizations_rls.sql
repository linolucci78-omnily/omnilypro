-- Fix RLS policies for organizations table to allow super_admin access
-- This migration allows super admin users from organization_users table to read all organizations

-- First, check if RLS is enabled on organizations
-- If not, the error is coming from somewhere else

-- Policy: Super admins can read all organizations (via organization_users table)
DO $$
BEGIN
    -- Drop the policy if it exists
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'organizations'
        AND policyname = 'Super admins can read all organizations'
    ) THEN
        DROP POLICY "Super admins can read all organizations" ON organizations;
    END IF;
END $$;

CREATE POLICY "Super admins can read all organizations"
ON organizations FOR SELECT
TO authenticated
USING (
  -- Allow if user is super_admin in organization_users table
  EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_users.user_id = auth.uid()
    AND organization_users.role = 'super_admin'
  )
);

-- Policy: Users can read their own organization(s)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'organizations'
        AND policyname = 'Users can read own organizations'
    ) THEN
        DROP POLICY "Users can read own organizations" ON organizations;
    END IF;
END $$;

CREATE POLICY "Users can read own organizations"
ON organizations FOR SELECT
TO authenticated
USING (
  -- Allow if user is member of this organization
  id IN (
    SELECT org_id FROM organization_users
    WHERE organization_users.user_id = auth.uid()
  )
);

-- Policy: Super admins can insert organizations
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'organizations'
        AND policyname = 'Super admins can insert organizations'
    ) THEN
        DROP POLICY "Super admins can insert organizations" ON organizations;
    END IF;
END $$;

CREATE POLICY "Super admins can insert organizations"
ON organizations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_users.user_id = auth.uid()
    AND organization_users.role = 'super_admin'
  )
);

-- Policy: Super admins can update organizations
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'organizations'
        AND policyname = 'Super admins can update organizations'
    ) THEN
        DROP POLICY "Super admins can update organizations" ON organizations;
    END IF;
END $$;

CREATE POLICY "Super admins can update organizations"
ON organizations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_users.user_id = auth.uid()
    AND organization_users.role = 'super_admin'
  )
);

-- Policy: Super admins can delete organizations
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'organizations'
        AND policyname = 'Super admins can delete organizations'
    ) THEN
        DROP POLICY "Super admins can delete organizations" ON organizations;
    END IF;
END $$;

CREATE POLICY "Super admins can delete organizations"
ON organizations FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_users
    WHERE organization_users.user_id = auth.uid()
    AND organization_users.role = 'super_admin'
  )
);
