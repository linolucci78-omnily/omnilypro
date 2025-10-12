-- ============================================================================
-- MIGRATION 023: Fix RLS Policies for organization_users table
-- Descrizione: Aggiunge policy RLS mancanti per organization_users
--              Questo risolve i timeout nelle query di autenticazione
-- ============================================================================

-- Abilita RLS sulla tabella organization_users (se non già abilitato)
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

-- Policy: Gli utenti possono leggere i propri record in organization_users
-- Questo è FONDAMENTALE per permettere a checkUserRole() di funzionare
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'organization_users'
        AND policyname = 'Users can read own organization memberships'
    ) THEN
        CREATE POLICY "Users can read own organization memberships"
        ON organization_users FOR SELECT
        TO authenticated
        USING (user_id = auth.uid());
    END IF;
END $$;

-- Policy: I super admin possono leggere tutti i record
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'organization_users'
        AND policyname = 'Super admins can read all organization memberships'
    ) THEN
        CREATE POLICY "Super admins can read all organization memberships"
        ON organization_users FOR SELECT
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM organization_users ou
                WHERE ou.user_id = auth.uid()
                AND ou.role = 'super_admin'
            )
        );
    END IF;
END $$;

-- Policy: I super admin possono inserire nuovi membri nelle organizzazioni
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'organization_users'
        AND policyname = 'Super admins can insert organization memberships'
    ) THEN
        CREATE POLICY "Super admins can insert organization memberships"
        ON organization_users FOR INSERT
        TO authenticated
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM organization_users ou
                WHERE ou.user_id = auth.uid()
                AND ou.role = 'super_admin'
            )
        );
    END IF;
END $$;

-- Policy: I super admin possono aggiornare i membri delle organizzazioni
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'organization_users'
        AND policyname = 'Super admins can update organization memberships'
    ) THEN
        CREATE POLICY "Super admins can update organization memberships"
        ON organization_users FOR UPDATE
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM organization_users ou
                WHERE ou.user_id = auth.uid()
                AND ou.role = 'super_admin'
            )
        );
    END IF;
END $$;

-- Policy: I super admin possono eliminare membri dalle organizzazioni
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'organization_users'
        AND policyname = 'Super admins can delete organization memberships'
    ) THEN
        CREATE POLICY "Super admins can delete organization memberships"
        ON organization_users FOR DELETE
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM organization_users ou
                WHERE ou.user_id = auth.uid()
                AND ou.role = 'super_admin'
            )
        );
    END IF;
END $$;

-- Policy: Gli owner delle organizzazioni possono gestire i membri della propria org
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'organization_users'
        AND policyname = 'Organization owners can manage their org members'
    ) THEN
        CREATE POLICY "Organization owners can manage their org members"
        ON organization_users FOR ALL
        TO authenticated
        USING (
            org_id IN (
                SELECT ou.org_id FROM organization_users ou
                WHERE ou.user_id = auth.uid()
                AND ou.role = 'owner'
            )
        );
    END IF;
END $$;

-- Verifica che le policy siano state create correttamente
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'organization_users';

    RAISE NOTICE 'organization_users table now has % RLS policies', policy_count;
END $$;
