-- Create lottery_extraction_commands table for remote extraction control

CREATE TABLE IF NOT EXISTS lottery_extraction_commands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES lottery_events(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  command TEXT NOT NULL, -- 'START_EXTRACTION', 'RESET', etc.
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_lottery_extraction_commands_event_id ON lottery_extraction_commands(event_id);
CREATE INDEX IF NOT EXISTS idx_lottery_extraction_commands_status ON lottery_extraction_commands(status);

-- Enable Row Level Security
ALTER TABLE lottery_extraction_commands ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated users" ON lottery_extraction_commands
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Enable Realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE lottery_extraction_commands;

-- Add comment
COMMENT ON TABLE lottery_extraction_commands IS 'Remote commands for lottery extraction display control';
