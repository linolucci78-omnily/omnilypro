-- ============================================================================
-- OMNILY PRO - ADMIN CONTROL SCHEMA COMPLETO
-- Versione: 1.0
-- Data: 1 Ottobre 2025
-- Descrizione: Schema completo per controllo totale admin SaaS
-- ============================================================================

-- ============================================================================
-- 1. AUDIT & LOGGING SYSTEM
-- ============================================================================

-- Audit log per tutte le azioni admin
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action varchar(100) NOT NULL, -- 'org_created', 'user_blocked', 'billing_refund'
    target_type varchar(50), -- 'organization', 'user', 'subscription', 'system'
    target_id uuid, -- ID dell'oggetto target
    old_values jsonb, -- Valori prima della modifica
    new_values jsonb, -- Valori dopo la modifica
    details jsonb, -- Dettagli azione specifica
    ip_address inet,
    user_agent text,
    session_id varchar(255),
    created_at timestamp DEFAULT now()
);

-- Security events e alerts
CREATE TABLE IF NOT EXISTS security_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type varchar(50) NOT NULL, -- 'failed_login', 'suspicious_activity', 'api_abuse'
    severity varchar(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
    ip_address inet,
    user_agent text,
    details jsonb,
    resolved_at timestamp,
    resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution_notes text,
    created_at timestamp DEFAULT now()
);

-- ============================================================================
-- 2. SYSTEM METRICS & MONITORING
-- ============================================================================

-- System metrics in tempo reale
CREATE TABLE IF NOT EXISTS system_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type varchar(50) NOT NULL, -- 'api_calls', 'revenue', 'active_users', 'db_performance'
    metric_name varchar(100) NOT NULL, -- Nome specifico metrica
    metric_value numeric,
    metric_unit varchar(20), -- 'count', 'seconds', 'bytes', 'percentage'
    metric_data jsonb, -- Dati aggiuntivi metrica
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE, -- NULL per system-wide
    recorded_at timestamp DEFAULT now()
);

-- Performance monitoring
CREATE TABLE IF NOT EXISTS performance_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint varchar(200), -- API endpoint o page
    method varchar(10), -- GET, POST, etc.
    response_time_ms integer,
    status_code integer,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
    error_message text,
    created_at timestamp DEFAULT now()
);

-- ============================================================================
-- 3. FEATURE FLAGS & CONFIGURATION
-- ============================================================================

-- Feature flags globali
CREATE TABLE IF NOT EXISTS feature_flags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_name varchar(100) UNIQUE NOT NULL,
    is_enabled boolean DEFAULT false,
    description text,
    target_percentage integer DEFAULT 100, -- Rollout percentage
    target_plans text[], -- Piani che hanno accesso
    target_organizations uuid[], -- Organizzazioni specifiche
    conditions jsonb, -- Condizioni per attivazione
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Global system settings
CREATE TABLE IF NOT EXISTS system_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key varchar(100) UNIQUE NOT NULL,
    setting_value text,
    setting_type varchar(20), -- 'string', 'number', 'boolean', 'json'
    description text,
    is_public boolean DEFAULT false, -- Se visibile agli utenti
    updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at timestamp DEFAULT now()
);

-- ============================================================================
-- 4. NOTIFICATION & COMMUNICATION SYSTEM
-- ============================================================================

-- System notifications globali
CREATE TABLE IF NOT EXISTS system_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title varchar(200) NOT NULL,
    message text NOT NULL,
    type varchar(50) NOT NULL, -- 'maintenance', 'update', 'security', 'marketing'
    priority varchar(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    target_audience varchar(50) NOT NULL, -- 'all', 'admins', 'specific_plan', 'specific_orgs'
    target_criteria jsonb, -- Criteri per targeting
    scheduled_for timestamp,
    sent_at timestamp,
    delivery_stats jsonb, -- Statistics di consegna
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp DEFAULT now()
);

