-- Add Hero Override Fields (optional overrides for branding)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_hero_title_override TEXT,
ADD COLUMN IF NOT EXISTS website_hero_subtitle_override TEXT;
