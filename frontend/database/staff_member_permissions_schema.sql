-- SCHEMA PERMESSI INDIVIDUALI PER MEMBRI DEL TEAM
-- Permette di fare override dei permessi di ruolo per singoli membri

-- Tabella Staff Member Permissions (Override Permessi Individuali)
CREATE TABLE IF NOT EXISTS staff_member_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,

  -- Dashboard Sections Access (NULL = usa permesso del ruolo, TRUE/FALSE = override)
  can_view_analytics BOOLEAN DEFAULT NULL,
  can_view_customers BOOLEAN DEFAULT NULL,
  can_add_customers BOOLEAN DEFAULT NULL,
  can_edit_customers BOOLEAN DEFAULT NULL,
  can_delete_customers BOOLEAN DEFAULT NULL,

  can_view_rewards BOOLEAN DEFAULT NULL,
  can_create_rewards BOOLEAN DEFAULT NULL,
  can_edit_rewards BOOLEAN DEFAULT NULL,
  can_delete_rewards BOOLEAN DEFAULT NULL,

  can_view_tiers BOOLEAN DEFAULT NULL,
  can_edit_tiers BOOLEAN DEFAULT NULL,

  can_view_transactions BOOLEAN DEFAULT NULL,
  can_add_points BOOLEAN DEFAULT NULL,
  can_redeem_rewards BOOLEAN DEFAULT NULL,
  can_refund BOOLEAN DEFAULT NULL,

  can_view_marketing BOOLEAN DEFAULT NULL,
  can_send_campaigns BOOLEAN DEFAULT NULL,

  can_view_team BOOLEAN DEFAULT NULL,
  can_manage_team BOOLEAN DEFAULT NULL,

  can_view_settings BOOLEAN DEFAULT NULL,
  can_edit_settings BOOLEAN DEFAULT NULL,

  can_view_branding BOOLEAN DEFAULT NULL,
  can_edit_branding BOOLEAN DEFAULT NULL,

  -- POS Access
  can_access_pos BOOLEAN DEFAULT NULL,
  can_process_sales BOOLEAN DEFAULT NULL,
  can_void_transactions BOOLEAN DEFAULT NULL,

  -- Advanced
  can_export_data BOOLEAN DEFAULT NULL,
  can_view_reports BOOLEAN DEFAULT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(organization_id, staff_id)
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_staff_member_permissions_org ON staff_member_permissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_member_permissions_staff ON staff_member_permissions(staff_id);

-- Row Level Security
ALTER TABLE staff_member_permissions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view staff member permissions"
  ON staff_member_permissions FOR SELECT
  USING (organization_id IN (
    SELECT id FROM organizations
  ));

CREATE POLICY "Users can manage staff member permissions"
  ON staff_member_permissions FOR ALL
  USING (organization_id IN (
    SELECT id FROM organizations
  ));

-- Function per ottenere i permessi effettivi di un membro (ruolo + override)
CREATE OR REPLACE FUNCTION get_effective_permissions(
  p_organization_id UUID,
  p_staff_id UUID
)
RETURNS TABLE (
  can_view_analytics BOOLEAN,
  can_view_customers BOOLEAN,
  can_add_customers BOOLEAN,
  can_edit_customers BOOLEAN,
  can_delete_customers BOOLEAN,
  can_view_rewards BOOLEAN,
  can_create_rewards BOOLEAN,
  can_edit_rewards BOOLEAN,
  can_delete_rewards BOOLEAN,
  can_view_tiers BOOLEAN,
  can_edit_tiers BOOLEAN,
  can_view_transactions BOOLEAN,
  can_add_points BOOLEAN,
  can_redeem_rewards BOOLEAN,
  can_refund BOOLEAN,
  can_view_marketing BOOLEAN,
  can_send_campaigns BOOLEAN,
  can_view_team BOOLEAN,
  can_manage_team BOOLEAN,
  can_view_settings BOOLEAN,
  can_edit_settings BOOLEAN,
  can_view_branding BOOLEAN,
  can_edit_branding BOOLEAN,
  can_access_pos BOOLEAN,
  can_process_sales BOOLEAN,
  can_void_transactions BOOLEAN,
  can_export_data BOOLEAN,
  can_view_reports BOOLEAN
) AS $$
DECLARE
  v_role TEXT;
  v_role_perms RECORD;
  v_member_perms RECORD;
BEGIN
  -- Get staff member role
  SELECT role INTO v_role
  FROM staff_members
  WHERE id = p_staff_id AND organization_id = p_organization_id;

  IF v_role IS NULL THEN
    RETURN;
  END IF;

  -- Get role permissions
  SELECT * INTO v_role_perms
  FROM role_permissions
  WHERE organization_id = p_organization_id AND role = v_role;

  -- Get member-specific permissions (overrides)
  SELECT * INTO v_member_perms
  FROM staff_member_permissions
  WHERE organization_id = p_organization_id AND staff_id = p_staff_id;

  -- Return merged permissions (member override takes precedence)
  RETURN QUERY SELECT
    COALESCE(v_member_perms.can_view_analytics, v_role_perms.can_view_analytics),
    COALESCE(v_member_perms.can_view_customers, v_role_perms.can_view_customers),
    COALESCE(v_member_perms.can_add_customers, v_role_perms.can_add_customers),
    COALESCE(v_member_perms.can_edit_customers, v_role_perms.can_edit_customers),
    COALESCE(v_member_perms.can_delete_customers, v_role_perms.can_delete_customers),
    COALESCE(v_member_perms.can_view_rewards, v_role_perms.can_view_rewards),
    COALESCE(v_member_perms.can_create_rewards, v_role_perms.can_create_rewards),
    COALESCE(v_member_perms.can_edit_rewards, v_role_perms.can_edit_rewards),
    COALESCE(v_member_perms.can_delete_rewards, v_role_perms.can_delete_rewards),
    COALESCE(v_member_perms.can_view_tiers, v_role_perms.can_view_tiers),
    COALESCE(v_member_perms.can_edit_tiers, v_role_perms.can_edit_tiers),
    COALESCE(v_member_perms.can_view_transactions, v_role_perms.can_view_transactions),
    COALESCE(v_member_perms.can_add_points, v_role_perms.can_add_points),
    COALESCE(v_member_perms.can_redeem_rewards, v_role_perms.can_redeem_rewards),
    COALESCE(v_member_perms.can_refund, v_role_perms.can_refund),
    COALESCE(v_member_perms.can_view_marketing, v_role_perms.can_view_marketing),
    COALESCE(v_member_perms.can_send_campaigns, v_role_perms.can_send_campaigns),
    COALESCE(v_member_perms.can_view_team, v_role_perms.can_view_team),
    COALESCE(v_member_perms.can_manage_team, v_role_perms.can_manage_team),
    COALESCE(v_member_perms.can_view_settings, v_role_perms.can_view_settings),
    COALESCE(v_member_perms.can_edit_settings, v_role_perms.can_edit_settings),
    COALESCE(v_member_perms.can_view_branding, v_role_perms.can_view_branding),
    COALESCE(v_member_perms.can_edit_branding, v_role_perms.can_edit_branding),
    COALESCE(v_member_perms.can_access_pos, v_role_perms.can_access_pos),
    COALESCE(v_member_perms.can_process_sales, v_role_perms.can_process_sales),
    COALESCE(v_member_perms.can_void_transactions, v_role_perms.can_void_transactions),
    COALESCE(v_member_perms.can_export_data, v_role_perms.can_export_data),
    COALESCE(v_member_perms.can_view_reports, v_role_perms.can_view_reports);
END;
$$ LANGUAGE plpgsql;
