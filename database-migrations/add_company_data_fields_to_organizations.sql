-- Migration: Add company data fields to organizations table for Privacy Policy
-- Description: Adds legal, contact, and address fields needed for GDPR compliance
-- Date: 2025-12-02

-- Add all company data fields in a single ALTER TABLE statement
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS legal_name TEXT,
ADD COLUMN IF NOT EXISTS legal_form TEXT DEFAULT 'srl',
ADD COLUMN IF NOT EXISTS vat_number TEXT,
ADD COLUMN IF NOT EXISTS tax_code TEXT,
ADD COLUMN IF NOT EXISTS legal_representative TEXT,
ADD COLUMN IF NOT EXISTS address_street TEXT,
ADD COLUMN IF NOT EXISTS address_city TEXT,
ADD COLUMN IF NOT EXISTS address_zip TEXT,
ADD COLUMN IF NOT EXISTS address_province TEXT,
ADD COLUMN IF NOT EXISTS address_country TEXT DEFAULT 'Italia',
ADD COLUMN IF NOT EXISTS company_phone TEXT,
ADD COLUMN IF NOT EXISTS company_email TEXT,
ADD COLUMN IF NOT EXISTS pec_email TEXT,
ADD COLUMN IF NOT EXISTS privacy_email TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_organizations_vat_number ON organizations(vat_number);
CREATE INDEX IF NOT EXISTS idx_organizations_legal_name ON organizations(legal_name);

-- Add comments
COMMENT ON COLUMN organizations.legal_name IS 'Full legal business name (Ragione Sociale)';
COMMENT ON COLUMN organizations.legal_form IS 'Legal form (S.r.l., S.p.a., Ditta Individuale, etc.)';
COMMENT ON COLUMN organizations.vat_number IS 'VAT Number (Partita IVA)';
COMMENT ON COLUMN organizations.tax_code IS 'Tax Code (Codice Fiscale)';
COMMENT ON COLUMN organizations.legal_representative IS 'Legal representative name';
COMMENT ON COLUMN organizations.address_street IS 'Street address of legal headquarters';
COMMENT ON COLUMN organizations.address_city IS 'City';
COMMENT ON COLUMN organizations.address_zip IS 'ZIP/Postal code';
COMMENT ON COLUMN organizations.address_province IS 'Province (2-letter code for Italy)';
COMMENT ON COLUMN organizations.address_country IS 'Country';
COMMENT ON COLUMN organizations.company_phone IS 'Company phone number';
COMMENT ON COLUMN organizations.company_email IS 'Company email address';
COMMENT ON COLUMN organizations.pec_email IS 'PEC (Certified Email) address';
COMMENT ON COLUMN organizations.privacy_email IS 'Privacy/GDPR contact email (used in Privacy Policy)';
COMMENT ON COLUMN organizations.website IS 'Company website URL';
