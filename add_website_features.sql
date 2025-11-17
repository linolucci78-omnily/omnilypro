-- Add features section to website
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_features JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS website_show_features BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS website_features_title TEXT DEFAULT 'Le Nostre Caratteristiche',
ADD COLUMN IF NOT EXISTS website_features_description TEXT;

-- Features structure: [{ id, title, description, image_url, link_url, link_text }]
COMMENT ON COLUMN organizations.website_features IS 'Features array with structure: [{ id, title, description, image_url, link_url, link_text }]';
