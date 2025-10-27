-- ============================================================================
-- MIGRATION 029: Gift Certificates System (Enterprise-Grade)
-- ============================================================================
-- Description: Complete professional Gift Certificate system with:
--   - Gift certificate management with unique codes and QR codes
--   - Transaction tracking for redemptions
--   - Customizable templates for different occasions
--   - Organization-specific settings and limits
--   - Audit log for security and fraud detection
--   - Full RLS (Row Level Security) policies
--
-- Author: OMNILY PRO Team
-- Date: 2024-11-27
-- Version: 1.0.0
-- ============================================================================

BEGIN;

-- ============================================================================
-- TABLE 1: gift_certificates (Main table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS gift_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Unique code and identifiers
  code VARCHAR(50) UNIQUE NOT NULL,
  qr_code_data TEXT,
  barcode VARCHAR(50),

  -- Value and balance
  original_amount DECIMAL(10,2) NOT NULL CHECK (original_amount > 0),
  current_balance DECIMAL(10,2) NOT NULL CHECK (current_balance >= 0),
  currency VARCHAR(3) DEFAULT 'EUR',

  -- Issuance information
  issued_by_user_id UUID REFERENCES auth.users(id),
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  issue_type VARCHAR(50) DEFAULT 'purchased' CHECK (
    issue_type IN ('purchased', 'promotional', 'redeemed_points', 'refund', 'gift')
  ),

  -- Recipient information
  recipient_name VARCHAR(255),
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(50),
  personal_message TEXT,

  -- Validity period
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,

  -- Status tracking
  status VARCHAR(50) DEFAULT 'active' CHECK (
    status IN ('active', 'partially_used', 'fully_used', 'expired', 'cancelled', 'suspended')
  ),

  -- Additional metadata
  template_id UUID,
  terms_conditions TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes
  CONSTRAINT positive_amounts CHECK (original_amount > 0 AND current_balance >= 0 AND current_balance <= original_amount)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gift_certificates_code ON gift_certificates(code);
CREATE INDEX IF NOT EXISTS idx_gift_certificates_org ON gift_certificates(organization_id);
CREATE INDEX IF NOT EXISTS idx_gift_certificates_status ON gift_certificates(status);
CREATE INDEX IF NOT EXISTS idx_gift_certificates_email ON gift_certificates(recipient_email);
CREATE INDEX IF NOT EXISTS idx_gift_certificates_valid_until ON gift_certificates(valid_until);
CREATE INDEX IF NOT EXISTS idx_gift_certificates_issued_at ON gift_certificates(issued_at);

-- Add comment
COMMENT ON TABLE gift_certificates IS 'Main table for storing gift certificates with unique codes, balances, and metadata';

-- ============================================================================
-- TABLE 2: gift_certificate_transactions (Transaction history)
-- ============================================================================
CREATE TABLE IF NOT EXISTS gift_certificate_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_certificate_id UUID NOT NULL REFERENCES gift_certificates(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Transaction type and amounts
  transaction_type VARCHAR(50) NOT NULL CHECK (
    transaction_type IN ('issued', 'redeemed', 'refunded', 'cancelled', 'adjustment', 'expired')
  ),
  amount DECIMAL(10,2) NOT NULL,
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,

  -- Transaction reference
  transaction_ref VARCHAR(100),
  performed_by_user_id UUID REFERENCES auth.users(id),
  customer_id UUID REFERENCES customers(id),

  -- POS information (if applicable)
  pos_device_id VARCHAR(100),
  pos_terminal_id VARCHAR(100),

  -- Description and notes
  description TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gift_cert_trans_cert ON gift_certificate_transactions(gift_certificate_id);
CREATE INDEX IF NOT EXISTS idx_gift_cert_trans_org ON gift_certificate_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_gift_cert_trans_type ON gift_certificate_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_gift_cert_trans_date ON gift_certificate_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_gift_cert_trans_customer ON gift_certificate_transactions(customer_id);

COMMENT ON TABLE gift_certificate_transactions IS 'Complete transaction history for all gift certificate operations';

-- ============================================================================
-- TABLE 3: gift_certificate_templates (Design templates)
-- ============================================================================
CREATE TABLE IF NOT EXISTS gift_certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Template information
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_type VARCHAR(50) CHECK (
    template_type IN ('birthday', 'christmas', 'easter', 'valentines', 'generic', 'custom')
  ),

  -- Design assets
  background_image_url TEXT,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#ef4444',
  secondary_color VARCHAR(7) DEFAULT '#dc2626',

  -- Preset amounts
  preset_amounts JSONB DEFAULT '[25, 50, 100, 250]'::jsonb,
  allow_custom_amount BOOLEAN DEFAULT true,
  min_amount DECIMAL(10,2) DEFAULT 10.00,
  max_amount DECIMAL(10,2) DEFAULT 1000.00,

  -- Default validity
  default_validity_days INTEGER DEFAULT 365,

  -- Templates (for future PDF/Email generation)
  pdf_template TEXT,
  email_template TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gift_cert_templates_org ON gift_certificate_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_gift_cert_templates_active ON gift_certificate_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_gift_cert_templates_type ON gift_certificate_templates(template_type);

COMMENT ON TABLE gift_certificate_templates IS 'Customizable templates for gift certificate designs';

-- ============================================================================
-- TABLE 4: gift_certificate_settings (Organization settings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS gift_certificate_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- General settings
  is_enabled BOOLEAN DEFAULT true,
  require_approval BOOLEAN DEFAULT false,

  -- Code generation settings
  code_prefix VARCHAR(20) DEFAULT 'GIFT',
  code_length INTEGER DEFAULT 16 CHECK (code_length >= 8 AND code_length <= 50),
  code_format VARCHAR(50) DEFAULT 'alphanumeric' CHECK (
    code_format IN ('alphanumeric', 'numeric', 'custom')
  ),

  -- Limits and restrictions
  max_amount_per_certificate DECIMAL(10,2) DEFAULT 1000.00,
  max_certificates_per_day INTEGER DEFAULT 100,
  max_balance_per_customer DECIMAL(10,2),

  -- Email automation
  send_email_on_issue BOOLEAN DEFAULT true,
  send_email_on_redeem BOOLEAN DEFAULT false,
  send_reminder_before_expiry BOOLEAN DEFAULT true,
  reminder_days_before INTEGER DEFAULT 30,

  -- Notifications
  notify_admin_on_issue BOOLEAN DEFAULT false,
  notify_admin_threshold DECIMAL(10,2) DEFAULT 500.00,

  -- Anti-fraud settings
  max_validation_attempts INTEGER DEFAULT 5,
  lockout_duration_minutes INTEGER DEFAULT 30,

  -- Default terms
  default_terms_conditions TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gift_cert_settings_org ON gift_certificate_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_gift_cert_settings_enabled ON gift_certificate_settings(is_enabled);

COMMENT ON TABLE gift_certificate_settings IS 'Organization-specific settings for gift certificate system';

-- ============================================================================
-- TABLE 5: gift_certificate_audit_log (Security audit log)
-- ============================================================================
CREATE TABLE IF NOT EXISTS gift_certificate_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_certificate_id UUID REFERENCES gift_certificates(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Action tracking
  action VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES auth.users(id),

  -- Request information
  ip_address INET,
  user_agent TEXT,

  -- Change tracking
  old_values JSONB,
  new_values JSONB,

  -- Result
  success BOOLEAN DEFAULT true,
  error_message TEXT,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gift_cert_audit_cert ON gift_certificate_audit_log(gift_certificate_id);
CREATE INDEX IF NOT EXISTS idx_gift_cert_audit_org ON gift_certificate_audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_gift_cert_audit_action ON gift_certificate_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_gift_cert_audit_date ON gift_certificate_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_gift_cert_audit_user ON gift_certificate_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_cert_audit_ip ON gift_certificate_audit_log(ip_address);

COMMENT ON TABLE gift_certificate_audit_log IS 'Complete audit log for security and fraud detection';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE gift_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_certificate_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_certificate_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_certificate_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: gift_certificates
-- ============================================================================

-- Super admin: full access
CREATE POLICY "Super admins can do everything on gift_certificates"
  ON gift_certificates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.role = 'super_admin'
    )
  );

-- Organization users: access own org certificates
CREATE POLICY "Org users can view own org gift_certificates"
  ON gift_certificates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = gift_certificates.organization_id
    )
  );

