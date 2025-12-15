-- Migration: Digital Signage CMS System
-- Description: Complete CMS for managing digital signage content, templates, playlists
-- Features: Media library, custom slides, templates, scheduling

-- =====================================================
-- 1. MEDIA LIBRARY (Images, Videos, Files)
-- =====================================================

CREATE TABLE IF NOT EXISTS signage_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'pdf'
    mime_type VARCHAR(100),
    file_url TEXT NOT NULL, -- Supabase Storage URL
    file_size BIGINT, -- in bytes
    width INTEGER,
    height INTEGER,
    duration INTEGER, -- for videos, in seconds
    thumbnail_url TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    tags TEXT[], -- for search/filtering
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_signage_media_org ON signage_media(organization_id);
CREATE INDEX idx_signage_media_type ON signage_media(file_type);
CREATE INDEX idx_signage_media_tags ON signage_media USING GIN(tags);

-- =====================================================
-- 2. SLIDE TEMPLATES (Pre-built and Custom)
-- =====================================================

CREATE TABLE IF NOT EXISTS signage_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL = global template
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- 'menu', 'promo', 'announcement', 'social', 'custom'
    thumbnail_url TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE, -- Can other orgs use it?
    layout_config JSONB NOT NULL, -- Layout structure (zones, positions)
    default_content JSONB, -- Default content for the template
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_signage_templates_org ON signage_templates(organization_id);
CREATE INDEX idx_signage_templates_category ON signage_templates(category);
CREATE INDEX idx_signage_templates_public ON signage_templates(is_public) WHERE is_public = TRUE;

-- =====================================================
-- 3. SLIDES (Instances of templates with content)
-- =====================================================

CREATE TABLE IF NOT EXISTS signage_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    template_id UUID REFERENCES signage_templates(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB NOT NULL, -- Actual content (text, images, videos, data sources)
    duration INTEGER DEFAULT 10, -- Display duration in seconds
    transition_type VARCHAR(50) DEFAULT 'fade', -- 'fade', 'slide', 'zoom', 'none'
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_signage_slides_org ON signage_slides(organization_id);
CREATE INDEX idx_signage_slides_active ON signage_slides(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_signage_slides_order ON signage_slides(display_order);

-- =====================================================
-- 4. PLAYLISTS (Groups of slides with scheduling)
-- =====================================================

CREATE TABLE IF NOT EXISTS signage_playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE, -- Default playlist when no schedule matches
    loop_enabled BOOLEAN DEFAULT TRUE,
    shuffle_enabled BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_signage_playlists_org ON signage_playlists(organization_id);
CREATE INDEX idx_signage_playlists_active ON signage_playlists(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_signage_playlists_default ON signage_playlists(is_default) WHERE is_default = TRUE;

-- =====================================================
-- 5. PLAYLIST ITEMS (Slides in playlists)
-- =====================================================

CREATE TABLE IF NOT EXISTS signage_playlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID NOT NULL REFERENCES signage_playlists(id) ON DELETE CASCADE,
    slide_id UUID REFERENCES signage_slides(id) ON DELETE CASCADE,
    slide_type VARCHAR(50) NOT NULL, -- 'custom', 'leaderboard', 'lottery', 'rewards', etc.
    display_order INTEGER NOT NULL,
    duration_override INTEGER, -- Override slide's default duration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_playlist_items_playlist ON signage_playlist_items(playlist_id);
CREATE INDEX idx_playlist_items_order ON signage_playlist_items(playlist_id, display_order);

-- =====================================================
-- 6. PLAYLIST SCHEDULES (When to show playlists)
-- =====================================================

CREATE TABLE IF NOT EXISTS signage_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID NOT NULL REFERENCES signage_playlists(id) ON DELETE CASCADE,
    device_id UUID REFERENCES tv_devices(id) ON DELETE CASCADE, -- NULL = all devices
    name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    days_of_week INTEGER[], -- 0=Sunday, 1=Monday, etc. NULL = all days
    start_time TIME,
    end_time TIME,
    priority INTEGER DEFAULT 0, -- Higher priority takes precedence
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_signage_schedules_playlist ON signage_schedules(playlist_id);
CREATE INDEX idx_signage_schedules_device ON signage_schedules(device_id);
CREATE INDEX idx_signage_schedules_active ON signage_schedules(is_active) WHERE is_active = TRUE;

-- =====================================================
-- 7. DISPLAY ANALYTICS
-- =====================================================

CREATE TABLE IF NOT EXISTS signage_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES tv_devices(id) ON DELETE CASCADE,
    slide_id UUID REFERENCES signage_slides(id) ON DELETE SET NULL,
    playlist_id UUID REFERENCES signage_playlists(id) ON DELETE SET NULL,
    displayed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_shown INTEGER, -- Actual seconds displayed
    viewer_count INTEGER, -- If you add people counting later
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_signage_analytics_device ON signage_analytics(device_id);
CREATE INDEX idx_signage_analytics_slide ON signage_analytics(slide_id);
CREATE INDEX idx_signage_analytics_date ON signage_analytics(displayed_at);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Media
ALTER TABLE signage_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's media"
    ON signage_media FOR SELECT
    USING (organization_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can upload media to their organization"
    ON signage_media FOR INSERT
    WITH CHECK (organization_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their organization's media"
    ON signage_media FOR UPDATE
    USING (organization_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their organization's media"
    ON signage_media FOR DELETE
    USING (organization_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid()));

-- Templates
ALTER TABLE signage_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public templates or their own"
    ON signage_templates FOR SELECT
    USING (
        is_public = TRUE OR
        organization_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create templates for their organization"
    ON signage_templates FOR INSERT
    WITH CHECK (organization_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid()));

-- Slides
ALTER TABLE signage_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's slides"
    ON signage_slides FOR SELECT
    USING (organization_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can create slides for their organization"
    ON signage_slides FOR INSERT
    WITH CHECK (organization_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their organization's slides"
    ON signage_slides FOR UPDATE
    USING (organization_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their organization's slides"
    ON signage_slides FOR DELETE
    USING (organization_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid()));

-- Playlists
ALTER TABLE signage_playlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their organization's playlists"
    ON signage_playlists FOR ALL
    USING (organization_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid()));

-- Playlist Items
ALTER TABLE signage_playlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage playlist items"
    ON signage_playlist_items FOR ALL
    USING (
        playlist_id IN (
            SELECT id FROM signage_playlists
            WHERE organization_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid())
        )
    );

-- Schedules
ALTER TABLE signage_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage schedules"
    ON signage_schedules FOR ALL
    USING (
        playlist_id IN (
            SELECT id FROM signage_playlists
            WHERE organization_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid())
        )
    );

-- Analytics (Read-only for users)
ALTER TABLE signage_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analytics for their devices"
    ON signage_analytics FOR SELECT
    USING (
        device_id IN (
            SELECT id FROM tv_devices
            WHERE organization_id IN (SELECT org_id FROM organization_users WHERE user_id = auth.uid())
        )
    );

-- Allow devices to insert analytics
CREATE POLICY "Devices can insert analytics"
    ON signage_analytics FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get active playlist for a device at current time
CREATE OR REPLACE FUNCTION get_active_playlist(p_device_id UUID)
RETURNS UUID AS $$
DECLARE
    v_playlist_id UUID;
    v_org_id UUID;
BEGIN
    -- Get device's organization
    SELECT organization_id INTO v_org_id
    FROM tv_devices
    WHERE id = p_device_id;

    -- Find matching schedule (highest priority)
    SELECT s.playlist_id INTO v_playlist_id
    FROM signage_schedules s
    JOIN signage_playlists p ON s.playlist_id = p.id
    WHERE s.is_active = TRUE
    AND p.organization_id = v_org_id
    AND (s.device_id = p_device_id OR s.device_id IS NULL)
    AND (s.start_date IS NULL OR s.start_date <= CURRENT_DATE)
    AND (s.end_date IS NULL OR s.end_date >= CURRENT_DATE)
    AND (s.days_of_week IS NULL OR EXTRACT(DOW FROM CURRENT_DATE)::INTEGER = ANY(s.days_of_week))
    AND (s.start_time IS NULL OR s.start_time <= CURRENT_TIME)
    AND (s.end_time IS NULL OR s.end_time >= CURRENT_TIME)
    ORDER BY s.priority DESC, s.created_at DESC
    LIMIT 1;

    -- If no schedule matches, return default playlist
    IF v_playlist_id IS NULL THEN
        SELECT id INTO v_playlist_id
        FROM signage_playlists
        WHERE organization_id = v_org_id
        AND is_default = TRUE
        AND is_active = TRUE
        LIMIT 1;
    END IF;

    RETURN v_playlist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get playlist content
CREATE OR REPLACE FUNCTION get_playlist_content(p_playlist_id UUID)
RETURNS TABLE(
    slide_id UUID,
    slide_type VARCHAR(50),
    content JSONB,
    duration INTEGER,
    transition_type VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(s.id, pi.slide_id) as slide_id,
        pi.slide_type,
        COALESCE(s.content, '{}'::jsonb) as content,
        COALESCE(pi.duration_override, s.duration, 10) as duration,
        COALESCE(s.transition_type, 'fade') as transition_type
    FROM signage_playlist_items pi
    LEFT JOIN signage_slides s ON pi.slide_id = s.id
    WHERE pi.playlist_id = p_playlist_id
    ORDER BY pi.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_signage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER signage_media_updated_at
    BEFORE UPDATE ON signage_media
    FOR EACH ROW EXECUTE FUNCTION update_signage_updated_at();

CREATE TRIGGER signage_templates_updated_at
    BEFORE UPDATE ON signage_templates
    FOR EACH ROW EXECUTE FUNCTION update_signage_updated_at();

CREATE TRIGGER signage_slides_updated_at
    BEFORE UPDATE ON signage_slides
    FOR EACH ROW EXECUTE FUNCTION update_signage_updated_at();

CREATE TRIGGER signage_playlists_updated_at
    BEFORE UPDATE ON signage_playlists
    FOR EACH ROW EXECUTE FUNCTION update_signage_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE signage_media IS 'Media library for digital signage (images, videos, files)';
COMMENT ON TABLE signage_templates IS 'Slide templates (pre-built and custom)';
COMMENT ON TABLE signage_slides IS 'Individual slides with content';
COMMENT ON TABLE signage_playlists IS 'Playlists grouping slides';
COMMENT ON TABLE signage_playlist_items IS 'Slides within playlists';
COMMENT ON TABLE signage_schedules IS 'Schedule when playlists should play';
COMMENT ON TABLE signage_analytics IS 'Analytics for displayed content';
