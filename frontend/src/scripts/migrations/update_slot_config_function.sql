-- Function to update slot machine config (bypasses RLS)
-- Execute this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION update_slot_machine_config(
  p_organization_id UUID,
  p_name TEXT,
  p_symbols JSONB,
  p_winning_combinations JSONB,
  p_max_spins_per_day INTEGER,
  p_cooldown_hours INTEGER,
  p_is_active BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE slot_machine_config
  SET
    name = p_name,
    symbols = p_symbols,
    winning_combinations = p_winning_combinations,
    max_spins_per_day = p_max_spins_per_day,
    cooldown_hours = p_cooldown_hours,
    is_active = p_is_active,
    updated_at = NOW()
  WHERE organization_id = p_organization_id
  RETURNING jsonb_build_object(
    'id', id,
    'organization_id', organization_id,
    'name', name,
    'symbols', symbols,
    'winning_combinations', winning_combinations,
    'max_spins_per_day', max_spins_per_day,
    'cooldown_hours', cooldown_hours,
    'is_active', is_active,
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO v_result;

  RETURN v_result;
END;
$$;
