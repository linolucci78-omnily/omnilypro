-- ============================================================================
-- API Keys Configuration Table
-- Store API keys securely with encryption
-- ============================================================================

-- Create table for API keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name VARCHAR(100) NOT NULL UNIQUE,
  key_value TEXT, -- Encrypted value (nullable until configured)
  description TEXT,
  is_active BOOLEAN DEFAULT false, -- Inactive by default until key is set
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_tested_at TIMESTAMPTZ,
  test_status VARCHAR(50) -- 'success', 'failed', 'not_tested'
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_api_keys_name ON api_keys(key_name);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

-- RLS Policies - Only accessible by super admins
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "Super admins can manage API keys"
  ON api_keys
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS api_keys_updated_at ON api_keys;
CREATE TRIGGER api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_keys_updated_at();

-- Insert Anthropic API key placeholder (value needs to be set by admin)
INSERT INTO api_keys (key_name, description, is_active, test_status)
VALUES (
  'ANTHROPIC_API_KEY',
  'Anthropic Claude API key for AI rewards generation',
  false,
  'not_tested'
)
ON CONFLICT (key_name) DO NOTHING;

COMMENT ON TABLE api_keys IS 'Stores encrypted API keys for third-party integrations';
COMMENT ON COLUMN api_keys.key_value IS 'Encrypted API key value - never expose in plain text to frontend';
COMMENT ON COLUMN api_keys.test_status IS 'Last test result: success, failed, or not_tested';
