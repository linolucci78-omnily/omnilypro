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
  const [showEmailPreview, setShowEmailPreview] = useState(false)

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

  // Genera anteprima footer email
  const generateEmailPreview = () => {
    const primaryColor = branding.primary_color
    const secondaryColor = branding.secondary_color

    // Social links (solo quelli presenti)
    const socialLinks = []

    if (branding.facebook_url) {
      socialLinks.push(`<a href="${branding.facebook_url}" style="text-decoration: none; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" style="width: 32px; height: 32px;" /></a>`)
    }
    if (branding.instagram_url) {
      socialLinks.push(`<a href="${branding.instagram_url}" style="text-decoration: none; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" style="width: 32px; height: 32px;" /></a>`)
    }
    if (branding.twitter_url) {
      socialLinks.push(`<a href="${branding.twitter_url}" style="text-decoration: none; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" alt="Twitter" style="width: 32px; height: 32px;" /></a>`)
    }
    if (branding.linkedin_url) {
      socialLinks.push(`<a href="${branding.linkedin_url}" style="text-decoration: none; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/733/733561.png" alt="LinkedIn" style="width: 32px; height: 32px;" /></a>`)
    }
    if (branding.youtube_url) {
      socialLinks.push(`<a href="${branding.youtube_url}" style="text-decoration: none; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/733/733646.png" alt="YouTube" style="width: 32px; height: 32px;" /></a>`)
    }
    if (branding.tiktok_url) {
      socialLinks.push(`<a href="${branding.tiktok_url}" style="text-decoration: none; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/3046/3046126.png" alt="TikTok" style="width: 32px; height: 32px;" /></a>`)
    }
    if (branding.pinterest_url) {
      socialLinks.push(`<a href="${branding.pinterest_url}" style="text-decoration: none; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/733/733614.png" alt="Pinterest" style="width: 32px; height: 32px;" /></a>`)
    }
    if (branding.telegram_url) {
      socialLinks.push(`<a href="${branding.telegram_url}" style="text-decoration: none; margin: 0 8px;"><img src="https://cdn-icons-png.flaticon.com/512/2111/2111646.png" alt="Telegram" style="width: 32px; height: 32px;" /></a>`)
    }

    // Contatti (solo quelli presenti)
    const contacts = []

    if (branding.email) {
      contacts.push(`<a href="mailto:${branding.email}" style="color: white; text-decoration: none; margin: 0 12px; font-size: 14px;">✉️ ${branding.email}</a>`)
    }
    if (branding.phone) {
      contacts.push(`<a href="tel:${branding.phone}" style="color: white; text-decoration: none; margin: 0 12px; font-size: 14px;">📞 ${branding.phone}</a>`)
    }
    if (branding.whatsapp_business) {
      contacts.push(`<a href="https://wa.me/${branding.whatsapp_business.replace(/[^0-9]/g, '')}" style="color: white; text-decoration: none; margin: 0 12px; font-size: 14px;">💬 WhatsApp</a>`)
    }
    if (branding.address) {
      contacts.push(`<span style="color: rgba(255,255,255,0.9); margin: 0 12px; font-size: 14px;">📍 ${branding.address}</span>`)
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f3f4f6; padding: 20px; margin: 0; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Email di Benvenuto</h1>
          </div>
          <div class="content">
            <p>Ciao <strong>Cliente</strong>,</p>
            <p>Questa è un'anteprima di come appariranno le tue email con il footer personalizzato!</p>

            <h3>🎁 Esempio contenuto email:</h3>
            <ul>
              <li>✅ Accumula punti ad ogni acquisto</li>
              <li>🎯 Sblocca premi esclusivi</li>
              <li>⭐ Raggiungi livelli superiori per vantaggi speciali</li>
            </ul>

            <p>Il footer qui sotto verrà aggiunto automaticamente a tutte le email inviate ai tuoi clienti!</p>
          </div>

          <!-- FOOTER BRANDED -->
          <div style="background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); padding: 40px 20px; text-align: center; border-radius: 0 0 10px 10px;">
            ${branding.logo_url ? `
              <div style="margin-bottom: 20px;">
                <img src="${branding.logo_url}" alt="${branding.business_name}" style="max-width: 150px; max-height: 60px; object-fit: contain;" />
              </div>
            ` : ''}

            ${socialLinks.length > 0 ? `
              <div style="margin: 20px 0;">
                <p style="color: white; font-size: 14px; font-weight: 600; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">Seguici Su</p>
                <div style="text-align: center;">
                  ${socialLinks.join('')}
                </div>
              </div>
            ` : ''}

            ${contacts.length > 0 ? `
              <div style="margin: 25px 0; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.3);">
                <div style="text-align: center;">
                  ${contacts.join('<br/>')}
                </div>
              </div>
            ` : ''}

            ${branding.website_url ? `
              <div style="margin-top: 20px;">
                <a href="${branding.website_url}" style="display: inline-block; background: white; color: ${primaryColor}; padding: 10px 24px; border-radius: 25px; text-decoration: none; font-weight: 600; font-size: 14px;">🌐 Visita il nostro sito</a>
              </div>
            ` : ''}

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.3);">
              <p style="color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 600; margin: 5px 0;">Grazie per aver scelto ${branding.business_name}!</p>
              <p style="color: rgba(255,255,255,0.7); font-size: 11px; margin: 5px 0; text-transform: uppercase; letter-spacing: 1px;">Powered by OMNILY PRO</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
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

            {/* NUOVI SOCIAL MEDIA */}
            <div className="branding-form-group">
              <label>
                <Youtube size={16} />
                YouTube
              </label>
              <input
                type="url"
                value={branding.youtube_url || ''}
                onChange={(e) => setBranding({ ...branding, youtube_url: e.target.value })}
                className="branding-input"
                placeholder="https://youtube.com/@tuocanale"
              />
            </div>

            <div className="branding-form-group">
              <label>
                <ImageIcon size={16} />
                TikTok
              </label>
              <input
                type="url"
                value={branding.tiktok_url || ''}
                onChange={(e) => setBranding({ ...branding, tiktok_url: e.target.value })}
                className="branding-input"
                placeholder="https://tiktok.com/@tuoaccount"
              />
            </div>

            <div className="branding-form-group">
              <label>
                <ImageIcon size={16} />
                Pinterest
              </label>
              <input
                type="url"
                value={branding.pinterest_url || ''}
                onChange={(e) => setBranding({ ...branding, pinterest_url: e.target.value })}
                className="branding-input"
                placeholder="https://pinterest.com/tuoaccount"
              />
            </div>

            <div className="branding-form-group">
              <label>
                <MessageCircle size={16} />
                WhatsApp Business
              </label>
              <input
                type="tel"
                value={branding.whatsapp_business || ''}
                onChange={(e) => setBranding({ ...branding, whatsapp_business: e.target.value })}
                className="branding-input"
                placeholder="+39 123 456 7890"
              />
            </div>

            <div className="branding-form-group">
              <label>
                <Send size={16} />
                Telegram
              </label>
              <input
                type="url"
                value={branding.telegram_url || ''}
                onChange={(e) => setBranding({ ...branding, telegram_url: e.target.value })}
                className="branding-input"
                placeholder="https://t.me/tuocanale"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===================== SEZIONE EXTENDED COLORS ===================== */}
      <div className="branding-section-full">
        <h2>
          <Palette size={24} />
          Palette Colori Estesa
          <span className="premium-badge">PREMIUM</span>
        </h2>

        <div className="branding-color-grid">
          <div className="branding-color-picker">
            <label>Colore Terziario / Accent</label>
            <div className="color-picker-row">
              <input
                type="color"
                value={branding.tertiary_color || '#3b82f6'}
                onChange={(e) => setBranding({ ...branding, tertiary_color: e.target.value })}
                className="color-input"
              />
              <input
                type="text"
                value={branding.tertiary_color || '#3b82f6'}
                onChange={(e) => setBranding({ ...branding, tertiary_color: e.target.value })}
                className="color-text-input"
                placeholder="#3b82f6"
              />
              <div
                className="color-preview"
                style={{ background: branding.tertiary_color || '#3b82f6' }}
              />
            </div>
          </div>

          <div className="branding-color-picker">
            <label>Colore Successo</label>
            <div className="color-picker-row">
              <input
                type="color"
                value={branding.success_color || '#10b981'}
                onChange={(e) => setBranding({ ...branding, success_color: e.target.value })}
                className="color-input"
              />
              <input
                type="text"
                value={branding.success_color || '#10b981'}
                onChange={(e) => setBranding({ ...branding, success_color: e.target.value })}
                className="color-text-input"
                placeholder="#10b981"
              />
              <div
                className="color-preview"
                style={{ background: branding.success_color || '#10b981' }}
              />
            </div>
          </div>

          <div className="branding-color-picker">
            <label>Colore Warning</label>
            <div className="color-picker-row">
              <input
                type="color"
                value={branding.warning_color || '#f59e0b'}
                onChange={(e) => setBranding({ ...branding, warning_color: e.target.value })}
                className="color-input"
              />
              <input
                type="text"
                value={branding.warning_color || '#f59e0b'}
                onChange={(e) => setBranding({ ...branding, warning_color: e.target.value })}
                className="color-text-input"
                placeholder="#f59e0b"
              />
              <div
                className="color-preview"
                style={{ background: branding.warning_color || '#f59e0b' }}
              />
            </div>
          </div>

          <div className="branding-color-picker">
            <label>Colore Errore</label>
            <div className="color-picker-row">
              <input
                type="color"
                value={branding.error_color || '#ef4444'}
                onChange={(e) => setBranding({ ...branding, error_color: e.target.value })}
                className="color-input"
              />
              <input
                type="text"
                value={branding.error_color || '#ef4444'}
                onChange={(e) => setBranding({ ...branding, error_color: e.target.value })}
                className="color-text-input"
                placeholder="#ef4444"
              />
              <div
                className="color-preview"
                style={{ background: branding.error_color || '#ef4444' }}
              />
            </div>
          </div>

          <div className="branding-color-picker">
            <label>Colore Background</label>
            <div className="color-picker-row">
              <input
                type="color"
                value={branding.background_color || '#ffffff'}
                onChange={(e) => setBranding({ ...branding, background_color: e.target.value })}
                className="color-input"
              />
              <input
                type="text"
                value={branding.background_color || '#ffffff'}
                onChange={(e) => setBranding({ ...branding, background_color: e.target.value })}
                className="color-text-input"
                placeholder="#ffffff"
              />
              <div
                className="color-preview"
                style={{ background: branding.background_color || '#ffffff' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===================== SEZIONE IMMAGINI MULTIPLE ===================== */}
      <div className="branding-section-full">
        <h2>
          <ImageIcon size={24} />
          Immagini & Assets
          <span className="premium-badge">PREMIUM</span>
        </h2>

        <div className="branding-images-grid">
          {/* Favicon */}
          <div className="branding-image-upload-card">
            <h4>Favicon</h4>
            <p className="upload-description">Icona browser (16x16 o 32x32 px)</p>
            {branding.favicon_url && (
              <div className="image-preview-small">
                <img src={branding.favicon_url} alt="Favicon" />
              </div>
            )}
            <label className="branding-upload-btn-small">
              {uploadingImage === 'favicon' ? <Loader size={16} className="spinning" /> : <Upload size={16} />}
              {uploadingImage === 'favicon' ? 'Upload...' : 'Carica Favicon'}
              <input
                type="file"
                accept="image/x-icon,image/png"
                onChange={(e) => handleImageUpload(e, 'favicon')}
                disabled={uploadingImage === 'favicon'}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Banner */}
          <div className="branding-image-upload-card">
            <h4>Banner / Cover</h4>
            <p className="upload-description">Immagine header (1920x400 px)</p>
            {branding.banner_url && (
              <div className="image-preview-wide">
                <img src={branding.banner_url} alt="Banner" />
              </div>
            )}
            <label className="branding-upload-btn-small">
              {uploadingImage === 'banner' ? <Loader size={16} className="spinning" /> : <Upload size={16} />}
              {uploadingImage === 'banner' ? 'Upload...' : 'Carica Banner'}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'banner')}
                disabled={uploadingImage === 'banner'}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Logo Light */}
          <div className="branding-image-upload-card">
            <h4>Logo Chiaro</h4>
            <p className="upload-description">Logo per sfondi scuri</p>
            {branding.logo_light_url && (
              <div className="image-preview-dark">
                <img src={branding.logo_light_url} alt="Logo Light" />
              </div>
            )}
            <label className="branding-upload-btn-small">
              {uploadingImage === 'logo_light' ? <Loader size={16} className="spinning" /> : <Upload size={16} />}
              {uploadingImage === 'logo_light' ? 'Upload...' : 'Carica Logo Chiaro'}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'logo_light')}
                disabled={uploadingImage === 'logo_light'}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Watermark */}
          <div className="branding-image-upload-card">
            <h4>Watermark</h4>
            <p className="upload-description">Logo trasparente per overlay</p>
            {branding.watermark_url && (
              <div className="image-preview-small">
                <img src={branding.watermark_url} alt="Watermark" />
              </div>
            )}
            <label className="branding-upload-btn-small">
              {uploadingImage === 'watermark' ? <Loader size={16} className="spinning" /> : <Upload size={16} />}
              {uploadingImage === 'watermark' ? 'Upload...' : 'Carica Watermark'}
              <input
                type="file"
                accept="image/png"
                onChange={(e) => handleImageUpload(e, 'watermark')}
                disabled={uploadingImage === 'watermark'}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* ===================== SEZIONE TIPOGRAFIA ===================== */}
      <div className="branding-section-full">
        <h2>
          <Type size={24} />
          Tipografia
          <span className="premium-badge">PREMIUM</span>
        </h2>

        <div className="branding-fonts-grid">
          <div className="branding-form-group">
            <label>Font Primario (Titoli)</label>
            <select
              value={branding.primary_font || 'Inter'}
              onChange={(e) => setBranding({ ...branding, primary_font: e.target.value })}
              className="branding-input"
            >
              <option value="Inter">Inter</option>
              <option value="Poppins">Poppins</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Lato">Lato</option>
              <option value="Raleway">Raleway</option>
              <option value="Playfair Display">Playfair Display</option>
              <option value="Merriweather">Merriweather</option>
            </select>
            <div className="font-preview" style={{ fontFamily: branding.primary_font || 'Inter' }}>
              <h3>Il Tuo Brand è Unico</h3>
            </div>
          </div>

          <div className="branding-form-group">
            <label>Font Secondario (Corpo Testo)</label>
            <select
              value={branding.secondary_font || 'Inter'}
              onChange={(e) => setBranding({ ...branding, secondary_font: e.target.value })}
              className="branding-input"
            >
              <option value="Inter">Inter</option>
              <option value="Poppins">Poppins</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Lato">Lato</option>
              <option value="Raleway">Raleway</option>
              <option value="Playfair Display">Playfair Display</option>
              <option value="Merriweather">Merriweather</option>
            </select>
            <div className="font-preview" style={{ fontFamily: branding.secondary_font || 'Inter' }}>
              <p>Questo è un esempio di testo corpo con il font secondario che hai scelto.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== SEZIONE INFO BUSINESS AVANZATE ===================== */}
      <div className="branding-section-full">
        <h2>
          <FileText size={24} />
          Informazioni Business Avanzate
          <span className="premium-badge">PREMIUM</span>
        </h2>

        <div className="branding-form">
          <div className="branding-form-group">
            <label>Categoria Business</label>
            <select
              value={branding.business_category || ''}
              onChange={(e) => setBranding({ ...branding, business_category: e.target.value })}
              className="branding-input"
            >
              <option value="">Seleziona categoria...</option>
              <option value="restaurant">Ristorante / Bar</option>
              <option value="retail">Retail / Negozio</option>
              <option value="beauty">Bellezza / Estetica</option>
              <option value="fitness">Fitness / Sport</option>
              <option value="health">Salute / Benessere</option>
              <option value="education">Educazione</option>
              <option value="services">Servizi Professionali</option>
              <option value="automotive">Automotive</option>
              <option value="hospitality">Ospitalità / Hotel</option>
              <option value="entertainment">Intrattenimento</option>
              <option value="other">Altro</option>
            </select>
          </div>

          <div className="branding-form-group">
            <label>
              <FileText size={16} />
              Bio / Descrizione Aziendale
            </label>
            <textarea
              value={branding.bio || ''}
              onChange={(e) => setBranding({ ...branding, bio: e.target.value })}
              className="branding-textarea"
              placeholder="Racconta la storia del tuo brand, i tuoi valori, cosa ti rende unico..."
              rows={5}
            />
            <small className="char-count">{(branding.bio || '').length} / 500 caratteri</small>
          </div>

          <div className="branding-form-group">
            <label>
              <Hash size={16} />
              Hashtag Ufficiali
            </label>
            <input
              type="text"
              value={branding.hashtags || ''}
              onChange={(e) => setBranding({ ...branding, hashtags: e.target.value })}
              className="branding-input"
              placeholder="#tuobrand, #qualità, #madeinitaly"
            />
            <small className="upload-hint">Separati da virgola</small>
          </div>
        </div>
      </div>

      {/* ===================== SEZIONE ORARI APERTURA ===================== */}
      <div className="branding-section-full">
        <h2>
          <Clock size={24} />
          Orari di Apertura
          <span className="premium-badge">PREMIUM</span>
        </h2>

        <div className="business-hours-info">
          <p>Gli orari verranno salvati in formato JSON. Puoi implementare un editor visuale in futuro.</p>
          <textarea
            value={branding.business_hours ? JSON.stringify(branding.business_hours, null, 2) : ''}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                setBranding({ ...branding, business_hours: parsed })
              } catch {
                // Invalid JSON, don't update
              }
            }}
            className="branding-textarea"
            placeholder='{"monday": "09:00-18:00", "tuesday": "09:00-18:00", ...}'
            rows={6}
          />
          <small className="upload-hint">Formato JSON per ora - editor visuale in arrivo</small>
        </div>
      </div>

      {/* ===================== SEZIONE EXPORT & TOOLS ===================== */}
      <div className="branding-section-full">
        <h2>
          <Download size={24} />
          Brand Kit & Tools
          <span className="premium-badge">PREMIUM</span>
        </h2>

        <div className="brand-tools-grid">
          <div className="brand-tool-card">
            <h4>Export Brand Kit</h4>
            <p>Scarica un archivio ZIP con logo, colori, fonts e linee guida</p>
            <button className="branding-tool-btn" disabled>
              <Download size={20} />
              Scarica Brand Kit
              <span className="coming-soon">Coming Soon</span>
            </button>
          </div>

          <div className="brand-tool-card">
            <h4>QR Code Business</h4>
            <p>QR code personalizzato con link al tuo profilo</p>
            <button className="branding-tool-btn" disabled>
              <ImageIcon size={20} />
              Genera QR Code
              <span className="coming-soon">Coming Soon</span>
            </button>
          </div>

          <div className="brand-tool-card">
            <h4>Template Colori</h4>
            <p>Palette pre-impostate da scegliere</p>
            <button className="branding-tool-btn" disabled>
              <Palette size={20} />
              Scegli Template
              <span className="coming-soon">Coming Soon</span>
            </button>
          </div>

          <div className="brand-tool-card brand-tool-card-active">
            <h4>Anteprima Email</h4>
            <p>Vedi come appare il footer nelle email inviate ai clienti</p>
            <button className="branding-tool-btn" onClick={() => setShowEmailPreview(true)}>
              <Mail size={20} />
              Visualizza Anteprima
            </button>
          </div>
        </div>
      </div>

      {/* ===================== MODAL ANTEPRIMA EMAIL ===================== */}
      {showEmailPreview && (
        <div className="email-preview-modal" onClick={() => setShowEmailPreview(false)}>
          <div className="email-preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="email-preview-header">
              <h3>
                <Mail size={24} />
                Anteprima Footer Email
              </h3>
              <button className="email-preview-close" onClick={() => setShowEmailPreview(false)}>
                ✕
              </button>
            </div>
            <div className="email-preview-body">
              <iframe
                srcDoc={generateEmailPreview()}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '8px'
                }}
                title="Email Preview"
              />
            </div>
            <div className="email-preview-footer">
              <p>
                <CheckCircle size={16} />
                Questo footer verrà automaticamente aggiunto a tutte le email inviate ai tuoi clienti!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BrandingSocialHub
