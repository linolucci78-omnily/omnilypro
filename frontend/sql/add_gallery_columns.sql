-- Add Gallery Section columns
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_show_gallery BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_gallery JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS website_gallery_layout TEXT DEFAULT 'masonry',
ADD COLUMN IF NOT EXISTS website_gallery_enable_lightbox BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS website_gallery_enable_zoom BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS website_gallery_enable_captions BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS website_gallery_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_gallery_bg_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_gallery_bg_gradient_start TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_gallery_bg_gradient_end TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_gallery_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_gallery_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_gallery_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_gallery_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_gallery_overlay_opacity NUMERIC DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS website_gallery_text_color TEXT DEFAULT '#1f2937';
