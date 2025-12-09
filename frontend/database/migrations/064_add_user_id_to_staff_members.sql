-- =====================================================
-- Migration 064: Collega staff_members ad auth.users (Modello Shopify POS-Only)
-- =====================================================
-- Descrizione: Permette operatori "locali" con account auth nascosto
-- Stessa architettura di Shopify POS Pro: POS-only staff
-- =====================================================

-- Step 1: Aggiungi user_id a staff_members (opzionale per retrocompatibilità)
ALTER TABLE public.staff_members
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Crea indice per user_id
CREATE INDEX IF NOT EXISTS idx_staff_members_user_id ON public.staff_members(user_id);

-- Step 3: Rendi email opzionale (già lo è, ma assicuriamoci)
-- Email può essere auto-generata o NULL per operatori locali
ALTER TABLE public.staff_members
ALTER COLUMN email DROP NOT NULL;

-- Step 4: Aggiungi commenti esplicativi
COMMENT ON COLUMN public.staff_members.user_id IS 'Account auth.users collegato (auto-creato per operatori POS-only). Permette autenticazione Supabase ma blocca accesso web tramite role.';
COMMENT ON COLUMN public.staff_members.email IS 'Email vera (se operatore completo) o auto-generata (staff-{id}@{org}.omnily.local per POS-only)';
COMMENT ON COLUMN public.staff_members.pin_code IS 'PIN a 4 cifre per UI locale (opzionale). Login POS usa NFC card.';

-- Step 5: Funzione helper per creare operatore POS-only con account auth automatico
CREATE OR REPLACE FUNCTION public.create_pos_only_staff(
  p_organization_id UUID,
  p_name TEXT,
  p_pin_code TEXT,
  p_role TEXT DEFAULT 'cashier'
)
RETURNS public.staff_members AS $$
DECLARE
  v_staff_email TEXT;
  v_auth_user_id UUID;
  v_random_password TEXT;
  v_new_staff public.staff_members;
BEGIN
  -- Genera email automatica per account auth
  v_staff_email := 'staff-' || gen_random_uuid()::TEXT || '@' || p_organization_id::TEXT || '.omnily.local';

  -- Genera password casuale (64 caratteri)
  v_random_password := encode(gen_random_bytes(48), 'base64');

  -- Crea account auth.users (tramite admin API - questo va fatto dall'application)
  -- NOTA: Questa parte deve essere gestita dall'applicazione frontend
  -- usando supabase.auth.admin.createUser()

  -- Per ora, inserisci solo lo staff_member
  -- L'applicazione dovrà:
  -- 1. Creare auth.users con email/password
  -- 2. Ottenere user_id
  -- 3. Aggiornare staff_member con user_id
  -- 4. Aggiungere in organization_users con role 'pos_only_staff'

  INSERT INTO public.staff_members (
    organization_id,
    name,
    email,
    role,
    pin_code,
    is_active
  ) VALUES (
    p_organization_id,
    p_name,
    v_staff_email,
    p_role,
    p_pin_code,
    true
  )
  RETURNING * INTO v_new_staff;

  RETURN v_new_staff;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.create_pos_only_staff(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- Step 6: Funzione per verificare se uno staff member è POS-only
CREATE OR REPLACE FUNCTION public.is_pos_only_staff(p_staff_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.organization_users
    WHERE user_id = p_staff_user_id
    AND role = 'pos_only_staff'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.is_pos_only_staff(UUID) TO authenticated;

-- Step 7: Aggiorna staff_activity_logs per usare user_id invece di staff_id (già fatto in migration 060)
-- Nessuna modifica necessaria - staff_activity_logs.staff_user_id già punta ad auth.users

-- Step 8: Commenti riassuntivi
COMMENT ON FUNCTION public.create_pos_only_staff IS 'Helper per creare operatore POS-only. L''app deve poi creare auth.users e aggiornare user_id.';
COMMENT ON FUNCTION public.is_pos_only_staff IS 'Controlla se un utente è un operatore POS-only (non può accedere al web)';

-- =====================================================
-- DOCUMENTAZIONE: MODELLO POS-ONLY STAFF
-- =====================================================
--
-- COME FUNZIONA (Modello Shopify POS Pro):
--
-- 1. OPERATORE COMPLETO (Manager/Admin):
--    - Crea account normale con email vera
--    - Login web: email + password
--    - Login POS: NFC o email/password
--    - Ruolo: org_admin, manager
--
-- 2. OPERATORE POS-ONLY (Cassiere):
--    - App crea auth.users con email auto-generata
--    - Email: staff-{uuid}@{org_id}.omnily.local
--    - Password: random (operatore non la vede mai)
--    - Login web: ❌ BLOCCATO (router redirect)
--    - Login POS: ✅ Solo NFC
--    - Ruolo: pos_only_staff
--    - Può fare tutto sul POS (ha auth.uid() valido)
--
-- VANTAGGI:
-- - RLS funziona (ha auth.uid())
-- - Può creare clienti, transazioni, ecc.
-- - Non può accedere al web (blocco UI)
-- - Tracciato in staff_activity_logs
-- - Stessa architettura di Shopify/Square
--
-- =====================================================
