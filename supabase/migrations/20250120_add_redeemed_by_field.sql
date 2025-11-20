-- Add redeemed_by field to track who redeemed the reward
-- This helps distinguish between:
-- - 'customer': Redeemed from app (needs to come to store to use it)
-- - 'operator': Redeemed by operator at POS (customer is already there, mark as used immediately)

ALTER TABLE reward_redemptions
ADD COLUMN IF NOT EXISTS redeemed_by VARCHAR(20) DEFAULT 'customer';

-- Add check constraint
ALTER TABLE reward_redemptions
ADD CONSTRAINT reward_redemptions_redeemed_by_check
CHECK (redeemed_by IN ('customer', 'operator'));

-- Add comment
COMMENT ON COLUMN reward_redemptions.redeemed_by IS 'Who redeemed the reward: customer (from app) or operator (from POS)';
