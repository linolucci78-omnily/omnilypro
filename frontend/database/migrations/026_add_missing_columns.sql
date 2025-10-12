-- ============================================================================
-- MIGRATION 026: Add missing columns to organizations and email_campaigns
-- Descrizione: Aggiunge colonne mancanti per il wizard campagne email
-- ============================================================================

-- 1. Aggiungi colonne mancanti alla tabella organizations
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website VARCHAR(255);

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS business_type VARCHAR(100);

-- 2. Aggiungi colonna custom_content alla tabella email_campaigns
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS custom_content TEXT;

-- 3. Crea indici utili
CREATE INDEX IF NOT EXISTS idx_organizations_email
ON organizations(email)
WHERE email IS NOT NULL;

-- 4. Verifica
DO $$
DECLARE
    missing_cols TEXT := '';
BEGIN
    -- Verifica organizations
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'email'
    ) THEN
        missing_cols := missing_cols || 'organizations.email, ';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'phone'
    ) THEN
        missing_cols := missing_cols || 'organizations.phone, ';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'website'
    ) THEN
        missing_cols := missing_cols || 'organizations.website, ';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'address'
    ) THEN
        missing_cols := missing_cols || 'organizations.address, ';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'business_type'
    ) THEN
        missing_cols := missing_cols || 'organizations.business_type, ';
    END IF;

    -- Verifica email_campaigns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'email_campaigns' AND column_name = 'custom_content'
    ) THEN
        missing_cols := missing_cols || 'email_campaigns.custom_content, ';
    END IF;

    IF missing_cols = '' THEN
        RAISE NOTICE '✅ All missing columns added successfully';
    ELSE
        RAISE EXCEPTION '❌ Failed to add columns: %', missing_cols;
    END IF;
END $$;
