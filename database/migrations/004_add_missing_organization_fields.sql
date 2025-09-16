-- Migration: Add missing fields to organizations table
-- Date: 2025-09-05
-- Description: Adds fields required by EnterpriseWizard

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS business_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS website VARCHAR(255),
ADD COLUMN IF NOT EXISTS tagline TEXT,

-- Branding fields
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7) DEFAULT '#ef4444',
ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(7) DEFAULT '#dc2626',

-- Social Media
ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255),

-- Channels (Step 6)
ADD COLUMN IF NOT EXISTS enable_pos BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_ecommerce BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_app BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pos_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS ecommerce_platform VARCHAR(50),

-- Marketing (Step 7)
ADD COLUMN IF NOT EXISTS welcome_campaign BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS birthday_rewards BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS inactive_campaign BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_templates JSONB DEFAULT '{}',

-- Team (Step 8)
ADD COLUMN IF NOT EXISTS admin_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS admin_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS invite_emails JSONB DEFAULT '[]',

-- POS Integration (Step 9)
ADD COLUMN IF NOT EXISTS pos_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS pos_model VARCHAR(10) DEFAULT 'Z108',
ADD COLUMN IF NOT EXISTS pos_connection VARCHAR(20) DEFAULT 'usb',
ADD COLUMN IF NOT EXISTS enable_receipt_print BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_nfc BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_emv BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_pinpad BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS pos_test_results JSONB DEFAULT 'null',

-- Notifications (Step 10)
ADD COLUMN IF NOT EXISTS enable_email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_sms BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_push_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS welcome_email_enabled BOOLEAN DEFAULT true,

-- Analytics (Step 11)
ADD COLUMN IF NOT EXISTS enable_advanced_analytics BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS report_frequency VARCHAR(20) DEFAULT 'weekly',
ADD COLUMN IF NOT EXISTS kpi_tracking JSONB DEFAULT '["customer_retention", "average_transaction", "loyalty_roi"]',

-- Billing
ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255),

-- Rewards (Step 4)
ADD COLUMN IF NOT EXISTS reward_types JSONB DEFAULT '["discount", "freeProduct", "cashback"]',
ADD COLUMN IF NOT EXISTS default_rewards JSONB DEFAULT '[]';