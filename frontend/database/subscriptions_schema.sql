-- ============================================================================
-- OMNILY PRO - SUBSCRIPTION SYSTEM COMPLETO
-- Schema per gestione abbonamenti reali con Stripe
-- ============================================================================

-- Tabella principale subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_subscription_id varchar(255) UNIQUE,
    stripe_customer_id varchar(255),
    plan_type varchar(50) NOT NULL, -- 'basic', 'premium', 'enterprise'
    status varchar(50) NOT NULL, -- 'active', 'past_due', 'canceled', 'unpaid'
    current_period_start timestamp NOT NULL,
    current_period_end timestamp NOT NULL,
    trial_start timestamp,
    trial_end timestamp,
    amount_monthly decimal(10,2) NOT NULL,
    currency varchar(3) DEFAULT 'EUR',
    billing_cycle varchar(20) DEFAULT 'monthly', -- 'monthly', 'yearly'
    quantity integer DEFAULT 1,
    discount_percent integer DEFAULT 0,
    metadata jsonb,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Tabella per i piani disponibili
CREATE TABLE IF NOT EXISTS subscription_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(100) NOT NULL,
    slug varchar(50) UNIQUE NOT NULL,
    stripe_price_id varchar(255) UNIQUE,
    stripe_product_id varchar(255),
    price_monthly decimal(10,2) NOT NULL,
    price_yearly decimal(10,2),
    currency varchar(3) DEFAULT 'EUR',
    max_users integer,
    max_organizations integer,
    max_transactions_monthly integer,
    features jsonb, -- Array di features incluse
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Tabella per tracking pagamenti
CREATE TABLE IF NOT EXISTS payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
    stripe_payment_intent_id varchar(255) UNIQUE,
    stripe_invoice_id varchar(255),
    amount decimal(10,2) NOT NULL,
    currency varchar(3) DEFAULT 'EUR',
    status varchar(50) NOT NULL, -- 'succeeded', 'pending', 'failed'
    payment_method varchar(50), -- 'card', 'sepa', 'bank_transfer'
    description text,
    metadata jsonb,
    paid_at timestamp,
    created_at timestamp DEFAULT now()
);

-- Tabella per fatture
CREATE TABLE IF NOT EXISTS invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
    stripe_invoice_id varchar(255) UNIQUE,
    invoice_number varchar(100),
    amount_due decimal(10,2) NOT NULL,
    amount_paid decimal(10,2) DEFAULT 0,
    currency varchar(3) DEFAULT 'EUR',
    status varchar(50) NOT NULL, -- 'draft', 'open', 'paid', 'void', 'uncollectible'
    due_date timestamp,
    paid_at timestamp,
    pdf_url text,
    hosted_invoice_url text,
    metadata jsonb,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Tabella per eventi webhook Stripe
CREATE TABLE IF NOT EXISTS stripe_webhooks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id varchar(255) UNIQUE,
    event_type varchar(100) NOT NULL,
    object_id varchar(255),
    object_type varchar(50),
    processed boolean DEFAULT false,
    data jsonb NOT NULL,
    created_at timestamp DEFAULT now(),
    processed_at timestamp
);

-- Tabella per usage tracking (metering)
CREATE TABLE IF NOT EXISTS subscription_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
    metric_name varchar(100) NOT NULL, -- 'api_calls', 'transactions', 'storage_gb'
    usage_count integer NOT NULL DEFAULT 0,
    reporting_period_start timestamp NOT NULL,
    reporting_period_end timestamp NOT NULL,
    stripe_usage_record_id varchar(255),
    metadata jsonb,
    created_at timestamp DEFAULT now()
);

-- Tabella per coupon e sconti
CREATE TABLE IF NOT EXISTS subscription_discounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
    stripe_coupon_id varchar(255),
    stripe_discount_id varchar(255),
    coupon_code varchar(100),
    discount_type varchar(20), -- 'percent', 'amount'
    discount_value decimal(10,2),
    start_date timestamp NOT NULL,
    end_date timestamp,
    is_active boolean DEFAULT true,
    created_at timestamp DEFAULT now()
);

