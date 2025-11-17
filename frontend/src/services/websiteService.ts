import { supabase } from '../lib/supabase'

export interface WebsiteConfig {
  // Main settings
  website_enabled: boolean
  website_template: 'modern' | 'classic' | 'minimal' | 'bold'

  // Content
  website_description?: string
  website_hero_title_override?: string  // Override del nome organizzazione
  website_hero_subtitle_override?: string  // Override del tagline organizzazione
  website_hero_image?: string
  website_hero_subtitle?: string  // Deprecated - usare hero_subtitle_override
  website_hero_enable_parallax?: boolean
  website_hero_enable_particles?: boolean
  website_hero_bg_type?: string
  website_hero_bg_color?: string
  website_hero_bg_gradient_start?: string
  website_hero_bg_gradient_end?: string
  website_hero_overlay_color?: string
  website_hero_overlay_opacity?: number
  website_gallery?: string[]
  website_gallery_layout?: 'masonry' | 'grid' | 'carousel'
  website_gallery_enable_lightbox?: boolean
  website_gallery_enable_zoom?: boolean
  website_gallery_enable_captions?: boolean
  website_opening_hours?: {
    [key: string]: { open: string; close: string; closed?: boolean }
  }
  website_video_url?: string
  website_testimonials?: Array<{
    name: string
    text: string
    rating: number
    image?: string
  }>
  website_services?: Array<{
    title: string
    description: string
    icon?: string
    price?: string
  }>
  website_team?: Array<{
    name: string
    role: string
    image?: string
    bio?: string
  }>
  website_custom_sections?: Array<{
    title: string
    content: string
    order: number
  }>
  website_price_list_categories?: Array<{
    id: string
    name: string
    description?: string
    items: Array<{
      id: string
      name: string
      description?: string
      price: string
      duration?: string
      image?: string
    }>
  }>
  website_pricing_layout?: 'vertical' | 'horizontal'
  website_pricing_title?: string
  website_pricing_subtitle?: string
  website_pricing_bg_type?: string
  website_pricing_bg_color?: string
  website_pricing_bg_gradient_start?: string
  website_pricing_bg_gradient_end?: string
  website_pricing_bg_image?: string
  website_pricing_enable_parallax?: boolean
  website_pricing_enable_overlay?: boolean
  website_pricing_overlay_color?: string
  website_pricing_overlay_opacity?: number
  website_pricing_text_color?: string

  // Toggles
  website_show_pricing?: boolean
  website_show_hero: boolean
  website_show_about: boolean
  website_show_services: boolean
  website_show_gallery: boolean
  website_show_loyalty: boolean
  website_show_testimonials: boolean
  website_show_team: boolean
  website_show_video: boolean
  website_show_map: boolean
  website_show_contact_form: boolean

  // Featured
  website_featured_rewards?: string[]

  // SEO
  website_meta_title?: string
  website_meta_description?: string
  website_meta_keywords?: string
  website_og_image?: string
  website_favicon_url?: string
  website_google_analytics_id?: string
  website_google_tag_manager_id?: string
  website_facebook_pixel_id?: string

  // Typography & Colors
  website_font_headings?: string
  website_font_body?: string
  website_color_text_primary?: string
  website_color_text_secondary?: string
  website_color_background_primary?: string
  website_color_background_secondary?: string

  // Button Styling
  website_button_bg_color?: string
  website_button_text_color?: string
  website_button_border_radius?: string
  website_button_border_width?: string
  website_button_border_color?: string
  website_button_hover_bg_color?: string
  website_button_hover_text_color?: string
  website_button_padding?: string
  website_button_font_weight?: string

  // Section-specific font overrides
  website_hero_font?: string
  website_about_font?: string
  website_services_font?: string
  website_gallery_font?: string
  website_loyalty_font?: string
  website_testimonials_font?: string
  website_pricing_font?: string
  website_team_font?: string
  website_video_font?: string
  website_contact_font?: string

  // Section-specific styling (bg, text, effects)
  website_hero_text_color?: string
  website_about_bg_type?: string
  website_about_bg_color?: string
  website_about_bg_gradient_start?: string
  website_about_bg_gradient_end?: string
  website_about_bg_image?: string
  website_about_text_color?: string
  website_about_enable_parallax?: boolean
  website_about_enable_overlay?: boolean
  website_about_overlay_color?: string
  website_about_overlay_opacity?: number

