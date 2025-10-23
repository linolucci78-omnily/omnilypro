-- ============================================
-- FIX MIGRATION: Contracts & E-Signature System
-- Questo script crea SOLO le tabelle/indici che mancano
-- ============================================

-- Prima verifichiamo cosa esiste già
DO $$
BEGIN
  RAISE NOTICE '=== VERIFICA TABELLE ESISTENTI ===';
END $$;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contract_templates')
    THEN '✅ contract_templates ESISTE'
    ELSE '❌ contract_templates MANCA'
  END;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contracts')
    THEN '✅ contracts ESISTE'
    ELSE '❌ contracts MANCA'
  END;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contract_signatures')
    THEN '✅ contract_signatures ESISTE'
    ELSE '❌ contract_signatures MANCA'
  END;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'signature_audit_log')
    THEN '✅ signature_audit_log ESISTE'
    ELSE '❌ signature_audit_log MANCA'
  END;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contract_notifications')
    THEN '✅ contract_notifications ESISTE'
    ELSE '❌ contract_notifications MANCA'
  END;

-- ============================================
-- Crea SOLO le tabelle mancanti
-- ============================================

-- Contract Templates
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  variables JSONB,
  requires_counter_signature BOOLEAN DEFAULT FALSE,
  signature_positions JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Contracts
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number VARCHAR(50) UNIQUE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  contract_type VARCHAR(50) NOT NULL,
  contract_value DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'EUR',
  client_info JSONB NOT NULL,
  vendor_info JSONB NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  pdf_url TEXT,
  signed_pdf_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract Signatures
CREATE TABLE IF NOT EXISTS contract_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  signer_name VARCHAR(255) NOT NULL,
  signer_email VARCHAR(255) NOT NULL,
  signer_phone VARCHAR(50),
  signer_role VARCHAR(50) NOT NULL,
  signer_company VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  otp_code VARCHAR(6),
  otp_sent_at TIMESTAMPTZ,
  otp_verified_at TIMESTAMPTZ,
  otp_attempts INTEGER DEFAULT 0,
  otp_max_attempts INTEGER DEFAULT 3,
  signature_type VARCHAR(50),
  signature_data TEXT,
  signature_ip VARCHAR(45),
  signature_user_agent TEXT,
  signature_geolocation JSONB,
  acceptance_timestamp TIMESTAMPTZ,
  acceptance_method VARCHAR(50),
  legal_consent_text TEXT,
  legal_consent_accepted BOOLEAN DEFAULT FALSE,
  signed_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Signature Audit Log
