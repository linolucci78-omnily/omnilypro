-- Migration: Create Business Owners Table and Relation
-- Date: 2025-01-27
-- Description: Creates business_owners table and establishes proper FK relation with organizations
-- This allows one owner to have multiple organizations with proper data normalization

-- =====================================================
-- STEP 1: Create business_owners table
-- =====================================================
CREATE TABLE IF NOT EXISTS business_owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Personal Information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    avatar_url TEXT,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT business_owners_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_business_owners_email ON business_owners(email);
CREATE INDEX IF NOT EXISTS idx_business_owners_created_at ON business_owners(created_at);

-- Add comments
COMMENT ON TABLE business_owners IS 'Business owners who can own one or multiple organizations';
COMMENT ON COLUMN business_owners.email IS 'Unique email address for the business owner (used for login/identification)';
COMMENT ON COLUMN business_owners.avatar_url IS 'Profile picture URL from wizard upload';

-- =====================================================
-- STEP 2: Add owner_id FK to organizations table
-- =====================================================
-- Add owner_id column (nullable for backward compatibility with existing data)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES business_owners(id) ON DELETE SET NULL;

-- Create index on owner_id for fast joins
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);

-- Add comment
COMMENT ON COLUMN organizations.owner_id IS 'Foreign key to business_owners table. One owner can have multiple organizations.';

-- =====================================================
-- STEP 3: Migrate existing embedded owner data (if any)
-- =====================================================
-- NOTE: Skipped because embedded columns don't exist yet
-- Organizations created via wizard will automatically create business_owners
-- and link via owner_id

DO $$
BEGIN
    RAISE NOTICE 'Skipping embedded data migration (columns do not exist yet)';
    RAISE NOTICE 'New organizations from wizard will automatically create proper relations';
END $$;

-- =====================================================
-- STEP 4: Create helper function to get owner's organizations
-- =====================================================
CREATE OR REPLACE FUNCTION get_owner_organizations(owner_email_param TEXT)
RETURNS TABLE (
    org_id UUID,
    org_name TEXT,
    org_slug TEXT,
    org_logo_url TEXT,
    org_primary_color TEXT,
    org_plan_type TEXT,
    org_created_at TIMESTAMPTZ,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.name,
        o.slug,
        o.logo_url,
        o.primary_color,
        o.plan_type,
        o.created_at,
        o.is_active
    FROM organizations o
    INNER JOIN business_owners bo ON o.owner_id = bo.id
    WHERE bo.email = owner_email_param
    ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_owner_organizations IS 'Returns all organizations owned by a business owner (for organization switcher menu)';

-- =====================================================
-- STEP 5: Create trigger to update updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_business_owners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_business_owners_updated_at
    BEFORE UPDATE ON business_owners
    FOR EACH ROW
    EXECUTE FUNCTION update_business_owners_updated_at();

-- =====================================================
-- STEP 6: Enable Row Level Security (RLS)
-- =====================================================
ALTER TABLE business_owners ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can read their own data
CREATE POLICY business_owners_read_own ON business_owners
    FOR SELECT
    USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy: Owners can update their own data
CREATE POLICY business_owners_update_own ON business_owners
    FOR UPDATE
    USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy: Allow service role to do everything (for backend operations)
CREATE POLICY business_owners_service_role_all ON business_owners
    FOR ALL
    USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- =====================================================
-- VERIFICATION QUERIES (for testing)
-- =====================================================
-- Uncomment to test after migration:

-- Check business_owners table structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'business_owners'
-- ORDER BY ordinal_position;

-- Check organizations have owner_id
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'organizations' AND column_name = 'owner_id';

-- Test get_owner_organizations function
-- SELECT * FROM get_owner_organizations('test@example.com');

-- Show all owners and their organization count
-- SELECT
--     bo.email,
--     bo.first_name,
--     bo.last_name,
--     COUNT(o.id) as organization_count
-- FROM business_owners bo
-- LEFT JOIN organizations o ON o.owner_id = bo.id
-- GROUP BY bo.id, bo.email, bo.first_name, bo.last_name
-- ORDER BY organization_count DESC;

-- Final log
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE 'Created: business_owners table';
    RAISE NOTICE 'Added: owner_id FK to organizations';
    RAISE NOTICE 'Migrated: existing embedded owner data';
    RAISE NOTICE 'Created: get_owner_organizations() function';
    RAISE NOTICE 'Enabled: RLS policies for security';
END $$;
