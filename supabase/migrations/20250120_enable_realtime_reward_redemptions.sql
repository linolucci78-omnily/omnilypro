-- Enable Realtime on reward_redemptions table
-- This allows customer app to receive real-time notifications when rewards are redeemed

-- Enable publication for realtime
ALTER PUBLICATION supabase_realtime ADD TABLE reward_redemptions;

-- Add RLS policies if they don't exist yet
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Allow customers to read their own redemptions
CREATE POLICY IF NOT EXISTS "Customers can view their own redemptions"
  ON reward_redemptions
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM customers WHERE id = reward_redemptions.customer_id
  ));

-- Allow authenticated users to insert redemptions (for POS)
CREATE POLICY IF NOT EXISTS "Authenticated users can create redemptions"
  ON reward_redemptions
  FOR INSERT
  WITH CHECK (true);
