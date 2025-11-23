-- Add customer_address column to lottery_tickets table
ALTER TABLE lottery_tickets
ADD COLUMN IF NOT EXISTS customer_address TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN lottery_tickets.customer_address IS 'Optional customer address for lottery ticket purchases';
