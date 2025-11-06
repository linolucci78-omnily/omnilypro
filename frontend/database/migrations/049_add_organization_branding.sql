-- =====================================================
-- 049: Add Organization Branding for Email Templates
-- =====================================================
-- Aggiunge campi per personalizzare le email con logo e dati aziendali
-- Author: Claude Code
-- Date: 2025-01-06
-- =====================================================

-- Aggiungi colonne branding alla tabella organizations
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#dc2626',
ADD COLUMN IF NOT EXISTS company_address TEXT,
ADD COLUMN IF NOT EXISTS company_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS company_website TEXT,
ADD COLUMN IF NOT EXISTS email_footer_text TEXT,
ADD COLUMN IF NOT EXISTS social_facebook TEXT,
ADD COLUMN IF NOT EXISTS social_instagram TEXT,
ADD COLUMN IF NOT EXISTS social_twitter TEXT,
ADD COLUMN IF NOT EXISTS social_linkedin TEXT;

-- Commenti
COMMENT ON COLUMN organizations.logo_url IS 'URL del logo aziendale per email e branding';
COMMENT ON COLUMN organizations.primary_color IS 'Colore brand principale (hex) - default rosso organization';
COMMENT ON COLUMN organizations.company_address IS 'Indirizzo aziendale per footer email';
COMMENT ON COLUMN organizations.company_phone IS 'Telefono aziendale per footer email';
COMMENT ON COLUMN organizations.company_website IS 'Sito web aziendale per footer email';
COMMENT ON COLUMN organizations.email_footer_text IS 'Testo personalizzato footer email';
COMMENT ON COLUMN organizations.social_facebook IS 'URL profilo Facebook';
COMMENT ON COLUMN organizations.social_instagram IS 'URL profilo Instagram';
COMMENT ON COLUMN organizations.social_twitter IS 'URL profilo Twitter';
COMMENT ON COLUMN organizations.social_linkedin IS 'URL profilo LinkedIn';

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_organizations_logo ON organizations(logo_url) WHERE logo_url IS NOT NULL;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 049_add_organization_branding completed!';
  RAISE NOTICE '🎨 Added branding fields to organizations table';
  RAISE NOTICE '📧 Email templates can now use: logo, colors, company info, social links';
  RAISE NOTICE '🔧 Fields: logo_url, primary_color, address, phone, website, footer, socials';
END $$;
