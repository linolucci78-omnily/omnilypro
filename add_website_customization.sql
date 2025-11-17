-- Add website customization fields to organizations table
ALTER TABLE organizations
-- Main settings
ADD COLUMN IF NOT EXISTS website_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS website_template VARCHAR(50) DEFAULT 'modern',

-- Content sections
ADD COLUMN IF NOT EXISTS website_description TEXT,
ADD COLUMN IF NOT EXISTS website_hero_image TEXT,
ADD COLUMN IF NOT EXISTS website_hero_subtitle TEXT,
ADD COLUMN IF NOT EXISTS website_gallery JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS website_opening_hours JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS website_video_url TEXT,
ADD COLUMN IF NOT EXISTS website_testimonials JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS website_services JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS website_team JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS website_custom_sections JSONB DEFAULT '[]'::jsonb,

-- Toggle sections ON/OFF
ADD COLUMN IF NOT EXISTS website_show_hero BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS website_show_about BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS website_show_services BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS website_show_gallery BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS website_show_loyalty BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS website_show_testimonials BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS website_show_team BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS website_show_video BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS website_show_map BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS website_show_contact_form BOOLEAN DEFAULT true,

-- Featured content
ADD COLUMN IF NOT EXISTS website_featured_rewards JSONB DEFAULT '[]'::jsonb,

-- SEO & Meta
ADD COLUMN IF NOT EXISTS website_meta_title TEXT,
ADD COLUMN IF NOT EXISTS website_meta_description TEXT,
ADD COLUMN IF NOT EXISTS website_meta_keywords TEXT,
ADD COLUMN IF NOT EXISTS website_og_image TEXT, -- Open Graph image for social sharing
ADD COLUMN IF NOT EXISTS website_favicon_url TEXT,
ADD COLUMN IF NOT EXISTS website_google_analytics_id TEXT,
ADD COLUMN IF NOT EXISTS website_google_tag_manager_id TEXT,
ADD COLUMN IF NOT EXISTS website_facebook_pixel_id TEXT,

-- Custom CSS (for advanced users)
ADD COLUMN IF NOT EXISTS website_custom_css TEXT;

-- Add index for slug lookups (for public website routes)
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- Add index for enabled websites
CREATE INDEX IF NOT EXISTS idx_organizations_website_enabled ON organizations(website_enabled) WHERE website_enabled = true;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
