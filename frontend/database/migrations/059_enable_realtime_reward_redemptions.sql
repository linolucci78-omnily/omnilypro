-- Enable Realtime for reward_redemptions table
-- This SQL enables Supabase Realtime UPDATE events for the reward_redemptions table

-- Set REPLICA IDENTITY to FULL so that UPDATE events include all column values
-- Without this, Realtime UPDATE events only include the primary key
ALTER TABLE reward_redemptions REPLICA IDENTITY FULL;
