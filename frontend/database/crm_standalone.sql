-- ============================================================================
-- OMNILY PRO - CRM SCHEMA STANDALONE
-- Customer Relationship Management (versione senza dipendenze)
-- ============================================================================

-- ============================================================================
-- 1. TABELLA CLIENTI B2C (Clienti finali dei negozi)
-- ============================================================================
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificazione
  first_name varchar(100) NOT NULL,
  last_name varchar(100) NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  phone varchar(50),
  date_of_birth date,
  gender varchar(10), -- 'M', 'F', 'Other'

  -- Indirizzo
  address_line1 text,
  address_line2 text,
  city varchar(100),
  state varchar(100),
  postal_code varchar(20),
  country varchar(2) DEFAULT 'IT', -- ISO country code

  -- Organizzazione di appartenenza (senza foreign key per ora)
  organization_id uuid,

  -- Dati comportamentali
  total_spent decimal(12,2) DEFAULT 0.00,
  total_orders integer DEFAULT 0,
  avg_order_value decimal(10,2) DEFAULT 0.00,
  lifetime_value decimal(12,2) DEFAULT 0.00,
  loyalty_points integer DEFAULT 0,

  -- Tier e Status
  tier varchar(50) DEFAULT 'Bronze', -- Bronze, Silver, Gold, Platinum
  status varchar(20) DEFAULT 'active', -- active, inactive, churned, vip

  -- Analytics predittive
  engagement_score decimal(5,2) DEFAULT 0.00, -- 0-100
  predicted_churn_risk decimal(5,2) DEFAULT 0.00, -- 0-100 (probabilità churn)
  customer_lifetime_months integer DEFAULT 0,

  -- Marketing
  acquisition_channel varchar(100), -- 'Social Media', 'Google Ads', 'Referral', etc.
  marketing_consent boolean DEFAULT false,
  email_consent boolean DEFAULT false,
  sms_consent boolean DEFAULT false,

  -- Preferenze
  preferred_language varchar(10) DEFAULT 'it',
  preferred_communication varchar(20) DEFAULT 'email', -- email, sms, phone

  -- Dates tracking
  last_activity timestamp,
  last_purchase_date timestamp,
  last_email_opened timestamp,
  last_login timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- ============================================================================
-- 2. TABELLA SEGMENTI CLIENTI
-- ============================================================================
CREATE TABLE IF NOT EXISTS customer_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificazione
  name varchar(100) NOT NULL,
  description text,
  organization_id uuid,

  -- Criteri segmentazione (JSON per flessibilità)
  criteria jsonb NOT NULL,
  -- Esempio: {"total_spent": {"min": 1000}, "tier": ["Gold", "Platinum"], "last_activity": {"days": 30}}

  -- Statistiche
  customer_count integer DEFAULT 0,
  avg_clv decimal(10,2) DEFAULT 0.00,
  avg_engagement decimal(5,2) DEFAULT 0.00,

  -- Status
  is_active boolean DEFAULT true,
  is_dynamic boolean DEFAULT true, -- Se true, si aggiorna automaticamente

  -- Dates
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  last_calculated timestamp
);

-- ============================================================================
-- 3. TABELLA ASSOCIAZIONE CLIENTI-SEGMENTI
-- ============================================================================
CREATE TABLE IF NOT EXISTS customer_segment_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  segment_id uuid REFERENCES customer_segments(id) ON DELETE CASCADE,

  -- Tracking
  added_at timestamp DEFAULT now(),
  removed_at timestamp,
  is_active boolean DEFAULT true,

  -- Indici
  CONSTRAINT customer_segment_unique UNIQUE (customer_id, segment_id)
);

-- ============================================================================
-- 4. TABELLA CAMPAGNE MARKETING
-- ============================================================================
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificazione
  name varchar(200) NOT NULL,
  description text,
  organization_id uuid,

  -- Configurazione campagna
  type varchar(50) NOT NULL, -- 'email', 'sms', 'push', 'direct_mail'
  status varchar(20) DEFAULT 'draft', -- draft, scheduled, running, completed, paused, cancelled

  -- Targeting
  target_segments uuid[], -- Array di segment IDs
  target_criteria jsonb, -- Criteri aggiuntivi

  -- Contenuto
  subject varchar(200),
  content text,
  template_id uuid, -- Riferimento a template (se esiste)

  -- Scheduling
  scheduled_at timestamp,
  started_at timestamp,
  completed_at timestamp,

  -- Budget e costi
  budget decimal(10,2) DEFAULT 0.00,
  cost_per_send decimal(6,4) DEFAULT 0.00,
  total_cost decimal(10,2) DEFAULT 0.00,

  -- Metriche performance
  sent_count integer DEFAULT 0,
  delivered_count integer DEFAULT 0,
  opened_count integer DEFAULT 0,
  clicked_count integer DEFAULT 0,
  converted_count integer DEFAULT 0,
  unsubscribed_count integer DEFAULT 0,
  bounced_count integer DEFAULT 0,

  -- Revenue tracking
  revenue_generated decimal(12,2) DEFAULT 0.00,
  orders_generated integer DEFAULT 0,

  -- Dates
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  created_by uuid
);

-- ============================================================================
-- 5. TABELLA INVII CAMPAGNE (Tracking individuale)
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaign_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  campaign_id uuid REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,

  -- Status invio
  status varchar(20) DEFAULT 'pending', -- pending, sent, delivered, failed, bounced

  -- Tracking comportamento
  sent_at timestamp,
  delivered_at timestamp,
  opened_at timestamp,
  clicked_at timestamp,
  converted_at timestamp,
  unsubscribed_at timestamp,

  -- Dati specifici
  email_address varchar(255),
  phone_number varchar(50),
  error_message text,

  -- Revenue da questo invio
  revenue_attributed decimal(10,2) DEFAULT 0.00,
  order_id uuid, -- Se convertito, ID ordine

  created_at timestamp DEFAULT now()
);

