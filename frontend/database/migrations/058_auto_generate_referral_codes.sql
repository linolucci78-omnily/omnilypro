-- Migration 058: Auto-Generate Referral Codes for All Customers
-- Genera automaticamente codici referral per clienti esistenti e nuovi

-- =====================================================
-- 1. FUNCTION: Auto-create referral program for new customers
-- =====================================================

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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.auto_create_referral_program IS 'Crea automaticamente un programma referral per ogni nuovo cliente';

-- =====================================================
-- 2. TRIGGER: Create referral program on customer insert
-- =====================================================

DROP TRIGGER IF EXISTS trigger_auto_create_referral_program ON public.customers;

CREATE TRIGGER trigger_auto_create_referral_program
  AFTER INSERT ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_referral_program();

-- =====================================================
-- 3. GENERATE CODES FOR EXISTING CUSTOMERS
-- =====================================================

-- Generate referral programs for all existing customers
-- that don't have one yet
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
SELECT
  c.organization_id,
  c.id,
  -- Generate referral code
  CASE
    -- Try to use settings format if exists
    WHEN rs.code_format = 'name' THEN
      public.generate_referral_code(c.name, c.organization_id)
    ELSE
      -- Default auto format
      COALESCE(rs.code_prefix, 'REF-') ||
      UPPER(SUBSTRING(MD5(RANDOM()::TEXT || c.id::TEXT) FROM 1 FOR COALESCE(rs.code_length, 8)))
  END,
  0,  -- total_referrals
  0,  -- successful_referrals
  0,  -- pending_referrals
  0,  -- conversion_rate
  0,  -- total_points_earned
  0,  -- total_rewards_claimed
  COALESCE(rs.program_active, true),  -- is_active (from settings or default true)
  NOW(),
  NOW()
FROM public.customers c
LEFT JOIN public.referral_settings rs ON rs.organization_id = c.organization_id
WHERE NOT EXISTS (
  SELECT 1
  FROM public.referral_programs rp
  WHERE rp.customer_id = c.id
    AND rp.organization_id = c.organization_id
)
-- Only for organizations with active referral settings (or all if no settings)
AND (rs.program_active IS NULL OR rs.program_active = true);

-- =====================================================
-- 4. ENSURE UNIQUE CODES (Fix any duplicates)
-- =====================================================

-- If by any chance there are duplicate codes, fix them
DO $$
DECLARE
  v_program RECORD;
  v_new_code TEXT;
BEGIN
  FOR v_program IN
    SELECT id, organization_id, customer_id, referral_code
    FROM public.referral_programs
    WHERE referral_code IN (
      SELECT referral_code
      FROM public.referral_programs
      GROUP BY referral_code
      HAVING COUNT(*) > 1
    )
    ORDER BY created_at DESC
  LOOP
    -- Generate new unique code
    v_new_code := 'REF-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || v_program.id::TEXT) FROM 1 FOR 8));

    -- Ensure uniqueness
    WHILE EXISTS(SELECT 1 FROM public.referral_programs WHERE referral_code = v_new_code) LOOP
      v_new_code := v_new_code || FLOOR(RANDOM() * 100)::TEXT;
    END LOOP;

    -- Update the duplicate
    UPDATE public.referral_programs
    SET referral_code = v_new_code,
        updated_at = NOW()
    WHERE id = v_program.id;

    RAISE NOTICE 'Fixed duplicate code for customer %: % -> %',
      v_program.customer_id, v_program.referral_code, v_new_code;
  END LOOP;
END $$;

-- =====================================================
-- 5. CREATE INDEX FOR BETTER PERFORMANCE
-- =====================================================

-- Index for checking code uniqueness (if not exists)
CREATE INDEX IF NOT EXISTS idx_referral_programs_code_unique
  ON public.referral_programs(referral_code);

-- Index for customer lookup
CREATE INDEX IF NOT EXISTS idx_referral_programs_customer_org
  ON public.referral_programs(customer_id, organization_id);

-- =====================================================
-- 6. VERIFY RESULTS
-- =====================================================

-- Count customers without referral programs
DO $$
DECLARE
  v_customers_total INTEGER;
  v_customers_with_code INTEGER;
  v_customers_without_code INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_customers_total FROM public.customers;
  SELECT COUNT(*) INTO v_customers_with_code
    FROM public.customers c
    INNER JOIN public.referral_programs rp ON rp.customer_id = c.id;

  v_customers_without_code := v_customers_total - v_customers_with_code;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'REFERRAL CODE GENERATION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total Customers: %', v_customers_total;
  RAISE NOTICE 'Customers WITH Referral Code: %', v_customers_with_code;
  RAISE NOTICE 'Customers WITHOUT Referral Code: %', v_customers_without_code;
  RAISE NOTICE '========================================';

  IF v_customers_without_code > 0 THEN
    RAISE WARNING 'Some customers still don''t have referral codes. Check referral_settings.program_active';
  END IF;
END $$;