CREATE POLICY "Org admins/managers can insert gift_certificates"
  ON gift_certificates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = gift_certificates.organization_id
      AND ou.role IN ('org_admin', 'manager', 'super_admin')
    )
  );

CREATE POLICY "Org admins/managers can update gift_certificates"
  ON gift_certificates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = gift_certificates.organization_id
      AND ou.role IN ('org_admin', 'manager', 'super_admin')
    )
  );

CREATE POLICY "Org admins can delete gift_certificates"
  ON gift_certificates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = gift_certificates.organization_id
      AND ou.role IN ('org_admin', 'super_admin')
    )
  );

-- ============================================================================
-- RLS POLICIES: gift_certificate_transactions
-- ============================================================================

CREATE POLICY "Super admins can do everything on transactions"
  ON gift_certificate_transactions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.role = 'super_admin'
    )
  );

CREATE POLICY "Org users can view own org transactions"
  ON gift_certificate_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = gift_certificate_transactions.organization_id
    )
  );

CREATE POLICY "Org users can insert transactions"
  ON gift_certificate_transactions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = gift_certificate_transactions.organization_id
    )
  );

-- ============================================================================
-- RLS POLICIES: gift_certificate_templates
-- ============================================================================

CREATE POLICY "Super admins can do everything on templates"
  ON gift_certificate_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.role = 'super_admin'
    )
  );

