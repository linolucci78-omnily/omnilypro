-- ============================================================================
-- MIGRATION 027: Add scheduled_for column to email_campaigns
-- Descrizione: Aggiunge colonna per programmare l'invio delle campagne
-- ============================================================================

-- Aggiungi colonna scheduled_for per invio programmato
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;

-- Crea indice per trovare rapidamente campagne da inviare
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled
ON email_campaigns(scheduled_for, status)
WHERE status = 'scheduled' AND scheduled_for IS NOT NULL;

-- Verifica
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'email_campaigns'
        AND column_name = 'scheduled_for'
    ) THEN
        RAISE NOTICE '✅ Column scheduled_for added successfully to email_campaigns';
    ELSE
        RAISE EXCEPTION '❌ Failed to add scheduled_for column';
    END IF;
END $$;
