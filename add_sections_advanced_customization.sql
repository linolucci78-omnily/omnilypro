-- Advanced customization for all sections

-- Hero Section (already has some fields, adding styling)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_hero_bg_type TEXT DEFAULT 'gradient',
ADD COLUMN IF NOT EXISTS website_hero_bg_color TEXT DEFAULT '#0f172a',
ADD COLUMN IF NOT EXISTS website_hero_bg_gradient_start TEXT DEFAULT '#0f172a',
ADD COLUMN IF NOT EXISTS website_hero_bg_gradient_end TEXT DEFAULT '#1e293b';

-- About Section
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_about_bg_type TEXT DEFAULT 'color', -- color, gradient, image
ADD COLUMN IF NOT EXISTS website_about_bg_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_about_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_about_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_about_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_about_enable_parallax BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS website_about_enable_overlay BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS website_about_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_about_overlay_opacity DECIMAL(3,2) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS website_about_text_color TEXT DEFAULT '#1f2937';

-- Services Section
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_services_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_services_bg_color TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_services_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_services_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_services_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_services_enable_parallax BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS website_services_enable_overlay BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS website_services_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_services_overlay_opacity DECIMAL(3,2) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS website_services_text_color TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_services_card_style TEXT DEFAULT 'elevated'; -- elevated, flat, outlined

-- Gallery Section
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_gallery_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_gallery_bg_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_gallery_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_gallery_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_gallery_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_gallery_enable_parallax BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS website_gallery_enable_overlay BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS website_gallery_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_gallery_overlay_opacity DECIMAL(3,2) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS website_gallery_text_color TEXT DEFAULT '#1f2937';

-- Loyalty Section
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_loyalty_bg_type TEXT DEFAULT 'gradient',
ADD COLUMN IF NOT EXISTS website_loyalty_bg_color TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_loyalty_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_loyalty_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_loyalty_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_loyalty_enable_parallax BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS website_loyalty_enable_overlay BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS website_loyalty_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_loyalty_overlay_opacity DECIMAL(3,2) DEFAULT 0.3,
ADD COLUMN IF NOT EXISTS website_loyalty_text_color TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_loyalty_enable_particles BOOLEAN DEFAULT true;

-- Testimonials Section
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_testimonials_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_testimonials_bg_color TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_testimonials_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_testimonials_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_testimonials_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_testimonials_enable_parallax BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS website_testimonials_enable_overlay BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS website_testimonials_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_testimonials_overlay_opacity DECIMAL(3,2) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS website_testimonials_text_color TEXT DEFAULT '#1f2937';

-- Team Section
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_team_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_team_bg_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_team_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_team_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_team_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_team_enable_parallax BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS website_team_enable_overlay BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS website_team_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_team_overlay_opacity DECIMAL(3,2) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS website_team_text_color TEXT DEFAULT '#1f2937';

-- Video Section
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_video_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_video_bg_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_video_bg_gradient_start TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_video_bg_gradient_end TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_video_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_video_enable_parallax BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS website_video_enable_overlay BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS website_video_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_video_overlay_opacity DECIMAL(3,2) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS website_video_text_color TEXT DEFAULT '#ffffff';

-- Contact Section
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_contact_bg_type TEXT DEFAULT 'gradient',
ADD COLUMN IF NOT EXISTS website_contact_bg_color TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_contact_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_contact_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_contact_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_contact_enable_parallax BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS website_contact_enable_overlay BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS website_contact_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_contact_overlay_opacity DECIMAL(3,2) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS website_contact_text_color TEXT DEFAULT '#1f2937';

-- Comments
COMMENT ON COLUMN organizations.website_about_bg_type IS 'Background type: color (solid), gradient (linear gradient), image (background image)';
COMMENT ON COLUMN organizations.website_services_card_style IS 'Card style for services: elevated (shadow), flat (no shadow), outlined (border)';
COMMENT ON COLUMN organizations.website_loyalty_enable_particles IS 'Enable floating particles animation in loyalty section';
