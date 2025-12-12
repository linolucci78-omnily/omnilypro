-- Fix RLS policies for transaction table to properly filter by organization

-- Drop existing policies
DROP POLICY IF EXISTS "Service role has full access to transactions" ON public.transaction;
DROP POLICY IF EXISTS "Users can view transactions" ON public.transaction;
DROP POLICY IF EXISTS "Users can create transactions" ON public.transaction;

-- Allow service role full access (for Edge Functions)
CREATE POLICY "Service role has full access to transactions"
ON public.transaction
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to view their organization's transactions
CREATE POLICY "Users can view their org transactions"
ON public.transaction
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM organizations_users
    WHERE user_id = auth.uid()
  )
);

-- Allow authenticated users to insert transactions for their organization
CREATE POLICY "Users can create their org transactions"
ON public.transaction
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM organizations_users
    WHERE user_id = auth.uid()
  )
);

-- Allow authenticated users to update their organization's transactions
CREATE POLICY "Users can update their org transactions"
ON public.transaction
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM organizations_users
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM organizations_users
    WHERE user_id = auth.uid()
  )
);

-- Verify policies
SELECT
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'transaction'
ORDER BY policyname;