-- Email templates per admin
CREATE TABLE IF NOT EXISTS email_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name varchar(100) UNIQUE NOT NULL,
    subject varchar(255) NOT NULL,
    html_content text NOT NULL,
    text_content text,
    variables jsonb, -- Variabili disponibili nel template
    category varchar(50), -- 'billing', 'security', 'onboarding', 'marketing'
    is_active boolean DEFAULT true,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- ============================================================================
-- 5. BILLING & REVENUE TRACKING
-- ============================================================================

-- Revenue events dettagliati
CREATE TABLE IF NOT EXISTS revenue_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    event_type varchar(50) NOT NULL, -- 'subscription', 'upgrade', 'downgrade', 'refund', 'chargeback'
    amount_cents integer NOT NULL,
    currency varchar(3) DEFAULT 'EUR',
    stripe_event_id varchar(255) UNIQUE,
    stripe_customer_id varchar(255),
    stripe_subscription_id varchar(255),
    plan_old varchar(50), -- Piano precedente per upgrades/downgrades
    plan_new varchar(50), -- Piano nuovo
    details jsonb,
    processed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Se processato manualmente
    recorded_at timestamp DEFAULT now()
);

-- Failed payments tracking
CREATE TABLE IF NOT EXISTS failed_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_invoice_id varchar(255),
    stripe_payment_intent_id varchar(255),
    amount_cents integer NOT NULL,
    currency varchar(3) DEFAULT 'EUR',
    failure_reason varchar(100),
    attempt_count integer DEFAULT 1,
    next_retry_at timestamp,
    resolved_at timestamp,
    resolution_type varchar(50), -- 'payment_succeeded', 'manually_resolved', 'subscription_cancelled'
    notes text,
    created_at timestamp DEFAULT now()
);

-- Subscription analytics
CREATE TABLE IF NOT EXISTS subscription_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    metric_date date NOT NULL,
    plan_type varchar(50) NOT NULL,
    mrr_cents integer, -- Monthly Recurring Revenue
    customers_count integer,
    churn_rate decimal(5,4), -- Percentage as decimal
    ltv_cents integer, -- Customer Lifetime Value
    recorded_at timestamp DEFAULT now(),

    UNIQUE(organization_id, metric_date, plan_type)
);

-- ============================================================================
-- 6. GDPR & COMPLIANCE
-- ============================================================================

-- GDPR requests tracking
CREATE TABLE IF NOT EXISTS gdpr_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_type varchar(50) NOT NULL, -- 'export', 'delete', 'rectify', 'portability'
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id uuid, -- Customer specifico se applicabile
    requester_email varchar(255) NOT NULL,
    status varchar(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'
    request_details jsonb,
    data_exported jsonb, -- Dati esportati per request di export
    processed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    completion_notes text,
    completed_at timestamp,
    expires_at timestamp, -- Limite tempo per completare
    created_at timestamp DEFAULT now()
);

-- Data retention policies
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name varchar(100) NOT NULL,
    retention_days integer NOT NULL,
    deletion_criteria jsonb,
    last_cleanup_at timestamp,
    is_active boolean DEFAULT true,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp DEFAULT now()
);

-- ============================================================================
-- 7. SUPPORT & TICKETING
-- ============================================================================

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number varchar(20) UNIQUE NOT NULL, -- AUTO-GENERATED
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id uuid, -- Cliente specifico se applicabile
    subject varchar(255) NOT NULL,
    description text NOT NULL,
    category varchar(50), -- 'technical', 'billing', 'general', 'feature_request'
    priority varchar(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    status varchar(50) DEFAULT 'open', -- 'open', 'in_progress', 'waiting_customer', 'resolved', 'closed'
    assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution text,
    created_by_email varchar(255),
    created_by_name varchar(255),
    resolved_at timestamp,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Support ticket messages/responses
CREATE TABLE IF NOT EXISTS support_ticket_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id uuid REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_type varchar(20) NOT NULL, -- 'customer', 'admin'
    sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    sender_email varchar(255),
    sender_name varchar(255),
    message text NOT NULL,
    attachments jsonb, -- Array di file URLs
    is_internal boolean DEFAULT false, -- Note interne admin
    created_at timestamp DEFAULT now()
);

