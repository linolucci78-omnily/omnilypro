import React, { useState, useEffect } from 'react'
import { Palette, Upload, X, Save, Building2, Phone, Globe, Mail, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './OrganizationBrandingPanel.css'
import './CardManagementPanel.css'

interface OrganizationBrandingPanelProps {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  organizationName: string
}

interface BrandingData {
  logo_url: string | null
  primary_color: string
  company_address: string | null
  company_phone: string | null
  company_website: string | null
  email_footer_text: string | null
  social_facebook: string | null
  social_instagram: string | null
  social_twitter: string | null
  social_linkedin: string | null
}

const OrganizationBrandingPanel: React.FC<OrganizationBrandingPanelProps> = ({
  isOpen,
  onClose,
  organizationId,
  organizationName
}) => {
  const [branding, setBranding] = useState<BrandingData>({
    logo_url: null,
    primary_color: '#dc2626',
    company_address: null,
    company_phone: null,
    company_website: null,
    email_footer_text: null,
    social_facebook: null,
    social_instagram: null,
    social_twitter: null,
    social_linkedin: null
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    if (isOpen && organizationId) {
      loadBranding()
    }
  }, [isOpen, organizationId])

  const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const loadBranding = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('logo_url, primary_color, company_address, company_phone, company_website, email_footer_text, social_facebook, social_instagram, social_twitter, social_linkedin')
        .eq('id', organizationId)
        .single()

      if (error) throw error

      if (data) {
        setBranding({
          logo_url: data.logo_url,
          primary_color: data.primary_color || '#dc2626',
          company_address: data.company_address,
          company_phone: data.company_phone,
          company_website: data.company_website,
          email_footer_text: data.email_footer_text,
          social_facebook: data.social_facebook,
          social_instagram: data.social_instagram,
          social_twitter: data.social_twitter,
          social_linkedin: data.social_linkedin
        })
      }
    } catch (error: any) {
      console.error('Error loading branding:', error)
      showToastMessage(`Errore: ${error?.message || 'Impossibile caricare'}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const saveBranding = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('organizations')
        .update(branding)
        .eq('id', organizationId)

      if (error) throw error

      showToastMessage('✅ Branding salvato con successo!', 'success')
    } catch (error: any) {
      console.error('Error saving branding:', error)
      showToastMessage(`❌ Errore: ${error?.message || 'Impossibile salvare'}`, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Toast */}
      {showToast && (
        <div className={`toast toast-${toastType}`}>
          {toastMessage}
        </div>
      )}

      {/* Overlay */}
      <div className="card-management-overlay" onClick={onClose} />

      {/* Panel */}
      <div className={`card-management-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="card-management-header">
          <div className="header-info">
            <h2>Branding Aziendale</h2>
            <p>{organizationName}</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="panel-content">
          {isLoading ? (
            <div className="branding-panel loading">
              <div className="loading-spinner"></div>
              <p>Caricamento...</p>
            </div>
          ) : (
            <div className="branding-panel">
              {/* Header Info */}
              <div className="panel-header">
                <div className="header-title">
                  <Palette size={28} style={{ color: '#dc2626' }} />
                  <div>
                    <h2>Personalizza le tue Email</h2>
                    <p>Logo, colori e informazioni aziendali per le email automatiche</p>
                  </div>
                </div>
              </div>

              {/* Logo Section */}
              <div className="branding-section">
                <h3>
                  <Upload size={20} />
                  Logo Aziendale
                </h3>
                <p className="section-description">
                  Il logo verrà mostrato nell'header delle email automatiche
                </p>
                <div className="form-group">
                  <label>URL Logo</label>
                  <input
                    type="url"
                    value={branding.logo_url || ''}
                    onChange={(e) => setBranding({ ...branding, logo_url: e.target.value })}
                    placeholder="https://esempio.com/logo.png"
                    className="form-input"
                  />
                  {branding.logo_url && (
                    <div className="logo-preview">
                      <img src={branding.logo_url} alt="Logo preview" />
                    </div>
                  )}
                </div>
              </div>

              {/* Color Section */}
              <div className="branding-section">
                <h3>
                  <Palette size={20} />
                  Colore Brand
                </h3>
                <p className="section-description">
                  Colore principale usato nelle email (header, pulsanti, accenti)
                </p>
                <div className="form-group">
                  <label>Colore Primario</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      value={branding.primary_color}
                      onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                      className="color-picker"
                    />
                    <input
                      type="text"
                      value={branding.primary_color}
                      onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                      placeholder="#dc2626"
                      className="form-input"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>

              {/* Company Info Section */}
              <div className="branding-section">
                <h3>
                  <Building2 size={20} />
                  Informazioni Aziendali
                </h3>
                <p className="section-description">
                  Dati mostrati nel footer delle email
                </p>

                <div className="form-group">
                  <label>
                    <Globe size={16} />
                    Sito Web
                  </label>
                  <input
                    type="url"
                    value={branding.company_website || ''}
                    onChange={(e) => setBranding({ ...branding, company_website: e.target.value })}
                    placeholder="https://www.esempio.com"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Phone size={16} />
                    Telefono
                  </label>
                  <input
                    type="tel"
                    value={branding.company_phone || ''}
                    onChange={(e) => setBranding({ ...branding, company_phone: e.target.value })}
                    placeholder="+39 123 456 7890"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Building2 size={16} />
                    Indirizzo
                  </label>
                  <textarea
                    value={branding.company_address || ''}
                    onChange={(e) => setBranding({ ...branding, company_address: e.target.value })}
                    placeholder="Via Esempio 123, 00100 Roma, Italia"
                    className="form-textarea"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Mail size={16} />
                    Testo Footer Personalizzato
                  </label>
                  <textarea
                    value={branding.email_footer_text || ''}
                    onChange={(e) => setBranding({ ...branding, email_footer_text: e.target.value })}
                    placeholder="Grazie per essere parte della nostra famiglia!"
                    className="form-textarea"
                    rows={2}
                  />
                </div>
              </div>

              {/* Social Media Section */}
              <div className="branding-section">
                <h3>
                  <Facebook size={20} />
                  Social Media
                </h3>
                <p className="section-description">
                  Link ai profili social mostrati nel footer delle email
                </p>

                <div className="form-group">
                  <label>
                    <Facebook size={16} />
                    Facebook
                  </label>
                  <input
                    type="url"
                    value={branding.social_facebook || ''}
                    onChange={(e) => setBranding({ ...branding, social_facebook: e.target.value })}
                    placeholder="https://facebook.com/tuapagina"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Instagram size={16} />
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={branding.social_instagram || ''}
                    onChange={(e) => setBranding({ ...branding, social_instagram: e.target.value })}
                    placeholder="https://instagram.com/tuoaccount"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Twitter size={16} />
                    Twitter
                  </label>
                  <input
                    type="url"
                    value={branding.social_twitter || ''}
                    onChange={(e) => setBranding({ ...branding, social_twitter: e.target.value })}
                    placeholder="https://twitter.com/tuoaccount"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Linkedin size={16} />
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={branding.social_linkedin || ''}
                    onChange={(e) => setBranding({ ...branding, social_linkedin: e.target.value })}
                    placeholder="https://linkedin.com/company/tuaazienda"
                    className="form-input"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="branding-actions">
                <button
                  onClick={saveBranding}
                  disabled={isSaving}
                  className="btn-save-branding"
                >
                  <Save size={20} />
                  {isSaving ? 'Salvataggio...' : 'Salva Branding'}
                </button>
              </div>

              {/* Info Box */}
              <div className="info-box">
                <h4>ℹ️ Come funziona</h4>
                <ul>
                  <li>Il logo verrà mostrato nell'header di tutte le email automatiche</li>
                  <li>Il colore brand personalizza header, pulsanti e accenti</li>
                  <li>Le informazioni aziendali appaiono nel footer</li>
                  <li>I social link creano icone cliccabili nel footer</li>
                  <li>Tutti i campi sono opzionali - usa solo ciò che ti serve</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default OrganizationBrandingPanel
