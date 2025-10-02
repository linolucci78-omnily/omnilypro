import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { CRMLeadInput } from '../../services/crmLeadsService'
import './LeadModal.css'

interface LeadModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (lead: CRMLeadInput) => Promise<void>
}

const LeadModal: React.FC<LeadModalProps> = ({ isOpen, onClose, onSave }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<CRMLeadInput>({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    address: '',
    stage: 'lead',
    probability: 10,
    estimated_monthly_value: 0,
    interested_modules: [],
    plan_type: '',
    next_action: '',
    next_action_date: '',
    notes: '',
    source: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      const currentModules = formData.interested_modules || []

      if (checked) {
        setFormData(prev => ({
          ...prev,
          interested_modules: [...currentModules, value]
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          interested_modules: currentModules.filter(m => m !== value)
        }))
      }
    } else if (name === 'estimated_monthly_value' || name === 'probability') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }))
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
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        city: '',
        country: '',
        address: '',
        stage: 'lead',
        probability: 10,
        estimated_monthly_value: 0,
        interested_modules: [],
        plan_type: '',
        next_action: '',
        next_action_date: '',
        notes: '',
        source: ''
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Errore durante la creazione del lead')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nuovo Lead</h2>
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
            {/* Company Info */}
            <div className="form-section">
              <h3>Informazioni Azienda</h3>

              <div className="form-group">
                <label htmlFor="company_name">Nome Azienda *</label>
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  required
                  placeholder="Es. Pizzeria Da Mario"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contact_name">Nome Contatto *</label>
                  <input
                    type="text"
                    id="contact_name"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleChange}
                    required
                    placeholder="Mario Rossi"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="mario@pizzeria.it"
                  />
                </div>
              </div>

              <div className="form-row">
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
              </div>

              <div className="form-group">
                <label htmlFor="address">Indirizzo Completo</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Via Roma 123, Milano"
                />
              </div>
            </div>

            {/* Sales Info */}
            <div className="form-section">
              <h3>Informazioni Vendita</h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="estimated_monthly_value">Valore Stimato Mensile (€) *</label>
                  <input
                    type="number"
                    id="estimated_monthly_value"
                    name="estimated_monthly_value"
                    value={formData.estimated_monthly_value}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="350.00"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="plan_type">Piano Interesse</label>
                  <select
                    id="plan_type"
                    name="plan_type"
                    value={formData.plan_type}
                    onChange={handleChange}
                  >
                    <option value="">Seleziona...</option>
                    <option value="basic">Basic</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="source">Origine Lead</label>
                <select
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                >
                  <option value="">Seleziona...</option>
                  <option value="website">Sito Web</option>
                  <option value="referral">Referral</option>
                  <option value="cold_call">Chiamata a Freddo</option>
                  <option value="event">Evento/Fiera</option>
                  <option value="partner">Partner</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="other">Altro</option>
                </select>
              </div>

              <div className="form-group-section">
                <h3>Moduli di Interesse</h3>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      value="pos"
                      checked={formData.interested_modules?.includes('pos')}
                      onChange={handleChange}
                    />
                    <span>POS (Punto Vendita)</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      value="inventory"
                      checked={formData.interested_modules?.includes('inventory')}
                      onChange={handleChange}
                    />
                    <span>Inventory (Magazzino)</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      value="loyalty"
                      checked={formData.interested_modules?.includes('loyalty')}
                      onChange={handleChange}
                    />
                    <span>Loyalty Program</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      value="analytics"
                      checked={formData.interested_modules?.includes('analytics')}
                      onChange={handleChange}
                    />
                    <span>Analytics</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      value="crm"
                      checked={formData.interested_modules?.includes('crm')}
                      onChange={handleChange}
                    />
                    <span>CRM</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Follow-up */}
            <div className="form-section">
              <h3>Prossima Azione</h3>

              <div className="form-group">
                <label htmlFor="next_action">Cosa Fare</label>
                <input
                  type="text"
                  id="next_action"
                  name="next_action"
                  value={formData.next_action}
                  onChange={handleChange}
                  placeholder="Es. Chiamare per fissare demo"
                />
              </div>

              <div className="form-group">
                <label htmlFor="next_action_date">Data Prossima Azione</label>
                <input
                  type="date"
                  id="next_action_date"
                  name="next_action_date"
                  value={formData.next_action_date}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes">Note</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Aggiungi note o dettagli importanti..."
                />
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
              {loading ? 'Salvataggio...' : 'Crea Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LeadModal
