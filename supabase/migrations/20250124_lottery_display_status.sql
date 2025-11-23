-- Create table to track lottery display status across devices
CREATE TABLE IF NOT EXISTS lottery_display_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES lottery_events(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  is_online BOOLEAN NOT NULL DEFAULT true,
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_lottery_display_status_event_id ON lottery_display_status(event_id);
CREATE INDEX IF NOT EXISTS idx_lottery_display_status_session ON lottery_display_status(session_id);

-- Enable RLS
ALTER TABLE lottery_display_status ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read display status (for public displays)
CREATE POLICY "Anyone can view display status"
  ON lottery_display_status FOR SELECT
  USING (true);

-- Policy: Anyone can insert/update display status
CREATE POLICY "Anyone can update display status"
  ON lottery_display_status FOR ALL
  USING (true);

-- Function to cleanup old/stale displays (offline for more than 30 seconds)
CREATE OR REPLACE FUNCTION cleanup_stale_displays()
RETURNS void AS $$
BEGIN
  DELETE FROM lottery_display_status
  WHERE last_heartbeat < NOW() - INTERVAL '30 seconds';
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE lottery_display_status;
