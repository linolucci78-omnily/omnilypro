-- Advanced Hero customization
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_hero_overlay_opacity DECIMAL(3,2) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS website_hero_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_hero_button1_text TEXT DEFAULT 'Scopri di Più',
ADD COLUMN IF NOT EXISTS website_hero_button1_link TEXT,
ADD COLUMN IF NOT EXISTS website_hero_button1_style TEXT DEFAULT 'primary', -- primary, secondary, outline
ADD COLUMN IF NOT EXISTS website_hero_button2_text TEXT DEFAULT 'Contattaci',
ADD COLUMN IF NOT EXISTS website_hero_button2_link TEXT,
ADD COLUMN IF NOT EXISTS website_hero_button2_style TEXT DEFAULT 'secondary',
ADD COLUMN IF NOT EXISTS website_hero_text_position TEXT DEFAULT 'center', -- left, center, right
ADD COLUMN IF NOT EXISTS website_hero_enable_parallax BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS website_hero_enable_particles BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS website_hero_height TEXT DEFAULT 'full'; -- full, medium, small

-- Update custom sections to include advanced styling
COMMENT ON COLUMN organizations.website_custom_sections IS
'Custom sections with advanced styling: [{
  id,
  title,
  content,
  visible,
  menuLabel,
  order,
  backgroundColor,
  textColor,
  image,
  imagePosition (left/right/background),
  enableParallax,
  overlayOpacity
}]';
