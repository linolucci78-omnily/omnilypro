-- ============================================================================
-- Get User Role Function
-- RPC function to get user role (bypasses RLS for this specific query)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE id = user_id;

  RETURN user_role;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;

COMMENT ON FUNCTION get_user_role IS 'Returns the role of a user - used for authentication in Edge Functions';
