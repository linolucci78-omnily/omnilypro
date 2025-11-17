-- Add Section-Specific Styling Fields
-- Font overrides per section
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_hero_font TEXT,
ADD COLUMN IF NOT EXISTS website_about_font TEXT,
ADD COLUMN IF NOT EXISTS website_services_font TEXT,
ADD COLUMN IF NOT EXISTS website_gallery_font TEXT,
ADD COLUMN IF NOT EXISTS website_loyalty_font TEXT,
ADD COLUMN IF NOT EXISTS website_testimonials_font TEXT,
ADD COLUMN IF NOT EXISTS website_pricing_font TEXT,
ADD COLUMN IF NOT EXISTS website_team_font TEXT,
ADD COLUMN IF NOT EXISTS website_video_font TEXT,
ADD COLUMN IF NOT EXISTS website_contact_font TEXT;

-- Hero section styling (only text color, bg already exists)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_hero_text_color TEXT DEFAULT '#ffffff';

-- About section styling
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_about_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_about_bg_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_about_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_about_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_about_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_about_text_color TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_about_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_about_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_about_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_about_overlay_opacity NUMERIC DEFAULT 0.5;

-- Services section styling
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_services_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_services_bg_color TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_services_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_services_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_services_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_services_text_color TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_services_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_services_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_services_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_services_overlay_opacity NUMERIC DEFAULT 0.5;

-- Gallery section styling
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_gallery_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_gallery_bg_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_gallery_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_gallery_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_gallery_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_gallery_text_color TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_gallery_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_gallery_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_gallery_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_gallery_overlay_opacity NUMERIC DEFAULT 0.5;

-- Loyalty section styling
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_loyalty_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_loyalty_bg_color TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_loyalty_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_loyalty_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_loyalty_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_loyalty_text_color TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_loyalty_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_loyalty_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_loyalty_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_loyalty_overlay_opacity NUMERIC DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS website_loyalty_enable_particles BOOLEAN DEFAULT TRUE;

-- Testimonials section styling
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_testimonials_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_testimonials_bg_color TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_testimonials_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_testimonials_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_testimonials_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_testimonials_text_color TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_testimonials_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_testimonials_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_testimonials_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_testimonials_overlay_opacity NUMERIC DEFAULT 0.5;

-- Team section styling
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_team_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_team_bg_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_team_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_team_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_team_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_team_text_color TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_team_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_team_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_team_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_team_overlay_opacity NUMERIC DEFAULT 0.5;

-- Video section styling
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_video_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_video_bg_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_video_bg_gradient_start TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_video_bg_gradient_end TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_video_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_video_text_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_video_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_video_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_video_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_video_overlay_opacity NUMERIC DEFAULT 0.5;

-- Contact section styling
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_contact_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_contact_bg_color TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_contact_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_contact_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_contact_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_contact_text_color TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_contact_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_contact_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_contact_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_contact_overlay_opacity NUMERIC DEFAULT 0.5;
