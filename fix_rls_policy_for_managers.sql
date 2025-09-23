-- =================================================================
-- SCRIPT SQL CORRETTO E DEFINITIVO (versione del 23/09/2025)
-- Corregge le policy di sicurezza (RLS) per la tabella `nfc_cards`.
--
-- Cosa fa:
-- 1. Utilizza il nome di colonna corretto `organization_id` (invece di `org_id`).
-- 2. Include il ruolo 'manager' che era stato escluso.
-- 3. Rimuove la logica per il ruolo 'cashier' che faceva riferimento a una colonna inesistente.
-- =================================================================

-- Step 1: Eliminare tutte le policy precedenti sulla tabella per fare pulizia.
-- Questo previene conflitti e assicura che solo le policy corrette siano attive.
DROP POLICY IF EXISTS "Allow update for org members" ON public.nfc_cards;
DROP POLICY IF EXISTS "Allow delete for org admins" ON public.nfc_cards;
DROP POLICY IF EXISTS "Allow update for admins and managers" ON public.nfc_cards;
DROP POLICY IF EXISTS "Allow delete for admins and managers" ON public.nfc_cards;


-- Step 2: Creare la nuova policy di UPDATE (corretta).
-- Permette ad admin, super_admin e manager di modificare le carte della propria organizzazione.
CREATE POLICY "Allow update for admins and managers" ON public.nfc_cards
FOR UPDATE
USING (organization_id = get_current_user_org_id()) -- <- NOME COLONNA CORRETTO
WITH CHECK (
    organization_id = get_current_user_org_id() AND -- <- NOME COLONNA CORRETTO
    get_current_user_role() IN ('org_admin', 'super_admin', 'manager')
);

-- Step 3: Creare la nuova policy di DELETE (corretta).
-- Permette ad admin, super_admin e manager di eliminare le carte della propria organizzazione.
CREATE POLICY "Allow delete for admins and managers" ON public.nfc_cards
FOR DELETE
USING (
    organization_id = get_current_user_org_id() AND -- <- NOME COLONNA CORRETTO
    get_current_user_role() IN ('org_admin', 'super_admin', 'manager')
);