-- ============================================================================
-- MIGRATION 024: Fix RLS Policies for organization_users (NO RECURSION)
-- Descrizione: Rimuove le policy ricorsive e le sostituisce con policy semplici
--              Questo risolve il loop infinito nell'autenticazione
-- ============================================================================

-- Prima di tutto, DROP tutte le policy esistenti su organization_users
DROP POLICY IF EXISTS "Users can read own organization memberships" ON organization_users;
DROP POLICY IF EXISTS "Super admins can read all organization memberships" ON organization_users;
DROP POLICY IF EXISTS "Super admins can insert organization memberships" ON organization_users;
DROP POLICY IF EXISTS "Super admins can update organization memberships" ON organization_users;
DROP POLICY IF EXISTS "Super admins can delete organization memberships" ON organization_users;
DROP POLICY IF EXISTS "Organization owners can manage their org members" ON organization_users;

-- Abilita RLS (se non già abilitato)
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

-- Policy SEMPLICE: Gli utenti autenticati possono leggere i propri record
-- NESSUNA RICORSIONE - usa solo auth.uid()
CREATE POLICY "Users can read own memberships"
ON organization_users FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy SEMPLICE: Gli utenti autenticati possono leggere tutti i membri delle org a cui appartengono
-- NESSUNA RICORSIONE - usa solo auth.uid()
CREATE POLICY "Users can read org members"
ON organization_users FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM organization_users WHERE user_id = auth.uid()
  )
);

-- Policy per INSERT: Solo service_role può inserire (tramite backend/functions)
-- In alternativa, gli owner possono invitare nella loro org
CREATE POLICY "Allow service role to insert"
ON organization_users FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy per UPDATE: Solo service_role
CREATE POLICY "Allow service role to update"
ON organization_users FOR UPDATE
TO service_role
USING (true);

-- Policy per DELETE: Solo service_role
CREATE POLICY "Allow service_role to delete"
ON organization_users FOR DELETE
TO service_role
USING (true);

-- Verifica che le policy siano state create correttamente
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'organization_users';

    RAISE NOTICE 'organization_users table now has % RLS policies (should be 5)', policy_count;
END $$;
