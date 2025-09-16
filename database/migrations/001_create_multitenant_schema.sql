-- Migration: Create Multi-tenant Schema for OMNILY PRO
-- Date: 2025-09-05
-- Description: Creates organizations, users, and multi-tenant structure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS organization_invites CASCADE;
DROP TABLE IF EXISTS organization_users CASCADE; 
DROP TABLE IF EXISTS organizations CASCADE;

-- Main organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- for subdomain (e.g. cliente1)
    domain VARCHAR(255), -- custom domain optional
    
    -- Business data from wizard
    partita_iva VARCHAR(11) UNIQUE,
    codice_fiscale VARCHAR(16),
    industry VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(10),
    country VARCHAR(2) DEFAULT 'IT',
    
    -- Plan and limits
    plan_type VARCHAR(50) DEFAULT 'basic', -- basic, pro, enterprise
    plan_status VARCHAR(20) DEFAULT 'active', -- active, suspended, cancelled
    max_customers INTEGER DEFAULT 100,
    max_workflows INTEGER DEFAULT 5,
    max_notifications_month INTEGER DEFAULT 1000,
    
    -- Loyalty system configuration (from wizard Step 2)
    points_name VARCHAR(50) DEFAULT 'Punti',
    points_per_euro DECIMAL(5,2) DEFAULT 1.00,
    reward_threshold INTEGER DEFAULT 100,
    welcome_bonus INTEGER DEFAULT 0,
    points_expiry_months INTEGER DEFAULT 12, -- 0 = never expire
    enable_tier_system BOOLEAN DEFAULT false,
    loyalty_tiers JSONB DEFAULT '[]',
    
    -- Products & Categories (Step 3)
    import_products BOOLEAN DEFAULT true,
    product_categories JSONB DEFAULT '[]',
    bonus_categories JSONB DEFAULT '[]',
    
    -- Rewards configuration (Step 4)
    reward_types JSONB DEFAULT '["discount", "freeProduct", "cashback"]',
    default_rewards JSONB DEFAULT '[]',
    
    -- Branding (Step 5)
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#ef4444',
    secondary_color VARCHAR(7) DEFAULT '#dc2626',
    
    -- Channels Integration (Step 6)
    enable_pos BOOLEAN DEFAULT true,
    enable_ecommerce BOOLEAN DEFAULT false,
    enable_app BOOLEAN DEFAULT true,
    pos_type VARCHAR(50),
    ecommerce_platform VARCHAR(50),
    
    -- Marketing (Step 7)
    welcome_campaign BOOLEAN DEFAULT true,
    birthday_rewards BOOLEAN DEFAULT true,
    inactive_campaign BOOLEAN DEFAULT true,
    email_templates JSONB DEFAULT '{}',
    
    -- Team setup (Step 8)
    admin_name VARCHAR(255),
    admin_email VARCHAR(255),
    invite_emails JSONB DEFAULT '[]',
    
    -- Notifications (Step 9)
    enable_email_notifications BOOLEAN DEFAULT true,
    enable_sms BOOLEAN DEFAULT false,
    enable_push_notifications BOOLEAN DEFAULT true,
    welcome_email_enabled BOOLEAN DEFAULT true,
    
    -- Analytics (Step 10)
    enable_advanced_analytics BOOLEAN DEFAULT true,
    report_frequency VARCHAR(20) DEFAULT 'weekly',
    kpi_tracking JSONB DEFAULT '["customer_retention", "average_transaction", "loyalty_roi"]',
    
    -- Billing
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    billing_email VARCHAR(255),
    next_billing_date TIMESTAMP,
    
    -- Settings
    settings JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP -- soft delete
);

-- Organization users (many-to-many with roles)
CREATE TABLE organization_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- super_admin, org_admin, manager, cashier
    permissions JSONB DEFAULT '{}',
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP,
    joined_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(org_id, user_id)
);

-- Organization invites (pending invitations)
CREATE TABLE organization_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    invited_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Usage tracking for billing
CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    resource_type VARCHAR(50) NOT NULL, -- customers, workflows, notifications
    date DATE NOT NULL,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(org_id, resource_type, date)
);

-- Create indexes for performance
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_partita_iva ON organizations(partita_iva);
CREATE INDEX idx_organization_users_org_id ON organization_users(org_id);
CREATE INDEX idx_organization_users_user_id ON organization_users(user_id);
CREATE INDEX idx_organization_invites_org_id ON organization_invites(org_id);
CREATE INDEX idx_organization_invites_token ON organization_invites(token);
CREATE INDEX idx_usage_tracking_org_date ON usage_tracking(org_id, date);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Organizations: Users can only see orgs they belong to
CREATE POLICY "Users can view their organizations" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT org_id FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

-- Organizations: Only org_admin can update their org
CREATE POLICY "Org admins can update their organization" ON organizations
    FOR UPDATE USING (
        id IN (
            SELECT org_id FROM organization_users 
            WHERE user_id = auth.uid() AND role = 'org_admin'
        )
    );

-- Organization users: Users can see other users in their orgs
CREATE POLICY "Users can view org members" ON organization_users
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

-- Organization invites: Users can see invites for their orgs
CREATE POLICY "Users can view org invites" ON organization_invites
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM organization_users 
            WHERE user_id = auth.uid() AND role IN ('org_admin', 'super_admin')
        )
    );

-- Usage tracking: Users can see usage for their orgs
CREATE POLICY "Users can view org usage" ON usage_tracking
    FOR SELECT USING (
        org_id IN (
            SELECT org_id FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

-- Functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE
    ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION generate_unique_slug(org_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert to slug format
    base_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]', '-', 'g'));
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    final_slug := base_slug;
    
    -- Check for uniqueness and add counter if needed
    WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Insert comment for migration tracking
COMMENT ON TABLE organizations IS 'Multi-tenant organizations table created 2025-09-05';