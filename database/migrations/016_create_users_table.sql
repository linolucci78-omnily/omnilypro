-- ============================================================================
-- Tabella USERS - Gestione utenti di sistema
-- ============================================================================
-- Questa tabella gestisce gli utenti del sistema (super_admin, sales_agent, etc.)
-- che sono diversi dagli utenti delle organizzazioni (organization_users)

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email varchar(255) UNIQUE NOT NULL,
    role varchar(50) NOT NULL CHECK (role IN ('super_admin', 'sales_agent', 'account_manager', 'organization_owner', 'organization_staff')),
    is_active boolean DEFAULT false,
    temp_password text, -- Password temporanea per attivazione account
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now(),
    last_sign_in_at timestamp
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Trigger per auto-update timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Super admin può fare tutto
CREATE POLICY "Super admin full access users" ON users FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role = 'super_admin'
        AND u.is_active = true
    )
);

-- Gli utenti possono vedere solo se stessi
CREATE POLICY "Users can view themselves" ON users FOR SELECT USING (
    id = auth.uid()
);

-- Gli utenti possono aggiornare solo i propri dati (limitato)
CREATE POLICY "Users can update themselves" ON users FOR UPDATE USING (
    id = auth.uid()
) WITH CHECK (
    id = auth.uid()
    AND role = OLD.role -- Non possono cambiare il proprio ruolo
);

-- ============================================================================
-- COMMENTI
-- ============================================================================

COMMENT ON TABLE users IS 'Gestione utenti di sistema (super_admin, sales_agent, etc.)';
COMMENT ON COLUMN users.id IS 'ID utente (coincide con auth.users.id dopo attivazione)';
COMMENT ON COLUMN users.email IS 'Email utente';
COMMENT ON COLUMN users.role IS 'Ruolo utente nel sistema';
COMMENT ON COLUMN users.is_active IS 'Flag attivazione account (false finché admin non attiva)';
COMMENT ON COLUMN users.temp_password IS 'Password temporanea per attivazione (viene rimossa dopo attivazione)';
