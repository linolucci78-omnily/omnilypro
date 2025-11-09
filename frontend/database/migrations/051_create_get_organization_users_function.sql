-- =====================================================
-- Migration 051: Create function to get organization users with auth data
-- =====================================================
-- Descrizione: Funzione RPC per ottenere gli utenti di un'organizzazione
-- con i dati di autenticazione joinati da auth.users
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_organization_users_with_auth(
  p_org_id UUID
)
RETURNS TABLE (
  user_id UUID,
  role TEXT,
  joined_at TIMESTAMPTZ,
  user_email TEXT,
  full_name TEXT,
  phone TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ou.user_id,
    ou.role::TEXT,
    ou.joined_at,
    u.email::TEXT as user_email,
    COALESCE(
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      split_part(u.email, '@', 1)
    )::TEXT as full_name,
    COALESCE(u.raw_user_meta_data->>'phone', '')::TEXT as phone
  FROM public.organization_users ou
  JOIN auth.users u ON u.id = ou.user_id
  WHERE ou.org_id = p_org_id
  ORDER BY ou.joined_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_organization_users_with_auth(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_users_with_auth(UUID) TO anon;

-- Comment
COMMENT ON FUNCTION public.get_organization_users_with_auth IS 'Ottiene gli utenti di un\'organizzazione con i dati di autenticazione';
