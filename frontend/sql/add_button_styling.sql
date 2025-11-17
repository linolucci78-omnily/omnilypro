-- Add Button Styling Options
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_button_bg_color TEXT DEFAULT '#ef4444',
ADD COLUMN IF NOT EXISTS website_button_text_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_button_border_radius TEXT DEFAULT '8px',
ADD COLUMN IF NOT EXISTS website_button_border_width TEXT DEFAULT '0px',
ADD COLUMN IF NOT EXISTS website_button_border_color TEXT DEFAULT '#ef4444',
ADD COLUMN IF NOT EXISTS website_button_hover_bg_color TEXT DEFAULT '#dc2626',
ADD COLUMN IF NOT EXISTS website_button_hover_text_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_button_padding TEXT DEFAULT '12px 24px',
ADD COLUMN IF NOT EXISTS website_button_font_weight TEXT DEFAULT '600';
