-- Add used_at field to track when a redeemed reward is actually used at the store
-- This allows us to distinguish between:
-- - 'redeemed': customer claimed the reward in the app (can still use it)
-- - 'used': customer showed QR code at store and reward was scanned/used (greyed out)

ALTER TABLE reward_redemptions
ADD COLUMN IF NOT EXISTS used_at TIMESTAMP WITH TIME ZONE;

-- Add index for performance when filtering by used/unused rewards
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_used_at
ON reward_redemptions(used_at)
WHERE used_at IS NOT NULL;

-- Update RLS policy to allow updates (for marking rewards as used)
CREATE POLICY IF NOT EXISTS "Authenticated users can update redemptions"
  ON reward_redemptions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add comment for clarity
COMMENT ON COLUMN reward_redemptions.used_at IS 'Timestamp when the reward was actually used/consumed at the store. NULL means redeemed but not yet used.';
