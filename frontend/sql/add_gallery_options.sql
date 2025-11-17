-- Add Gallery Layout and Options
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_gallery_layout TEXT DEFAULT 'masonry',
ADD COLUMN IF NOT EXISTS website_gallery_enable_lightbox BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS website_gallery_enable_zoom BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS website_gallery_enable_captions BOOLEAN DEFAULT TRUE;
