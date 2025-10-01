# Database Fix for Rewards 403 Error

## Problem
The application is returning a **403 Forbidden** error when trying to create new rewards. This is caused by missing Row Level Security (RLS) policies for the `rewards` table.

## Files Created
1. `rewards_rls_fix.sql` - Fixes RLS policies for the rewards table
2. `rewards_schema_update.sql` - Adds the `required_tier` column if missing
3. `README_DATABASE_FIX.md` - This instruction file

## How to Apply the Fix

### Step 1: Connect to Supabase
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your OMNILY PRO project
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Apply Schema Update (Add required_tier column)
1. Copy the contents of `rewards_schema_update.sql`
2. Paste it into the SQL Editor
3. Click **RUN** to execute
4. You should see: `Added required_tier column to rewards table` or `required_tier column already exists`

### Step 3: Apply RLS Policy Fix
1. Copy the contents of `rewards_rls_fix.sql`
2. Paste it into the SQL Editor
3. Click **RUN** to execute
4. The query should complete successfully and show the created policies

### Step 4: Verify the Fix
After applying both SQL scripts, you should see:
- New RLS policies for the rewards table allowing organization users to INSERT rewards
- The `required_tier` column added to the rewards table
- The application should now allow creating new rewards without 403 errors

## Code Changes Made
- ✅ Uncommented `required_tier` field in `rewardsService.ts`
- ✅ Updated reward creation to include loyalty tier requirements
- ✅ Enhanced UI with tier selection checkbox and dropdown

## Test the Fix
1. Try creating a new reward in the OMNILY PRO dashboard
2. The 403 error should be resolved
3. You should be able to select loyalty tier requirements for rewards

## What the RLS Policies Do
- **Admin users** (`super_admin` role): Full access to all rewards
- **Organization users** (`org_admin`, `manager` roles): Can create, read, update, and delete rewards for their organization only
- **Cashier users**: Can only read rewards for their organization

This ensures data security while allowing proper functionality for reward management.