-- Migration: Create CRM Tables (Minimal Version - No Errors)
-- Date: 2025-10-02

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    subject VARCHAR(500),
    content TEXT,
    target_segments TEXT[],
    scheduled_at TIMESTAMP,
    budget DECIMAL(10,2) DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    converted_count INTEGER DEFAULT 0,
    revenue_generated DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create customer segments table
CREATE TABLE IF NOT EXISTS customer_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL,
    is_dynamic BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    customer_count INTEGER DEFAULT 0,
    avg_clv DECIMAL(10,2) DEFAULT 0,
    avg_engagement DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create customer activities table
CREATE TABLE IF NOT EXISTS customer_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    description TEXT,
    metadata JSONB,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    activity_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_activities ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (view only for now)
CREATE POLICY "view_campaigns" ON campaigns FOR SELECT USING (
    organization_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid())
);

CREATE POLICY "view_segments" ON customer_segments FOR SELECT USING (
    organization_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid())
);

CREATE POLICY "view_activities" ON customer_activities FOR SELECT USING (
    organization_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid())
);
