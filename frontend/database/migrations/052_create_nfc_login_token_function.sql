-- =====================================================
-- Migration 052: Create NFC login token function
-- =====================================================
-- Descrizione: Funzione per generare token di accesso
-- per operatori autenticati tramite NFC
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_nfc_login_token(
  p_user_id UUID,
  p_nfc_uid VARCHAR(255)
)
RETURNS JSON AS $$
DECLARE
  v_card RECORD;
  v_token TEXT;
BEGIN
  -- Verifica che la tessera NFC esista ed sia attiva
  SELECT * INTO v_card
  FROM public.operator_nfc_cards
  WHERE user_id = p_user_id
  AND nfc_uid = p_nfc_uid
  AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid NFC card or card not active';
  END IF;

  -- Aggiorna last_used_at
  UPDATE public.operator_nfc_cards
  SET last_used_at = NOW()
  WHERE id = v_card.id;

  -- Genera un token di accesso usando l'estensione pgjwt se disponibile
  -- Altrimenti, usa il metodo nativo di Supabase
  -- Per ora, restituiamo solo i dati dell'utente e lasciamo che il client
  -- usi questi dati per fare il login standard

  RETURN json_build_object(
    'success', true,
    'user_id', p_user_id,
    'card_id', v_card.id,
    'operator_name', v_card.operator_name,
    'organization_id', v_card.organization_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.generate_nfc_login_token(UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_nfc_login_token(UUID, VARCHAR) TO anon;

-- Comment
COMMENT ON FUNCTION public.generate_nfc_login_token IS 'Genera token di accesso per operatori NFC autenticati';