-- Tabella per gestione hardware e setup fees
CREATE TABLE IF NOT EXISTS hardware_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
    order_type varchar(50) NOT NULL, -- 'initial_setup', 'additional_hardware', 'replacement'
    hardware_model varchar(100) DEFAULT 'Z108', -- 'Z108', 'Z108_PRO', 'CUSTOMER_DISPLAY'
    quantity integer DEFAULT 1,
    unit_price decimal(10,2) NOT NULL, -- Prezzo singola unità hardware
    setup_fee decimal(10,2) DEFAULT 299.00, -- Setup fee una tantum
    total_amount decimal(10,2) NOT NULL,
    currency varchar(3) DEFAULT 'EUR',
    status varchar(50) DEFAULT 'pending', -- 'pending', 'paid', 'shipped', 'delivered', 'cancelled'
    stripe_payment_intent_id varchar(255),
    tracking_number varchar(255),
    shipping_address jsonb,
    notes text,
    ordered_at timestamp DEFAULT now(),
    shipped_at timestamp,
    delivered_at timestamp,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Tabella per servizi premium e add-ons
CREATE TABLE IF NOT EXISTS subscription_addons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
    addon_type varchar(50) NOT NULL, -- 'ai_premium', 'extra_locations', 'white_label', 'custom_integration'
    addon_name varchar(100) NOT NULL,
    price_monthly decimal(10,2) NOT NULL,
    quantity integer DEFAULT 1,
    status varchar(20) DEFAULT 'active', -- 'active', 'suspended', 'cancelled'
    stripe_price_id varchar(255),
    features jsonb, -- Features specifiche dell'addon
    activation_date timestamp DEFAULT now(),
    cancellation_date timestamp,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Tabella per tracking utilizzo AI services
CREATE TABLE IF NOT EXISTS ai_usage_tracking (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    ai_service varchar(50) NOT NULL, -- 'customer_segmentation', 'content_generation', 'churn_prediction', 'voice_assistant'
    usage_count integer DEFAULT 0,
    tokens_used integer DEFAULT 0, -- Per servizi basati su token (OpenAI, Claude)
    cost_cents integer DEFAULT 0, -- Costo in centesimi
    reporting_period_start timestamp NOT NULL,
    reporting_period_end timestamp NOT NULL,
    metadata jsonb,
    created_at timestamp DEFAULT now()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_subscription ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_stripe_webhooks_processed ON stripe_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_usage_subscription_period ON subscription_usage(subscription_id, reporting_period_start);

-- RLS (Row Level Security)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_discounts ENABLE ROW LEVEL SECURITY;

-- Policy per admin (full access)
CREATE POLICY "Admin full access subscriptions" ON subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_users ou
            WHERE ou.user_id = auth.uid()
            AND ou.role = 'super_admin'
        )
    );

CREATE POLICY "Admin full access plans" ON subscription_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_users ou
            WHERE ou.user_id = auth.uid()
            AND ou.role = 'super_admin'
        )
    );

-- Policy per organizations (solo loro dati)
CREATE POLICY "Organization own subscriptions" ON subscriptions
    FOR ALL USING (
        organization_id IN (
            SELECT ou.org_id FROM organization_users ou
            WHERE ou.user_id = auth.uid()
        )
    );

-- Inserimento piani base OMNILY PRO - ECOSISTEMA COMPLETO CON AI
INSERT INTO subscription_plans (name, slug, price_monthly, price_yearly, max_users, max_organizations, max_transactions_monthly, features) VALUES
('Basic', 'basic', 49.00, 490.00, 3, 1, 2000, '["POS Z108 Terminal", "Digital Wallet", "NFC Loyalty Cards", "AI Customer Segmentation", "AI Sales Prediction", "Thermal Printing", "Coupon System", "Email Marketing", "SMS Birthday", "Chatbot FAQ", "Analytics Dashboard", "Excel Export", "Email Support"]'),
('Pro', 'pro', 99.00, 990.00, 15, 3, 10000, '["Everything in Basic", "Gift Cards System", "AI Revenue Optimization", "AI Churn Prediction", "AI Content Generation", "Advanced Chatbot", "AI Inventory Forecasting", "Product Subscriptions", "Live Chat", "Page Builder", "WhatsApp Integration", "Push Notifications", "Multi-location", "API Access", "Priority Support"]'),
('Enterprise', 'enterprise', 199.00, 1990.00, 0, 0, 0, '["Everything in Pro", "AI Custom Model Training", "AI Voice Assistant", "AI Competitor Analysis", "AI Dynamic Pricing", "AI Fraud Detection", "White Label Complete", "E-commerce Integration", "Unlimited Locations", "Custom Integrations", "Advanced Security", "GDPR Compliance", "Dedicated Account Manager", "SLA 99.9%"]'),
('AI Premium Add-on', 'ai-premium', 99.00, 990.00, 0, 0, 0, '["Custom AI Model Training", "AI Business Consultant", "AI Market Analysis", "AI Growth Strategy", "AI Risk Assessment", "Dedicated AI Support"]')
ON CONFLICT (slug) DO NOTHING;

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();