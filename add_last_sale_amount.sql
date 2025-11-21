-- Add last_sale_amount column to customers table
-- This stores the exact amount of the last sale for accurate display in mobile app

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS last_sale_amount NUMERIC(10, 2) DEFAULT 0;

COMMENT ON COLUMN customers.last_sale_amount IS 'Amount of the last sale transaction - used for real-time notification display in mobile app';
