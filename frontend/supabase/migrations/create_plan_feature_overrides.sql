-- Plan Feature Overrides Table
-- Permette di modificare dinamicamente le features disponibili per ogni piano
-- senza modificare il codice
-- V2: Supporta sia valori boolean (true/false) che valori custom (numeri, stringhe)

-- Crea tabella se non esiste (prima installazione)
CREATE TABLE IF NOT EXISTS plan_feature_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('free', 'basic', 'pro', 'enterprise')),
  feature_name VARCHAR(100) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(plan_type, feature_name)
);

-- Aggiungi nuove colonne se non esistono (upgrade tabella esistente)
DO $$
BEGIN
  -- Aggiungi value_type se non esiste
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'plan_feature_overrides' AND column_name = 'value_type') THEN
    ALTER TABLE plan_feature_overrides ADD COLUMN value_type VARCHAR(20) NOT NULL DEFAULT 'boolean' CHECK (value_type IN ('boolean', 'number', 'string'));
  END IF;

  -- Aggiungi boolean_value se non esiste
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'plan_feature_overrides' AND column_name = 'boolean_value') THEN
    ALTER TABLE plan_feature_overrides ADD COLUMN boolean_value BOOLEAN NULL;
    -- Migra i valori esistenti da enabled a boolean_value
    UPDATE plan_feature_overrides SET boolean_value = enabled WHERE value_type = 'boolean' OR value_type IS NULL;
  END IF;

  -- Aggiungi number_value se non esiste
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'plan_feature_overrides' AND column_name = 'number_value') THEN
    ALTER TABLE plan_feature_overrides ADD COLUMN number_value INTEGER NULL;
  END IF;

  -- Aggiungi string_value se non esiste
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'plan_feature_overrides' AND column_name = 'string_value') THEN
    ALTER TABLE plan_feature_overrides ADD COLUMN string_value TEXT NULL;
  END IF;
END $$;

-- Index per query veloci
CREATE INDEX IF NOT EXISTS idx_plan_feature_overrides_plan ON plan_feature_overrides(plan_type);
CREATE INDEX IF NOT EXISTS idx_plan_feature_overrides_feature ON plan_feature_overrides(plan_type, feature_name);
CREATE INDEX IF NOT EXISTS idx_plan_feature_overrides_expires ON plan_feature_overrides(expires_at) WHERE expires_at IS NOT NULL;

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_plan_feature_overrides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS plan_feature_overrides_updated_at ON plan_feature_overrides;
CREATE TRIGGER plan_feature_overrides_updated_at
  BEFORE UPDATE ON plan_feature_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_plan_feature_overrides_updated_at();

-- RLS Policies
ALTER TABLE plan_feature_overrides ENABLE ROW LEVEL SECURITY;

-- Rimuovi policy esistenti se presenti
DROP POLICY IF EXISTS "Super admin can manage plan overrides" ON plan_feature_overrides;
DROP POLICY IF EXISTS "Everyone can read plan overrides" ON plan_feature_overrides;

-- Solo super admin possono modificare
CREATE POLICY "Super admin can manage plan overrides"
  ON plan_feature_overrides
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_users
      WHERE organization_users.user_id = auth.uid()
      AND organization_users.role = 'super_admin'
    )
  );

-- Tutti possono leggere (necessario per check permissions)
CREATE POLICY "Everyone can read plan overrides"
  ON plan_feature_overrides
  FOR SELECT
  USING (true);

-- Commenti per documentazione
COMMENT ON TABLE plan_feature_overrides IS 'Override dinamici delle features per piano - supporta valori boolean, numerici e testuali';
COMMENT ON COLUMN plan_feature_overrides.plan_type IS 'Piano da modificare: free, basic, pro, enterprise';
COMMENT ON COLUMN plan_feature_overrides.feature_name IS 'Nome della feature da modificare (es: coupons, maxCustomers, tierLimit)';
COMMENT ON COLUMN plan_feature_overrides.value_type IS 'Tipo di valore: boolean (true/false), number (numerico), string (testo)';
COMMENT ON COLUMN plan_feature_overrides.boolean_value IS 'Valore boolean per features on/off (es: coupons = true)';
COMMENT ON COLUMN plan_feature_overrides.number_value IS 'Valore numerico per limiti (es: maxCustomers = 200)';
COMMENT ON COLUMN plan_feature_overrides.string_value IS 'Valore testuale per configurazioni (es: tier_level = "premium")';
COMMENT ON COLUMN plan_feature_overrides.expires_at IS 'Data di scadenza override (NULL = permanente). Utile per promozioni temporanee';
COMMENT ON COLUMN plan_feature_overrides.description IS 'Motivo dell override (es: Promo Black Friday 2025)';
