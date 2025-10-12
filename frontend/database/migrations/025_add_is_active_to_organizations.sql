-- ============================================================================
-- MIGRATION 025: Add missing columns to organizations table
-- Descrizione: Aggiunge colonne mancanti: is_active, pos_enabled, pos_model
-- ============================================================================

-- Aggiungi colonna is_active con default TRUE
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Aggiungi colonna pos_enabled con default FALSE
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS pos_enabled BOOLEAN DEFAULT false NOT NULL;

-- Aggiungi colonna pos_model (opzionale)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS pos_model VARCHAR(50);

-- Crea indici per query veloci
CREATE INDEX IF NOT EXISTS idx_organizations_is_active
ON organizations(is_active)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_organizations_pos_enabled
ON organizations(pos_enabled)
WHERE pos_enabled = true;

-- Verifica
DO $$
DECLARE
    missing_columns TEXT := '';
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'is_active'
    ) THEN
        missing_columns := missing_columns || 'is_active, ';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'pos_enabled'
    ) THEN
        missing_columns := missing_columns || 'pos_enabled, ';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'pos_model'
    ) THEN
        missing_columns := missing_columns || 'pos_model, ';
    END IF;

    IF missing_columns = '' THEN
        RAISE NOTICE '✅ All columns (is_active, pos_enabled, pos_model) added successfully';
    ELSE
        RAISE EXCEPTION '❌ Failed to add columns: %', missing_columns;
    END IF;
END $$;
