import React, { useState, useEffect } from 'react'
import {
  Building2, Save, Mail, Phone, MapPin, FileText, CreditCard, User, Globe, Shield
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { organizationsApi } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import './ProfileSettings.css'

interface CompanyData {
  legal_name?: string
  legal_form?: string
  vat_number?: string
  tax_code?: string
  address_street?: string
  address_city?: string
  address_zip?: string
  address_province?: string
  address_country?: string
  company_phone?: string
  company_email?: string
  pec_email?: string
  legal_representative?: string
  privacy_email?: string
  website?: string
}

const LEGAL_FORMS = [
  { value: 'individual', label: 'Ditta Individuale' },
  { value: 'srl', label: 'S.r.l.' },
  { value: 'spa', label: 'S.p.a.' },
  { value: 'snc', label: 'S.n.c.' },
  { value: 'sas', label: 'S.a.s.' },
  { value: 'cooperative', label: 'Cooperativa' },
  { value: 'association', label: 'Associazione' },
  { value: 'other', label: 'Altro' }
]

const CompanyDataTab: React.FC = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(false)
  const [organizationId, setOrganizationId] = useState<string | null>(null)

  const [formData, setFormData] = useState<CompanyData>({
    legal_name: '',
    legal_form: 'srl',
    vat_number: '',
    tax_code: '',
    address_street: '',
    address_city: '',
    address_zip: '',
    address_province: '',
    address_country: 'Italia',
    company_phone: '',
    company_email: '',
    pec_email: '',
    legal_representative: '',
    privacy_email: '',
    website: ''
  })

  // Load organization data
  useEffect(() => {
    loadOrganizationData()
  }, [user])

  const loadOrganizationData = async () => {
    try {
      if (!user) return

      // Get first organization for this user (founder's organization)
      const organizations = await organizationsApi.getAll()
      if (organizations && organizations.length > 0) {
        const org = organizations[0]
        setOrganizationId(org.id)

        setFormData({
          legal_name: org.legal_name || '',
          legal_form: org.legal_form || 'srl',
          vat_number: org.vat_number || '',
          tax_code: org.tax_code || '',
          address_street: org.address_street || '',
          address_city: org.address_city || '',
          address_zip: org.address_zip || '',
          address_province: org.address_province || '',
          address_country: org.address_country || 'Italia',
          company_phone: org.company_phone || '',
          company_email: org.company_email || '',
          pec_email: org.pec_email || '',
          legal_representative: org.legal_representative || '',
          privacy_email: org.privacy_email || '',
          website: org.website || ''
        })
      }
    } catch (error) {
      console.error('Error loading organization data:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!organizationId) {
      showError('Errore: Organizzazione non trovata')
      return
    }

    setLoading(true)
    try {
      await organizationsApi.update(organizationId, formData)
      showSuccess('Dati aziendali salvati con successo!')
    } catch (error) {
      console.error('Error saving company data:', error)
      showError('Errore durante il salvataggio dei dati aziendali')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="founder-profile" style={{ paddingTop: 0 }}>
      <form onSubmit={handleSubmit} className="founder-content">
        <div className="founder-content-left">
          {/* Informazioni Legali */}
          <div className="founder-card">
            <div className="founder-card-header-inline">
              <h3>
                <Building2 size={20} style={{ marginRight: '8px', display: 'inline' }} />
                Informazioni Legali
              </h3>
            </div>
            <div className="founder-form-grid-2col">
              <div className="founder-form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Ragione Sociale *</label>
                <input
                  type="text"
                  name="legal_name"
                  value={formData.legal_name}
                  onChange={handleChange}
                  className="founder-form-input"
                  placeholder="es: OMNILY PRO S.r.l."
                  required
                />
              </div>
              <div className="founder-form-group">
                <label>Forma Giuridica *</label>
                <select
                  name="legal_form"
                  value={formData.legal_form}
                  onChange={handleChange}
                  className="founder-form-input"
                  required
                >
                  {LEGAL_FORMS.map(form => (
                    <option key={form.value} value={form.value}>
                      {form.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="founder-form-group">
                <label>Rappresentante Legale</label>
                <input
                  type="text"
                  name="legal_representative"
                  value={formData.legal_representative}
                  onChange={handleChange}
                  className="founder-form-input"
                  placeholder="Nome Cognome"
                />
              </div>
              <div className="founder-form-group">
                <label>Partita IVA *</label>
                <input
                  type="text"
                  name="vat_number"
                  value={formData.vat_number}
                  onChange={handleChange}
                  className="founder-form-input"
                  placeholder="IT12345678901"
                  required
                />
              </div>
              <div className="founder-form-group">
                <label>Codice Fiscale</label>
                <input
                  type="text"
                  name="tax_code"
                  value={formData.tax_code}
                  onChange={handleChange}
                  className="founder-form-input"
                  placeholder="12345678901"
                />
              </div>
            </div>
          </div>

          {/* Sede Legale */}
          <div className="founder-card">
            <div className="founder-card-header-inline">
              <h3>
                <MapPin size={20} style={{ marginRight: '8px', display: 'inline' }} />
                Sede Legale
              </h3>
            </div>
            <div className="founder-form-grid-2col">
              <div className="founder-form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Indirizzo *</label>
                <input
                  type="text"
                  name="address_street"
                  value={formData.address_street}
                  onChange={handleChange}
                  className="founder-form-input"
                  placeholder="Via Roma 123"
                  required
                />
              </div>
              <div className="founder-form-group">
                <label>Città *</label>
                <input
                  type="text"
                  name="address_city"
                  value={formData.address_city}
                  onChange={handleChange}
                  className="founder-form-input"
                  placeholder="Roma"
                  required
                />
              </div>
              <div className="founder-form-group">
                <label>CAP *</label>
                <input
                  type="text"
                  name="address_zip"
                  value={formData.address_zip}
                  onChange={handleChange}
                  className="founder-form-input"
                  placeholder="00100"
                  required
                />
              </div>
              <div className="founder-form-group">
                <label>Provincia *</label>
                <input
                  type="text"
                  name="address_province"
                  value={formData.address_province}
                  onChange={handleChange}
                  className="founder-form-input"
                  placeholder="RM"
                  maxLength={2}
                  required
                />
              </div>
              <div className="founder-form-group">
                <label>Paese</label>
                <input
                  type="text"
                  name="address_country"
                  value={formData.address_country}
                  onChange={handleChange}
                  className="founder-form-input"
                  placeholder="Italia"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="founder-content-right">
          {/* Contatti Aziendali */}
          <div className="founder-card">
            <div className="founder-card-header-inline">
              <h3>
                <Mail size={20} style={{ marginRight: '8px', display: 'inline' }} />
                Contatti Aziendali
              </h3>
            </div>
            <div className="founder-form-group">
              <label>Email Aziendale *</label>
              <input
                type="email"
                name="company_email"
                value={formData.company_email}
                onChange={handleChange}
                className="founder-form-input"
                placeholder="info@omnilypro.com"
                required
              />
            </div>
            <div className="founder-form-group">
              <label>Email Privacy/GDPR</label>
              <input
                type="email"
                name="privacy_email"
                value={formData.privacy_email}
                onChange={handleChange}
                className="founder-form-input"
                placeholder="privacy@omnilypro.com"
              />
              <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Usata nella Privacy Policy
              </small>
            </div>
            <div className="founder-form-group">
              <label>PEC</label>
              <input
                type="email"
                name="pec_email"
                value={formData.pec_email}
                onChange={handleChange}
                className="founder-form-input"
                placeholder="omnilypro@pec.it"
              />
            </div>
            <div className="founder-form-group">
              <label>Telefono</label>
              <input
                type="tel"
                name="company_phone"
                value={formData.company_phone}
                onChange={handleChange}
                className="founder-form-input"
                placeholder="+39 06 1234567"
              />
            </div>
            <div className="founder-form-group">
              <label>Sito Web</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="founder-form-input"
                placeholder="https://omnilypro.com"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="founder-id-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
            <div className="founder-id-header">
              <Shield size={18} />
              <span>Dati Privacy Policy</span>
            </div>
            <p className="founder-id-description" style={{ color: 'white' }}>
              Questi dati verranno utilizzati automaticamente nella Privacy Policy mostrata ai clienti durante la registrazione.
            </p>
          </div>

          {/* Save Button */}
          <button type="submit" className="founder-btn-save" disabled={loading}>
            <Save size={18} />
            {loading ? 'Salvataggio...' : 'Salva Dati Aziendali'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CompanyDataTab
