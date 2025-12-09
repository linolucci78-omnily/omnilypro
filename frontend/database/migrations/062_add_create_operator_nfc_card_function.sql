-- =====================================================
-- Migration 062: Add create_operator_nfc_card RPC function
-- =====================================================
-- Descrizione: Crea una funzione RPC atomica per creare tessere NFC operatore
-- Risolve race conditions disattivando automaticamente le tessere precedenti
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_operator_nfc_card(
  p_user_id UUID,
  p_organization_id UUID,
  p_nfc_uid VARCHAR(255),
  p_operator_name VARCHAR(255),
  p_encrypted_password TEXT,
  p_created_by UUID DEFAULT NULL
)
RETURNS public.operator_nfc_cards AS $$
DECLARE
  v_new_card public.operator_nfc_cards;
BEGIN
  -- Step 1: Disattiva tutte le tessere attive precedenti dello stesso operatore
  -- per rispettare il constraint UNIQUE(user_id, organization_id, is_active)
  UPDATE public.operator_nfc_cards
  SET is_active = false,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND organization_id = p_organization_id
    AND is_active = true;

  -- Step 2: Inserisci la nuova tessera come attiva
  INSERT INTO public.operator_nfc_cards (
    user_id,
    organization_id,
    nfc_uid,
    operator_name,
    encrypted_password,
    created_by,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_organization_id,
    p_nfc_uid,
    p_operator_name,
    p_encrypted_password,
    p_created_by,
    true,
    NOW(),
    NOW()
  )
  RETURNING * INTO v_new_card;

  -- Step 3: Restituisci la tessera appena creata
  RETURN v_new_card;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_operator_nfc_card(UUID, UUID, VARCHAR, VARCHAR, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_operator_nfc_card(UUID, UUID, VARCHAR, VARCHAR, TEXT, UUID) TO anon;

-- Comment
COMMENT ON FUNCTION public.create_operator_nfc_card IS 'Crea una nuova tessera NFC operatore disattivando automaticamente quelle precedenti per evitare race conditions';
