-- SCHEMA PERMESSI PER CONTROLLO ACCESSI GRANULARE
-- Definisce quali sezioni ogni ruolo può accedere

-- 1. Tabella Role Permissions (Permessi per Ruolo)
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier', 'staff')),

  -- Dashboard Sections Access
  can_view_analytics BOOLEAN DEFAULT false,
  can_view_customers BOOLEAN DEFAULT false,
  can_add_customers BOOLEAN DEFAULT false,
  can_edit_customers BOOLEAN DEFAULT false,
  can_delete_customers BOOLEAN DEFAULT false,

  can_view_rewards BOOLEAN DEFAULT false,
  can_create_rewards BOOLEAN DEFAULT false,
  can_edit_rewards BOOLEAN DEFAULT false,
  can_delete_rewards BOOLEAN DEFAULT false,

  can_view_tiers BOOLEAN DEFAULT false,
  can_edit_tiers BOOLEAN DEFAULT false,

  can_view_transactions BOOLEAN DEFAULT false,
  can_add_points BOOLEAN DEFAULT false,
  can_redeem_rewards BOOLEAN DEFAULT false,
  can_refund BOOLEAN DEFAULT false,

  can_view_marketing BOOLEAN DEFAULT false,
  can_send_campaigns BOOLEAN DEFAULT false,

  can_view_team BOOLEAN DEFAULT false,
  can_manage_team BOOLEAN DEFAULT false,

  can_view_settings BOOLEAN DEFAULT false,
  can_edit_settings BOOLEAN DEFAULT false,

  can_view_branding BOOLEAN DEFAULT false,
  can_edit_branding BOOLEAN DEFAULT false,

  -- POS Access
  can_access_pos BOOLEAN DEFAULT false,
  can_process_sales BOOLEAN DEFAULT false,
  can_void_transactions BOOLEAN DEFAULT false,

  -- Advanced
  can_export_data BOOLEAN DEFAULT false,
  can_view_reports BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(organization_id, role)
);

-- 2. Tabella Protected Sections (Sezioni Protette da Password)
CREATE TABLE IF NOT EXISTS protected_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL, -- es: 'team-management', 'settings', 'financial-reports'
  requires_password BOOLEAN DEFAULT true,
  password_hash TEXT, -- Hash bcrypt della password
  allowed_roles TEXT[] DEFAULT ARRAY['admin'], -- Array di ruoli che possono accedere
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(organization_id, section_name)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_org ON role_permissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(organization_id, role);
CREATE INDEX IF NOT EXISTS idx_protected_sections_org ON protected_sections(organization_id);

-- Row Level Security
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE protected_sections ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view role permissions"
  ON role_permissions FOR SELECT
  USING (organization_id IN (
    SELECT id FROM organizations
  ));

CREATE POLICY "Users can manage role permissions"
  ON role_permissions FOR ALL
  USING (organization_id IN (
    SELECT id FROM organizations
  ));

CREATE POLICY "Users can view protected sections"
  ON protected_sections FOR SELECT
  USING (organization_id IN (
    SELECT id FROM organizations
  ));

CREATE POLICY "Users can manage protected sections"
  ON protected_sections FOR ALL
  USING (organization_id IN (
    SELECT id FROM organizations
  ));

-- Inserisci permessi di default per ogni ruolo
-- ADMIN: Accesso completo
INSERT INTO role_permissions (organization_id, role,
  can_view_analytics, can_view_customers, can_add_customers, can_edit_customers, can_delete_customers,
  can_view_rewards, can_create_rewards, can_edit_rewards, can_delete_rewards,
  can_view_tiers, can_edit_tiers,
  can_view_transactions, can_add_points, can_redeem_rewards, can_refund,
  can_view_marketing, can_send_campaigns,
  can_view_team, can_manage_team,
  can_view_settings, can_edit_settings,
  can_view_branding, can_edit_branding,
  can_access_pos, can_process_sales, can_void_transactions,
  can_export_data, can_view_reports
)
SELECT id, 'admin',
  true, true, true, true, true,
  true, true, true, true,
  true, true,
  true, true, true, true,
  true, true,
  true, true,
  true, true,
  true, true,
  true, true, true,
  true, true
FROM organizations
ON CONFLICT (organization_id, role) DO NOTHING;

-- MANAGER: Gestione operativa, no settings
INSERT INTO role_permissions (organization_id, role,
  can_view_analytics, can_view_customers, can_add_customers, can_edit_customers, can_delete_customers,
  can_view_rewards, can_create_rewards, can_edit_rewards, can_delete_rewards,
  can_view_tiers, can_edit_tiers,
  can_view_transactions, can_add_points, can_redeem_rewards, can_refund,
  can_view_marketing, can_send_campaigns,
  can_view_team, can_manage_team,
  can_view_settings, can_edit_settings,
  can_view_branding, can_edit_branding,
  can_access_pos, can_process_sales, can_void_transactions,
  can_export_data, can_view_reports
)
SELECT id, 'manager',
  true, true, true, true, false,
  true, true, true, false,
  true, false,
  true, true, true, true,
  true, true,
  true, false,
  true, false,
  false, false,
  true, true, true,
  true, true
FROM organizations
ON CONFLICT (organization_id, role) DO NOTHING;

-- CASHIER: Solo POS e clienti base
INSERT INTO role_permissions (organization_id, role,
  can_view_analytics, can_view_customers, can_add_customers, can_edit_customers, can_delete_customers,
  can_view_rewards, can_create_rewards, can_edit_rewards, can_delete_rewards,
  can_view_tiers, can_edit_tiers,
  can_view_transactions, can_add_points, can_redeem_rewards, can_refund,
  can_view_marketing, can_send_campaigns,
  can_view_team, can_manage_team,
  can_view_settings, can_edit_settings,
  can_view_branding, can_edit_branding,
  can_access_pos, can_process_sales, can_void_transactions,
  can_export_data, can_view_reports
)
SELECT id, 'cashier',
  false, true, true, false, false,
  true, false, false, false,
  false, false,
  true, true, true, false,
  false, false,
  false, false,
  false, false,
  false, false,
  true, true, false,
  false, false
FROM organizations
ON CONFLICT (organization_id, role) DO NOTHING;

-- STAFF: Solo visualizzazione base
INSERT INTO role_permissions (organization_id, role,
  can_view_analytics, can_view_customers, can_add_customers, can_edit_customers, can_delete_customers,
  can_view_rewards, can_create_rewards, can_edit_rewards, can_delete_rewards,
  can_view_tiers, can_edit_tiers,
  can_view_transactions, can_add_points, can_redeem_rewards, can_refund,
  can_view_marketing, can_send_campaigns,
  can_view_team, can_manage_team,
  can_view_settings, can_edit_settings,
  can_view_branding, can_edit_branding,
  can_access_pos, can_process_sales, can_void_transactions,
  can_export_data, can_view_reports
)
SELECT id, 'staff',
  false, true, false, false, false,
  true, false, false, false,
  false, false,
  false, false, false, false,
  false, false,
  false, false,
  false, false,
  false, false,
  true, false, false,
  false, false
FROM organizations
ON CONFLICT (organization_id, role) DO NOTHING;
