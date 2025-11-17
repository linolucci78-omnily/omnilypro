-- Add Pricing Section columns (Price List with Categories)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_show_pricing BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_price_list_categories JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS website_pricing_title TEXT DEFAULT 'I Nostri Servizi',
ADD COLUMN IF NOT EXISTS website_pricing_subtitle TEXT DEFAULT 'Scopri i nostri servizi e i relativi prezzi',
ADD COLUMN IF NOT EXISTS website_pricing_layout TEXT DEFAULT 'vertical',
ADD COLUMN IF NOT EXISTS website_pricing_bg_type TEXT DEFAULT 'gradient',
ADD COLUMN IF NOT EXISTS website_pricing_bg_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_pricing_bg_gradient_start TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_pricing_bg_gradient_end TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_pricing_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_pricing_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_pricing_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_pricing_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_pricing_overlay_opacity NUMERIC DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS website_pricing_text_color TEXT DEFAULT '#1f2937';

-- Add GDPR Banner columns
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_show_gdpr_banner BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS website_privacy_policy_url TEXT,
ADD COLUMN IF NOT EXISTS website_cookie_policy_url TEXT,
ADD COLUMN IF NOT EXISTS website_gdpr_banner_position TEXT DEFAULT 'bottom',
ADD COLUMN IF NOT EXISTS website_gdpr_show_preferences BOOLEAN DEFAULT TRUE;
