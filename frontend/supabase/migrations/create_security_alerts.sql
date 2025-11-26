-- Security Alerts Table
-- Sistema di alerting sicurezza automatico basato su eventi reali
-- Gli alert vengono generati automaticamente da trigger sui audit_logs

CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'investigating', 'resolved', 'dismissed')),
  alert_type VARCHAR(50) NOT NULL,
  affected_users INTEGER DEFAULT 0,
  affected_organizations TEXT[], -- Array di organization IDs
  source_event_ids TEXT[], -- Array di audit_log IDs che hanno generato l'alert
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE NULL,
  resolved_by UUID REFERENCES auth.users(id) NULL,
  resolution_notes TEXT NULL
);

-- Indices per performance
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created ON security_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON security_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_active ON security_alerts(status, severity) WHERE status IN ('active', 'investigating');

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_security_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  -- Auto-set resolved_at quando status diventa resolved
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS security_alerts_updated_at ON security_alerts;
CREATE TRIGGER security_alerts_updated_at
  BEFORE UPDATE ON security_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_security_alerts_updated_at();

-- RLS Policies
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

-- Solo super admin possono modificare
DROP POLICY IF EXISTS "Super admin can manage security alerts" ON security_alerts;
CREATE POLICY "Super admin can manage security alerts"
  ON security_alerts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_users
      WHERE organization_users.user_id = auth.uid()
      AND organization_users.role = 'super_admin'
    )
  );

-- Admin possono leggere
DROP POLICY IF EXISTS "Admins can read security alerts" ON security_alerts;
CREATE POLICY "Admins can read security alerts"
  ON security_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_users
      WHERE organization_users.user_id = auth.uid()
      AND organization_users.role IN ('super_admin', 'admin')
    )
  );

-- Funzione per creare alert automatici per failed login multipli
CREATE OR REPLACE FUNCTION check_failed_login_alerts()
RETURNS TRIGGER AS $$
DECLARE
  failed_count INTEGER;
  alert_exists BOOLEAN;
  ip_addr TEXT;
BEGIN
  -- Solo per failed login
  IF NEW.action = 'user.login_failed' THEN
    ip_addr := NEW.metadata->>'ip_address';

    -- Conta failed login dallo stesso IP nelle ultime 2 ore
    SELECT COUNT(*) INTO failed_count
    FROM audit_logs
    WHERE action = 'user.login_failed'
      AND metadata->>'ip_address' = ip_addr
      AND created_at > NOW() - INTERVAL '2 hours';

    -- Se ci sono più di 5 tentativi falliti, crea alert
    IF failed_count >= 5 THEN
      -- Controlla se esiste già un alert attivo per questo IP
      SELECT EXISTS (
        SELECT 1 FROM security_alerts
        WHERE alert_type = 'multiple_failed_logins'
          AND status IN ('active', 'investigating')
          AND metadata->>'ip_address' = ip_addr
          AND created_at > NOW() - INTERVAL '24 hours'
      ) INTO alert_exists;

      -- Crea alert solo se non esiste già
      IF NOT alert_exists THEN
        INSERT INTO security_alerts (
          title,
          description,
          severity,
          status,
          alert_type,
          affected_users,
          source_event_ids,
          metadata
        ) VALUES (
          'Tentativi di login multipli falliti',
          format('Rilevati %s tentativi di login falliti dall''IP %s nelle ultime 2 ore', failed_count, ip_addr),
          CASE
            WHEN failed_count >= 10 THEN 'critical'
            WHEN failed_count >= 7 THEN 'high'
            ELSE 'medium'
          END,
          'active',
          'multiple_failed_logins',
          1,
          ARRAY[NEW.id::TEXT],
          jsonb_build_object(
            'ip_address', ip_addr,
            'failed_count', failed_count,
            'user_agent', NEW.metadata->>'user_agent',
            'location', NEW.metadata->>'location'
          )
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per auto-generare alert da audit_logs
DROP TRIGGER IF EXISTS auto_generate_security_alerts ON audit_logs;
CREATE TRIGGER auto_generate_security_alerts
  AFTER INSERT ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION check_failed_login_alerts();

-- Commenti per documentazione
COMMENT ON TABLE security_alerts IS 'Alert di sicurezza generati automaticamente da eventi sospetti';
COMMENT ON COLUMN security_alerts.severity IS 'Gravità: low (info), medium (warning), high (urgente), critical (critico)';
COMMENT ON COLUMN security_alerts.status IS 'Stato: active (da gestire), investigating (in analisi), resolved (risolto), dismissed (ignorato)';
COMMENT ON COLUMN security_alerts.alert_type IS 'Tipo alert: multiple_failed_logins, suspicious_location, data_breach, etc.';
COMMENT ON COLUMN security_alerts.affected_users IS 'Numero di utenti coinvolti nell alert';
COMMENT ON COLUMN security_alerts.source_event_ids IS 'IDs degli audit_logs che hanno generato questo alert';
COMMENT ON COLUMN security_alerts.metadata IS 'Dati aggiuntivi specifici per tipo di alert (IP, location, etc.)';
