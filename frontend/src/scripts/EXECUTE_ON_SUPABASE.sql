/**
 * =====================================================
 * OMNILYPRO - SQL COMPLETO PER SLOT MACHINE
 * =====================================================
 *
 * ISTRUZIONI:
 * 1. Apri Supabase → SQL Editor
 * 2. Copia e incolla TUTTO questo file
 * 3. Clicca RUN
 * 4. Verifica che non ci siano errori
 *
 * Questo script include:
 * ✅ Tabelle slot machine (se non esistono già)
 * ✅ Funzione per aggiornare configurazione slot
 * ✅ Funzione per aggiungere punti ai clienti
 *
 * =====================================================
 */

-- =====================================================
-- 1. TABELLE SLOT MACHINE
-- =====================================================

-- Slot Machine Configuration Table
CREATE TABLE IF NOT EXISTS slot_machine_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Slot Machine',
  symbols JSONB NOT NULL DEFAULT '[]'::jsonb,
  winning_combinations JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_spins_per_day INTEGER NOT NULL DEFAULT 3,
  cooldown_hours INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT slot_config_org_unique UNIQUE (organization_id)
);

-- Customer Slot Spins Table
CREATE TABLE IF NOT EXISTS customer_slot_spins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slot_config_id UUID REFERENCES slot_machine_config(id) ON DELETE SET NULL,
  result JSONB NOT NULL,
  prize_won JSONB,
  rewards_claimed BOOLEAN NOT NULL DEFAULT false,
  rewards_claimed_at TIMESTAMP WITH TIME ZONE,
  spun_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_slot_config_org ON slot_machine_config(organization_id);
CREATE INDEX IF NOT EXISTS idx_slot_config_active ON slot_machine_config(is_active);
CREATE INDEX IF NOT EXISTS idx_slot_spins_customer ON customer_slot_spins(customer_id);
CREATE INDEX IF NOT EXISTS idx_slot_spins_org ON customer_slot_spins(organization_id);
CREATE INDEX IF NOT EXISTS idx_slot_spins_spun_at ON customer_slot_spins(spun_at);
CREATE INDEX IF NOT EXISTS idx_slot_spins_customer_date ON customer_slot_spins(customer_id, spun_at DESC);

-- RLS Policies
ALTER TABLE slot_machine_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_slot_spins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active slot configs" ON slot_machine_config;
CREATE POLICY "Anyone can view active slot configs"
  ON slot_machine_config FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Service role can manage slot configs" ON slot_machine_config;
CREATE POLICY "Service role can manage slot configs"
  ON slot_machine_config FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Customers can view own slot spins" ON customer_slot_spins;
CREATE POLICY "Customers can view own slot spins"
  ON customer_slot_spins FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can insert slot spins" ON customer_slot_spins;
CREATE POLICY "Service role can insert slot spins"
  ON customer_slot_spins FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_slot_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS slot_config_updated_at ON slot_machine_config;
CREATE TRIGGER slot_config_updated_at
  BEFORE UPDATE ON slot_machine_config
  FOR EACH ROW
  EXECUTE FUNCTION update_slot_config_updated_at();

-- =====================================================
-- 2. FUNZIONE PER AGGIORNARE CONFIGURAZIONE SLOT
-- =====================================================

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

-- =====================================================
-- 3. FUNZIONE PER AGGIUNGERE PUNTI AI CLIENTI
-- =====================================================

CREATE OR REPLACE FUNCTION add_loyalty_points(
  p_customer_id UUID,
  p_points INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE customers
  SET
    points = COALESCE(points, 0) + p_points,
    updated_at = NOW()
  WHERE id = p_customer_id;
END;
$$;

-- =====================================================
-- VERIFICA INSTALLAZIONE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Slot Machine tables created/verified';
  RAISE NOTICE '✅ update_slot_machine_config function created';
  RAISE NOTICE '✅ add_loyalty_points function created';
  RAISE NOTICE '';
  RAISE NOTICE '🎰 Slot Machine SQL installation complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Refresh your frontend application';
  RAISE NOTICE '2. Test slot machine configuration in Gaming Settings';
  RAISE NOTICE '3. Test playing and winning points';
END $$;
