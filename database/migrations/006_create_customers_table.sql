-- Migration: Create Customers Table for OMNILY PRO
-- Date: 2025-09-06  
-- Description: Creates customers table for multi-tenant loyalty system

-- Drop existing table if exists (for development)
DROP TABLE IF EXISTS customers CASCADE;

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Personal information
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    birth_date DATE,
    
    -- Loyalty system
    points INTEGER DEFAULT 0,
    tier VARCHAR(50) DEFAULT 'Bronze' CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Platinum', 'Argento', 'Bronzo')),
    total_spent DECIMAL(10,2) DEFAULT 0,
    visits INTEGER DEFAULT 0,
    
    -- Status and preferences
    is_active BOOLEAN DEFAULT true,
    notifications_enabled BOOLEAN DEFAULT false,
    
    -- Marketing
    referral_code VARCHAR(20),
    referred_by UUID REFERENCES customers(id),
    marketing_consent BOOLEAN DEFAULT false,
    privacy_consent BOOLEAN DEFAULT false,
    
    -- Digital signature and privacy
    signature_data TEXT, -- base64 encoded signature
    privacy_signed_at TIMESTAMP,
    
    -- Timestamps
    last_visit TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_customers_organization_id ON customers(organization_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_tier ON customers(tier);
CREATE INDEX idx_customers_active ON customers(is_active);
CREATE INDEX idx_customers_referral_code ON customers(referral_code);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see customers from their organizations
CREATE POLICY "Users can view customers from their organizations" ON customers
    FOR SELECT USING (
        organization_id IN (
            SELECT org_id FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Users can insert customers to their organizations
CREATE POLICY "Users can insert customers to their organizations" ON customers
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT org_id FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Users can update customers from their organizations
CREATE POLICY "Users can update customers from their organizations" ON customers
    FOR UPDATE USING (
        organization_id IN (
            SELECT org_id FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policy: Users can delete customers from their organizations  
CREATE POLICY "Users can delete customers from their organizations" ON customers
    FOR DELETE USING (
        organization_id IN (
            SELECT org_id FROM organization_users 
            WHERE user_id = auth.uid()
        )
    );

-- Trigger for updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE
    ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    code TEXT := '';
    i INTEGER;
BEGIN
    -- Generate 8 character code
    FOR i IN 1..8 LOOP
        code := code || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM customers WHERE referral_code = code) LOOP
        code := '';
        FOR i IN 1..8 LOOP
            code := code || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
        END LOOP;
    END LOOP;
    
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate referral code
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
        NEW.referral_code := generate_referral_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_customer_referral_code BEFORE INSERT
    ON customers FOR EACH ROW EXECUTE FUNCTION set_referral_code();

-- Insert comment for tracking
COMMENT ON TABLE customers IS 'Customers table for multi-tenant loyalty system created 2025-09-06';