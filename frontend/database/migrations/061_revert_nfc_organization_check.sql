-- =====================================================
-- Migration 061: Revert NFC Organization Check
-- =====================================================
-- REVERT INCORRECT FIX: The organization check was wrong!
-- NFC cards should work like personal IDs - they take you to
-- YOUR organization from ANY POS device, not restricted to
-- specific POS devices.
-- =====================================================

-- Drop the function with organization_id parameter
DROP FUNCTION IF EXISTS public.authenticate_operator_via_nfc(VARCHAR, UUID);

-- Recreate the original function WITHOUT organization check
-- This allows the card to work from any POS device
CREATE OR REPLACE FUNCTION public.authenticate_operator_via_nfc(
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
  -- 🔑 NFC card works like a personal ID
  -- It takes you to YOUR organization (the one on the card)
  -- regardless of which POS device you use

  RETURN QUERY
  SELECT
    onc.user_id,
    u.email::TEXT,
    onc.operator_name::TEXT,
    onc.organization_id,  -- This is the card's organization
    onc.id as card_id,
    onc.encrypted_password::TEXT
  FROM public.operator_nfc_cards onc
  JOIN auth.users u ON u.id = onc.user_id
  WHERE onc.nfc_uid = p_nfc_uid
  AND onc.is_active = true
  LIMIT 1;

  -- Update last_used_at only if authentication succeeded
  IF FOUND THEN
    UPDATE public.operator_nfc_cards
    SET last_used_at = NOW()
    WHERE nfc_uid = p_nfc_uid
    AND is_active = true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON FUNCTION public.authenticate_operator_via_nfc IS
'Autentica un operatore tramite NFC UID. La card funziona come un ID personale -
ti porta alla TUA organizzazione da qualsiasi POS, non è limitata a specifici dispositivi.';

-- Verification query
SELECT
  'authenticate_operator_via_nfc function reverted' as status,
  'NFC cards now work like personal IDs - from any POS to your organization' as behavior;
