-- Add Hero Section styling columns
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_hero_enable_parallax BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS website_hero_enable_particles BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_hero_bg_type TEXT DEFAULT 'gradient',
ADD COLUMN IF NOT EXISTS website_hero_bg_color TEXT DEFAULT '#0f172a',
ADD COLUMN IF NOT EXISTS website_hero_bg_gradient_start TEXT DEFAULT '#0f172a',
ADD COLUMN IF NOT EXISTS website_hero_bg_gradient_end TEXT DEFAULT '#1e293b',
ADD COLUMN IF NOT EXISTS website_hero_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_hero_overlay_opacity NUMERIC DEFAULT 0.5;
