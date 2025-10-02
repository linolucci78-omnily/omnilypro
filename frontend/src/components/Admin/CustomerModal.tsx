import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { CustomerInput } from '../../services/crmService'
import './CustomerModal.css'

interface CustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (customer: CustomerInput) => Promise<void>
}

const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, onSave }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<CustomerInput>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: undefined,
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
    setError(null)
    setLoading(true)

    try {
      await onSave(formData)
      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: undefined,
        city: '',
        country: '',
        acquisition_channel: '',
        marketing_consent: false,
        email_consent: false,
        sms_consent: false
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Errore durante la creazione del cliente')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nuovo Cliente</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="modal-error">
              {error}
            </div>
          )}

          <div className="modal-form-content">
            <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">Nome *</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                placeholder="Mario"
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Cognome *</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                placeholder="Rossi"
              />
            </div>
          </div>

          <div className="form-row">
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
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date_of_birth">Data di nascita</label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Sesso</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender || ''}
                onChange={handleChange}
              >
                <option value="">Seleziona...</option>
                <option value="M">Maschio</option>
                <option value="F">Femmina</option>
                <option value="Other">Altro</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">Città</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Milano"
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
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="acquisition_channel">Canale di acquisizione</label>
            <select
              id="acquisition_channel"
              name="acquisition_channel"
              value={formData.acquisition_channel}
              onChange={handleChange}
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

          <div className="form-group-section">
            <h3>Consensi Privacy</h3>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="marketing_consent"
                  checked={formData.marketing_consent}
                  onChange={handleChange}
                />
                <span>Consenso Marketing</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="email_consent"
                  checked={formData.email_consent}
                  onChange={handleChange}
                />
                <span>Consenso Email</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="sms_consent"
                  checked={formData.sms_consent}
                  onChange={handleChange}
                />
                <span>Consenso SMS</span>
              </label>
            </div>
          </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Salvataggio...' : 'Crea Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CustomerModal
