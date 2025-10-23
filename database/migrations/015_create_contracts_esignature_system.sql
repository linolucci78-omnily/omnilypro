-- Digital Contracts and E-Signature System
-- Legal-compliant digital signature with OTP verification
-- eIDAS (EU) and ESIGN Act (US) compliant

-- ============================================
-- 1. CONTRACT TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Template info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_type VARCHAR(50) NOT NULL, -- 'service_agreement', 'nda', 'subscription', 'custom'

  -- Template content
  content TEXT NOT NULL, -- HTML/Markdown with variables {{company_name}}, {{value}}, etc.
  variables JSONB, -- List of available variables

  -- Settings
  requires_counter_signature BOOLEAN DEFAULT FALSE, -- Richiede firma di entrambe le parti
  signature_positions JSONB, -- Posizioni delle firme nel documento

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_contract_templates_org ON contract_templates(organization_id);
CREATE INDEX idx_contract_templates_type ON contract_templates(template_type);

-- ============================================
-- 2. CONTRACTS (Istanze dei contratti)
-- ============================================
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number VARCHAR(50) UNIQUE NOT NULL, -- CTR-2024-001

  -- Relations
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Contract details
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL, -- Rendered content with filled variables
  contract_type VARCHAR(50) NOT NULL,

  -- Financial
  contract_value DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'EUR',

  -- Parties
  client_info JSONB NOT NULL, -- {name, email, phone, company, vat_number, address}
  vendor_info JSONB NOT NULL, -- Info della tua azienda

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  -- 'draft', 'sent', 'viewed', 'signing_in_progress', 'signed', 'completed', 'rejected', 'expired', 'cancelled'

  -- Dates
  sent_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Scadenza per firma
  signed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Storage
  pdf_url TEXT, -- URL del PDF generato
  signed_pdf_url TEXT, -- URL del PDF firmato

  -- Metadata
  metadata JSONB, -- Dati aggiuntivi

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contracts_org ON contracts(organization_id);
CREATE INDEX idx_contracts_lead ON contracts(lead_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_number ON contracts(contract_number);

-- ============================================
-- 3. CONTRACT SIGNATURES (Firme)
-- ============================================
CREATE TABLE IF NOT EXISTS contract_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,

  -- Signer info
  signer_name VARCHAR(255) NOT NULL,
  signer_email VARCHAR(255) NOT NULL,
  signer_phone VARCHAR(50),
  signer_role VARCHAR(50) NOT NULL, -- 'client', 'vendor', 'witness'
  signer_company VARCHAR(255),

  -- Signature process
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- 'pending', 'otp_sent', 'otp_verified', 'signed', 'rejected'

  -- OTP verification
  otp_code VARCHAR(6), -- 6-digit code
  otp_sent_at TIMESTAMPTZ,
  otp_verified_at TIMESTAMPTZ,
  otp_attempts INTEGER DEFAULT 0,
  otp_max_attempts INTEGER DEFAULT 3,

  -- Signature data
  signature_type VARCHAR(50), -- 'otp_verified', 'drawn', 'typed'
  signature_data TEXT, -- Base64 della firma disegnata o hash OTP
  signature_ip VARCHAR(45),
  signature_user_agent TEXT,
  signature_geolocation JSONB, -- {lat, lng, city, country}

  -- Legal compliance
  acceptance_timestamp TIMESTAMPTZ,
  acceptance_method VARCHAR(50), -- 'email_otp', 'sms_otp', 'drawn_signature'
  legal_consent_text TEXT, -- Testo del consenso mostrato
  legal_consent_accepted BOOLEAN DEFAULT FALSE,

  -- Dates
  signed_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contract_signatures_contract ON contract_signatures(contract_id);
CREATE INDEX idx_contract_signatures_email ON contract_signatures(signer_email);
CREATE INDEX idx_contract_signatures_status ON contract_signatures(status);

-- ============================================
-- 4. SIGNATURE AUDIT TRAIL (Log completo)
-- ============================================
CREATE TABLE IF NOT EXISTS signature_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  signature_id UUID REFERENCES contract_signatures(id) ON DELETE CASCADE,

  -- Event info
  event_type VARCHAR(50) NOT NULL,
  -- 'contract_created', 'contract_sent', 'contract_viewed', 'otp_sent', 'otp_verified',
  -- 'signature_started', 'signature_completed', 'signature_rejected', 'contract_expired'

  event_description TEXT,

  -- Actor
  actor_type VARCHAR(50), -- 'system', 'user', 'signer'
  actor_id UUID, -- user_id se applicabile
  actor_email VARCHAR(255),
  actor_name VARCHAR(255),

  -- Technical details
  ip_address VARCHAR(45),
  user_agent TEXT,
  geolocation JSONB,

  -- Metadata
  metadata JSONB, -- Dati aggiuntivi dell'evento

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signature_audit_contract ON signature_audit_log(contract_id);
CREATE INDEX idx_signature_audit_signature ON signature_audit_log(signature_id);
CREATE INDEX idx_signature_audit_event ON signature_audit_log(event_type);
CREATE INDEX idx_signature_audit_timestamp ON signature_audit_log(created_at DESC);

-- ============================================
-- 5. EMAIL/SMS NOTIFICATIONS LOG
-- ============================================
CREATE TABLE IF NOT EXISTS contract_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  signature_id UUID REFERENCES contract_signatures(id) ON DELETE CASCADE,

  -- Notification details
  notification_type VARCHAR(50) NOT NULL, -- 'contract_sent', 'reminder', 'otp', 'signed', 'completed'
  channel VARCHAR(20) NOT NULL, -- 'email', 'sms'

  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(50),

  subject VARCHAR(255),
  content TEXT,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Provider info (Resend, Twilio, etc.)
  provider VARCHAR(50),
  provider_message_id VARCHAR(255),
  provider_response JSONB,

  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contract_notifications_contract ON contract_notifications(contract_id);
CREATE INDEX idx_contract_notifications_status ON contract_notifications(status);

-- ============================================
-- 6. VIEWS per Dashboard
-- ============================================

-- View: Contract Summary
CREATE OR REPLACE VIEW contract_summary AS
SELECT
  c.id,
  c.contract_number,
  c.title,
  c.status,
  c.contract_value,
  c.created_at,
  c.sent_at,
  c.signed_at,
  l.company_name as client_company,
  l.contact_name as client_contact,
  u.full_name as created_by_name,
  COUNT(DISTINCT cs.id) as total_signatures,
  COUNT(DISTINCT CASE WHEN cs.status = 'signed' THEN cs.id END) as completed_signatures
FROM contracts c
LEFT JOIN crm_leads l ON l.id = c.lead_id
LEFT JOIN users u ON u.id = c.created_by
LEFT JOIN contract_signatures cs ON cs.contract_id = c.id
GROUP BY c.id, c.contract_number, c.title, c.status, c.contract_value,
         c.created_at, c.sent_at, c.signed_at, l.company_name,
         l.contact_name, u.full_name;

-- View: Pending Signatures
CREATE OR REPLACE VIEW pending_signatures AS
SELECT
  cs.*,
  c.contract_number,
  c.title as contract_title,
  c.status as contract_status,
  c.expires_at as contract_expires_at
FROM contract_signatures cs
JOIN contracts c ON c.id = cs.contract_id
WHERE cs.status IN ('pending', 'otp_sent', 'otp_verified')
  AND (c.expires_at IS NULL OR c.expires_at > NOW())
ORDER BY cs.created_at ASC;

-- ============================================
-- 7. FUNCTIONS
-- ============================================

-- Function: Generate contract number
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  current_count INTEGER;
  new_number TEXT;
BEGIN
  current_year := TO_CHAR(NOW(), 'YYYY');

  -- Get count of contracts this year
  SELECT COUNT(*) + 1 INTO current_count
  FROM contracts
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());

  -- Format: CTR-2024-001
  new_number := 'CTR-' || current_year || '-' || LPAD(current_count::TEXT, 3, '0');

  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function: Generate OTP code
