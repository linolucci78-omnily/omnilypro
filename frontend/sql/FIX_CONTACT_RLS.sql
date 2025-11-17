-- Fix Contact Form RLS Policy
-- The issue is likely the WITH CHECK clause not being properly evaluated

-- Drop all existing policies on contact_form_submissions
DROP POLICY IF EXISTS "Allow public contact form submissions" ON contact_form_submissions;
DROP POLICY IF EXISTS "Enable insert for anonymous users" ON contact_form_submissions;
DROP POLICY IF EXISTS "Public can insert contact forms" ON contact_form_submissions;

-- Ensure RLS is enabled
ALTER TABLE contact_form_submissions ENABLE ROW LEVEL SECURITY;

-- Create new policy with proper boolean expression (not string "true")
CREATE POLICY "public_insert_contact_forms"
  ON contact_form_submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Also allow authenticated users to insert (for testing)
CREATE POLICY "authenticated_insert_contact_forms"
  ON contact_form_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Verify policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'contact_form_submissions'
ORDER BY policyname;