  website_services_bg_type?: string
  website_services_bg_color?: string
  website_services_bg_gradient_start?: string
  website_services_bg_gradient_end?: string
  website_services_bg_image?: string
  website_services_text_color?: string
  website_services_enable_parallax?: boolean
  website_services_enable_overlay?: boolean
  website_services_overlay_color?: string
  website_services_overlay_opacity?: number

  website_gallery_bg_type?: string
  website_gallery_bg_color?: string
  website_gallery_bg_gradient_start?: string
  website_gallery_bg_gradient_end?: string
  website_gallery_bg_image?: string
  website_gallery_text_color?: string
  website_gallery_enable_parallax?: boolean
  website_gallery_enable_overlay?: boolean
  website_gallery_overlay_color?: string
  website_gallery_overlay_opacity?: number

  website_loyalty_bg_type?: string
  website_loyalty_bg_color?: string
  website_loyalty_bg_gradient_start?: string
  website_loyalty_bg_gradient_end?: string
  website_loyalty_bg_image?: string
  website_loyalty_text_color?: string
  website_loyalty_enable_parallax?: boolean
  website_loyalty_enable_overlay?: boolean
  website_loyalty_overlay_color?: string
  website_loyalty_overlay_opacity?: number
  website_loyalty_enable_particles?: boolean

  website_testimonials_bg_type?: string
  website_testimonials_bg_color?: string
  website_testimonials_bg_gradient_start?: string
  website_testimonials_bg_gradient_end?: string
  website_testimonials_bg_image?: string
  website_testimonials_text_color?: string
  website_testimonials_enable_parallax?: boolean
  website_testimonials_enable_overlay?: boolean
  website_testimonials_overlay_color?: string
  website_testimonials_overlay_opacity?: number

  website_team_bg_type?: string
  website_team_bg_color?: string
  website_team_bg_gradient_start?: string
  website_team_bg_gradient_end?: string
  website_team_bg_image?: string
  website_team_text_color?: string
  website_team_enable_parallax?: boolean
  website_team_enable_overlay?: boolean
  website_team_overlay_color?: string
  website_team_overlay_opacity?: number

  website_video_bg_type?: string
  website_video_bg_color?: string
  website_video_bg_gradient_start?: string
  website_video_bg_gradient_end?: string
  website_video_bg_image?: string
  website_video_text_color?: string
  website_video_enable_parallax?: boolean
  website_video_enable_overlay?: boolean
  website_video_overlay_color?: string
  website_video_overlay_opacity?: number

  website_contact_bg_type?: string
  website_contact_bg_color?: string
  website_contact_bg_gradient_start?: string
  website_contact_bg_gradient_end?: string
  website_contact_bg_image?: string
  website_contact_text_color?: string
  website_contact_enable_parallax?: boolean
  website_contact_enable_overlay?: boolean
  website_contact_overlay_color?: string
  website_contact_overlay_opacity?: number

  // Custom
  website_custom_css?: string

  // GDPR
  website_show_gdpr_banner?: boolean
  website_privacy_policy_url?: string
  website_cookie_policy_url?: string
  website_gdpr_banner_position?: string
  website_gdpr_show_preferences?: boolean

  // Contact Form
  website_contact_form_email?: string
  website_contact_form_subject?: string
  website_contact_form_success_message?: string

  // Maintenance Mode
  website_maintenance_mode?: boolean
  website_maintenance_message?: string
  website_maintenance_until?: string
}

export interface OrganizationWebsite {
  id: string
  name: string
  slug: string
  logo_url?: string
  primary_color: string
  secondary_color: string
  tagline?: string
  industry?: string

  // Contact info
  email?: string
  phone?: string
  address?: string
  city?: string
  postal_code?: string
  website?: string

  // Social
  facebook_url?: string
  instagram_url?: string
  twitter_url?: string
  linkedin_url?: string
  youtube_url?: string
  tiktok_url?: string

  // Loyalty
  points_name?: string
  points_per_euro?: number
  reward_threshold?: number
  welcome_bonus?: number

  // Website config
  websiteConfig: WebsiteConfig
}

