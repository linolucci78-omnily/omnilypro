-- Migration: Create CRM Campaigns and Segments Tables (Version 2 - Safe)
-- Date: 2025-10-02
-- Description: Creates campaigns and customer_segments tables for CRM functionality

-- =============================================
-- STEP 1: CREATE CAMPAIGNS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'sms', 'push', 'direct_mail')),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'completed', 'paused')),
    subject VARCHAR(500),
    content TEXT,
    target_segments TEXT[],
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    budget DECIMAL(10,2) DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    converted_count INTEGER DEFAULT 0,
    revenue_generated DECIMAL(10,2) DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- STEP 2: CREATE CUSTOMER SEGMENTS TABLE
-- =============================================
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
    updated_at TIMESTAMP DEFAULT NOW(),
    last_calculated_at TIMESTAMP
);

-- =============================================
-- STEP 3: CREATE CUSTOMER ACTIVITIES TABLE
-- =============================================
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

-- =============================================
-- STEP 4: CREATE ALL INDEXES
-- =============================================

-- Campaigns indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_organization_id ON campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON campaigns(scheduled_at);

-- Customer segments indexes
CREATE INDEX IF NOT EXISTS idx_customer_segments_organization_id ON customer_segments(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_segments_is_active ON customer_segments(is_active);
CREATE INDEX IF NOT EXISTS idx_customer_segments_is_dynamic ON customer_segments(is_dynamic);

-- Customer activities indexes
CREATE INDEX IF NOT EXISTS idx_customer_activities_customer_id ON customer_activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_organization_id ON customer_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_campaign_id ON customer_activities(campaign_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_activity_type ON customer_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_customer_activities_activity_date ON customer_activities(activity_date);

-- =============================================
-- STEP 5: ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_activities ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 6: CREATE RLS POLICIES FOR CAMPAIGNS
-- =============================================

DROP POLICY IF EXISTS "Users can view campaigns from their organizations" ON campaigns;
CREATE POLICY "Users can view campaigns from their organizations" ON campaigns
    FOR SELECT USING (
        organization_id IN (
            SELECT org_id FROM organization_users WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert campaigns to their organizations" ON campaigns;
CREATE POLICY "Users can insert campaigns to their organizations" ON campaigns
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT org_id FROM organization_users WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update campaigns from their organizations" ON campaigns;
CREATE POLICY "Users can update campaigns from their organizations" ON campaigns
    FOR UPDATE USING (
        organization_id IN (
            SELECT org_id FROM organization_users WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete campaigns from their organizations" ON campaigns;
CREATE POLICY "Users can delete campaigns from their organizations" ON campaigns
    FOR DELETE USING (
        organization_id IN (
            SELECT org_id FROM organization_users WHERE user_id = auth.uid()
        )
    );

-- =============================================
-- STEP 7: CREATE RLS POLICIES FOR CUSTOMER SEGMENTS
-- =============================================

DROP POLICY IF EXISTS "Users can view segments from their organizations" ON customer_segments;
CREATE POLICY "Users can view segments from their organizations" ON customer_segments
    FOR SELECT USING (
        organization_id IN (
            SELECT org_id FROM organization_users WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert segments to their organizations" ON customer_segments;
CREATE POLICY "Users can insert segments to their organizations" ON customer_segments
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT org_id FROM organization_users WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update segments from their organizations" ON customer_segments;
CREATE POLICY "Users can update segments from their organizations" ON customer_segments
    FOR UPDATE USING (
        organization_id IN (
            SELECT org_id FROM organization_users WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete segments from their organizations" ON customer_segments;
CREATE POLICY "Users can delete segments from their organizations" ON customer_segments
    FOR DELETE USING (
        organization_id IN (
            SELECT org_id FROM organization_users WHERE user_id = auth.uid()
        )
    );

-- =============================================
-- STEP 8: CREATE RLS POLICIES FOR CUSTOMER ACTIVITIES
-- =============================================

DROP POLICY IF EXISTS "Users can view activities from their organizations" ON customer_activities;
CREATE POLICY "Users can view activities from their organizations" ON customer_activities
    FOR SELECT USING (
        organization_id IN (
            SELECT org_id FROM organization_users WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert activities to their organizations" ON customer_activities;
CREATE POLICY "Users can insert activities to their organizations" ON customer_activities
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT org_id FROM organization_users WHERE user_id = auth.uid()
        )
    );

-- =============================================
-- STEP 9: CREATE TRIGGERS FOR UPDATED_AT
-- =============================================

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE
    ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_segments_updated_at ON customer_segments;
CREATE TRIGGER update_customer_segments_updated_at BEFORE UPDATE
    ON customer_segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE campaigns IS 'Marketing campaigns for CRM - created 2025-10-02';
COMMENT ON TABLE customer_segments IS 'Customer segmentation for targeted marketing - created 2025-10-02';
COMMENT ON TABLE customer_activities IS 'Customer activity tracking for analytics - created 2025-10-02';
