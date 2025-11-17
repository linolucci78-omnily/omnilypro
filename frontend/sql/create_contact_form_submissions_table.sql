-- Create Contact Form Submissions Table
CREATE TABLE IF NOT EXISTS contact_form_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_form_submissions_organization_id ON contact_form_submissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_contact_form_submissions_status ON contact_form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_form_submissions_submitted_at ON contact_form_submissions(submitted_at DESC);

-- Enable RLS
ALTER TABLE contact_form_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to insert (submit contact form)
CREATE POLICY "Allow public to submit contact forms"
  ON contact_form_submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow organization members to view their own submissions
CREATE POLICY "Allow organization members to view submissions"
  ON contact_form_submissions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Allow organization admins to update submissions
CREATE POLICY "Allow organization admins to update submissions"
  ON contact_form_submissions
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Policy: Allow organization admins to delete submissions
CREATE POLICY "Allow organization admins to delete submissions"
  ON contact_form_submissions
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );
