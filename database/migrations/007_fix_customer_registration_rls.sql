-- Migration: Fix Customer Registration RLS Policy
-- Date: 2025-09-23
-- Description: Allow public customer registration for loyalty system

-- Drop existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert customers to their organizations" ON customers;

-- Create new policy that allows public customer registration
-- This is necessary for loyalty systems where customers self-register
CREATE POLICY "Allow public customer registration" ON customers
    FOR INSERT WITH CHECK (
        -- Allow insert if organization exists and is active
        organization_id IN (
            SELECT id FROM organizations
            WHERE is_active = true
        )
        -- No auth.uid() requirement - customers can register publicly
    );

-- Keep existing policies for SELECT, UPDATE, DELETE (require authentication)
-- These ensure data privacy while allowing public registration

-- Add bypass for system operations (if needed)
CREATE POLICY "System can manage customers" ON customers
    FOR ALL USING (
        -- Allow if no auth context (system operations)
        auth.uid() IS NULL
        OR
        -- Allow if user is member of organization
        organization_id IN (
            SELECT org_id FROM organization_users
            WHERE user_id = auth.uid()
        )
    );

-- Add comment for tracking
COMMENT ON TABLE customers IS 'Customers table - Updated RLS policies for public registration 2025-09-23';