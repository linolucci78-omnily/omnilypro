-- Add metadata column to lottery_extraction_commands table
ALTER TABLE lottery_extraction_commands
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add comment
COMMENT ON COLUMN lottery_extraction_commands.metadata IS 'Additional command metadata (e.g., custom messages)';
