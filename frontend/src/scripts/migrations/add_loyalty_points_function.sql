-- Function to add loyalty points to a customer
-- Execute this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION add_loyalty_points(
  p_customer_id UUID,
  p_points INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE customers
  SET
    points = COALESCE(points, 0) + p_points,
    updated_at = NOW()
  WHERE id = p_customer_id;
END;
$$;
