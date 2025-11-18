-- Migration: Demo Requests Table
-- Description: Stores demo request submissions from the qualification wizard
-- Author: OmnilyPro
-- Date: 2025-01-18

-- Create demo_requests table
CREATE TABLE IF NOT EXISTS demo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Company Info (Step 1)
  company_name VARCHAR(255) NOT NULL,
  website VARCHAR(500),
  industry VARCHAR(100),
  employees_count VARCHAR(50),

  -- Locations (Step 2)
  locations_count VARCHAR(50),
  locations_cities TEXT,
  existing_pos VARCHAR(50),
  existing_pos_name VARCHAR(255),

  -- Customer Management (Step 3)
  has_loyalty_program VARCHAR(100),
  current_customer_management TEXT,
  active_customers_count VARCHAR(50),

  -- Goals (Step 4)
  goals JSONB, -- Array of selected goals

  -- Timeline & Budget (Step 5)
  timeline VARCHAR(50),
  budget_range VARCHAR(50),

  -- Contact Info (Step 6)
  contact_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  contact_role VARCHAR(255),

  -- Metadata
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'approved', 'rejected', 'converted')),
  notes TEXT, -- Admin notes
  assigned_to UUID REFERENCES auth.users(id), -- Sales agent assigned

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  contacted_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ
);

-- Create indexes for better query performance
CREATE INDEX idx_demo_requests_status ON demo_requests(status);
CREATE INDEX idx_demo_requests_created_at ON demo_requests(created_at DESC);
CREATE INDEX idx_demo_requests_contact_email ON demo_requests(contact_email);
CREATE INDEX idx_demo_requests_company_name ON demo_requests(company_name);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_demo_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER demo_requests_updated_at
  BEFORE UPDATE ON demo_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_demo_requests_updated_at();

-- RLS Policies
ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (public form submission)
CREATE POLICY "Anyone can submit demo requests"
  ON demo_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Authenticated users (admins) can view all demo requests
CREATE POLICY "Admins can view all demo requests"
  ON demo_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_users
      WHERE organization_users.user_id = auth.uid()
      AND organization_users.role IN ('super_admin', 'sales_agent', 'account_manager')
    )
  );

-- Policy: Admins can update demo requests
CREATE POLICY "Admins can update demo requests"
  ON demo_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_users
      WHERE organization_users.user_id = auth.uid()
      AND organization_users.role IN ('super_admin', 'sales_agent', 'account_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_users
      WHERE organization_users.user_id = auth.uid()
      AND organization_users.role IN ('super_admin', 'sales_agent', 'account_manager')
    )
  );

-- Comments
COMMENT ON TABLE demo_requests IS 'Stores demo request submissions from the qualification wizard';
COMMENT ON COLUMN demo_requests.status IS 'Status: pending, contacted, approved, rejected, converted';
COMMENT ON COLUMN demo_requests.goals IS 'JSON array of selected goals from step 4';
COMMENT ON COLUMN demo_requests.assigned_to IS 'Sales agent assigned to this demo request';
