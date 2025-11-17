-- Check for RESTRICTIVE policies that might be blocking
SELECT
  schemaname,
  tablename,
  policyname,
  permissive, -- RESTRICTIVE policies block even if PERMISSIVE allows
  roles,
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'contact_form_submissions'
ORDER BY permissive DESC, policyname;

-- If you see any RESTRICTIVE policies above, that's the problem
-- They override PERMISSIVE policies

-- Solution: Drop ALL policies and recreate with ONLY what we need
DROP POLICY IF EXISTS "Allow organization admins to delete submissions" ON contact_form_submissions;
DROP POLICY IF EXISTS "Allow organization admins to update submissions" ON contact_form_submissions;
DROP POLICY IF EXISTS "Allow organization members to view submissions" ON contact_form_submissions;
DROP POLICY IF EXISTS "authenticated_insert_contact_forms" ON contact_form_submissions;
DROP POLICY IF EXISTS "public_insert_contact_forms" ON contact_form_submissions;

-- Create ONLY the essential policies
-- For anonymous users (public contact form)
CREATE POLICY "anon_insert_contact_forms"
  ON contact_form_submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- For authenticated users
CREATE POLICY "authenticated_insert_contact_forms"
  ON contact_form_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- For organization members to view their submissions
CREATE POLICY "members_view_contact_forms"
  ON contact_form_submissions
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users WHERE user_id = auth.uid()
    )
  );

-- For organization admins to update/delete
CREATE POLICY "admins_manage_contact_forms"
  ON contact_form_submissions
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Verify the new policies
SELECT
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'contact_form_submissions'
ORDER BY policyname;