-- ============================================================================
-- INDICI PER PERFORMANCE
-- ============================================================================

-- Audit log indices
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_user ON admin_audit_log(admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON admin_audit_log(target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON admin_audit_log(action, created_at DESC);

-- Security events indices
CREATE INDEX IF NOT EXISTS idx_security_events_type_severity ON security_events(event_type, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_org ON security_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_unresolved ON security_events(created_at DESC) WHERE resolved_at IS NULL;

-- Metrics indices
CREATE INDEX IF NOT EXISTS idx_system_metrics_type_time ON system_metrics(metric_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_metrics_org_time ON system_metrics(organization_id, recorded_at DESC) WHERE organization_id IS NOT NULL;

-- Performance logs indices
CREATE INDEX IF NOT EXISTS idx_performance_logs_endpoint ON performance_logs(endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_logs_slow ON performance_logs(response_time_ms DESC, created_at DESC) WHERE response_time_ms > 1000;

-- Revenue indices
CREATE INDEX IF NOT EXISTS idx_revenue_events_org_time ON revenue_events(organization_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_events_type ON revenue_events(event_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_failed_payments_org ON failed_payments(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_failed_payments_unresolved ON failed_payments(next_retry_at) WHERE resolved_at IS NULL;

-- Support indices
CREATE INDEX IF NOT EXISTS idx_support_tickets_org ON support_tickets(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON support_tickets(assigned_to, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all admin tables
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Super admin policy - accesso completo a tutto
CREATE POLICY "Super admin full access audit_log" ON admin_audit_log FOR ALL USING (
    auth.uid() IN (
        SELECT user_id FROM organization_users
        WHERE role = 'super_admin'
    )
);

CREATE POLICY "Super admin full access security_events" ON security_events FOR ALL USING (
    auth.uid() IN (
        SELECT user_id FROM organization_users
        WHERE role = 'super_admin'
    )
);

CREATE POLICY "Super admin full access metrics" ON system_metrics FOR ALL USING (
    auth.uid() IN (
        SELECT user_id FROM organization_users
        WHERE role = 'super_admin'
    )
);

CREATE POLICY "Super admin full access performance" ON performance_logs FOR ALL USING (
    auth.uid() IN (
        SELECT user_id FROM organization_users
        WHERE role = 'super_admin'
    )
);

CREATE POLICY "Super admin full access feature_flags" ON feature_flags FOR ALL USING (
    auth.uid() IN (
        SELECT user_id FROM organization_users
        WHERE role = 'super_admin'
    )
);

CREATE POLICY "Super admin full access settings" ON system_settings FOR ALL USING (
    auth.uid() IN (
        SELECT user_id FROM organization_users
        WHERE role = 'super_admin'
    )
);

CREATE POLICY "Super admin full access notifications" ON system_notifications FOR ALL USING (
    auth.uid() IN (
        SELECT user_id FROM organization_users
        WHERE role = 'super_admin'
    )
);

CREATE POLICY "Super admin full access templates" ON email_templates FOR ALL USING (
    auth.uid() IN (
        SELECT user_id FROM organization_users
        WHERE role = 'super_admin'
    )
);

CREATE POLICY "Super admin full access revenue" ON revenue_events FOR ALL USING (
    auth.uid() IN (
        SELECT user_id FROM organization_users
        WHERE role = 'super_admin'
    )
);

CREATE POLICY "Super admin full access failed_payments" ON failed_payments FOR ALL USING (
    auth.uid() IN (
        SELECT user_id FROM organization_users
        WHERE role = 'super_admin'
    )
);

CREATE POLICY "Super admin full access analytics" ON subscription_analytics FOR ALL USING (
    auth.uid() IN (
        SELECT user_id FROM organization_users
        WHERE role = 'super_admin'
    )
);

CREATE POLICY "Super admin full access gdpr" ON gdpr_requests FOR ALL USING (
    auth.uid() IN (
        SELECT user_id FROM organization_users
        WHERE role = 'super_admin'
    )
);

CREATE POLICY "Super admin full access retention" ON data_retention_policies FOR ALL USING (
    auth.uid() IN (
        SELECT user_id FROM organization_users
        WHERE role = 'super_admin'
    )
);

CREATE POLICY "Super admin full access tickets" ON support_tickets FOR ALL USING (
    auth.uid() IN (
        SELECT user_id FROM organization_users
        WHERE role = 'super_admin'
    )
);

CREATE POLICY "Super admin full access ticket_messages" ON support_ticket_messages FOR ALL USING (
    auth.uid() IN (
        SELECT user_id FROM organization_users
        WHERE role = 'super_admin'
    )
);

-- ============================================================================
-- TRIGGER PER AUTO-UPDATE TIMESTAMPS
-- ============================================================================

-- Trigger per auto-update
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS UTILITY
-- ============================================================================

-- Function per generare ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS varchar(20) AS $$
DECLARE
    ticket_num varchar(20);
    counter integer;
BEGIN
    -- Format: TICKET-YYYYMMDD-NNNN
    SELECT COUNT(*) + 1 INTO counter
    FROM support_tickets
    WHERE DATE(created_at) = CURRENT_DATE;

    ticket_num := 'TICKET-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::text, 4, '0');

    RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Function per calcolare metriche di sistema
CREATE OR REPLACE FUNCTION record_system_metric(
    p_metric_type varchar(50),
    p_metric_name varchar(100),
    p_metric_value numeric,
    p_metric_unit varchar(20),
    p_organization_id uuid DEFAULT NULL,
    p_metric_data jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO system_metrics (
        metric_type,
        metric_name,
        metric_value,
        metric_unit,
        organization_id,
        metric_data
    ) VALUES (
        p_metric_type,
        p_metric_name,
        p_metric_value,
        p_metric_unit,
        p_organization_id,
        p_metric_data
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DATI DI ESEMPIO (OPZIONALI)
-- ============================================================================

-- Feature flags di base
INSERT INTO feature_flags (flag_name, description, is_enabled) VALUES
('maintenance_mode', 'Sistema in manutenzione', false),
('new_dashboard', 'Nuovo dashboard sperimentale', false),
('advanced_analytics', 'Analytics avanzate', true),
('ai_recommendations', 'Raccomandazioni AI', false)
ON CONFLICT (flag_name) DO NOTHING;

-- System settings di base
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('max_organizations_per_user', '5', 'number', 'Massimo numero organizzazioni per utente', false),
('trial_period_days', '14', 'number', 'Giorni di trial gratuito', true),
('max_failed_login_attempts', '5', 'number', 'Tentativi di login falliti prima del blocco', false),
('session_timeout_hours', '24', 'number', 'Timeout sessione in ore', false),
('support_email', 'support@omnilypro.com', 'string', 'Email supporto clienti', true)
ON CONFLICT (setting_key) DO NOTHING;

-- Email templates di base
INSERT INTO email_templates (template_name, subject, html_content, text_content, category) VALUES
('welcome_organization', 'Benvenuto in OMNILY PRO!',
 '<h1>Benvenuto {{organization_name}}!</h1><p>La tua organizzazione è stata creata con successo.</p>',
 'Benvenuto {{organization_name}}! La tua organizzazione è stata creata con successo.',
 'onboarding'),
('payment_failed', 'Problema con il pagamento - OMNILY PRO',
 '<h1>Problema con il pagamento</h1><p>Non siamo riusciti a processare il pagamento per {{organization_name}}.</p>',
 'Problema con il pagamento per {{organization_name}}.',
 'billing')
ON CONFLICT (template_name) DO NOTHING;

-- ============================================================================
-- FINE SCHEMA ADMIN
-- ============================================================================1