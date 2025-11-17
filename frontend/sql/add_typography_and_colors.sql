-- Add Global Typography & Colors
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_font_headings TEXT DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS website_font_body TEXT DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS website_color_text_primary TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_color_text_secondary TEXT DEFAULT '#6b7280',
ADD COLUMN IF NOT EXISTS website_color_background_primary TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_color_background_secondary TEXT DEFAULT '#f9fafb';
