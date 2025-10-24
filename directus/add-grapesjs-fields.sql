-- Add GrapesJS fields to organizations_websites table
-- Execute this on Neon database

ALTER TABLE organizations_websites
ADD COLUMN IF NOT EXISTS grapesjs_html TEXT,
ADD COLUMN IF NOT EXISTS grapesjs_css TEXT,
ADD COLUMN IF NOT EXISTS grapesjs_components TEXT,
ADD COLUMN IF NOT EXISTS grapesjs_styles TEXT;

-- Add comments to describe the fields
COMMENT ON COLUMN organizations_websites.grapesjs_html IS 'HTML output from GrapesJS editor';
COMMENT ON COLUMN organizations_websites.grapesjs_css IS 'CSS styles from GrapesJS editor';
COMMENT ON COLUMN organizations_websites.grapesjs_components IS 'JSON structure of GrapesJS components for editing';
COMMENT ON COLUMN organizations_websites.grapesjs_styles IS 'JSON structure of GrapesJS styles for editing';

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'organizations_websites'
AND column_name LIKE 'grapesjs%'
ORDER BY column_name;