class WebsiteService {
  /**
   * Get organization website data by slug (public access)
   */
  async getPublicWebsite(slug: string): Promise<OrganizationWebsite | null> {
    try {
      console.log('🔍 Loading website for slug:', slug)
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          id, name, slug, logo_url, primary_color, secondary_color, tagline, slogan, industry,
          email, phone, address, city, postal_code, website,
          facebook_url, instagram_url, twitter_url, linkedin_url, youtube_url, tiktok_url,
          points_name, points_per_euro, reward_threshold, welcome_bonus,
          website_enabled, website_template, website_description, website_hero_image,
          website_maintenance_mode, website_maintenance_message, website_maintenance_until,
          website_hero_title_override, website_hero_subtitle_override,
          website_hero_subtitle, website_hero_enable_parallax, website_hero_enable_particles,
          website_hero_bg_type, website_hero_bg_color, website_hero_bg_gradient_start, website_hero_bg_gradient_end,
          website_hero_overlay_color, website_hero_overlay_opacity,
          website_gallery, website_gallery_layout, website_gallery_enable_lightbox,
          website_gallery_enable_zoom, website_gallery_enable_captions,
          website_opening_hours, website_video_url,
          website_testimonials, website_services, website_team, website_custom_sections,
          website_price_list_categories, website_pricing_layout, website_pricing_title, website_pricing_subtitle,
          website_pricing_bg_type, website_pricing_bg_color, website_pricing_bg_gradient_start, website_pricing_bg_gradient_end,
          website_pricing_bg_image, website_pricing_enable_parallax, website_pricing_enable_overlay,
          website_pricing_overlay_color, website_pricing_overlay_opacity, website_pricing_text_color,
          website_show_hero, website_show_about, website_show_services, website_show_gallery,
          website_show_loyalty, website_show_testimonials, website_show_team, website_show_video,
          website_show_map, website_show_contact_form, website_show_pricing, website_featured_rewards,
          website_meta_title, website_meta_description, website_meta_keywords,
          website_og_image, website_favicon_url, website_google_analytics_id,
          website_google_tag_manager_id, website_facebook_pixel_id,
          website_font_headings, website_font_body,
          website_color_text_primary, website_color_text_secondary,
          website_color_background_primary, website_color_background_secondary,
          website_button_bg_color, website_button_text_color, website_button_border_radius,
          website_button_border_width, website_button_border_color, website_button_hover_bg_color,
          website_button_hover_text_color, website_button_padding, website_button_font_weight,
          website_hero_font, website_about_font, website_services_font, website_gallery_font,
          website_loyalty_font, website_testimonials_font, website_pricing_font, website_team_font,
          website_video_font, website_contact_font,
          website_hero_text_color,
          website_about_bg_type, website_about_bg_color, website_about_bg_gradient_start, website_about_bg_gradient_end,
          website_about_bg_image, website_about_text_color, website_about_enable_parallax, website_about_enable_overlay,
          website_about_overlay_color, website_about_overlay_opacity,
          website_services_bg_type, website_services_bg_color, website_services_bg_gradient_start, website_services_bg_gradient_end,
          website_services_bg_image, website_services_text_color, website_services_enable_parallax, website_services_enable_overlay,
          website_services_overlay_color, website_services_overlay_opacity,
          website_gallery_bg_type, website_gallery_bg_color, website_gallery_bg_gradient_start, website_gallery_bg_gradient_end,
          website_gallery_bg_image, website_gallery_text_color, website_gallery_enable_parallax, website_gallery_enable_overlay,
          website_gallery_overlay_color, website_gallery_overlay_opacity,
          website_loyalty_bg_type, website_loyalty_bg_color, website_loyalty_bg_gradient_start, website_loyalty_bg_gradient_end,
          website_loyalty_bg_image, website_loyalty_text_color, website_loyalty_enable_parallax, website_loyalty_enable_overlay,
          website_loyalty_overlay_color, website_loyalty_overlay_opacity, website_loyalty_enable_particles,
          website_testimonials_bg_type, website_testimonials_bg_color, website_testimonials_bg_gradient_start, website_testimonials_bg_gradient_end,
          website_testimonials_bg_image, website_testimonials_text_color, website_testimonials_enable_parallax, website_testimonials_enable_overlay,
          website_testimonials_overlay_color, website_testimonials_overlay_opacity,
          website_team_bg_type, website_team_bg_color, website_team_bg_gradient_start, website_team_bg_gradient_end,
          website_team_bg_image, website_team_text_color, website_team_enable_parallax, website_team_enable_overlay,
          website_team_overlay_color, website_team_overlay_opacity,
          website_video_bg_type, website_video_bg_color, website_video_bg_gradient_start, website_video_bg_gradient_end,
          website_video_bg_image, website_video_text_color, website_video_enable_parallax, website_video_enable_overlay,
          website_video_overlay_color, website_video_overlay_opacity,
          website_contact_bg_type, website_contact_bg_color, website_contact_bg_gradient_start, website_contact_bg_gradient_end,
          website_contact_bg_image, website_contact_text_color, website_contact_enable_parallax, website_contact_enable_overlay,
          website_contact_overlay_color, website_contact_overlay_opacity,
          website_custom_css,
          website_show_gdpr_banner, website_privacy_policy_url, website_cookie_policy_url,
          website_gdpr_banner_position, website_gdpr_show_preferences,
          website_contact_form_email, website_contact_form_subject, website_contact_form_success_message
        `)
        .eq('slug', slug)
        .eq('website_enabled', true)
        .single()

      if (error || !data) {
        console.error('Website not found:', error)
        return null
      }

      console.log('📊 Database values loaded:', {
        name: data.name,
        tagline: data.tagline,
        slogan: data.slogan,
        website_hero_title_override: data.website_hero_title_override,
        website_hero_subtitle_override: data.website_hero_subtitle_override
      })

      // Transform to OrganizationWebsite format
      const websiteConfig: WebsiteConfig = {
        website_enabled: data.website_enabled,
        website_template: data.website_template || 'modern',
        website_description: data.website_description,
        website_hero_image: data.website_hero_image,
        website_hero_title_override: data.website_hero_title_override,
        website_hero_subtitle_override: data.website_hero_subtitle_override,
        website_hero_subtitle: data.website_hero_subtitle || data.website_hero_subtitle_override,  // Fallback per retrocompatibilità
        website_hero_enable_parallax: data.website_hero_enable_parallax ?? true,
        website_hero_enable_particles: data.website_hero_enable_particles ?? false,
        website_hero_bg_type: data.website_hero_bg_type || 'gradient',
        website_hero_bg_color: data.website_hero_bg_color || '#0f172a',
        website_hero_bg_gradient_start: data.website_hero_bg_gradient_start || '#0f172a',
        website_hero_bg_gradient_end: data.website_hero_bg_gradient_end || '#1e293b',
        website_hero_overlay_color: data.website_hero_overlay_color || '#000000',
        website_hero_overlay_opacity: data.website_hero_overlay_opacity ?? 0.5,
        website_gallery: data.website_gallery || [],
        website_gallery_layout: data.website_gallery_layout || 'masonry',
        website_gallery_enable_lightbox: data.website_gallery_enable_lightbox ?? true,
        website_gallery_enable_zoom: data.website_gallery_enable_zoom ?? true,
        website_gallery_enable_captions: data.website_gallery_enable_captions ?? true,
        website_opening_hours: data.website_opening_hours || {},
        website_video_url: data.website_video_url,
        website_testimonials: data.website_testimonials || [],
        website_services: data.website_services || [],
        website_team: data.website_team || [],
        website_custom_sections: data.website_custom_sections || [],
        website_price_list_categories: data.website_price_list_categories || [],
        website_pricing_layout: data.website_pricing_layout || 'vertical',
        website_pricing_title: data.website_pricing_title || 'I Nostri Servizi',
        website_pricing_subtitle: data.website_pricing_subtitle || '',
        website_pricing_bg_type: data.website_pricing_bg_type || 'gradient',
        website_pricing_bg_color: data.website_pricing_bg_color || '#ffffff',
        website_pricing_bg_gradient_start: data.website_pricing_bg_gradient_start || '#ffffff',
        website_pricing_bg_gradient_end: data.website_pricing_bg_gradient_end || '#f8fafc',
        website_pricing_bg_image: data.website_pricing_bg_image,
        website_pricing_enable_parallax: data.website_pricing_enable_parallax || false,
        website_pricing_enable_overlay: data.website_pricing_enable_overlay || false,
        website_pricing_overlay_color: data.website_pricing_overlay_color || '#000000',
        website_pricing_overlay_opacity: data.website_pricing_overlay_opacity || 0.5,
        website_pricing_text_color: data.website_pricing_text_color || '#1f2937',
        website_show_hero: data.website_show_hero ?? true,
        website_show_about: data.website_show_about ?? true,
        website_show_services: data.website_show_services ?? true,
        website_show_gallery: data.website_show_gallery ?? true,
        website_show_loyalty: data.website_show_loyalty ?? true,
        website_show_testimonials: data.website_show_testimonials ?? true,
        website_show_team: data.website_show_team ?? false,
        website_show_video: data.website_show_video ?? false,
        website_show_map: data.website_show_map ?? true,
        website_show_contact_form: data.website_show_contact_form ?? true,
        website_show_pricing: data.website_show_pricing ?? false,
        website_featured_rewards: data.website_featured_rewards || [],
        website_meta_title: data.website_meta_title,
        website_meta_description: data.website_meta_description,
        website_meta_keywords: data.website_meta_keywords,
        website_og_image: data.website_og_image,
        website_favicon_url: data.website_favicon_url,
        website_google_analytics_id: data.website_google_analytics_id,
        website_google_tag_manager_id: data.website_google_tag_manager_id,
        website_facebook_pixel_id: data.website_facebook_pixel_id,
        website_font_headings: data.website_font_headings || 'Inter',
        website_font_body: data.website_font_body || 'Inter',
        website_color_text_primary: data.website_color_text_primary || '#1f2937',
        website_color_text_secondary: data.website_color_text_secondary || '#6b7280',
        website_color_background_primary: data.website_color_background_primary || '#ffffff',
        website_color_background_secondary: data.website_color_background_secondary || '#f9fafb',
        website_button_bg_color: data.website_button_bg_color || '#ef4444',
        website_button_text_color: data.website_button_text_color || '#ffffff',
        website_button_border_radius: data.website_button_border_radius || '8px',
        website_button_border_width: data.website_button_border_width || '0px',
        website_button_border_color: data.website_button_border_color || '#ef4444',
        website_button_hover_bg_color: data.website_button_hover_bg_color || '#dc2626',
        website_button_hover_text_color: data.website_button_hover_text_color || '#ffffff',
        website_button_padding: data.website_button_padding || '12px 24px',
        website_button_font_weight: data.website_button_font_weight || '600',

        // Section-specific font overrides
        website_hero_font: data.website_hero_font,
        website_about_font: data.website_about_font,
        website_services_font: data.website_services_font,
        website_gallery_font: data.website_gallery_font,
        website_loyalty_font: data.website_loyalty_font,
        website_testimonials_font: data.website_testimonials_font,
        website_pricing_font: data.website_pricing_font,
        website_team_font: data.website_team_font,
        website_video_font: data.website_video_font,
        website_contact_font: data.website_contact_font,

        // Section-specific styling
        website_hero_text_color: data.website_hero_text_color || '#ffffff',

        website_about_bg_type: data.website_about_bg_type || 'color',
        website_about_bg_color: data.website_about_bg_color || '#ffffff',
        website_about_bg_gradient_start: data.website_about_bg_gradient_start || '#f8fafc',
        website_about_bg_gradient_end: data.website_about_bg_gradient_end || '#e2e8f0',
        website_about_bg_image: data.website_about_bg_image,
        website_about_text_color: data.website_about_text_color || '#1f2937',
        website_about_enable_parallax: data.website_about_enable_parallax ?? false,
        website_about_enable_overlay: data.website_about_enable_overlay ?? false,
        website_about_overlay_color: data.website_about_overlay_color || '#000000',
        website_about_overlay_opacity: data.website_about_overlay_opacity ?? 0.5,

        website_services_bg_type: data.website_services_bg_type || 'color',
        website_services_bg_color: data.website_services_bg_color || '#f8fafc',
        website_services_bg_gradient_start: data.website_services_bg_gradient_start || '#f8fafc',
        website_services_bg_gradient_end: data.website_services_bg_gradient_end || '#e2e8f0',
        website_services_bg_image: data.website_services_bg_image,
        website_services_text_color: data.website_services_text_color || '#1f2937',
        website_services_enable_parallax: data.website_services_enable_parallax ?? false,
        website_services_enable_overlay: data.website_services_enable_overlay ?? false,
        website_services_overlay_color: data.website_services_overlay_color || '#000000',
        website_services_overlay_opacity: data.website_services_overlay_opacity ?? 0.5,

        website_gallery_bg_type: data.website_gallery_bg_type || 'color',
        website_gallery_bg_color: data.website_gallery_bg_color || '#ffffff',
        website_gallery_bg_gradient_start: data.website_gallery_bg_gradient_start || '#f8fafc',
        website_gallery_bg_gradient_end: data.website_gallery_bg_gradient_end || '#e2e8f0',
        website_gallery_bg_image: data.website_gallery_bg_image,
        website_gallery_text_color: data.website_gallery_text_color || '#1f2937',
        website_gallery_enable_parallax: data.website_gallery_enable_parallax ?? false,
        website_gallery_enable_overlay: data.website_gallery_enable_overlay ?? false,
        website_gallery_overlay_color: data.website_gallery_overlay_color || '#000000',
        website_gallery_overlay_opacity: data.website_gallery_overlay_opacity ?? 0.5,

        website_loyalty_bg_type: data.website_loyalty_bg_type || 'color',
        website_loyalty_bg_color: data.website_loyalty_bg_color || '#f8fafc',
        website_loyalty_bg_gradient_start: data.website_loyalty_bg_gradient_start || '#f8fafc',
        website_loyalty_bg_gradient_end: data.website_loyalty_bg_gradient_end || '#e2e8f0',
        website_loyalty_bg_image: data.website_loyalty_bg_image,
        website_loyalty_text_color: data.website_loyalty_text_color || '#1f2937',
        website_loyalty_enable_parallax: data.website_loyalty_enable_parallax ?? false,
        website_loyalty_enable_overlay: data.website_loyalty_enable_overlay ?? false,
        website_loyalty_overlay_color: data.website_loyalty_overlay_color || '#000000',
        website_loyalty_overlay_opacity: data.website_loyalty_overlay_opacity ?? 0.5,
        website_loyalty_enable_particles: data.website_loyalty_enable_particles ?? true,

        website_testimonials_bg_type: data.website_testimonials_bg_type || 'color',
        website_testimonials_bg_color: data.website_testimonials_bg_color || '#f8fafc',
        website_testimonials_bg_gradient_start: data.website_testimonials_bg_gradient_start || '#f8fafc',
        website_testimonials_bg_gradient_end: data.website_testimonials_bg_gradient_end || '#e2e8f0',
        website_testimonials_bg_image: data.website_testimonials_bg_image,
        website_testimonials_text_color: data.website_testimonials_text_color || '#1f2937',
        website_testimonials_enable_parallax: data.website_testimonials_enable_parallax ?? false,
        website_testimonials_enable_overlay: data.website_testimonials_enable_overlay ?? false,
        website_testimonials_overlay_color: data.website_testimonials_overlay_color || '#000000',
        website_testimonials_overlay_opacity: data.website_testimonials_overlay_opacity ?? 0.5,

        website_team_bg_type: data.website_team_bg_type || 'color',
        website_team_bg_color: data.website_team_bg_color || '#ffffff',
        website_team_bg_gradient_start: data.website_team_bg_gradient_start || '#f8fafc',
        website_team_bg_gradient_end: data.website_team_bg_gradient_end || '#e2e8f0',
        website_team_bg_image: data.website_team_bg_image,
        website_team_text_color: data.website_team_text_color || '#1f2937',
        website_team_enable_parallax: data.website_team_enable_parallax ?? false,
        website_team_enable_overlay: data.website_team_enable_overlay ?? false,
        website_team_overlay_color: data.website_team_overlay_color || '#000000',
        website_team_overlay_opacity: data.website_team_overlay_opacity ?? 0.5,

        website_video_bg_type: data.website_video_bg_type || 'color',
        website_video_bg_color: data.website_video_bg_color || '#000000',
        website_video_bg_gradient_start: data.website_video_bg_gradient_start || '#000000',
        website_video_bg_gradient_end: data.website_video_bg_gradient_end || '#1f2937',
        website_video_bg_image: data.website_video_bg_image,
        website_video_text_color: data.website_video_text_color || '#ffffff',
        website_video_enable_parallax: data.website_video_enable_parallax ?? false,
        website_video_enable_overlay: data.website_video_enable_overlay ?? false,
        website_video_overlay_color: data.website_video_overlay_color || '#000000',
        website_video_overlay_opacity: data.website_video_overlay_opacity ?? 0.5,

        website_contact_bg_type: data.website_contact_bg_type || 'color',
        website_contact_bg_color: data.website_contact_bg_color || '#f8fafc',
        website_contact_bg_gradient_start: data.website_contact_bg_gradient_start || '#f8fafc',
        website_contact_bg_gradient_end: data.website_contact_bg_gradient_end || '#e2e8f0',
        website_contact_bg_image: data.website_contact_bg_image,
        website_contact_text_color: data.website_contact_text_color || '#1f2937',
        website_contact_enable_parallax: data.website_contact_enable_parallax ?? false,
        website_contact_enable_overlay: data.website_contact_enable_overlay ?? false,
        website_contact_overlay_color: data.website_contact_overlay_color || '#000000',
        website_contact_overlay_opacity: data.website_contact_overlay_opacity ?? 0.5,

        website_custom_css: data.website_custom_css,
        website_show_gdpr_banner: data.website_show_gdpr_banner ?? true,
        website_privacy_policy_url: data.website_privacy_policy_url,
        website_cookie_policy_url: data.website_cookie_policy_url,
        website_gdpr_banner_position: data.website_gdpr_banner_position || 'bottom',
        website_gdpr_show_preferences: data.website_gdpr_show_preferences ?? true,
        website_contact_form_email: data.website_contact_form_email,
        website_contact_form_subject: data.website_contact_form_subject || 'Nuovo messaggio dal sito web',
        website_contact_form_success_message: data.website_contact_form_success_message || 'Grazie per averci contattato! Ti risponderemo il prima possibile.',

        // Maintenance mode
        website_maintenance_mode: data.website_maintenance_mode ?? false,
        website_maintenance_message: data.website_maintenance_message,
        website_maintenance_until: data.website_maintenance_until,
      }

      // Clean slogan: remove quotes and extra spaces
      const cleanSlogan = data.slogan ? data.slogan.trim().replace(/^["']|["']$/g, '') : null;

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        logo_url: data.logo_url,
        primary_color: data.primary_color || '#ef4444',
        secondary_color: data.secondary_color || '#dc2626',
        tagline: cleanSlogan || data.tagline, // Use cleaned slogan first, fallback to tagline
        industry: data.industry,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        postal_code: data.postal_code,
        website: data.website,
        facebook_url: data.facebook_url,
        instagram_url: data.instagram_url,
        twitter_url: data.twitter_url,
        linkedin_url: data.linkedin_url,
        youtube_url: data.youtube_url,
        tiktok_url: data.tiktok_url,
        points_name: data.points_name,
        points_per_euro: data.points_per_euro,
        reward_threshold: data.reward_threshold,
        welcome_bonus: data.welcome_bonus,
        websiteConfig,
      }
    } catch (error) {
      console.error('Error fetching public website:', error)
      return null
    }
  }

  /**
   * Get featured rewards for website
   */
  async getFeaturedRewards(organizationId: string, rewardIds: string[]) {
    if (!rewardIds || rewardIds.length === 0) {
      return []
    }

    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('organization_id', organizationId)
      .in('id', rewardIds)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching featured rewards:', error)
      return []
    }

    return data || []
  }

  /**
   * Update website configuration (admin only)
   */
  async updateWebsiteConfig(organizationId: string, config: Partial<WebsiteConfig>) {
    const { data, error } = await supabase
      .from('organizations')
      .update({
        ...config,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating website config:', error)
      throw error
    }

    return data
  }

  /**
   * Toggle website enabled/disabled
   */
  async toggleWebsite(organizationId: string, enabled: boolean) {
    return this.updateWebsiteConfig(organizationId, { website_enabled: enabled })
  }

  /**
   * Submit contact form
   */
  async submitContactForm(organizationId: string, formData: {
    name: string
    email: string
    phone?: string
    message: string
  }) {
    try {
      console.log('📧 WebsiteService: submitContactForm called', { organizationId, formData })

      // Use Edge Function to bypass RLS issues
      const { data: result, error: functionError } = await supabase.functions.invoke('submit-contact-form', {
        body: {
          organizationId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message
        }
      })

      if (functionError) {
        console.error('❌ Error calling submit-contact-form function:', functionError)
        throw functionError
      }

      if (!result?.success) {
        console.error('❌ Function returned error:', result)
        throw new Error(result?.error || 'Failed to submit contact form')
      }

      console.log('✅ Contact form submission stored via Edge Function:', result.submissionId)

      // Send email notification to organization
      try {
        // Get organization details for email
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('name, website_contact_form_email, email')
          .eq('id', organizationId)
          .single()

        if (orgError) {
          console.error('Error loading organization for email:', orgError)
        } else if (org) {
          // Import emailService dynamically to avoid circular dependencies
          const { emailService } = await import('./emailService')

          const recipientEmail = org.website_contact_form_email || org.email

          if (recipientEmail) {
            const emailHtml = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 0;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <tr>
                          <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: white;">📧 Nuovo Messaggio dal Sito Web</h1>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; font-size: 18px; color: #333;">Hai ricevuto un nuovo messaggio da ${formData.name}</h2>

                            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                              <p style="margin: 0 0 10px 0;"><strong>Nome:</strong> ${formData.name}</p>
                              <p style="margin: 0 0 10px 0;"><strong>Email:</strong> <a href="mailto:${formData.email}">${formData.email}</a></p>
                              ${formData.phone ? `<p style="margin: 0 0 10px 0;"><strong>Telefono:</strong> <a href="tel:${formData.phone}">${formData.phone}</a></p>` : ''}
                            </div>

                            <div style="background: #fff; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
                              <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #667eea;">Messaggio:</h3>
                              <p style="margin: 0; color: #333; line-height: 1.6;">${formData.message.replace(/\n/g, '<br>')}</p>
                            </div>

                            <p style="margin: 30px 0 0 0; padding: 15px; background: #f0f9ff; border-radius: 6px; font-size: 13px; color: #666;">
                              💡 <strong>Tip:</strong> Rispondi direttamente a ${formData.email} per contattare il cliente.
                            </p>
                          </td>
                        </tr>
                        <!-- FOOTER PLACEHOLDER -->
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
            `

            const htmlWithFooter = await emailService.wrapEmailWithFooter(emailHtml, organizationId, org.name)

            await emailService.sendEmail({
              to: recipientEmail,
              subject: `📧 Nuovo messaggio dal sito web da ${formData.name}`,
              html: htmlWithFooter,
              organizationId
            })

            console.log('✅ Contact form notification email sent to:', recipientEmail)

            // Send confirmation email to the visitor
            const confirmationEmailHtml = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 0;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <tr>
                          <td style="background: linear-gradient(135deg, ${org.primary_color || '#667eea'} 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: white;">✅ Messaggio Ricevuto!</h1>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">Ciao <strong>${formData.name}</strong>,</p>

                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #333; line-height: 1.6;">
                              Grazie per averci contattato! Abbiamo ricevuto il tuo messaggio e ti risponderemo il prima possibile.
                            </p>

                            <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid ${org.primary_color || '#667eea'};">
                              <h3 style="margin: 0 0 15px 0; font-size: 16px; color: ${org.primary_color || '#667eea'};">📝 Il tuo messaggio:</h3>
                              <p style="margin: 0; color: #666; line-height: 1.6; font-style: italic;">"${formData.message}"</p>
                            </div>

                            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 20px; border-radius: 12px; margin: 25px 0;">
                              <p style="margin: 0; font-size: 14px; color: #0369a1; line-height: 1.6;">
                                💡 <strong>Cosa succede ora?</strong><br>
                                Il nostro team esaminerà il tuo messaggio e ti risponderà entro 24-48 ore all'indirizzo email che hai fornito: <strong>${formData.email}</strong>
                              </p>
                            </div>

                            <p style="margin: 30px 0 0 0; font-size: 15px; color: #333; line-height: 1.6;">
                              Se hai bisogno di assistenza urgente, non esitare a contattarci direttamente.
                            </p>

                            <p style="margin: 25px 0 0 0; font-size: 16px; color: #333;">
                              Cordiali saluti,<br>
                              <strong style="color: ${org.primary_color || '#667eea'};">Il Team ${org.name}</strong>
                            </p>
                          </td>
                        </tr>
                        <!-- FOOTER PLACEHOLDER -->
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
            `

            const confirmationHtmlWithFooter = await emailService.wrapEmailWithFooter(confirmationEmailHtml, organizationId, org.name)

            await emailService.sendEmail({
              to: formData.email,
              subject: `✅ Abbiamo ricevuto il tuo messaggio - ${org.name}`,
              html: confirmationHtmlWithFooter,
              organizationId
            })

            console.log('✅ Confirmation email sent to visitor:', formData.email)
          } else {
            console.warn('⚠️ No email configured for contact form notifications')
          }
        }
      } catch (emailError) {
        console.error('Error sending contact form email (non-blocking):', emailError)
        // Don't throw - email failure shouldn't break form submission
      }

      return {
        success: true,
        submissionId: submission?.id
      }
    } catch (error) {
      console.error('Error submitting contact form:', error)
      throw error
    }
  }
}

export const websiteService = new WebsiteService()
