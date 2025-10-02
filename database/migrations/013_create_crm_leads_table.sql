-- Migration: Create CRM Leads Table for Sales Agents
-- Date: 2025-10-02
-- Purpose: Lead management and sales pipeline for OMNILYPRO backoffice agents

-- Create CRM Leads table
CREATE TABLE IF NOT EXISTS crm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Company Information
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    city VARCHAR(100),
    country VARCHAR(100),
    address TEXT,

    -- Sales Pipeline
    stage VARCHAR(50) NOT NULL DEFAULT 'lead',
    -- Stages: 'lead', 'contacted', 'demo_scheduled', 'demo_completed',
    --         'proposal_sent', 'negotiation', 'contract_ready', 'won', 'lost'

    probability INTEGER DEFAULT 0, -- 0-100%
    estimated_monthly_value DECIMAL(10,2) DEFAULT 0,

    -- Product Interest
    interested_modules TEXT[], -- ['pos', 'inventory', 'loyalty', 'analytics']
    plan_type VARCHAR(50), -- 'basic', 'professional', 'enterprise'

    -- Assignment
    sales_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Tracking & Follow-up
    last_contact_date TIMESTAMP,
    next_action VARCHAR(255),
    next_action_date DATE,

    -- Notes & History
    notes TEXT,
    loss_reason VARCHAR(255), -- Only if stage = 'lost'

    -- Link to Customer (when won)
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,

    -- Source tracking
    source VARCHAR(100), -- 'website', 'referral', 'cold_call', 'event', 'partner'

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    won_at TIMESTAMP,
    lost_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_crm_leads_stage ON crm_leads(stage);
CREATE INDEX idx_crm_leads_agent ON crm_leads(sales_agent_id);
CREATE INDEX idx_crm_leads_next_action_date ON crm_leads(next_action_date);
CREATE INDEX idx_crm_leads_created_at ON crm_leads(created_at);

-- Enable Row Level Security
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Sales agents can only see their own leads
CREATE POLICY "sales_agents_own_leads" ON crm_leads
    FOR ALL
    USING (
        sales_agent_id = auth.uid()
    );

-- Super admins can see all leads
CREATE POLICY "super_admin_all_leads" ON crm_leads
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'super_admin'
        )
    );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_crm_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
CREATE TRIGGER crm_leads_updated_at
    BEFORE UPDATE ON crm_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_crm_leads_updated_at();

-- Function to auto-set won_at/lost_at when stage changes
CREATE OR REPLACE FUNCTION update_crm_leads_stage_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stage = 'won' AND OLD.stage != 'won' THEN
        NEW.won_at = NOW();
    END IF;

    IF NEW.stage = 'lost' AND OLD.stage != 'lost' THEN
        NEW.lost_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-setting stage timestamps
CREATE TRIGGER crm_leads_stage_timestamps
    BEFORE UPDATE ON crm_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_crm_leads_stage_timestamps();

-- Insert sample data for testing (optional - remove in production)
-- INSERT INTO crm_leads (
--     company_name,
--     contact_name,
--     email,
--     phone,
--     city,
--     stage,
--     probability,
--     estimated_monthly_value,
--     interested_modules,
--     plan_type,
--     next_action,
--     next_action_date,
--     source
-- ) VALUES
-- ('Pizzeria Da Mario', 'Mario Rossi', 'mario@pizzeria.it', '+39 333 1234567', 'Milano',
--  'contacted', 40, 350.00, ARRAY['pos', 'inventory'], 'professional',
--  'Fissare demo', CURRENT_DATE + INTERVAL '2 days', 'website'),
--
-- ('Hotel Paradiso', 'Laura Bianchi', 'laura@hotelparadiso.it', '+39 335 9876543', 'Roma',
--  'proposal_sent', 70, 950.00, ARRAY['pos', 'loyalty', 'analytics'], 'enterprise',
--  'Follow-up proposta', CURRENT_DATE + INTERVAL '3 days', 'referral');
