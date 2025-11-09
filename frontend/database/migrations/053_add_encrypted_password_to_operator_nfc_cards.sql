-- =====================================================
-- Migration 053: Add encrypted password to operator NFC cards
-- =====================================================
-- Descrizione: Aggiunge campo per salvare la password criptata
-- di ogni operatore, così ogni operatore usa la SUA password personale
-- =====================================================

-- Add encrypted_password column
ALTER TABLE public.operator_nfc_cards
ADD COLUMN IF NOT EXISTS encrypted_password TEXT;

-- Comment
COMMENT ON COLUMN public.operator_nfc_cards.encrypted_password IS 'Password criptata dell''operatore per login NFC automatico';

-- Note: La password viene salvata in modo criptato quando si associa la tessera
-- L'operatore inserisce la sua password normale (quella che usa per il login web)
-- e viene salvata criptata qui per permettere il login NFC automatico