CREATE OR REPLACE FUNCTION generate_otp_code()
RETURNS VARCHAR(6) AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Function: Verify OTP
CREATE OR REPLACE FUNCTION verify_signature_otp(
  p_signature_id UUID,
  p_otp_code VARCHAR(6)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_stored_otp VARCHAR(6);
  v_otp_sent_at TIMESTAMPTZ;
  v_attempts INTEGER;
  v_max_attempts INTEGER;
BEGIN
  -- Get signature data
  SELECT otp_code, otp_sent_at, otp_attempts, otp_max_attempts
  INTO v_stored_otp, v_otp_sent_at, v_attempts, v_max_attempts
  FROM contract_signatures
  WHERE id = p_signature_id;

  -- Check if OTP is expired (15 minutes)
  IF v_otp_sent_at < NOW() - INTERVAL '15 minutes' THEN
    RETURN FALSE;
  END IF;

  -- Check max attempts
  IF v_attempts >= v_max_attempts THEN
    RETURN FALSE;
  END IF;

  -- Increment attempts
  UPDATE contract_signatures
  SET otp_attempts = otp_attempts + 1
  WHERE id = p_signature_id;

  -- Verify OTP
  IF v_stored_otp = p_otp_code THEN
    UPDATE contract_signatures
    SET
      status = 'otp_verified',
      otp_verified_at = NOW()
    WHERE id = p_signature_id;

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. TRIGGERS
-- ============================================

-- Trigger: Auto-generate contract number
CREATE OR REPLACE FUNCTION set_contract_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contract_number IS NULL THEN
    NEW.contract_number := generate_contract_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_contract_number
  BEFORE INSERT ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION set_contract_number();

-- Trigger: Log audit events
CREATE OR REPLACE FUNCTION log_signature_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when signature status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO signature_audit_log (
      contract_id,
      signature_id,
      event_type,
      event_description,
      actor_type,
      actor_email,
      actor_name
    ) VALUES (
      NEW.contract_id,
      NEW.id,
      'signature_status_changed',
      format('Signature status changed from %s to %s', OLD.status, NEW.status),
      'signer',
      NEW.signer_email,
      NEW.signer_name
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_signature_event
  AFTER UPDATE ON contract_signatures
  FOR EACH ROW
  EXECUTE FUNCTION log_signature_event();

-- Trigger: Update contract status when all signatures completed
CREATE OR REPLACE FUNCTION update_contract_status_on_signatures()
RETURNS TRIGGER AS $$
DECLARE
  v_total_signatures INTEGER;
  v_signed_signatures INTEGER;
BEGIN
  -- Count signatures
  SELECT
    COUNT(*),
    COUNT(CASE WHEN status = 'signed' THEN 1 END)
  INTO v_total_signatures, v_signed_signatures
  FROM contract_signatures
  WHERE contract_id = NEW.contract_id;

  -- If all signatures completed
  IF v_total_signatures > 0 AND v_total_signatures = v_signed_signatures THEN
    UPDATE contracts
    SET
      status = 'signed',
      signed_at = NOW()
    WHERE id = NEW.contract_id AND status != 'signed';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contract_status
  AFTER UPDATE OF status ON contract_signatures
  FOR EACH ROW
  WHEN (NEW.status = 'signed')
  EXECUTE FUNCTION update_contract_status_on_signatures();

-- ============================================
-- 9. RLS POLICIES
-- ============================================

-- Contract Templates
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's templates"
  ON contract_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.organization_id = contract_templates.organization_id
    )
  );

