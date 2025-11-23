-- Enable RLS on lottery_prizes table
ALTER TABLE lottery_prizes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON lottery_prizes
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Add comment
COMMENT ON TABLE lottery_prizes IS 'Multiple prizes for lottery events - supports ranked prize system';
