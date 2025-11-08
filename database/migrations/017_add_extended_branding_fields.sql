-- Migration: Add Extended Branding & Social Fields
-- Date: 2025-11-08
-- Description: Premium branding features for high-tier plans

-- Additional Social Media
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS tiktok_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS pinterest_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS whatsapp_business TEXT; -- Format: +39...
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS telegram_url TEXT;

-- Additional Brand Images
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS favicon_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_light_url TEXT; -- for dark backgrounds
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS watermark_url TEXT;

-- Extended Color Palette
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS tertiary_color VARCHAR(7) DEFAULT '#3b82f6';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS error_color VARCHAR(7) DEFAULT '#ef4444';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS success_color VARCHAR(7) DEFAULT '#10b981';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS warning_color VARCHAR(7) DEFAULT '#f59e0b';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS background_color VARCHAR(7) DEFAULT '#ffffff';

-- Typography
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS primary_font VARCHAR(100) DEFAULT 'Inter';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS secondary_font VARCHAR(100) DEFAULT 'Inter';

-- Extended Business Info
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS bio TEXT; -- Long description
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS business_category VARCHAR(100); -- e.g., "Restaurant", "Retail"
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS hashtags TEXT[]; -- Array of hashtags
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{}'; -- Schedule
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slogan TEXT;

-- Brand Kit Settings
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS brand_templates JSONB DEFAULT '[]'; -- Pre-saved color schemes
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS qr_code_url TEXT; -- QR to business profile

-- Update comment
COMMENT ON TABLE organizations IS 'Multi-tenant organizations table - Extended branding fields added 2025-11-08';
