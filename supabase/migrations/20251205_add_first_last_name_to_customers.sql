-- Add first_name and last_name columns to customers table
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

-- Populate first_name and last_name from existing name field
-- This attempts to split "Lucci Lino" into first_name="Lucci" and last_name="Lino"
UPDATE public.customers
SET
    first_name = SPLIT_PART(name, ' ', 1),
    last_name = CASE
        WHEN POSITION(' ' IN name) > 0
        THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
        ELSE NULL
    END
WHERE first_name IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_first_name ON public.customers(first_name);
CREATE INDEX IF NOT EXISTS idx_customers_last_name ON public.customers(last_name);

-- Add comment
COMMENT ON COLUMN public.customers.first_name IS 'Customer first name - extracted from name field';
COMMENT ON COLUMN public.customers.last_name IS 'Customer last name - extracted from name field';