CREATE POLICY "Org users can view own org templates"
  ON gift_certificate_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = gift_certificate_templates.organization_id
    )
  );

CREATE POLICY "Org admins can manage templates"
  ON gift_certificate_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = gift_certificate_templates.organization_id
      AND ou.role IN ('org_admin', 'super_admin')
    )
  );

-- ============================================================================
-- RLS POLICIES: gift_certificate_settings
-- ============================================================================

CREATE POLICY "Super admins can do everything on settings"
  ON gift_certificate_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.role = 'super_admin'
    )
  );

CREATE POLICY "Org users can view own org settings"
  ON gift_certificate_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = gift_certificate_settings.organization_id
    )
  );

CREATE POLICY "Org admins can manage settings"
  ON gift_certificate_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = gift_certificate_settings.organization_id
      AND ou.role IN ('org_admin', 'super_admin')
    )
  );

-- ============================================================================
-- RLS POLICIES: gift_certificate_audit_log
-- ============================================================================

CREATE POLICY "Super admins can view all audit logs"
  ON gift_certificate_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.role = 'super_admin'
    )
  );

CREATE POLICY "Org admins can view own org audit logs"
  ON gift_certificate_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.organization_id = gift_certificate_audit_log.organization_id
      AND ou.role IN ('org_admin', 'super_admin')
    )
  );

CREATE POLICY "System can insert audit logs"
  ON gift_certificate_audit_log
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gift_certificate_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gift_certificates_updated_at
  BEFORE UPDATE ON gift_certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_gift_certificate_updated_at();

CREATE TRIGGER gift_certificate_templates_updated_at
  BEFORE UPDATE ON gift_certificate_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_gift_certificate_updated_at();

CREATE TRIGGER gift_certificate_settings_updated_at
  BEFORE UPDATE ON gift_certificate_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_gift_certificate_updated_at();

-- ============================================================================
-- FUNCTIONS: Helper functions for gift certificates
-- ============================================================================

