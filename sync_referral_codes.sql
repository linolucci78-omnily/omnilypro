-- ========================================
-- SINCRONIZZA CODICI REFERRAL
-- ========================================
-- Problema: customers.referral_code != referral_programs.referral_code
-- Soluzione: Usa referral_programs come fonte autoritativa

-- 1. AGGIORNA LA FUNZIONE PER SINCRONIZZARE I CODICI
CREATE OR REPLACE FUNCTION public.auto_create_referral_program()
RETURNS TRIGGER AS $$
DECLARE
  v_referral_code TEXT;
  v_settings RECORD;
BEGIN
  -- Get organization referral settings
  SELECT * INTO v_settings
  FROM public.referral_settings
  WHERE organization_id = NEW.organization_id;

  -- If settings don't exist or program not active, skip
  IF v_settings IS NULL OR v_settings.program_active = false THEN
    RETURN NEW;
  END IF;

  -- Generate referral code based on format
  CASE v_settings.code_format
    WHEN 'auto' THEN
      -- Auto format: PREFIX + RANDOM
      v_referral_code := COALESCE(v_settings.code_prefix, 'REF-') ||
                         UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NEW.id::TEXT) FROM 1 FOR v_settings.code_length));

    WHEN 'name' THEN
      -- Name format: Use generate_referral_code function
      v_referral_code := public.generate_referral_code(NEW.name, NEW.organization_id);

    WHEN 'custom' THEN
      -- Custom format: Will be set manually later, use auto for now
      v_referral_code := COALESCE(v_settings.code_prefix, 'REF-') ||
                         UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NEW.id::TEXT) FROM 1 FOR v_settings.code_length));

    ELSE
      -- Default to auto
      v_referral_code := 'REF-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NEW.id::TEXT) FROM 1 FOR 8));
  END CASE;

  -- Ensure uniqueness by checking and adding counter if needed
  WHILE EXISTS(SELECT 1 FROM public.referral_programs WHERE referral_code = v_referral_code) LOOP
    v_referral_code := v_referral_code || FLOOR(RANDOM() * 100)::TEXT;
  END LOOP;

  -- Create referral program
  INSERT INTO public.referral_programs (
    organization_id,
    customer_id,
    referral_code,
    total_referrals,
    successful_referrals,
    pending_referrals,
    conversion_rate,
    total_points_earned,
    total_rewards_claimed,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.organization_id,
    NEW.id,
    v_referral_code,
    0,
    0,
    0,
    0,
    0,
    0,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (organization_id, customer_id) DO NOTHING;

  -- **NUOVO: Sincronizza il codice nella tabella customers**
  UPDATE public.customers
  SET referral_code = v_referral_code
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. SINCRONIZZA TUTTI I CODICI ESISTENTI
-- Usa referral_programs come fonte autoritativa
UPDATE public.customers c
SET referral_code = rp.referral_code
FROM public.referral_programs rp
WHERE c.id = rp.customer_id
  AND c.organization_id = rp.organization_id
  AND (c.referral_code IS NULL OR c.referral_code != rp.referral_code);

-- 3. VERIFICA RISULTATI
SELECT
  'Codici sincronizzati con successo' as messaggio,
  COUNT(*) as totale_clienti_sincronizzati
FROM public.customers c
INNER JOIN public.referral_programs rp ON c.id = rp.customer_id
WHERE c.referral_code = rp.referral_code;

-- 4. CONTROLLA SE CI SONO ANCORA DISCREPANZE
SELECT
  c.id,
  c.name,
  c.email,
  c.referral_code as codice_customers,
  rp.referral_code as codice_referral_programs,
  CASE
    WHEN c.referral_code = rp.referral_code THEN '✅ MATCH'
    WHEN c.referral_code IS NULL THEN '⚠️ NULL in customers'
    ELSE '❌ DIVERSI!'
  END as stato
FROM public.customers c
LEFT JOIN public.referral_programs rp ON c.id = rp.customer_id
WHERE c.referral_code IS NULL OR c.referral_code != rp.referral_code
ORDER BY c.created_at DESC
LIMIT 20;

-- 5. VERIFICA SPECIFICA PER LUCIA
SELECT
  c.id,
  c.name,
  c.email,
  c.referral_code as codice_customers,
  rp.referral_code as codice_referral_programs,
  CASE
    WHEN c.referral_code = rp.referral_code THEN '✅ SINCRONIZZATO'
    ELSE '❌ ERRORE SINCRONIZZAZIONE'
  END as stato
FROM public.customers c
LEFT JOIN public.referral_programs rp ON c.id = rp.customer_id
WHERE c.email = 'lucia.procope47@gmail.com';
