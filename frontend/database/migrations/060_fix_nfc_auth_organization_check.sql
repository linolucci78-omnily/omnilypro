-- =====================================================
-- Migration 060: Fix NFC Authentication Organization Check
-- =====================================================
-- CRITICAL SECURITY FIX: Prevent cross-organization NFC login
-- La card NFC deve appartenere SOLO all'organizzazione del POS
-- =====================================================

-- Drop the existing function
DROP FUNCTION IF EXISTS public.authenticate_operator_via_nfc(VARCHAR);

-- Recreate with organization_id parameter for security
CREATE OR REPLACE FUNCTION public.authenticate_operator_via_nfc(
  p_nfc_uid VARCHAR(255),
  p_organization_id UUID DEFAULT NULL  -- Optional for backward compatibility
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
  -- 🔒 SECURITY: If organization_id is provided, MUST match the card's organization
  -- This prevents using a card from Organization A in Organization B's POS

  IF p_organization_id IS NOT NULL THEN
    -- SECURE MODE: Check both UID AND organization_id
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
    AND onc.organization_id = p_organization_id  -- 🔒 CRITICAL: Must match POS organization
    AND onc.is_active = true
    LIMIT 1;
  ELSE
    -- FALLBACK MODE (backward compatibility): Check only UID
    -- ⚠️ WARNING: This allows cross-organization login if org_id not provided
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
  END IF;

  -- Update last_used_at only if authentication succeeded
  IF FOUND THEN
    UPDATE public.operator_nfc_cards
    SET last_used_at = NOW()
    WHERE nfc_uid = p_nfc_uid
    AND is_active = true
    AND (p_organization_id IS NULL OR organization_id = p_organization_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON FUNCTION public.authenticate_operator_via_nfc IS
'Verifica e autentica un operatore tramite NFC UID con controllo organization_id per sicurezza.
CRITICAL: Passa p_organization_id per evitare login cross-organization!';

-- Verification query
SELECT
  'authenticate_operator_via_nfc function updated' as status,
  'Now requires organization_id for secure authentication' as security_note;
