-- =====================================================
-- Migration 063: Add staff_id support to operator NFC cards
-- =====================================================
-- Descrizione: Permette tessere NFC anche per operatori senza account auth
-- Aggiunge staff_id opzionale per operatori da staff_members
-- =====================================================

-- Step 1: Rendi user_id nullable (può essere NULL se è un operatore locale)
ALTER TABLE public.operator_nfc_cards
ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Aggiungi colonna staff_id (opzionale)
ALTER TABLE public.operator_nfc_cards
ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.staff_members(id) ON DELETE CASCADE;

-- Step 3: Aggiungi constraint: almeno uno tra user_id e staff_id deve essere presente
ALTER TABLE public.operator_nfc_cards
ADD CONSTRAINT operator_nfc_cards_user_or_staff CHECK (
  (user_id IS NOT NULL AND staff_id IS NULL) OR
  (user_id IS NULL AND staff_id IS NOT NULL)
);

-- Step 4: Crea indice per staff_id
CREATE INDEX IF NOT EXISTS idx_operator_nfc_cards_staff_id ON public.operator_nfc_cards(staff_id);

-- Step 5: Aggiorna il constraint UNIQUE per includere staff_id
-- Prima rimuovi il vecchio constraint
ALTER TABLE public.operator_nfc_cards
DROP CONSTRAINT IF EXISTS operator_nfc_cards_user_id_organization_id_is_active_key;

-- Poi aggiungi un nuovo constraint parziale solo per user_id (quando è NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS operator_nfc_cards_user_active_unique
ON public.operator_nfc_cards(user_id, organization_id)
WHERE is_active = true AND user_id IS NOT NULL;

-- E uno per staff_id (quando è NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS operator_nfc_cards_staff_active_unique
ON public.operator_nfc_cards(staff_id, organization_id)
WHERE is_active = true AND staff_id IS NOT NULL;

-- Step 6: Aggiorna la funzione create_operator_nfc_card per supportare staff_id
CREATE OR REPLACE FUNCTION public.create_operator_nfc_card(
  p_organization_id UUID,
  p_nfc_uid VARCHAR(255),
  p_operator_name VARCHAR(255),
  p_user_id UUID DEFAULT NULL,
  p_staff_id UUID DEFAULT NULL,
  p_encrypted_password TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS public.operator_nfc_cards AS $$
DECLARE
  v_new_card public.operator_nfc_cards;
BEGIN
  -- Validazione: almeno uno tra user_id e staff_id deve essere presente
  IF p_user_id IS NULL AND p_staff_id IS NULL THEN
    RAISE EXCEPTION 'Deve essere specificato user_id o staff_id';
  END IF;

  -- Disattiva tessere precedenti dello stesso operatore
  IF p_user_id IS NOT NULL THEN
    UPDATE public.operator_nfc_cards
    SET is_active = false, updated_at = NOW()
    WHERE user_id = p_user_id
      AND organization_id = p_organization_id
      AND is_active = true;
  END IF;

  IF p_staff_id IS NOT NULL THEN
    UPDATE public.operator_nfc_cards
    SET is_active = false, updated_at = NOW()
    WHERE staff_id = p_staff_id
      AND organization_id = p_organization_id
      AND is_active = true;
  END IF;

  -- Inserisci nuova tessera
  INSERT INTO public.operator_nfc_cards (
    user_id,
    staff_id,
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
    p_staff_id,
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

  RETURN v_new_card;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_operator_nfc_card(UUID, VARCHAR, VARCHAR, UUID, UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_operator_nfc_card(UUID, VARCHAR, VARCHAR, UUID, UUID, TEXT, UUID) TO anon;

-- Step 7: Aggiorna la funzione authenticate_operator_via_nfc per supportare staff_id
CREATE OR REPLACE FUNCTION public.authenticate_operator_via_nfc(
  p_nfc_uid VARCHAR(255)
)
RETURNS TABLE (
  user_id UUID,
  staff_id UUID,
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
    onc.staff_id,
    COALESCE(u.email, sm.email)::TEXT as user_email,
    onc.operator_name::TEXT,
    onc.organization_id,
    onc.id as card_id,
    onc.encrypted_password::TEXT
  FROM public.operator_nfc_cards onc
  LEFT JOIN auth.users u ON u.id = onc.user_id
  LEFT JOIN public.staff_members sm ON sm.id = onc.staff_id
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

-- Grant execute
GRANT EXECUTE ON FUNCTION public.authenticate_operator_via_nfc(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.authenticate_operator_via_nfc(VARCHAR) TO anon;

-- Comments
COMMENT ON COLUMN public.operator_nfc_cards.staff_id IS 'ID operatore da staff_members (per operatori senza account auth)';
COMMENT ON CONSTRAINT operator_nfc_cards_user_or_staff ON public.operator_nfc_cards IS 'Almeno uno tra user_id e staff_id deve essere presente';
