-- TEMPORARY: Disable RLS on organizations table for development
-- This allows the customer app to load organization data without authentication
-- WARNING: Only use in development! Re-enable RLS before production!

ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- Alternative: Keep RLS enabled but add permissive policies
-- Uncomment these lines if you prefer to keep RLS enabled:
/*
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public organizations read access" ON organizations;
CREATE POLICY "Public organizations read access"
ON organizations
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Customers can read own data" ON customers;
CREATE POLICY "Customers can read own data"
ON customers
FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Customers can update own data" ON customers;
CREATE POLICY "Customers can update own data"
ON customers
FOR UPDATE
TO authenticated
USING (auth.uid() = id);
*/
