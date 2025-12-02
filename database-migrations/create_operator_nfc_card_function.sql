-- Migration: Create RPC function for operator NFC card creation
-- Description: Creates a PostgreSQL function to handle operator card creation with atomic deactivation
-- Date: 2025-12-03

-- Drop function if exists (for re-running migration)
DROP FUNCTION IF EXISTS create_operator_nfc_card(UUID, UUID, TEXT, TEXT, TEXT, UUID);

-- Create function to atomically deactivate old cards and create new one
CREATE OR REPLACE FUNCTION create_operator_nfc_card(
  p_user_id UUID,
  p_organization_id UUID,
  p_nfc_uid TEXT,
  p_operator_name TEXT,
  p_encrypted_password TEXT,
  p_created_by UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  organization_id UUID,
  nfc_uid TEXT,
  operator_name TEXT,
  encrypted_password TEXT,
  is_active BOOLEAN,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_card_id UUID;
BEGIN
  -- Step 1: Disattiva tutte le altre tessere attive per questo operatore
  -- Questo previene violazioni del constraint UNIQUE(user_id, organization_id, is_active WHERE is_active = true)
  UPDATE operator_nfc_cards
  SET is_active = false,
      updated_at = NOW()
  WHERE operator_nfc_cards.user_id = p_user_id
    AND operator_nfc_cards.organization_id = p_organization_id
    AND operator_nfc_cards.is_active = true;

  -- Step 2: Inserisci la nuova tessera
  INSERT INTO operator_nfc_cards (
    user_id,
    organization_id,
    nfc_uid,
    operator_name,
    encrypted_password,
    is_active,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_organization_id,
    p_nfc_uid,
    p_operator_name,
    p_encrypted_password,
    true,
    p_created_by,
    NOW(),
    NOW()
  )
  RETURNING operator_nfc_cards.id INTO v_new_card_id;

  -- Step 3: Ritorna la tessera appena creata
  RETURN QUERY
  SELECT
    c.id,
    c.user_id,
    c.organization_id,
    c.nfc_uid,
    c.operator_name,
    c.encrypted_password,
    c.is_active,
    c.last_used_at,
    c.created_at,
    c.updated_at,
    c.created_by
  FROM operator_nfc_cards c
  WHERE c.id = v_new_card_id;
END;
$$;

-- Add comment
COMMENT ON FUNCTION create_operator_nfc_card IS 'Atomically deactivates existing operator cards and creates a new one to avoid UNIQUE constraint violations';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_operator_nfc_card TO authenticated;
