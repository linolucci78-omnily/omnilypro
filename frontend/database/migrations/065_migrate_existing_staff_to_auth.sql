-- =====================================================
-- Migration 065: Migra operatori staff esistenti ad auth.users
-- =====================================================
-- Descrizione: Crea account auth.users per tutti gli staff_members
-- che non hanno ancora user_id collegato
-- =====================================================

-- IMPORTANTE: Questo script va eseguito DOPO migration 064
-- Non può essere fatto automaticamente via SQL perché richiede
-- l'Admin API di Supabase per creare utenti auth.

-- Invece, forniamo una stored procedure helper che l'applicazione
-- può chiamare per migrare gli staff esistenti

CREATE OR REPLACE FUNCTION public.get_staff_members_without_auth()
RETURNS TABLE (
  staff_id UUID,
  organization_id UUID,
  name TEXT,
  email TEXT,
  pin_code TEXT,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sm.id as staff_id,
    sm.organization_id,
    sm.name,
    sm.email,
    sm.pin_code,
    sm.role
  FROM public.staff_members sm
  WHERE sm.user_id IS NULL
  AND sm.is_active = true
  ORDER BY sm.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.get_staff_members_without_auth() TO authenticated;

-- Funzione per collegare auth user a staff member dopo la creazione
CREATE OR REPLACE FUNCTION public.link_auth_to_staff_member(
  p_staff_id UUID,
  p_auth_user_id UUID,
  p_email TEXT
)
RETURNS void AS $$
BEGIN
  -- Aggiorna staff_member con user_id
  UPDATE public.staff_members
  SET
    user_id = p_auth_user_id,
    email = p_email,
    updated_at = NOW()
  WHERE id = p_staff_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Staff member % not found', p_staff_id;
  END IF;

  RAISE NOTICE 'Linked auth user % to staff member %', p_auth_user_id, p_staff_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.link_auth_to_staff_member(UUID, UUID, TEXT) TO authenticated;

-- Commenti
COMMENT ON FUNCTION public.get_staff_members_without_auth IS 'Ottiene tutti gli staff members che non hanno ancora account auth collegato';
COMMENT ON FUNCTION public.link_auth_to_staff_member IS 'Collega un auth user esistente ad uno staff member';

-- =====================================================
-- NOTA PER L'APPLICAZIONE
-- =====================================================
-- Per migrare gli staff esistenti, l'applicazione deve:
--
-- 1. Chiamare get_staff_members_without_auth()
-- 2. Per ogni staff member:
--    a. Generare email: staff-{uuid}@{org_id}.omnily.local
--    b. Generare password random
--    c. Creare auth user con supabase.auth.admin.createUser()
--    d. Creare record in organization_users con role 'pos_only_staff'
--    e. Chiamare link_auth_to_staff_member(staff_id, auth_user_id, email)
-- 3. Aggiornare eventuali operator_nfc_cards da staff_id a user_id
-- =====================================================
