-- TEMPORARY: Disable RLS for development to fix infinite recursion
-- WARNING: Only use this in development environment

-- Disable RLS temporarily 
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invites DISABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking DISABLE ROW LEVEL SECURITY;

-- Add comment
COMMENT ON TABLE organizations IS 'Multi-tenant organizations - RLS DISABLED for development';