-- ============================================================================
-- OMNILY PRO - FIX TABELLA CUSTOMERS PER CRM
-- Aggiunge colonne necessarie per il CRM alla tabella existente
-- ============================================================================

-- Aggiungi colonne CRM mancanti alla tabella customers
DO $$
BEGIN
    -- Aggiungi status (mapperemo is_active -> status nel service)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'customers' AND column_name = 'status') THEN
        ALTER TABLE customers ADD COLUMN status varchar(20) DEFAULT 'active';
        -- Popola status basato su is_active
        UPDATE customers SET status = CASE
            WHEN is_active = true THEN 'active'
            ELSE 'inactive'
        END;
    END IF;

    -- Aggiungi engagement_score
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'customers' AND column_name = 'engagement_score') THEN
        ALTER TABLE customers ADD COLUMN engagement_score decimal(5,2) DEFAULT 0.00;
    END IF;

    -- Aggiungi predicted_churn_risk
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'customers' AND column_name = 'predicted_churn_risk') THEN
        ALTER TABLE customers ADD COLUMN predicted_churn_risk decimal(5,2) DEFAULT 0.00;
    END IF;

    -- Aggiungi lifetime_value
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'customers' AND column_name = 'lifetime_value') THEN
        ALTER TABLE customers ADD COLUMN lifetime_value decimal(12,2) DEFAULT 0.00;
    END IF;

    -- Aggiungi first_name e last_name (split da name)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'customers' AND column_name = 'first_name') THEN
        ALTER TABLE customers ADD COLUMN first_name varchar(100);
        ALTER TABLE customers ADD COLUMN last_name varchar(100);

        -- Popola first_name e last_name dal campo name esistente
        UPDATE customers SET
            first_name = CASE
                WHEN position(' ' in name) > 0 THEN trim(substring(name from 1 for position(' ' in name) - 1))
                ELSE name
            END,
            last_name = CASE
                WHEN position(' ' in name) > 0 THEN trim(substring(name from position(' ' in name) + 1))
                ELSE ''
            END;
    END IF;

    -- Aggiungi total_orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'customers' AND column_name = 'total_orders') THEN
        ALTER TABLE customers ADD COLUMN total_orders integer DEFAULT 0;
    END IF;

    -- Aggiungi avg_order_value
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'customers' AND column_name = 'avg_order_value') THEN
        ALTER TABLE customers ADD COLUMN avg_order_value decimal(10,2) DEFAULT 0.00;
    END IF;

    -- Aggiungi last_activity
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'customers' AND column_name = 'last_activity') THEN
        ALTER TABLE customers ADD COLUMN last_activity timestamp;
        -- Popola con last_visit se esiste
        UPDATE customers SET last_activity = last_visit WHERE last_visit IS NOT NULL;
    END IF;

    -- Aggiungi last_purchase_date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'customers' AND column_name = 'last_purchase_date') THEN
        ALTER TABLE customers ADD COLUMN last_purchase_date timestamp;
    END IF;

END $$;

-- Crea le altre tabelle CRM necessarie
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

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(200) NOT NULL,
  description text,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  type varchar(50) NOT NULL DEFAULT 'email',
  status varchar(20) DEFAULT 'draft',
  target_segments uuid[],
  target_criteria jsonb,
  subject varchar(200),
  content text,
  scheduled_at timestamp,
  started_at timestamp,
  completed_at timestamp,
  sent_count integer DEFAULT 0,
  delivered_count integer DEFAULT 0,
  opened_count integer DEFAULT 0,
  clicked_count integer DEFAULT 0,
  converted_count integer DEFAULT 0,
  revenue_generated decimal(12,2) DEFAULT 0.00,
  orders_generated integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS customer_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  activity_type varchar(50) NOT NULL,
  activity_title varchar(200),
  activity_description text,
  activity_data jsonb,
  monetary_value decimal(10,2) DEFAULT 0.00,
  points_earned integer DEFAULT 0,
  points_spent integer DEFAULT 0,
  created_at timestamp DEFAULT now()
);

