-- Add gallery effects customization
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_gallery_layout TEXT DEFAULT 'masonry', -- masonry, grid, carousel
ADD COLUMN IF NOT EXISTS website_gallery_columns INTEGER DEFAULT 3, -- 2, 3, 4
ADD COLUMN IF NOT EXISTS website_gallery_enable_lightbox BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS website_gallery_enable_zoom BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS website_gallery_enable_captions BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS website_gallery_animation TEXT DEFAULT 'fade'; -- fade, slide, zoom, none

COMMENT ON COLUMN organizations.website_gallery_layout IS 'Gallery layout style: masonry (dynamic), grid (uniform), carousel (slideshow)';
COMMENT ON COLUMN organizations.website_gallery_columns IS 'Number of columns for grid/masonry layout (2-4)';
COMMENT ON COLUMN organizations.website_gallery_enable_lightbox IS 'Enable fullscreen lightbox when clicking images';
COMMENT ON COLUMN organizations.website_gallery_enable_zoom IS 'Enable hover zoom effect on images';
COMMENT ON COLUMN organizations.website_gallery_enable_captions IS 'Show image captions/descriptions';
COMMENT ON COLUMN organizations.website_gallery_animation IS 'Image entrance animation: fade, slide, zoom, none';