CREATE POLICY "Admin can manage templates"
  ON contract_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.organization_id = contract_templates.organization_id
        AND u.role IN ('admin', 'super_admin')
    )
  );

-- Contracts
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's contracts"
  ON contracts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.organization_id = contracts.organization_id
    )
  );

CREATE POLICY "Users can create contracts"
  ON contracts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.organization_id = contracts.organization_id
    )
  );

CREATE POLICY "Users can update contracts"
  ON contracts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.organization_id = contracts.organization_id
    )
  );

-- Contract Signatures
ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view signatures for their contracts"
  ON contract_signatures FOR SELECT
  USING (TRUE); -- Signature is accessed via secure link with UUID

CREATE POLICY "System can manage signatures"
  ON contract_signatures FOR ALL
  USING (TRUE); -- Managed by backend logic

-- Audit Log
ALTER TABLE signature_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit log for their contracts"
  ON signature_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contracts c
      JOIN users u ON u.organization_id = c.organization_id
      WHERE c.id = signature_audit_log.contract_id
        AND u.id = auth.uid()
    )
  );

-- Notifications
ALTER TABLE contract_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notifications for their contracts"
  ON contract_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contracts c
      JOIN users u ON u.organization_id = c.organization_id
      WHERE c.id = contract_notifications.contract_id
        AND u.id = auth.uid()
    )
  );
