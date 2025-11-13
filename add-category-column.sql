-- Add category column to rewards table
ALTER TABLE rewards
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add comment
COMMENT ON COLUMN rewards.category IS 'Categoria del premio (es: Food, Drink, etc.)';