-- Crea indici per performance
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_engagement ON customers(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_customers_churn_risk ON customers(predicted_churn_risk DESC);
CREATE INDEX IF NOT EXISTS idx_customers_last_activity ON customers(last_activity DESC);

CREATE INDEX IF NOT EXISTS idx_segments_organization ON customer_segments(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_organization ON marketing_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_customer ON customer_activities(customer_id, created_at DESC);

-- Popola alcuni dati di esempio se la tabella è vuota
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM customers) = 0 THEN
        INSERT INTO customers (organization_id, name, first_name, last_name, email, total_spent, tier, status, engagement_score, lifetime_value)
        SELECT
            id, 'Mario Rossi', 'Mario', 'Rossi', 'mario.rossi@test.com', 1500.00, 'Gold', 'active', 85.5, 1200.00
        FROM organizations
        LIMIT 1;

        INSERT INTO customers (organization_id, name, first_name, last_name, email, total_spent, tier, status, engagement_score, lifetime_value)
        SELECT
            id, 'Anna Verdi', 'Anna', 'Verdi', 'anna.verdi@test.com', 850.00, 'Silver', 'active', 72.3, 750.00
        FROM organizations
        LIMIT 1;

        INSERT INTO customers (organization_id, name, first_name, last_name, email, total_spent, tier, status, engagement_score, lifetime_value)
        SELECT
            id, 'Luca Bianchi', 'Luca', 'Bianchi', 'luca.bianchi@test.com', 300.00, 'Bronze', 'active', 45.8, 280.00
        FROM organizations
        LIMIT 1;
    END IF;
END $$;

-- Aggiorna engagement_score e lifetime_value per i clienti esistenti
UPDATE customers SET
    engagement_score = CASE
        WHEN total_spent > 1000 THEN 85.0 + (RANDOM() * 10)
        WHEN total_spent > 500 THEN 60.0 + (RANDOM() * 20)
        ELSE 30.0 + (RANDOM() * 30)
    END,
    lifetime_value = total_spent * (0.8 + (RANDOM() * 0.4)),
    status = CASE
        WHEN is_active = true AND total_spent > 1000 THEN 'vip'
        WHEN is_active = true THEN 'active'
        ELSE 'inactive'
    END
WHERE engagement_score = 0 OR lifetime_value = 0;

-- Inserisci segmenti di test
INSERT INTO customer_segments (name, description, organization_id, criteria, customer_count)
SELECT
  'Clienti VIP', 'Clienti con alto valore e spesa superiore a 1000€', id, '{"total_spent": {"min": 1000}}', 0
FROM organizations
LIMIT 1
ON CONFLICT (name, organization_id) DO NOTHING;

INSERT INTO customer_segments (name, description, organization_id, criteria, customer_count)
SELECT
  'Clienti Attivi', 'Clienti con engagement alto (>70%)', id, '{"engagement_score": {"min": 70}}', 0
FROM organizations
LIMIT 1
ON CONFLICT (name, organization_id) DO NOTHING;

INSERT INTO customer_segments (name, description, organization_id, criteria, customer_count)
SELECT
  'A Rischio Abbandono', 'Clienti con basso engagement (<40%)', id, '{"engagement_score": {"max": 40}}', 0
FROM organizations
LIMIT 1
ON CONFLICT (name, organization_id) DO NOTHING;

-- Inserisci campagne di test
INSERT INTO marketing_campaigns (name, description, organization_id, type, status, sent_count, opened_count, clicked_count, revenue_generated)
SELECT
  'Campagna Estate 2024', 'Promozione estiva per tutti i clienti registrati', id, 'email', 'completed', 1250, 487, 123, 15000.00
FROM organizations
LIMIT 1;

INSERT INTO marketing_campaigns (name, description, organization_id, type, status, sent_count, opened_count, clicked_count, revenue_generated)
SELECT
  'Black Friday 2024', 'Offerte speciali Black Friday per clienti VIP', id, 'email', 'running', 890, 312, 89, 8500.00
FROM organizations
LIMIT 1;

-- ============================================================================
-- FINE FIX TABELLA CUSTOMERS
-- ============================================================================