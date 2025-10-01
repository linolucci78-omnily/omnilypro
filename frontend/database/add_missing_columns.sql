-- ============================================================================
-- OMNILY PRO - AGGIUNGI COLONNE MANCANTI
-- Fix per colonne mancanti nelle tabelle esistenti
-- ============================================================================

-- Aggiungi colonna status alla tabella customers se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'customers' AND column_name = 'status') THEN
        ALTER TABLE customers ADD COLUMN status varchar(20) DEFAULT 'active';
    END IF;
END $$;

-- Aggiungi colonna tier alla tabella customers se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'customers' AND column_name = 'tier') THEN
        ALTER TABLE customers ADD COLUMN tier varchar(50) DEFAULT 'Bronze';
    END IF;
END $$;

-- Aggiungi colonna engagement_score alla tabella customers se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'customers' AND column_name = 'engagement_score') THEN
        ALTER TABLE customers ADD COLUMN engagement_score decimal(5,2) DEFAULT 0.00;
    END IF;
END $$;

-- Aggiungi colonna predicted_churn_risk alla tabella customers se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'customers' AND column_name = 'predicted_churn_risk') THEN
        ALTER TABLE customers ADD COLUMN predicted_churn_risk decimal(5,2) DEFAULT 0.00;
    END IF;
END $$;

-- Aggiungi colonna total_spent alla tabella customers se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'customers' AND column_name = 'total_spent') THEN
        ALTER TABLE customers ADD COLUMN total_spent decimal(12,2) DEFAULT 0.00;
    END IF;
END $$;

-- Aggiungi colonna lifetime_value alla tabella customers se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'customers' AND column_name = 'lifetime_value') THEN
        ALTER TABLE customers ADD COLUMN lifetime_value decimal(12,2) DEFAULT 0.00;
    END IF;
END $$;

-- Aggiungi colonna organization_id alla tabella customers se non esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'customers' AND column_name = 'organization_id') THEN
        ALTER TABLE customers ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Crea la tabella customer_segments se non esiste
CREATE TABLE IF NOT EXISTS customer_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  description text,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  criteria jsonb NOT NULL,
  customer_count integer DEFAULT 0,
  avg_clv decimal(10,2) DEFAULT 0.00,
  avg_engagement decimal(5,2) DEFAULT 0.00,
  is_active boolean DEFAULT true,
  is_dynamic boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  last_calculated timestamp,
  CONSTRAINT segments_name_org_unique UNIQUE (name, organization_id)
);

-- Crea la tabella marketing_campaigns se non esiste
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(200) NOT NULL,
  description text,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  type varchar(50) NOT NULL,
  status varchar(20) DEFAULT 'draft',
  target_segments uuid[],
  target_criteria jsonb,
  subject varchar(200),
  content text,
  template_id uuid,
  scheduled_at timestamp,
  started_at timestamp,
  completed_at timestamp,
  budget decimal(10,2) DEFAULT 0.00,
  cost_per_send decimal(6,4) DEFAULT 0.00,
  total_cost decimal(10,2) DEFAULT 0.00,
  sent_count integer DEFAULT 0,
  delivered_count integer DEFAULT 0,
  opened_count integer DEFAULT 0,
  clicked_count integer DEFAULT 0,
  converted_count integer DEFAULT 0,
  unsubscribed_count integer DEFAULT 0,
  bounced_count integer DEFAULT 0,
  revenue_generated decimal(12,2) DEFAULT 0.00,
  orders_generated integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Crea indici per performance
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_tier ON customers(tier);
CREATE INDEX IF NOT EXISTS idx_customers_organization ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_engagement ON customers(engagement_score DESC);

-- Inserisci alcuni dati di test se non esistono
INSERT INTO customers (first_name, last_name, email, organization_id, total_spent, tier, status, engagement_score)
SELECT
  'Mario', 'Rossi', 'mario.rossi@test.com', id, 1500.00, 'Gold', 'vip', 85.5
FROM organizations
LIMIT 1
ON CONFLICT (email) DO NOTHING;

INSERT INTO customers (first_name, last_name, email, organization_id, total_spent, tier, status, engagement_score)
SELECT
  'Anna', 'Verdi', 'anna.verdi@test.com', id, 850.00, 'Silver', 'active', 72.3
FROM organizations
LIMIT 1
ON CONFLICT (email) DO NOTHING;

INSERT INTO customers (first_name, last_name, email, organization_id, total_spent, tier, status, engagement_score)
SELECT
  'Luca', 'Bianchi', 'luca.bianchi@test.com', id, 300.00, 'Bronze', 'active', 45.8
FROM organizations
LIMIT 1
ON CONFLICT (email) DO NOTHING;

-- Inserisci segmenti di test
INSERT INTO customer_segments (name, description, organization_id, criteria, customer_count)
SELECT
  'Clienti VIP', 'Clienti con alto valore', id, '{"total_spent": {"min": 1000}}', 0
FROM organizations
LIMIT 1
ON CONFLICT (name, organization_id) DO NOTHING;

-- Inserisci campagne di test
INSERT INTO marketing_campaigns (name, description, organization_id, type, status, sent_count, opened_count, clicked_count)
SELECT
  'Campagna Estate 2024', 'Promozione estiva', id, 'email', 'completed', 1250, 487, 123
FROM organizations
LIMIT 1;

-- ============================================================================
-- FINE FIX COLONNE
-- ============================================================================