-- ============================================================================
-- FIX RAPIDO RLS POLICIES per tabella users
-- ============================================================================

-- 1. Drop tutte le policy esistenti
DROP POLICY IF EXISTS "Admin full access users" ON public.users;
DROP POLICY IF EXISTS "Super admin full access users" ON public.users;
DROP POLICY IF EXISTS "Users can view themselves" ON public.users;
DROP POLICY IF EXISTS "Users can update themselves" ON public.users;
DROP POLICY IF EXISTS "Organization users access users" ON public.users;

-- 2. Verifica che RLS sia abilitato
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Policy per super_admin - ACCESSO COMPLETO (pattern CRM)
CREATE POLICY "Admin full access users"
ON public.users
FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM public.organization_users
    WHERE role = 'super_admin'
  )
);

-- 4. Policy per utenti - possono vedere solo se stessi
CREATE POLICY "Users can view themselves"
ON public.users
FOR SELECT
USING (
  id = auth.uid()
);

-- ============================================================================
-- VERIFICA CHE IL TUO UTENTE SIA SUPER_ADMIN
-- ============================================================================
-- Esegui questa query per verificare il tuo ruolo:

SELECT
  ou.user_id,
  ou.role,
  u.email
FROM public.organization_users ou
JOIN auth.users u ON u.id = ou.user_id
WHERE ou.user_id = auth.uid();

-- Se non sei super_admin, esegui questo per diventarlo:
-- UPDATE public.organization_users
-- SET role = 'super_admin'
-- WHERE user_id = auth.uid();
