-- =====================================================
-- CRITICAL SECURITY FIX: Enable RLS on Core Tables
-- =====================================================
-- Tabelle critiche senza RLS policies - GRAVE VULNERABILITÀ
-- Chiunque poteva vedere dati di TUTTE le organizzazioni!

-- =====================================================
-- 1. ORGANIZATIONS TABLE
-- =====================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Super admin OMNILY può vedere tutto
CREATE POLICY "super_admin_all_organizations" ON organizations
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'super_admin'
    )
  );

-- Organization users possono vedere solo la propria org
CREATE POLICY "users_own_organization" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 2. CUSTOMERS TABLE
-- =====================================================
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Super admin può vedere tutti
CREATE POLICY "super_admin_all_customers" ON customers
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'super_admin'
    )
  );

-- Organization users possono vedere solo i propri clienti
CREATE POLICY "org_users_own_customers" ON customers
  FOR ALL USING (
    organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 3. NFC_CARDS TABLE
-- =====================================================
ALTER TABLE nfc_cards ENABLE ROW LEVEL SECURITY;

-- Super admin può vedere tutte
CREATE POLICY "super_admin_all_nfc_cards" ON nfc_cards
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'super_admin'
    )
  );

-- Organization users possono gestire solo le proprie carte
CREATE POLICY "org_users_own_nfc_cards" ON nfc_cards
  FOR ALL USING (
    organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 4. CUSTOMER_ACTIVITIES TABLE
-- =====================================================
ALTER TABLE customer_activities ENABLE ROW LEVEL SECURITY;

-- Super admin può vedere tutte
CREATE POLICY "super_admin_all_activities" ON customer_activities
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'super_admin'
    )
  );

-- Organization users possono vedere solo le attività dei propri clienti
CREATE POLICY "org_users_own_activities" ON customer_activities
  FOR ALL USING (
    organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 5. REWARDS TABLE
-- =====================================================
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- Super admin può vedere tutti
CREATE POLICY "super_admin_all_rewards" ON rewards
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'super_admin'
    )
  );

-- Organization users possono gestire solo i propri premi
CREATE POLICY "org_users_own_rewards" ON rewards
  FOR ALL USING (
    organization_id IN (
      SELECT org_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 6. USAGE_TRACKING TABLE (se esiste)
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_tracking') THEN
    ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

    -- Super admin può vedere tutto
    EXECUTE 'CREATE POLICY "super_admin_all_usage" ON usage_tracking
      FOR ALL USING (
        auth.uid() IN (
          SELECT id FROM users WHERE role = ''super_admin''
        )
      )';

    -- Organization users possono vedere solo il proprio usage
    EXECUTE 'CREATE POLICY "org_users_own_usage" ON usage_tracking
      FOR SELECT USING (
        org_id IN (
          SELECT org_id FROM organization_users
          WHERE user_id = auth.uid()
        )
      )';
  END IF;
END $$;

-- =====================================================
-- 7. LOYALTY_TIERS TABLE (se esiste)
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loyalty_tiers') THEN
    ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;

    -- Super admin può vedere tutti
    EXECUTE 'CREATE POLICY "super_admin_all_tiers" ON loyalty_tiers
      FOR ALL USING (
        auth.uid() IN (
          SELECT id FROM users WHERE role = ''super_admin''
        )
      )';

    -- Organization users possono gestire solo i propri tiers
    EXECUTE 'CREATE POLICY "org_users_own_tiers" ON loyalty_tiers
      FOR ALL USING (
        organization_id IN (
          SELECT org_id FROM organization_users
          WHERE user_id = auth.uid()
        )
      )';
  END IF;
END $$;

-- =====================================================
-- VERIFICA FINALE
-- =====================================================
-- Query per vedere quali tabelle hanno RLS abilitato
DO $$
DECLARE
  rec RECORD;
  rls_count INTEGER := 0;
  no_rls_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=== VERIFICA RLS POLICIES ===';

  FOR rec IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = rec.tablename
      AND n.nspname = 'public'
      AND c.relrowsecurity = true
    ) THEN
      rls_count := rls_count + 1;
      RAISE NOTICE '✅ % - RLS ENABLED', rec.tablename;
    ELSE
      no_rls_count := no_rls_count + 1;
      RAISE NOTICE '❌ % - RLS DISABLED', rec.tablename;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '=== RIEPILOGO ===';
  RAISE NOTICE 'Tabelle con RLS: %', rls_count;
  RAISE NOTICE 'Tabelle senza RLS: %', no_rls_count;

  IF no_rls_count > 0 THEN
    RAISE WARNING 'ATTENZIONE: Ci sono ancora % tabelle senza RLS!', no_rls_count;
  ELSE
    RAISE NOTICE '🎉 TUTTE le tabelle hanno RLS abilitato!';
  END IF;
END $$;
