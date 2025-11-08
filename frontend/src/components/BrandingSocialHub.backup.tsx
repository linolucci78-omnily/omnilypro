import React, { useState, useEffect } from 'react'
import {
  Palette, Upload, Save, RefreshCw, Eye, Facebook, Instagram,
  Twitter, Linkedin, Globe, Mail, Phone, MapPin, Sparkles,
  CheckCircle, AlertCircle, Image as ImageIcon, Loader, Youtube,
  MessageCircle, Send, Type, Clock, Hash, FileText, Download
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import './BrandingSocialHub.css'

interface BrandingSocialHubProps {
  organizationId: string
  organizationName: string
  currentPrimaryColor: string
  currentSecondaryColor: string
  onColorsUpdate?: (primary: string, secondary: string) => void
  onPreviewChange?: (previewMode: boolean, primary?: string, secondary?: string) => void
}

interface BrandingData {
  // Colors
  primary_color: string
  secondary_color: string
  tertiary_color: string | null
  error_color: string | null
  success_color: string | null
  warning_color: string | null
  background_color: string | null

  // Images
  logo_url: string | null
  favicon_url: string | null
  banner_url: string | null
  logo_light_url: string | null
  watermark_url: string | null

  // Typography
  primary_font: string | null
  secondary_font: string | null

  // Business Info
  business_name: string
  slogan: string | null
  bio: string | null
  business_category: string | null
  hashtags: string | null
  business_hours: any | null

  // Contact
  website_url: string | null
  email: string | null
  phone: string | null
  address: string | null
  whatsapp_business: string | null

  // Social Media
  facebook_url: string | null
  instagram_url: string | null
  twitter_url: string | null
  linkedin_url: string | null
  tiktok_url: string | null
  youtube_url: string | null
  pinterest_url: string | null
  telegram_url: string | null
}

const BrandingSocialHub: React.FC<BrandingSocialHubProps> = ({
  organizationId,
  organizationName,
  currentPrimaryColor,
  currentSecondaryColor,
  onColorsUpdate,
  onPreviewChange
}) => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [previewMode, setPreviewMode] = useState(false)

  const [branding, setBranding] = useState<BrandingData>({
    // Colors
    primary_color: currentPrimaryColor,
    secondary_color: currentSecondaryColor,
    tertiary_color: '#3b82f6',
    error_color: '#ef4444',
    success_color: '#10b981',
    warning_color: '#f59e0b',
    background_color: '#ffffff',

    // Images
    logo_url: null,
    favicon_url: null,
    banner_url: null,
    logo_light_url: null,
    watermark_url: null,

    // Typography
    primary_font: 'Inter',
    secondary_font: 'Inter',

    // Business Info
    business_name: organizationName,
    slogan: null,
    bio: null,
    business_category: null,
    hashtags: null,
    business_hours: null,

    // Contact
    website_url: null,
    email: null,
    phone: null,
    address: null,
    whatsapp_business: null,

    // Social Media
    facebook_url: null,
    instagram_url: null,
    twitter_url: null,
    linkedin_url: null,
    tiktok_url: null,
    youtube_url: null,
    pinterest_url: null,
    telegram_url: null
  })

  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingImage, setUploadingImage] = useState<string | null>(null) // 'favicon', 'banner', etc.

  useEffect(() => {
    loadBrandingData()
  }, [organizationId])

  // Comunica al parent quando cambia la preview
  useEffect(() => {
    if (onPreviewChange) {
      if (previewMode) {
        onPreviewChange(true, branding.primary_color, branding.secondary_color)
      } else {
        onPreviewChange(false)
      }
    }
  }, [previewMode, branding.primary_color, branding.secondary_color])

  const loadBrandingData = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single()

      if (error) throw error

      if (data) {
        setBranding({
          // Colors
          primary_color: data.primary_color || currentPrimaryColor,
          secondary_color: data.secondary_color || currentSecondaryColor,
          tertiary_color: data.tertiary_color || '#3b82f6',
          error_color: data.error_color || '#ef4444',
          success_color: data.success_color || '#10b981',
          warning_color: data.warning_color || '#f59e0b',
          background_color: data.background_color || '#ffffff',

          // Images
          logo_url: data.logo_url,
          favicon_url: data.favicon_url,
          banner_url: data.banner_url,
          logo_light_url: data.logo_light_url,
          watermark_url: data.watermark_url,

          // Typography
          primary_font: data.primary_font || 'Inter',
          secondary_font: data.secondary_font || 'Inter',

          // Business Info
          business_name: data.name || organizationName,
          slogan: data.slogan,
          bio: data.bio,
          business_category: data.business_category,
          hashtags: data.hashtags ? data.hashtags.join(', ') : null,
          business_hours: data.business_hours,

          // Contact
          website_url: data.website_url,
          email: data.email,
          phone: data.phone,
          address: data.address,
          whatsapp_business: data.whatsapp_business,

          // Social Media
          facebook_url: data.facebook_url,
          instagram_url: data.instagram_url,
          twitter_url: data.twitter_url,
          linkedin_url: data.linkedin_url,
          tiktok_url: data.tiktok_url,
          youtube_url: data.youtube_url,
          pinterest_url: data.pinterest_url,
          telegram_url: data.telegram_url
        })
      }
    } catch (error) {
      console.error('Error loading branding data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploadingLogo(true)

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${organizationId}_logo_${Date.now()}.${fileExt}`
      const filePath = `logos/${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from('IMG')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('IMG')
        .getPublicUrl(filePath)

      setBranding({ ...branding, logo_url: publicUrl })
      setMessage({ type: 'success', text: 'Logo caricato! Ricorda di salvare.' })
    } catch (error) {
      console.error('Error uploading logo:', error)
      setMessage({ type: 'error', text: 'Errore caricamento logo' })
    } finally {
      setUploadingLogo(false)
    }
  }

  // Upload generico per immagini multiple
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, imageType: 'favicon' | 'banner' | 'logo_light' | 'watermark') => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploadingImage(imageType)

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${organizationId}_${imageType}_${Date.now()}.${fileExt}`
      const filePath = `branding/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('IMG')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('IMG')
        .getPublicUrl(filePath)

      // Update state based on image type
      const fieldMap = {
        'favicon': 'favicon_url',
        'banner': 'banner_url',
        'logo_light': 'logo_light_url',
        'watermark': 'watermark_url'
      }

      setBranding({ ...branding, [fieldMap[imageType]]: publicUrl })
      setMessage({ type: 'success', text: `${imageType.charAt(0).toUpperCase() + imageType.slice(1)} caricato! Ricorda di salvare.` })
    } catch (error) {
      console.error(`Error uploading ${imageType}:`, error)
      setMessage({ type: 'error', text: `Errore caricamento ${imageType}` })
    } finally {
      setUploadingImage(null)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage(null)

      // Converti hashtags da stringa a array
      const hashtagsArray = branding.hashtags
        ? branding.hashtags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : null

      const { error } = await supabase
        .from('organizations')
        .update({
          // Colors
          primary_color: branding.primary_color,
          secondary_color: branding.secondary_color,
          tertiary_color: branding.tertiary_color,
          error_color: branding.error_color,
          success_color: branding.success_color,
          warning_color: branding.warning_color,
          background_color: branding.background_color,

          // Images
          logo_url: branding.logo_url,
          favicon_url: branding.favicon_url,
          banner_url: branding.banner_url,
          logo_light_url: branding.logo_light_url,
          watermark_url: branding.watermark_url,

          // Typography
          primary_font: branding.primary_font,
          secondary_font: branding.secondary_font,

          // Business Info
          name: branding.business_name,
          slogan: branding.slogan,
          bio: branding.bio,
          business_category: branding.business_category,
          hashtags: hashtagsArray,
          business_hours: branding.business_hours,

          // Contact
          website_url: branding.website_url,
          email: branding.email,
          phone: branding.phone,
          address: branding.address,
          whatsapp_business: branding.whatsapp_business,

          // Social Media
          facebook_url: branding.facebook_url,
          instagram_url: branding.instagram_url,
          twitter_url: branding.twitter_url,
          linkedin_url: branding.linkedin_url,
          tiktok_url: branding.tiktok_url,
          youtube_url: branding.youtube_url,
          pinterest_url: branding.pinterest_url,
          telegram_url: branding.telegram_url
        })
        .eq('id', organizationId)

      if (error) throw error

      setMessage({ type: 'success', text: 'Branding salvato con successo! Ricarica la pagina per vedere i cambiamenti.' })

      if (onColorsUpdate) {
        onColorsUpdate(branding.primary_color, branding.secondary_color)
      }
    } catch (error) {
      console.error('Error saving branding:', error)
      setMessage({ type: 'error', text: 'Errore durante il salvataggio' })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    loadBrandingData()
    setMessage(null)
  }

  if (loading) {
    return (
      <div className="branding-social-hub">
        <div className="branding-loading">
          <Loader size={48} className="spinning" />
          <p>Caricamento impostazioni branding...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="branding-social-hub"
      style={{
        '--primary-color': previewMode ? branding.primary_color : currentPrimaryColor,
        '--secondary-color': previewMode ? branding.secondary_color : currentSecondaryColor
      } as React.CSSProperties}
    >
      {/* Header */}
      <div className="branding-hub-header">
        <div className="branding-hub-header-content">
          <div className="branding-hub-icon">
            <Palette size={48} />
          </div>
          <div>
            <h1>Branding & Social Media</h1>
            <p>Personalizza l'identità del tuo brand e i canali social</p>
          </div>
        </div>
        <div className="branding-hub-actions">
          <button
            className={`branding-preview-btn ${previewMode ? 'active' : ''}`}
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye size={20} />
            {previewMode ? 'Preview ON' : 'Anteprima'}
          </button>
          <button className="branding-reset-btn" onClick={handleReset}>
            <RefreshCw size={20} />
            Reset
          </button>
          <button className="branding-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? <Loader size={20} className="spinning" /> : <Save size={20} />}
            Salva Modifiche
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`branding-message branding-message-${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="branding-content-grid">
        {/* Left Column - Colors & Logo */}
        <div className="branding-section">
          <h2>
            <Palette size={24} />
            Colori Brand
          </h2>

          <div className="branding-color-section">
            <div className="branding-color-picker">
              <label>Colore Primario</label>
              <div className="color-picker-row">
                <input
                  type="color"
                  value={branding.primary_color}
                  onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                  className="color-input"
                />
                <input
                  type="text"
                  value={branding.primary_color}
                  onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                  className="color-text-input"
                  placeholder="#dc2626"
                />
                <div
                  className="color-preview"
                  style={{ background: branding.primary_color }}
                />
              </div>
            </div>

            <div className="branding-color-picker">
              <label>Colore Secondario</label>
              <div className="color-picker-row">
                <input
                  type="color"
                  value={branding.secondary_color}
                  onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                  className="color-input"
                />
                <input
                  type="text"
                  value={branding.secondary_color}
                  onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                  className="color-text-input"
                  placeholder="#ef4444"
                />
                <div
                  className="color-preview"
                  style={{ background: branding.secondary_color }}
                />
              </div>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="branding-logo-section">
            <h3>
              <ImageIcon size={20} />
              Logo Aziendale
            </h3>

            {branding.logo_url && (
              <div className="branding-logo-preview">
                <img src={branding.logo_url} alt="Logo" />
              </div>
            )}

            <label className="branding-upload-btn">
              {uploadingLogo ? <Loader size={20} className="spinning" /> : <Upload size={20} />}
              {uploadingLogo ? 'Caricamento...' : 'Carica Nuovo Logo'}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                style={{ display: 'none' }}
              />
            </label>
            <small className="upload-hint">PNG, JPG o SVG - Max 2MB</small>
          </div>

          {/* Color Preview Cards */}
          <div className="branding-preview-section">
            <h3>
              <Sparkles size={20} />
              Anteprima Colori
            </h3>
            <div className="branding-preview-cards">
              <div className="preview-card" style={{ background: `linear-gradient(135deg, ${branding.primary_color}, ${branding.secondary_color})` }}>
                <span>Gradiente Brand</span>
              </div>
              <div className="preview-card" style={{ background: branding.primary_color }}>
                <span>Primario</span>
              </div>
              <div className="preview-card" style={{ background: branding.secondary_color }}>
                <span>Secondario</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Business Info & Social */}
        <div className="branding-section">
          <h2>
            <Sparkles size={24} />
            Informazioni Business
          </h2>

          <div className="branding-form">
            <div className="branding-form-group">
              <label>Nome Business</label>
              <input
                type="text"
                value={branding.business_name}
                onChange={(e) => setBranding({ ...branding, business_name: e.target.value })}
                className="branding-input"
                placeholder="Nome della tua azienda"
              />
            </div>

            <div className="branding-form-group">
              <label>Slogan</label>
              <input
                type="text"
                value={branding.slogan || ''}
                onChange={(e) => setBranding({ ...branding, slogan: e.target.value })}
                className="branding-input"
                placeholder="Il tuo slogan aziendale"
              />
            </div>

            <div className="branding-form-group">
              <label>
                <Mail size={16} />
                Email
              </label>
              <input
                type="email"
                value={branding.email || ''}
                onChange={(e) => setBranding({ ...branding, email: e.target.value })}
                className="branding-input"
                placeholder="info@tuodominio.com"
              />
            </div>

            <div className="branding-form-group">
              <label>
                <Phone size={16} />
                Telefono
              </label>
              <input
                type="tel"
                value={branding.phone || ''}
                onChange={(e) => setBranding({ ...branding, phone: e.target.value })}
                className="branding-input"
                placeholder="+39 123 456 7890"
              />
            </div>

            <div className="branding-form-group">
              <label>
                <MapPin size={16} />
                Indirizzo
              </label>
              <input
                type="text"
                value={branding.address || ''}
                onChange={(e) => setBranding({ ...branding, address: e.target.value })}
                className="branding-input"
                placeholder="Via, Città, CAP"
              />
            </div>
          </div>

          {/* Social Media */}
          <h2 style={{ marginTop: '2rem' }}>
            <Globe size={24} />
            Social Media & Web
          </h2>

          <div className="branding-form">
            <div className="branding-form-group">
              <label>
                <Globe size={16} />
                Sito Web
              </label>
              <input
                type="url"
                value={branding.website_url || ''}
                onChange={(e) => setBranding({ ...branding, website_url: e.target.value })}
                className="branding-input"
                placeholder="https://tuosito.com"
              />
            </div>

            <div className="branding-form-group">
              <label>
                <Facebook size={16} />
                Facebook
              </label>
              <input
                type="url"
                value={branding.facebook_url || ''}
                onChange={(e) => setBranding({ ...branding, facebook_url: e.target.value })}
                className="branding-input"
                placeholder="https://facebook.com/tuapagina"
              />
            </div>

            <div className="branding-form-group">
              <label>
                <Instagram size={16} />
                Instagram
              </label>
              <input
                type="url"
                value={branding.instagram_url || ''}
                onChange={(e) => setBranding({ ...branding, instagram_url: e.target.value })}
                className="branding-input"
                placeholder="https://instagram.com/tuoaccount"
              />
            </div>

            <div className="branding-form-group">
              <label>
                <Twitter size={16} />
                Twitter / X
              </label>
              <input
                type="url"
                value={branding.twitter_url || ''}
                onChange={(e) => setBranding({ ...branding, twitter_url: e.target.value })}
                className="branding-input"
                placeholder="https://twitter.com/tuoaccount"
              />
            </div>

            <div className="branding-form-group">
              <label>
                <Linkedin size={16} />
                LinkedIn
              </label>
              <input
                type="url"
                value={branding.linkedin_url || ''}
                onChange={(e) => setBranding({ ...branding, linkedin_url: e.target.value })}
                className="branding-input"
                placeholder="https://linkedin.com/company/tuaazienda"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BrandingSocialHub
