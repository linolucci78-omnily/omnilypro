-- ============================================================================
-- FIX TABELLA USERS E RLS POLICIES
-- Pattern identico al CRM con organization_users
-- ============================================================================

-- 1. Crea tabella users se non esiste (con status invece di is_active)
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email varchar(255) UNIQUE NOT NULL,
    role varchar(50) NOT NULL CHECK (role IN ('super_admin', 'sales_agent', 'account_manager', 'organization_owner', 'organization_staff')),
    status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
    temp_password text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now(),
    last_sign_in_at timestamp
);

-- 2. Aggiungi colonna status se esiste solo is_active (migrazione)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'is_active'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'status'
    ) THEN
        -- Aggiungi colonna status
        ALTER TABLE users ADD COLUMN status varchar(20) DEFAULT 'pending';

        -- Migra i dati da is_active a status
        UPDATE users SET status = CASE
            WHEN is_active = true THEN 'active'::varchar(20)
            ELSE 'pending'::varchar(20)
        END;

        -- Rimuovi colonna is_active (opzionale)
        -- ALTER TABLE users DROP COLUMN is_active;
    END IF;
END $$;

-- 3. Crea indici se non esistono
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 4. Trigger per auto-update timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at_trigger ON users;
CREATE TRIGGER update_users_updated_at_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

-- ============================================================================
-- 5. ROW LEVEL SECURITY POLICIES (Pattern CRM)
-- ============================================================================

-- Abilita RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop vecchie policy se esistono
DROP POLICY IF EXISTS "Super admin full access users" ON users;
DROP POLICY IF EXISTS "Users can view themselves" ON users;
DROP POLICY IF EXISTS "Users can update themselves" ON users;
DROP POLICY IF EXISTS "Admin full access users" ON users;
DROP POLICY IF EXISTS "Organization users access users" ON users;

-- Policy 1: Super admin ha accesso completo (PATTERN CRM)
CREATE POLICY "Admin full access users" ON users FOR ALL USING (
  auth.uid() IN (
    SELECT user_id FROM organization_users
    WHERE role = 'super_admin'
  )
);

-- Policy 2: Gli utenti possono vedere solo se stessi
CREATE POLICY "Users can view themselves" ON users FOR SELECT USING (
  id = auth.uid()
);

-- ============================================================================
-- VERIFICA FINALE
-- ============================================================================

-- Verifica policies create
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Verifica struttura tabella
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
