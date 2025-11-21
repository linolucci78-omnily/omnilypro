-- Add print_receipt_preference column to customers table
-- Default TRUE means print receipt by default for existing customers

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS print_receipt_preference BOOLEAN DEFAULT true;

-- Add comment to explain the column
COMMENT ON COLUMN customers.print_receipt_preference IS 'Whether to print physical receipt for this customer. FALSE = digital only, TRUE = print paper receipt';
