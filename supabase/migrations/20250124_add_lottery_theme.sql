-- Add theme column to lottery_events table
ALTER TABLE lottery_events
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'casino' CHECK (theme IN ('casino', 'bingo', 'drum', 'modern'));

-- Add comment
COMMENT ON COLUMN lottery_events.theme IS 'Visual theme for the extraction display: casino (cards/chips), bingo (bouncing balls), drum (rotating cylinder), modern (geometric minimal)';
