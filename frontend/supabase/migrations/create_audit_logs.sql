-- Audit Logs Table
-- Sistema di logging per tracciare tutte le azioni importanti nel sistema
-- Usato per security monitoring, compliance, e debugging

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NULL,
  organization_id UUID REFERENCES organizations(id) NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices per performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created ON audit_logs(action, created_at DESC);

-- Index per failed login detection
CREATE INDEX IF NOT EXISTS idx_audit_logs_failed_login_ip ON audit_logs((metadata->>'ip_address'), created_at)
  WHERE action = 'user.login_failed';

-- RLS Policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Super admin possono vedere tutti i log
DROP POLICY IF EXISTS "Super admin can view all audit logs" ON audit_logs;
CREATE POLICY "Super admin can view all audit logs"
  ON audit_logs
  FOR SELECT
  USING (
    -- Check if user is super admin using organization_users table
    auth.uid() IN (
      SELECT user_id FROM organization_users WHERE role = 'super_admin'
    )
  );

-- Tutti possono vedere i propri log
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
CREATE POLICY "Users can view own audit logs"
  ON audit_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- Sistema può inserire log (via service_role)
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Commenti per documentazione
COMMENT ON TABLE audit_logs IS 'Log di audit per tracciare tutte le azioni nel sistema';
COMMENT ON COLUMN audit_logs.action IS 'Tipo di azione (es: user.login, user.logout, user.login_failed, data.access, etc.)';
COMMENT ON COLUMN audit_logs.user_id IS 'Utente che ha eseguito l azione (NULL per azioni di sistema)';
COMMENT ON COLUMN audit_logs.organization_id IS 'Organizzazione coinvolta nell azione';
COMMENT ON COLUMN audit_logs.metadata IS 'Dati aggiuntivi: ip_address, user_agent, location, reason, etc.';
