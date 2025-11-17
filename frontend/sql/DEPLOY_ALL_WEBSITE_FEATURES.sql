-- ============================================
-- COMPLETE WEBSITE BUILDER MIGRATION
-- Esegui questo file su Supabase SQL Editor
-- ============================================

-- 1. GALLERY OPTIONS
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_gallery_layout TEXT DEFAULT 'masonry',
ADD COLUMN IF NOT EXISTS website_gallery_enable_lightbox BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS website_gallery_enable_zoom BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS website_gallery_enable_captions BOOLEAN DEFAULT TRUE;

-- 2. HERO OVERRIDE FIELDS
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_hero_title_override TEXT,
ADD COLUMN IF NOT EXISTS website_hero_subtitle_override TEXT;

-- 3. SECTION-SPECIFIC FONT OVERRIDES
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_hero_font TEXT,
ADD COLUMN IF NOT EXISTS website_about_font TEXT,
ADD COLUMN IF NOT EXISTS website_services_font TEXT,
ADD COLUMN IF NOT EXISTS website_gallery_font TEXT,
ADD COLUMN IF NOT EXISTS website_loyalty_font TEXT,
ADD COLUMN IF NOT EXISTS website_testimonials_font TEXT,
ADD COLUMN IF NOT EXISTS website_pricing_font TEXT,
ADD COLUMN IF NOT EXISTS website_team_font TEXT,
ADD COLUMN IF NOT EXISTS website_video_font TEXT,
ADD COLUMN IF NOT EXISTS website_contact_font TEXT;

-- 4. HERO SECTION STYLING
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_hero_text_color TEXT DEFAULT '#ffffff';

-- 5. ABOUT SECTION STYLING
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_about_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_about_bg_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_about_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_about_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_about_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_about_text_color TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_about_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_about_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_about_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_about_overlay_opacity NUMERIC DEFAULT 0.5;

-- 6. SERVICES SECTION STYLING
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_services_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_services_bg_color TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_services_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_services_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_services_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_services_text_color TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_services_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_services_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_services_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_services_overlay_opacity NUMERIC DEFAULT 0.5;

-- 7. GALLERY SECTION STYLING
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_gallery_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_gallery_bg_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_gallery_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_gallery_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_gallery_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_gallery_text_color TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_gallery_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_gallery_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_gallery_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_gallery_overlay_opacity NUMERIC DEFAULT 0.5;

-- 8. LOYALTY SECTION STYLING
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_loyalty_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_loyalty_bg_color TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_loyalty_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_loyalty_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_loyalty_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_loyalty_text_color TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_loyalty_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_loyalty_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_loyalty_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_loyalty_overlay_opacity NUMERIC DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS website_loyalty_enable_particles BOOLEAN DEFAULT TRUE;

-- 9. TESTIMONIALS SECTION STYLING
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_testimonials_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_testimonials_bg_color TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_testimonials_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_testimonials_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_testimonials_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_testimonials_text_color TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_testimonials_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_testimonials_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_testimonials_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_testimonials_overlay_opacity NUMERIC DEFAULT 0.5;

-- 10. TEAM SECTION STYLING
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_team_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_team_bg_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_team_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_team_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_team_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_team_text_color TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_team_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_team_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_team_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_team_overlay_opacity NUMERIC DEFAULT 0.5;

-- 11. VIDEO SECTION STYLING
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_video_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_video_bg_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_video_bg_gradient_start TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_video_bg_gradient_end TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_video_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_video_text_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_video_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_video_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_video_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_video_overlay_opacity NUMERIC DEFAULT 0.5;

-- 12. CONTACT SECTION STYLING
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_contact_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_contact_bg_color TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_contact_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_contact_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_contact_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_contact_text_color TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_contact_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_contact_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_contact_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_contact_overlay_opacity NUMERIC DEFAULT 0.5;

-- 13. CONTACT FORM CONFIGURATION
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_contact_form_email TEXT,
ADD COLUMN IF NOT EXISTS website_contact_form_subject TEXT DEFAULT 'Nuovo messaggio dal sito web',
ADD COLUMN IF NOT EXISTS website_contact_form_success_message TEXT DEFAULT 'Grazie per averci contattato! Ti risponderemo il prima possibile.';

-- 14. CONTACT FORM SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS contact_form_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. CREATE INDEXES FOR CONTACT FORM SUBMISSIONS
CREATE INDEX IF NOT EXISTS idx_contact_form_submissions_organization_id ON contact_form_submissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_contact_form_submissions_status ON contact_form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_form_submissions_submitted_at ON contact_form_submissions(submitted_at DESC);

-- 16. ENABLE ROW LEVEL SECURITY
ALTER TABLE contact_form_submissions ENABLE ROW LEVEL SECURITY;

-- 17. RLS POLICIES FOR CONTACT FORM SUBMISSIONS

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public to submit contact forms" ON contact_form_submissions;
DROP POLICY IF EXISTS "Allow organization members to view submissions" ON contact_form_submissions;
DROP POLICY IF EXISTS "Allow organization admins to update submissions" ON contact_form_submissions;
DROP POLICY IF EXISTS "Allow organization admins to delete submissions" ON contact_form_submissions;

