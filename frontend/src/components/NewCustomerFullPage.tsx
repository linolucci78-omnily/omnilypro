import React, { useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import type { CustomerInput } from '../services/crmService'
import { useToast } from '../contexts/ToastContext'
import './NewCustomerFullPage.css'

interface NewCustomerFullPageProps {
  onBack: () => void
  onSave: (customer: CustomerInput) => Promise<void>
}

const NewCustomerFullPage: React.FC<NewCustomerFullPageProps> = ({ onBack, onSave }) => {
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState<CustomerInput>({
    company_name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    acquisition_channel: '',
    marketing_consent: false,
    email_consent: false,
    sms_consent: false
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSave(formData)
      showSuccess('Cliente Creato!', `${formData.company_name} è stato aggiunto con successo`)

      // Reset form
      setFormData({
        company_name: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        city: '',
        country: '',
        acquisition_channel: '',
        marketing_consent: false,
        email_consent: false,
        sms_consent: false
      })

      // Torna indietro dopo 1 secondo
      setTimeout(() => {
        onBack()
      }, 1000)
    } catch (err: any) {
      showError('Errore', err.message || 'Errore durante la creazione del cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="new-customer-fullpage">
      {/* Header */}
      <div className="fullpage-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={20} />
          Torna al CRM
        </button>
        <div className="header-info">
          <h1>Nuovo Cliente</h1>
          <p>Aggiungi un nuovo cliente al sistema CRM</p>
        </div>
      </div>

      {/* Form Content */}
      <div className="fullpage-content">
        <form onSubmit={handleSubmit} className="customer-form">
          {/* Informazioni Azienda */}
          <div className="form-section">
            <h2 className="section-title">Informazioni Azienda</h2>
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="company_name">Nome Azienda *</label>
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  required
                  placeholder="Es. Pizzeria Da Mario"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Informazioni Titolare */}
          <div className="form-section">
            <h2 className="section-title">Informazioni Titolare</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="first_name">Nome Titolare *</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  placeholder="Mario"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="last_name">Cognome Titolare *</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  placeholder="Rossi"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Contatti */}
          <div className="form-section">
            <h2 className="section-title">Contatti</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="mario.rossi@email.com"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Telefono</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+39 333 1234567"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Localizzazione */}
          <div className="form-section">
            <h2 className="section-title">Localizzazione</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="city">Città</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Milano"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="country">Paese</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Italia"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Acquisizione */}
          <div className="form-section">
            <h2 className="section-title">Informazioni Acquisizione</h2>
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="acquisition_channel">Canale di Acquisizione</label>
                <select
                  id="acquisition_channel"
                  name="acquisition_channel"
                  value={formData.acquisition_channel}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Seleziona...</option>
                  <option value="website">Sito Web</option>
                  <option value="social">Social Media</option>
                  <option value="referral">Referral</option>
                  <option value="advertising">Pubblicità</option>
                  <option value="store">Negozio Fisico</option>
                  <option value="other">Altro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Consensi Privacy */}
          <div className="form-section">
            <h2 className="section-title">Consensi Privacy</h2>

            <div style={{
              marginBottom: '1rem',
              padding: '0.875rem',
              background: '#f8fafc',
              borderRadius: '0.5rem',
              fontSize: '0.813rem',
              color: '#475569',
              lineHeight: '1.5',
              border: '1px solid #e2e8f0'
            }}>
              Prima di procedere, assicurati che il cliente abbia letto e accettato:{' '}
              <a
                href="/privacy.html"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#dc2626', textDecoration: 'underline', fontWeight: 500 }}
              >
                Privacy Policy
              </a>
              ,{' '}
              <a
                href="/cookie-policy.html"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#dc2626', textDecoration: 'underline', fontWeight: 500 }}
              >
                Cookie Policy
              </a>
              {' '}e{' '}
              <a
                href="/rights.html"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#dc2626', textDecoration: 'underline', fontWeight: 500 }}
              >
                Diritti degli Utenti
              </a>
              .
            </div>

            <div className="consent-grid">
              <label className="consent-label">
                <input
                  type="checkbox"
                  name="marketing_consent"
                  checked={formData.marketing_consent}
                  onChange={handleChange}
                  className="consent-checkbox"
                />
                <span className="consent-text">
                  <strong>Consenso Marketing</strong>
                  <small>Autorizza l'invio di comunicazioni promozionali</small>
                </span>
              </label>

              <label className="consent-label">
                <input
                  type="checkbox"
                  name="email_consent"
                  checked={formData.email_consent}
                  onChange={handleChange}
                  className="consent-checkbox"
                />
                <span className="consent-text">
                  <strong>Consenso Email</strong>
                  <small>Autorizza l'invio di email commerciali</small>
                </span>
              </label>

              <label className="consent-label">
                <input
                  type="checkbox"
                  name="sms_consent"
                  checked={formData.sms_consent}
                  onChange={handleChange}
                  className="consent-checkbox"
                />
                <span className="consent-text">
                  <strong>Consenso SMS</strong>
                  <small>Autorizza l'invio di SMS promozionali</small>
                </span>
              </label>
            </div>
          </div>

          {/* Form Footer */}
          <div className="form-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={onBack}
              disabled={loading}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="btn-save"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Crea Cliente
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewCustomerFullPage
