-- migration: 011_fix_nfc_cards_rls_for_manager_role.sql
--
-- Questa migrazione corregge le policy di sicurezza a livello di riga (RLS) per la tabella `nfc_cards`.
-- Il ruolo 'manager' era precedentemente escluso, impedendo agli utenti con quel ruolo di
-- aggiornare (disattivare) o eliminare le carte NFC.
-- Questa modifica allinea le policy del database con i ruoli definiti nell'applicazione.
--

-- 1. Eliminare le vecchie policy che non includono il ruolo 'manager'.
--    Usiamo DROP POLICY IF EXISTS per evitare errori se la migrazione viene eseguita più volte.
DROP POLICY IF EXISTS "Allow update for org members" ON public.nfc_cards;
DROP POLICY IF EXISTS "Allow delete for org admins" ON public.nfc_cards;


-- 2. Creare la nuova policy di UPDATE che include 'manager'.
--    Questa policy permette ad admin, super_admin e manager di modificare liberamente le carte
--    della propria organizzazione.
CREATE POLICY "Allow update for admins and managers" ON public.nfc_cards
FOR UPDATE
USING (org_id = get_current_user_org_id())
WITH CHECK (
    org_id = get_current_user_org_id() AND
    (
        -- Admin, Super Admin e Manager possono modificare le carte
        get_current_user_role() IN ('org_admin', 'super_admin', 'manager')
        OR
        -- I cassieri possono solo aggiornare last_used_at (implicitamente tramite altre funzioni)
        (get_current_user_role() = 'cashier' AND last_used_at = NOW())
    )
);

-- 3. Creare la nuova policy di DELETE che include 'manager'.
--    Questa policy permette ad admin, super_admin e manager di eliminare fisicamente le carte
--    della propria organizzazione.
CREATE POLICY "Allow delete for admins and managers" ON public.nfc_cards
FOR DELETE
USING (org_id = get_current_user_org_id() AND get_current_user_role() IN ('org_admin', 'super_admin', 'manager'));