-- Policy: Allow public to insert (submit contact form)
CREATE POLICY "Allow public to submit contact forms"
  ON contact_form_submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow organization members to view their own submissions
-- Policy: Allow anyone to submit contact forms (public access)
CREATE POLICY "Allow public contact form submissions"
  ON contact_form_submissions
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow organization members to view submissions
CREATE POLICY "Allow organization members to view submissions"
  ON contact_form_submissions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Allow organization admins to update submissions
CREATE POLICY "Allow organization admins to update submissions"
  ON contact_form_submissions
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT org_id
      FROM organization_users
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Policy: Allow organization admins to delete submissions
CREATE POLICY "Allow organization admins to delete submissions"
  ON contact_form_submissions
  FOR DELETE
  USING (
    organization_id IN (
      SELECT org_id
      FROM organization_users
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- ============================================
-- MIGRATION COMPLETATA! ✅
-- ============================================
-- Ora puoi usare:
-- - Palette colori globale con UI grafica
-- - Stile sezioni personalizzato per ogni sezione
-- - Font override per ogni sezione
-- - Form contatti con configurazione email
-- - Contatori animati nella sezione About
-- ============================================
-- Add Hero Override Fields (optional overrides for branding)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_hero_title_override TEXT,
ADD COLUMN IF NOT EXISTS website_hero_subtitle_override TEXT;
-- Add Hero Section styling columns
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_hero_enable_parallax BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS website_hero_enable_particles BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_hero_bg_type TEXT DEFAULT 'gradient',
ADD COLUMN IF NOT EXISTS website_hero_bg_color TEXT DEFAULT '#0f172a',
ADD COLUMN IF NOT EXISTS website_hero_bg_gradient_start TEXT DEFAULT '#0f172a',
ADD COLUMN IF NOT EXISTS website_hero_bg_gradient_end TEXT DEFAULT '#1e293b',
ADD COLUMN IF NOT EXISTS website_hero_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_hero_overlay_opacity NUMERIC DEFAULT 0.5;
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
-- Add Gallery Layout and Options
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_gallery_layout TEXT DEFAULT 'masonry',
ADD COLUMN IF NOT EXISTS website_gallery_enable_lightbox BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS website_gallery_enable_zoom BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS website_gallery_enable_captions BOOLEAN DEFAULT TRUE;
-- Add Section-Specific Styling Fields
-- Font overrides per section
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_hero_font TEXT,
ADD COLUMN IF NOT EXISTS website_about_font TEXT,
ADD COLUMN IF NOT EXISTS website_services_font TEXT,
ADD COLUMN IF NOT EXISTS website_gallery_font TEXT,
ADD COLUMN IF NOT EXISTS website_loyalty_font TEXT,
ADD COLUMN IF NOT EXISTS website_testimonials_font TEXT,
ADD COLUMN IF NOT EXISTS website_pricing_font TEXT,
ADD COLUMN IF NOT EXISTS website_team_font TEXT,
ADD COLUMN IF NOT EXISTS website_video_font TEXT,
ADD COLUMN IF NOT EXISTS website_contact_font TEXT;

-- Hero section styling (only text color, bg already exists)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_hero_text_color TEXT DEFAULT '#ffffff';

-- About section styling
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_about_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_about_bg_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_about_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_about_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_about_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_about_text_color TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_about_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_about_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_about_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_about_overlay_opacity NUMERIC DEFAULT 0.5;

-- Services section styling
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_services_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_services_bg_color TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_services_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_services_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_services_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_services_text_color TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_services_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_services_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_services_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_services_overlay_opacity NUMERIC DEFAULT 0.5;

-- Gallery section styling
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_gallery_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_gallery_bg_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_gallery_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_gallery_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_gallery_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_gallery_text_color TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_gallery_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_gallery_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_gallery_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_gallery_overlay_opacity NUMERIC DEFAULT 0.5;

-- Loyalty section styling
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_loyalty_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_loyalty_bg_color TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_loyalty_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_loyalty_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_loyalty_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_loyalty_text_color TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_loyalty_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_loyalty_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_loyalty_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_loyalty_overlay_opacity NUMERIC DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS website_loyalty_enable_particles BOOLEAN DEFAULT TRUE;

-- Testimonials section styling
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_testimonials_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_testimonials_bg_color TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_testimonials_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_testimonials_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_testimonials_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_testimonials_text_color TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_testimonials_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_testimonials_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_testimonials_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_testimonials_overlay_opacity NUMERIC DEFAULT 0.5;

-- Team section styling
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_team_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_team_bg_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_team_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_team_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_team_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_team_text_color TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_team_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_team_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_team_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_team_overlay_opacity NUMERIC DEFAULT 0.5;

-- Video section styling
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_video_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_video_bg_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_video_bg_gradient_start TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_video_bg_gradient_end TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_video_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_video_text_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_video_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_video_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_video_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_video_overlay_opacity NUMERIC DEFAULT 0.5;

-- Contact section styling
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_contact_bg_type TEXT DEFAULT 'color',
ADD COLUMN IF NOT EXISTS website_contact_bg_color TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_contact_bg_gradient_start TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_contact_bg_gradient_end TEXT DEFAULT '#e2e8f0',
ADD COLUMN IF NOT EXISTS website_contact_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_contact_text_color TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_contact_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_contact_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_contact_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_contact_overlay_opacity NUMERIC DEFAULT 0.5;
-- Add Global Typography & Colors
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_font_headings TEXT DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS website_font_body TEXT DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS website_color_text_primary TEXT DEFAULT '#1f2937',
ADD COLUMN IF NOT EXISTS website_color_text_secondary TEXT DEFAULT '#6b7280',
ADD COLUMN IF NOT EXISTS website_color_background_primary TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_color_background_secondary TEXT DEFAULT '#f9fafb';
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
-- Add Pricing Section columns (Price List with Categories)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_show_pricing BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_price_list_categories JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS website_pricing_title TEXT DEFAULT 'I Nostri Servizi',
ADD COLUMN IF NOT EXISTS website_pricing_subtitle TEXT DEFAULT 'Scopri i nostri servizi e i relativi prezzi',
ADD COLUMN IF NOT EXISTS website_pricing_layout TEXT DEFAULT 'vertical',
ADD COLUMN IF NOT EXISTS website_pricing_bg_type TEXT DEFAULT 'gradient',
ADD COLUMN IF NOT EXISTS website_pricing_bg_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_pricing_bg_gradient_start TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS website_pricing_bg_gradient_end TEXT DEFAULT '#f8fafc',
ADD COLUMN IF NOT EXISTS website_pricing_bg_image TEXT,
ADD COLUMN IF NOT EXISTS website_pricing_enable_parallax BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_pricing_enable_overlay BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS website_pricing_overlay_color TEXT DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS website_pricing_overlay_opacity NUMERIC DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS website_pricing_text_color TEXT DEFAULT '#1f2937';

-- Add GDPR Banner columns
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_show_gdpr_banner BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS website_privacy_policy_url TEXT,
ADD COLUMN IF NOT EXISTS website_cookie_policy_url TEXT,
ADD COLUMN IF NOT EXISTS website_gdpr_banner_position TEXT DEFAULT 'bottom',
ADD COLUMN IF NOT EXISTS website_gdpr_show_preferences BOOLEAN DEFAULT TRUE;
-- Add Contact Form Configuration Fields
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_contact_form_email TEXT,
ADD COLUMN IF NOT EXISTS website_contact_form_subject TEXT DEFAULT 'Nuovo messaggio dal sito web',
ADD COLUMN IF NOT EXISTS website_contact_form_success_message TEXT DEFAULT 'Grazie per averci contattato! Ti risponderemo il prima possibile.';
-- Create Contact Form Submissions Table
CREATE TABLE IF NOT EXISTS contact_form_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_form_submissions_organization_id ON contact_form_submissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_contact_form_submissions_status ON contact_form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_form_submissions_submitted_at ON contact_form_submissions(submitted_at DESC);

-- Enable RLS
ALTER TABLE contact_form_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to insert (submit contact form)
CREATE POLICY "Allow public to submit contact forms"
  ON contact_form_submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow organization members to view their own submissions
CREATE POLICY "Allow organization members to view submissions"
  ON contact_form_submissions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Allow organization admins to update submissions
CREATE POLICY "Allow organization admins to update submissions"
  ON contact_form_submissions
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Policy: Allow organization admins to delete submissions
CREATE POLICY "Allow organization admins to delete submissions"
  ON contact_form_submissions
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );
-- ============================================
-- FIX: Allow public users to submit contact forms
-- ============================================
-- This policy allows anyone (including anonymous users)
-- to insert contact form submissions into the database

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow public contact form submissions" ON contact_form_submissions;

-- Create policy to allow public INSERT
CREATE POLICY "Allow public contact form submissions"
  ON contact_form_submissions
  FOR INSERT
  WITH CHECK (true);

-- Verify RLS is enabled
ALTER TABLE contact_form_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Done! Now anyone can submit the contact form
-- ============================================
-- ============================================
-- ADD MAINTENANCE MODE TO WEBSITES
-- ============================================
-- This allows websites to show a "maintenance" page
-- instead of being completely disabled (404)

-- Add maintenance mode column to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_maintenance_mode boolean DEFAULT false;

-- Add maintenance message column (optional custom message)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_maintenance_message text;

-- Add estimated return time (optional)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_maintenance_until timestamptz;

-- Comment the columns
COMMENT ON COLUMN organizations.website_maintenance_mode IS 'When true, shows maintenance page instead of full website';
COMMENT ON COLUMN organizations.website_maintenance_message IS 'Custom message to show on maintenance page';
COMMENT ON COLUMN organizations.website_maintenance_until IS 'Estimated time when website will be back online';

-- ============================================
-- Now you have 3 states:
-- 1. website_enabled = true, maintenance_mode = false  → Site works normally
-- 2. website_enabled = true, maintenance_mode = true   → Shows maintenance page
-- 3. website_enabled = false                           → Shows 404 / Not found
-- ============================================
