-- ============================================================================
-- OMNILY PRO - REWARDS TABLE SCHEMA UPDATE
-- Add required_tier column for loyalty tier requirements
-- ============================================================================

-- Add required_tier column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'rewards'
        AND column_name = 'required_tier'
    ) THEN
        ALTER TABLE rewards ADD COLUMN required_tier varchar(50);

        -- Add comment to explain the column
        COMMENT ON COLUMN rewards.required_tier IS 'Loyalty tier required to redeem this reward (e.g. "Bronze", "Silver", "Gold")';

        -- Add index for performance
        CREATE INDEX IF NOT EXISTS idx_rewards_required_tier ON rewards(required_tier);

        RAISE NOTICE 'Added required_tier column to rewards table';
    ELSE
        RAISE NOTICE 'required_tier column already exists in rewards table';
    END IF;
END $$;

-- Verify the column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'rewards'
AND column_name = 'required_tier';