CREATE TABLE IF NOT EXISTS signature_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  signature_id UUID REFERENCES contract_signatures(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_description TEXT,
  actor_type VARCHAR(50),
  actor_id UUID,
  actor_email VARCHAR(255),
  actor_name VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  geolocation JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract Notifications
CREATE TABLE IF NOT EXISTS contract_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  signature_id UUID REFERENCES contract_signatures(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(50),
  subject VARCHAR(255),
  content TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  provider VARCHAR(50),
  provider_message_id VARCHAR(255),
  provider_response JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Crea SOLO gli indici che non esistono
-- ============================================

DO $$
BEGIN
  -- Indici contract_templates
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contract_templates_org') THEN
    CREATE INDEX idx_contract_templates_org ON contract_templates(organization_id);
    RAISE NOTICE 'Creato indice: idx_contract_templates_org';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contract_templates_type') THEN
    CREATE INDEX idx_contract_templates_type ON contract_templates(template_type);
    RAISE NOTICE 'Creato indice: idx_contract_templates_type';
  END IF;

  -- Indici contracts
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contracts_org') THEN
    CREATE INDEX idx_contracts_org ON contracts(organization_id);
    RAISE NOTICE 'Creato indice: idx_contracts_org';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contracts_lead') THEN
    CREATE INDEX idx_contracts_lead ON contracts(lead_id);
    RAISE NOTICE 'Creato indice: idx_contracts_lead';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contracts_status') THEN
    CREATE INDEX idx_contracts_status ON contracts(status);
    RAISE NOTICE 'Creato indice: idx_contracts_status';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contracts_number') THEN
    CREATE INDEX idx_contracts_number ON contracts(contract_number);
    RAISE NOTICE 'Creato indice: idx_contracts_number';
  END IF;

  -- Indici contract_signatures
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contract_signatures_contract') THEN
    CREATE INDEX idx_contract_signatures_contract ON contract_signatures(contract_id);
    RAISE NOTICE 'Creato indice: idx_contract_signatures_contract';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contract_signatures_email') THEN
    CREATE INDEX idx_contract_signatures_email ON contract_signatures(signer_email);
    RAISE NOTICE 'Creato indice: idx_contract_signatures_email';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contract_signatures_status') THEN
    CREATE INDEX idx_contract_signatures_status ON contract_signatures(status);
    RAISE NOTICE 'Creato indice: idx_contract_signatures_status';
  END IF;

  -- Indici audit log
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_signature_audit_contract') THEN
    CREATE INDEX idx_signature_audit_contract ON signature_audit_log(contract_id);
    RAISE NOTICE 'Creato indice: idx_signature_audit_contract';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_signature_audit_signature') THEN
    CREATE INDEX idx_signature_audit_signature ON signature_audit_log(signature_id);
    RAISE NOTICE 'Creato indice: idx_signature_audit_signature';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_signature_audit_event') THEN
    CREATE INDEX idx_signature_audit_event ON signature_audit_log(event_type);
    RAISE NOTICE 'Creato indice: idx_signature_audit_event';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_signature_audit_timestamp') THEN
    CREATE INDEX idx_signature_audit_timestamp ON signature_audit_log(created_at DESC);
    RAISE NOTICE 'Creato indice: idx_signature_audit_timestamp';
  END IF;

  -- Indici notifications
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contract_notifications_contract') THEN
    CREATE INDEX idx_contract_notifications_contract ON contract_notifications(contract_id);
    RAISE NOTICE 'Creato indice: idx_contract_notifications_contract';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contract_notifications_status') THEN
    CREATE INDEX idx_contract_notifications_status ON contract_notifications(status);
    RAISE NOTICE 'Creato indice: idx_contract_notifications_status';
  END IF;
END $$;

-- ============================================
-- Crea funzioni
-- ============================================

CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  current_count INTEGER;
  new_number TEXT;
BEGIN
  current_year := TO_CHAR(NOW(), 'YYYY');
  SELECT COUNT(*) + 1 INTO current_count
  FROM contracts
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  new_number := 'CTR-' || current_year || '-' || LPAD(current_count::TEXT, 3, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_otp_code()
RETURNS VARCHAR(6) AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

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
  SELECT otp_code, otp_sent_at, otp_attempts, otp_max_attempts
  INTO v_stored_otp, v_otp_sent_at, v_attempts, v_max_attempts
  FROM contract_signatures
  WHERE id = p_signature_id;

  IF v_otp_sent_at < NOW() - INTERVAL '15 minutes' THEN
    RETURN FALSE;
  END IF;

  IF v_attempts >= v_max_attempts THEN
    RETURN FALSE;
  END IF;

  UPDATE contract_signatures
  SET otp_attempts = otp_attempts + 1
  WHERE id = p_signature_id;

  IF v_stored_otp = p_otp_code THEN
    UPDATE contract_signatures
    SET status = 'otp_verified', otp_verified_at = NOW()
    WHERE id = p_signature_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Verifica finale
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== MIGRAZIONE COMPLETATA ===';
  RAISE NOTICE 'Verifica che tutte le tabelle esistano ora:';
  RAISE NOTICE '✅ Se vedi 5 righe sotto, la migrazione è completa!';
END $$;

SELECT table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as num_columns
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('contract_templates', 'contracts', 'contract_signatures', 'signature_audit_log', 'contract_notifications')
ORDER BY table_name;
