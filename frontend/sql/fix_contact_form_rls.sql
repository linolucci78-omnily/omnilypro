-- ============================================
-- FIX: Allow public users to submit contact forms
-- ============================================
-- This policy allows anyone (including anonymous users)
-- to insert contact form submissions into the database

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow public contact form submissions" ON contact_form_submissions;

-- Create policy to allow public INSERT
CREATE POLICY "Allow public contact form submissions"
  ON contact_form_submissions
  FOR INSERT
  WITH CHECK (true);

-- Verify RLS is enabled
ALTER TABLE contact_form_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Done! Now anyone can submit the contact form
-- ============================================
