import React, { useState } from 'react'
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
  CreditCard,
  Users,
  Briefcase,
  Save,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { organizationService } from '../services/organizationService'
import './BusinessDetailsHub.css'

interface BusinessDetailsHubProps {
  organizationId: string
  organizationName: string
  primaryColor: string
  secondaryColor: string
  organization: any
  onBack: () => void
  onUpdate: () => void
}

const BusinessDetailsHub: React.FC<BusinessDetailsHubProps> = ({
  organizationId,
  organizationName,
  primaryColor,
  secondaryColor,
  organization,
  onBack,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    tagline: organization?.tagline || '',
    partita_iva: organization?.partita_iva || '',
    codice_fiscale: organization?.codice_fiscale || '',
    industry: organization?.industry || '',
    team_size: organization?.team_size || '',
    business_email: organization?.business_email || '',
    phone_number: organization?.phone || '',
    website: organization?.website || '',
    address: organization?.address || '',
    city: organization?.city || '',
    cap: organization?.postal_code || ''
  })

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      await organizationService.updateOrganizationDetails(organizationId, {
        name: formData.name,
        tagline: formData.tagline,
        partita_iva: formData.partita_iva,
        codice_fiscale: formData.codice_fiscale,
        industry: formData.industry,
        team_size: formData.team_size,
        business_email: formData.business_email,
        phone: formData.phone_number,
        website: formData.website,
        address: formData.address,
        city: formData.city,
        postal_code: formData.cap
      })
      setMessage({ type: 'success', text: 'Dettagli aziendali salvati con successo!' })
      setTimeout(() => {
        setMessage(null)
        onUpdate()
      }, 3000)
    } catch (error) {
      console.error('Error saving business details:', error)
      setMessage({ type: 'error', text: 'Errore nel salvataggio dei dettagli' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="business-details-hub"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      {/* Header */}
      <div className="business-details-header">
        <button className="back-button" onClick={onBack}>
          ← Torna alle Impostazioni
        </button>
        <div className="business-details-header-content">
          <div className="business-details-icon">
            <Building2 size={48} />
          </div>
          <div>
            <h1>Dettagli Business</h1>
            <p>Gestisci informazioni aziendali, contatti e dati fiscali</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`business-message ${message.type}`}>
          {message.type === 'success' ? <Save size={20} /> : <AlertTriangle size={20} />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      {/* Main Content */}
      <div className="business-details-content">

        {/* Business Info */}
        <div className="business-section">
          <div className="business-section-header">
            <Building2 size={24} />
            <h2>Informazioni Aziendali</h2>
          </div>

          <div className="business-form-grid">
            <div className="form-group full-width">
              <label>
                <FileText size={18} />
                Nome Business
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome della tua attività"
              />
            </div>

            <div className="form-group full-width">
              <label>
                <FileText size={18} />
                Tagline / Descrizione
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="Una breve descrizione della tua attività"
              />
            </div>

            <div className="form-group">
              <label>
                <CreditCard size={18} />
                Partita IVA
              </label>
              <input
                type="text"
                value={formData.partita_iva}
                onChange={(e) => setFormData({ ...formData, partita_iva: e.target.value })}
                placeholder="IT12345678901"
              />
            </div>

            <div className="form-group">
              <label>
                <FileText size={18} />
                Codice Fiscale
              </label>
              <input
                type="text"
                value={formData.codice_fiscale}
                onChange={(e) => setFormData({ ...formData, codice_fiscale: e.target.value })}
                placeholder="RSSMRA80A01H501U"
              />
            </div>

            <div className="form-group">
              <label>
                <Briefcase size={18} />
                Settore
              </label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              >
                <option value="">Seleziona settore</option>
                <option value="retail">Retail</option>
                <option value="food">Food & Beverage</option>
                <option value="beauty">Bellezza & Estetica</option>
                <option value="fitness">Fitness & Sport</option>
                <option value="services">Servizi</option>
                <option value="other">Altro</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                <Users size={18} />
                Dimensione Team
              </label>
              <select
                value={formData.team_size}
                onChange={(e) => setFormData({ ...formData, team_size: e.target.value })}
              >
                <option value="">Seleziona dimensione</option>
                <option value="1">Solo io</option>
                <option value="2-5">2-5 persone</option>
                <option value="6-10">6-10 persone</option>
                <option value="11-25">11-25 persone</option>
                <option value="26-50">26-50 persone</option>
                <option value="50+">50+ persone</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="business-section">
          <div className="business-section-header">
            <Phone size={24} />
            <h2>Informazioni di Contatto</h2>
          </div>

          <div className="business-form-grid">
            <div className="form-group">
              <label>
                <Mail size={18} />
                Email Business
              </label>
              <input
                type="email"
                value={formData.business_email}
                onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                placeholder="info@tuodominio.it"
              />
            </div>

            <div className="form-group">
              <label>
                <Phone size={18} />
                Telefono
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="+39 123 456 7890"
              />
            </div>

            <div className="form-group full-width">
              <label>
                <Globe size={18} />
                Sito Web
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.tuosito.it"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="business-section">
          <div className="business-section-header">
            <MapPin size={24} />
            <h2>Indirizzo</h2>
          </div>

          <div className="business-form-grid">
            <div className="form-group full-width">
              <label>
                <MapPin size={18} />
                Via e Numero Civico
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Via Roma, 123"
              />
            </div>

            <div className="form-group">
              <label>Città</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Milano"
              />
            </div>

            <div className="form-group">
              <label>CAP</label>
              <input
                type="text"
                value={formData.cap}
                onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
                placeholder="20121"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button className="btn-save" onClick={handleSave} disabled={saving}>
          {saving ? <RefreshCw size={20} className="spin" /> : <Save size={20} />}
          {saving ? 'Salvataggio...' : 'Salva Tutti i Dettagli'}
        </button>
      </div>
    </div>
  )
}

export default BusinessDetailsHub
