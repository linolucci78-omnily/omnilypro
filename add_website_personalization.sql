-- Add more website personalization fields
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_hero_title TEXT,
ADD COLUMN IF NOT EXISTS website_hero_cta_primary TEXT DEFAULT 'Scopri di Più',
ADD COLUMN IF NOT EXISTS website_hero_cta_secondary TEXT DEFAULT 'Contattaci',
ADD COLUMN IF NOT EXISTS website_about_title TEXT DEFAULT 'Chi Siamo',
ADD COLUMN IF NOT EXISTS website_footer_text TEXT,
ADD COLUMN IF NOT EXISTS website_show_powered_by BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS website_custom_sections JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining custom sections structure
COMMENT ON COLUMN organizations.website_custom_sections IS 'Custom sections array with structure: [{ id, title, content, visible, menuLabel, order }]';
