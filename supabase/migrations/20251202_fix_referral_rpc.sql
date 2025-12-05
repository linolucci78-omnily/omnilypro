-- Funzione sicura per processare i referral bypassando RLS
CREATE OR REPLACE FUNCTION process_referral_conversion(
  p_organization_id UUID,
  p_referrer_id UUID,
  p_referee_id UUID,
  p_referral_program_id UUID,
  p_referral_code TEXT,
  p_points_referrer INTEGER,
  p_points_referee INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Esegue con i permessi del creatore della funzione (bypass RLS)
SET search_path = public -- Sicurezza: forza search_path
AS $$
DECLARE
  v_conversion_id UUID;
  v_referrer_new_points INTEGER;
  v_referee_new_points INTEGER;
BEGIN
  -- 1. Verifica esistenza programma referral
  IF NOT EXISTS (SELECT 1 FROM referral_programs WHERE id = p_referral_program_id AND is_active = true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Programma referral non valido o inattivo');
  END IF;

  -- 2. Crea record conversione
  INSERT INTO referral_conversions (
    organization_id,
    referrer_id,
    referee_id,
    referral_program_id,
    referral_code,
    status,
    points_awarded_referrer,
    points_awarded_referee,
    reward_type,
    source,
    converted_at
  ) VALUES (
    p_organization_id,
    p_referrer_id,
    p_referee_id,
    p_referral_program_id,
    p_referral_code,
    'completed',
    p_points_referrer,
    p_points_referee,
    'points',
    'registration_wizard',
    NOW()
  ) RETURNING id INTO v_conversion_id;

  -- 3. Aggiorna punti referrer
  UPDATE customers
  SET points = points + p_points_referrer
  WHERE id = p_referrer_id
  RETURNING points INTO v_referrer_new_points;

  -- 4. Aggiorna punti referee (nuovo cliente)
  UPDATE customers
  SET points = points + p_points_referee
  WHERE id = p_referee_id
  RETURNING points INTO v_referee_new_points;

  -- 5. Aggiorna statistiche programma referral
  UPDATE referral_programs
  SET 
    successful_referrals = successful_referrals + 1,
    total_points_earned = total_points_earned + p_points_referrer,
    updated_at = NOW()
  WHERE id = p_referral_program_id;

  -- 6. Ritorna successo e dettagli
  RETURN jsonb_build_object(
    'success', true,
    'conversion_id', v_conversion_id,
    'referrer_new_points', v_referrer_new_points,
    'referee_new_points', v_referee_new_points
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Permessi
GRANT EXECUTE ON FUNCTION process_referral_conversion TO authenticated;
GRANT EXECUTE ON FUNCTION process_referral_conversion TO anon; -- Necessario per kiosk/registrazione pubblica
