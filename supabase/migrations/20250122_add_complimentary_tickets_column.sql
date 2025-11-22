-- Add total_complimentary_tickets column to lottery_events table

ALTER TABLE lottery_events
ADD COLUMN IF NOT EXISTS total_complimentary_tickets INTEGER DEFAULT 0;

-- Update existing events to set complimentary tickets to 0
UPDATE lottery_events
SET total_complimentary_tickets = 0
WHERE total_complimentary_tickets IS NULL;

-- Add a comment to document the column
COMMENT ON COLUMN lottery_events.total_complimentary_tickets IS 'Number of complimentary (free) tickets given for this event';
