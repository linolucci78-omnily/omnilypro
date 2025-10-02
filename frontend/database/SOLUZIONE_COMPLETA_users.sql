-- ============================================================================
-- SOLUZIONE COMPLETA - Tabella users e RLS policies
-- Esegui questo script TUTTO INSIEME su Supabase SQL Editor
-- ============================================================================

-- STEP 1: Verifica tabella users (se non esiste, creala)
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email varchar(255) UNIQUE NOT NULL,
    role varchar(50) NOT NULL CHECK (role IN ('super_admin', 'sales_agent', 'account_manager', 'organization_owner', 'organization_staff')),
    status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
    temp_password text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now(),
    last_sign_in_at timestamp
);

-- STEP 2: Aggiungi colonna status se manca (per retrocompatibilità)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'status'
    ) THEN
        ALTER TABLE public.users ADD COLUMN status varchar(20) DEFAULT 'pending';
    END IF;
END $$;

-- STEP 3: Crea indici
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- STEP 4: Trigger per auto-update timestamp
CREATE OR REPLACE FUNCTION public.update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at_trigger ON public.users;
CREATE TRIGGER update_users_updated_at_trigger
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_users_updated_at();

-- STEP 5: Abilita RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- STEP 6: Rimuovi TUTTE le vecchie policy
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'users'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.users';
    END LOOP;
END $$;

-- STEP 7: Crea nuove policy (PATTERN CRM)

-- Policy 1: Super admin accesso completo
CREATE POLICY "Admin full access users"
ON public.users
FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM public.organization_users
    WHERE role = 'super_admin'
  )
);

-- Policy 2: Utenti vedono solo se stessi
CREATE POLICY "Users can view themselves"
ON public.users
FOR SELECT
USING (
  id = auth.uid()
);

-- ============================================================================
-- STEP 8: VERIFICA IL TUO RUOLO
-- ============================================================================

SELECT
  'Il tuo ruolo attuale è:' as messaggio,
  ou.role,
  au.email
FROM public.organization_users ou
JOIN auth.users au ON au.id = ou.user_id
WHERE ou.user_id = auth.uid();

-- ============================================================================
-- STEP 9: SE NON SEI SUPER_ADMIN, DIVENTA SUPER_ADMIN
-- Decommenta questa riga se necessario:
-- ============================================================================

-- UPDATE public.organization_users
-- SET role = 'super_admin'
-- WHERE user_id = auth.uid();

-- ============================================================================
-- STEP 10: VERIFICA FINALE
-- ============================================================================

-- Verifica policies create
SELECT
  'Policies sulla tabella users:' as info,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users';

-- Verifica struttura tabella
SELECT
  'Struttura tabella users:' as info,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Test: prova a leggere dalla tabella users
SELECT
  'Record attuali in tabella users:' as info,
  COUNT(*) as total
FROM public.users;