-- ============================================================================
-- 6. TABELLA ATTIVITÀ CLIENTI (Customer Journey)
-- ============================================================================
CREATE TABLE IF NOT EXISTS customer_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  organization_id uuid,

  -- Tipo attività
  activity_type varchar(50) NOT NULL,
  -- 'purchase', 'login', 'email_open', 'email_click', 'page_view', 'cart_abandon', 'loyalty_redeem'

  -- Dettagli attività
  activity_title varchar(200),
  activity_description text,
  activity_data jsonb, -- Dati specifici (es. prodotti acquistati, email aperta, etc.)

  -- Valori
  monetary_value decimal(10,2) DEFAULT 0.00,
  points_earned integer DEFAULT 0,
  points_spent integer DEFAULT 0,

  -- Context
  session_id varchar(100),
  user_agent text,
  ip_address inet,
  referrer_url text,

  -- Geolocation
  latitude decimal(10,8),
  longitude decimal(11,8),

  created_at timestamp DEFAULT now()
);

-- ============================================================================
-- 7. TABELLA TAGS CLIENTI
-- ============================================================================
CREATE TABLE IF NOT EXISTS customer_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  organization_id uuid,

  tag_name varchar(100) NOT NULL,
  tag_color varchar(7) DEFAULT '#3b82f6', -- Hex color

  -- Auto-generated o manuale
  is_automatic boolean DEFAULT false,
  created_by uuid,

  created_at timestamp DEFAULT now(),

  CONSTRAINT customer_tag_unique UNIQUE (customer_id, tag_name)
);

-- ============================================================================
-- 8. TABELLA NOTE CLIENTI
-- ============================================================================
CREATE TABLE IF NOT EXISTS customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  organization_id uuid,

  note_content text NOT NULL,
  note_type varchar(50) DEFAULT 'general', -- general, complaint, compliment, follow_up
  is_important boolean DEFAULT false,

  created_by uuid,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- ============================================================================
-- INDICI PER PERFORMANCE
-- ============================================================================

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_organization ON customers(organization_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_tier ON customers(tier);
CREATE INDEX IF NOT EXISTS idx_customers_total_spent ON customers(total_spent DESC);
CREATE INDEX IF NOT EXISTS idx_customers_last_activity ON customers(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_customers_engagement ON customers(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_customers_churn_risk ON customers(predicted_churn_risk DESC);

-- Segments
CREATE INDEX IF NOT EXISTS idx_segments_organization ON customer_segments(organization_id);
CREATE INDEX IF NOT EXISTS idx_segments_active ON customer_segments(is_active);

-- Campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_organization ON marketing_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON marketing_campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled ON marketing_campaigns(scheduled_at);

-- Activities
CREATE INDEX IF NOT EXISTS idx_activities_customer ON customer_activities(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_organization ON customer_activities(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON customer_activities(activity_type);

-- Campaign Sends
CREATE INDEX IF NOT EXISTS idx_campaign_sends_campaign ON campaign_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_customer ON campaign_sends(customer_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_status ON campaign_sends(status);

-- ============================================================================
-- TRIGGER PER AUTO-UPDATE TIMESTAMPS
-- ============================================================================

-- Funzione per auto-update di updated_at (se non esiste già)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per customers
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger per segments
CREATE TRIGGER update_segments_updated_at BEFORE UPDATE ON customer_segments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger per campaigns
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON marketing_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger per notes
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON customer_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DATI DI ESEMPIO
-- ============================================================================

-- Inserisci alcuni clienti di test
INSERT INTO customers (first_name, last_name, email, organization_id, total_spent, tier, status, engagement_score) VALUES
('Mario', 'Rossi', 'mario.rossi@email.com', gen_random_uuid(), 1500.00, 'Gold', 'vip', 85.5),
('Anna', 'Verdi', 'anna.verdi@email.com', gen_random_uuid(), 850.00, 'Silver', 'active', 72.3),
('Luca', 'Bianchi', 'luca.bianchi@email.com', gen_random_uuid(), 300.00, 'Bronze', 'active', 45.8),
('Giulia', 'Neri', 'giulia.neri@email.com', gen_random_uuid(), 2100.00, 'Platinum', 'vip', 92.1),
('Francesco', 'Romano', 'francesco.romano@email.com', gen_random_uuid(), 120.00, 'Bronze', 'inactive', 23.4)
ON CONFLICT (email) DO NOTHING;

-- Inserisci alcuni segmenti di test
INSERT INTO customer_segments (name, description, criteria, customer_count) VALUES
('Clienti VIP', 'Clienti con alto valore', '{"total_spent": {"min": 1000}}', 0),
('Clienti Attivi', 'Clienti con engagement alto', '{"engagement_score": {"min": 70}}', 0),
('A Rischio', 'Clienti con basso engagement', '{"engagement_score": {"max": 30}}', 0)
ON CONFLICT DO NOTHING;

-- Inserisci alcune campagne di test
INSERT INTO marketing_campaigns (name, description, type, status, sent_count, opened_count, clicked_count) VALUES
('Campagna Estate 2024', 'Promozione estiva per tutti i clienti', 'email', 'completed', 1250, 487, 123),
('Black Friday 2024', 'Offerte speciali Black Friday', 'email', 'running', 890, 312, 89),
('Welcome Series', 'Serie di benvenuto per nuovi clienti', 'email', 'running', 156, 98, 34)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FINE SCHEMA CRM STANDALONE
-- ============================================================================