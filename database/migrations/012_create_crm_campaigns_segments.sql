-- Migration: Create CRM Campaigns and Segments Tables
-- Date: 2025-10-02
-- Description: Creates campaigns and customer_segments tables for CRM functionality

-- =============================================
-- CAMPAIGNS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Campaign details
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'sms', 'push', 'direct_mail')),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'completed', 'paused')),

    -- Content
    subject VARCHAR(500),
    content TEXT,

    -- Targeting
    target_segments TEXT[], -- Array of segment IDs

    -- Scheduling
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Budget
    budget DECIMAL(10,2) DEFAULT 0,

    -- Performance metrics
    sent_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    converted_count INTEGER DEFAULT 0,
    revenue_generated DECIMAL(10,2) DEFAULT 0,

    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_organization_id ON campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON campaigns(scheduled_at);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaigns
CREATE POLICY "Users can view campaigns from their organizations" ON campaigns
    FOR SELECT USING (
        organization_id IN (
            SELECT org_id FROM organization_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert campaigns to their organizations" ON campaigns
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT org_id FROM organization_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update campaigns from their organizations" ON campaigns
    FOR UPDATE USING (
        organization_id IN (
            SELECT org_id FROM organization_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete campaigns from their organizations" ON campaigns
    FOR DELETE USING (
        organization_id IN (
            SELECT org_id FROM organization_users
            WHERE user_id = auth.uid()
        )
    );

-- Trigger for updated_at
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE
    ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- CUSTOMER SEGMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS customer_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Segment details
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Segment criteria (stored as JSONB for flexibility)
    criteria JSONB NOT NULL,

    -- Segment type
    is_dynamic BOOLEAN DEFAULT true, -- Dynamic segments auto-update
    is_active BOOLEAN DEFAULT true,

    -- Cached statistics (updated periodically)
    customer_count INTEGER DEFAULT 0,
    avg_clv DECIMAL(10,2) DEFAULT 0,
    avg_engagement DECIMAL(5,2) DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_calculated_at TIMESTAMP
);

-- Indexes for customer_segments
CREATE INDEX IF NOT EXISTS idx_customer_segments_organization_id ON customer_segments(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_segments_is_active ON customer_segments(is_active);
CREATE INDEX IF NOT EXISTS idx_customer_segments_is_dynamic ON customer_segments(is_dynamic);

-- Enable RLS
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_segments
CREATE POLICY "Users can view segments from their organizations" ON customer_segments
    FOR SELECT USING (
        organization_id IN (
            SELECT org_id FROM organization_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert segments to their organizations" ON customer_segments
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT org_id FROM organization_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update segments from their organizations" ON customer_segments
    FOR UPDATE USING (
        organization_id IN (
            SELECT org_id FROM organization_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete segments from their organizations" ON customer_segments
    FOR DELETE USING (
        organization_id IN (
            SELECT org_id FROM organization_users
            WHERE user_id = auth.uid()
        )
    );

-- Trigger for updated_at
CREATE TRIGGER update_customer_segments_updated_at BEFORE UPDATE
    ON customer_segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- CUSTOMER ACTIVITIES TABLE (for tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS customer_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Activity details
    activity_type VARCHAR(100) NOT NULL, -- 'purchase', 'visit', 'email_open', 'email_click', etc.
    description TEXT,

    -- Associated data
    metadata JSONB, -- Flexible data storage (amount, product_id, etc.)

    -- Campaign tracking
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,

    -- Timestamps
    activity_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for customer_activities
CREATE INDEX IF NOT EXISTS idx_customer_activities_customer_id ON customer_activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_organization_id ON customer_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_campaign_id ON customer_activities(campaign_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_activity_type ON customer_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_customer_activities_activity_date ON customer_activities(activity_date);

-- Enable RLS
ALTER TABLE customer_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customer_activities
CREATE POLICY "Users can view activities from their organizations" ON customer_activities
    FOR SELECT USING (
        organization_id IN (
            SELECT org_id FROM organization_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert activities to their organizations" ON customer_activities
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT org_id FROM organization_users
            WHERE user_id = auth.uid()
        )
    );

-- Comments
COMMENT ON TABLE campaigns IS 'Marketing campaigns for CRM - created 2025-10-02';
COMMENT ON TABLE customer_segments IS 'Customer segmentation for targeted marketing - created 2025-10-02';
COMMENT ON TABLE customer_activities IS 'Customer activity tracking for analytics - created 2025-10-02';
