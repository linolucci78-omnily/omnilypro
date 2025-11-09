-- =====================================================
-- Migration 054: Update authenticate_operator_via_nfc to return password
-- =====================================================
-- Descrizione: Aggiorna la funzione per restituire anche la password
-- criptata, necessaria per il login automatico
-- =====================================================

-- Drop the existing function first (required when changing return type)
DROP FUNCTION IF EXISTS public.authenticate_operator_via_nfc(VARCHAR);

-- Recreate with new return type including encrypted_password
CREATE FUNCTION public.authenticate_operator_via_nfc(
  p_nfc_uid VARCHAR(255)
)
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  operator_name TEXT,
  organization_id UUID,
  card_id UUID,
  encrypted_password TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    onc.user_id,
    u.email::TEXT,
    onc.operator_name::TEXT,
    onc.organization_id,
    onc.id as card_id,
    onc.encrypted_password::TEXT
  FROM public.operator_nfc_cards onc
  JOIN auth.users u ON u.id = onc.user_id
  WHERE onc.nfc_uid = p_nfc_uid
  AND onc.is_active = true
  LIMIT 1;

  -- Aggiorna last_used_at
  UPDATE public.operator_nfc_cards
  SET last_used_at = NOW()
  WHERE nfc_uid = p_nfc_uid
  AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON FUNCTION public.authenticate_operator_via_nfc IS 'Verifica e autentica un operatore tramite NFC UID, restituendo anche la password per login automatico';
