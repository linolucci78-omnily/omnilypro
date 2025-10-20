-- Verifica e crea la tabella customer_activities se non esiste
CREATE TABLE IF NOT EXISTS customer_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,

  -- Tipo attività
  activity_type varchar(50) NOT NULL,

  -- Dettagli attività
  activity_description text,

  -- Valori opzionali
  amount decimal(10,2),
  points integer,

  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Crea indici se non esistono
CREATE INDEX IF NOT EXISTS idx_activities_customer ON customer_activities(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_organization ON customer_activities(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON customer_activities(activity_type);

-- Abilita RLS
ALTER TABLE customer_activities ENABLE ROW LEVEL SECURITY;

-- Drop vecchie policy se esistono
DROP POLICY IF EXISTS "Admin full access activities" ON customer_activities;
DROP POLICY IF EXISTS "Organization users access activities" ON customer_activities;

-- Ricrea policy per admin
CREATE POLICY "Admin full access activities" ON customer_activities FOR ALL USING (
  auth.uid() IN (
    SELECT user_id FROM organization_users
    WHERE role = 'super_admin'
  )
);

-- Ricrea policy per utenti organizzazione
CREATE POLICY "Organization users access activities" ON customer_activities FOR ALL USING (
  organization_id IN (
    SELECT org_id FROM organization_users
    WHERE user_id = auth.uid()
    AND role IN ('org_admin', 'manager', 'cashier')
  )
);

-- Verifica struttura
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'customer_activities'
ORDER BY ordinal_position;
2