-- Function to generate unique gift certificate code
CREATE OR REPLACE FUNCTION generate_gift_certificate_code(
  p_organization_id UUID,
  p_prefix VARCHAR DEFAULT 'GIFT',
  p_length INTEGER DEFAULT 16
)
RETURNS VARCHAR AS $$
DECLARE
  v_code VARCHAR;
  v_exists BOOLEAN;
  v_chars VARCHAR := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude similar chars (I,O,0,1)
  v_random_part VARCHAR := '';
  i INTEGER;
BEGIN
  -- Loop until we find a unique code
  LOOP
    v_random_part := '';

    -- Generate random alphanumeric string
    FOR i IN 1..p_length LOOP
      v_random_part := v_random_part || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    END LOOP;

    -- Format: PREFIX-XXXX-XXXX-XXXX (groups of 4)
    v_code := p_prefix || '-' ||
              substr(v_random_part, 1, 4) || '-' ||
              substr(v_random_part, 5, 4) || '-' ||
              substr(v_random_part, 9, 4);

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM gift_certificates WHERE code = v_code) INTO v_exists;

    EXIT WHEN NOT v_exists;
  END LOOP;

  RETURN v_code;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Function to get gift certificate statistics for organization
CREATE OR REPLACE FUNCTION get_gift_certificate_stats(p_organization_id UUID)
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'total_issued', COUNT(*),
    'total_value_issued', COALESCE(SUM(original_amount), 0),
    'active_count', COUNT(*) FILTER (WHERE status IN ('active', 'partially_used')),
    'active_balance', COALESCE(SUM(current_balance) FILTER (WHERE status IN ('active', 'partially_used')), 0),
    'total_redeemed', COALESCE(SUM(original_amount - current_balance), 0),
    'fully_used_count', COUNT(*) FILTER (WHERE status = 'fully_used'),
    'expired_count', COUNT(*) FILTER (WHERE status = 'expired'),
    'avg_certificate_value', COALESCE(AVG(original_amount), 0),
    'redemption_rate', CASE
      WHEN SUM(original_amount) > 0
      THEN ROUND((SUM(original_amount - current_balance) / SUM(original_amount) * 100)::numeric, 2)
      ELSE 0
    END
  )
  INTO v_stats
  FROM gift_certificates
  WHERE organization_id = p_organization_id;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- DEFAULT DATA
-- ============================================================================

-- Insert default template for each organization
INSERT INTO gift_certificate_templates (
  organization_id,
  name,
  description,
  template_type,
  primary_color,
  secondary_color,
  preset_amounts,
  is_default
)
SELECT
  id,
  'Template Generico',
  'Template predefinito per gift certificate generici',
  'generic',
  '#ef4444',
  '#dc2626',
  '[25, 50, 100, 250]'::jsonb,
  true
FROM organizations
WHERE NOT EXISTS (
  SELECT 1 FROM gift_certificate_templates t
  WHERE t.organization_id = organizations.id
);

-- Insert default settings for each organization
INSERT INTO gift_certificate_settings (
  organization_id,
  is_enabled,
  code_prefix,
  default_terms_conditions
)
SELECT
  id,
  true,
  'GIFT',
  'Questo gift certificate è valido per acquisti presso la nostra attività. Non è rimborsabile in denaro e non può essere sostituito in caso di smarrimento o furto. Valido fino alla data di scadenza indicata.'
FROM organizations
WHERE NOT EXISTS (
  SELECT 1 FROM gift_certificate_settings s
  WHERE s.organization_id = organizations.id
);

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify installation)
-- ============================================================================
-- SELECT * FROM gift_certificates LIMIT 5;
-- SELECT * FROM gift_certificate_transactions LIMIT 5;
-- SELECT * FROM gift_certificate_templates LIMIT 5;
-- SELECT * FROM gift_certificate_settings LIMIT 5;
-- SELECT * FROM gift_certificate_audit_log LIMIT 5;
-- SELECT generate_gift_certificate_code('00000000-0000-0000-0000-000000000000'::uuid);
-- SELECT get_gift_certificate_stats('00000000-0000-0000-0000-000000000000'::uuid);
