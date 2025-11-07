-- SCHEMA DATABASE PER GESTIONE TEAM E AUDIT LOG
-- Eseguire questo SQL nella dashboard di Supabase

-- 1. Tabella Staff Members (Dipendenti)
CREATE TABLE IF NOT EXISTS staff_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier', 'staff')),
  pin_code TEXT NOT NULL, -- PIN a 4 cifre per accesso POS
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  UNIQUE(organization_id, email),
  UNIQUE(organization_id, pin_code)
);

-- 2. Tabella Access Logs (Log Accessi)
CREATE TABLE IF NOT EXISTS staff_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('login', 'logout', 'pos_access', 'desktop_access')),
  device_info TEXT, -- es: "POS #1", "Desktop - Chrome"
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabella Activity Logs (Audit Trail)
CREATE TABLE IF NOT EXISTS staff_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- es: 'created_customer', 'added_points', 'redeemed_reward'
  entity_type TEXT, -- es: 'customer', 'transaction', 'reward'
  entity_id UUID, -- ID dell'entità modificata
  details JSONB, -- Dati aggiuntivi in formato JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_staff_members_org ON staff_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_active ON staff_members(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_access_logs_org ON staff_access_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_staff ON staff_access_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created ON staff_access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_org ON staff_activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_staff ON staff_activity_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON staff_activity_logs(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Gli utenti possono vedere solo i dati della propria organizzazione
-- Usa la tabella organizations e si affida alle sue RLS policies
CREATE POLICY "Users can view own organization staff"
  ON staff_members FOR SELECT
  USING (organization_id IN (
    SELECT id FROM organizations
  ));

CREATE POLICY "Users can manage own organization staff"
  ON staff_members FOR ALL
  USING (organization_id IN (
    SELECT id FROM organizations
  ));

CREATE POLICY "Users can view own organization access logs"
  ON staff_access_logs FOR SELECT
  USING (organization_id IN (
    SELECT id FROM organizations
  ));

CREATE POLICY "Users can insert access logs"
  ON staff_access_logs FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT id FROM organizations
  ));

CREATE POLICY "Users can view own organization activity logs"
  ON staff_activity_logs FOR SELECT
  USING (organization_id IN (
    SELECT id FROM organizations
  ));

CREATE POLICY "Users can insert activity logs"
  ON staff_activity_logs FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT id FROM organizations
  ));
