import React, { useState } from 'react'
import { X, Mail, Lock, Shield, AlertCircle } from 'lucide-react'
import { usersService } from '../../services/usersService'
import type { CreateUserInput, UserRole } from '../../services/usersService'
import './CreateUserModal.css'

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateUserInput>({
    email: '',
    password: '',
    role: 'sales_agent'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validazione
      if (!formData.email || !formData.password) {
        throw new Error('Email e password sono obbligatori')
      }

      if (formData.password.length < 8) {
        throw new Error('La password deve essere di almeno 8 caratteri')
      }

      await usersService.createUser(formData)

      // Reset form
      setFormData({
        email: '',
        password: '',
        role: 'sales_agent'
      })

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Errore durante la creazione dell\'utente')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const roles = [
    { value: 'super_admin', label: 'Super Admin', description: 'Accesso completo a tutto il sistema OMNILY PRO' },
    { value: 'sales_agent', label: 'Agente Vendite', description: 'Accesso solo al CRM e gestione lead/vendite' },
    { value: 'account_manager', label: 'Account Manager', description: 'Gestione clienti esistenti, supporto e analytics' }
  ]

  const selectedRoleInfo = roles.find(r => r.value === formData.role)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container create-user-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Crea Nuovo Utente</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="modal-error">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <div className="modal-form-content">
            {/* Email */}
            <div className="form-section">
              <h3>Informazioni Account</h3>

              <div className="form-group">
                <label htmlFor="email">
                  <Mail size={16} />
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="utente@esempio.com"
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  <Lock size={16} />
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  placeholder="Minimo 8 caratteri"
                  autoComplete="new-password"
                />
                <small className="form-hint">
                  L'utente potrà cambiarla al primo accesso
                </small>
              </div>
            </div>

            {/* Ruolo e Permessi */}
            <div className="form-section">
              <h3>
                <Shield size={18} />
                Ruolo e Permessi
              </h3>

              <div className="form-group">
                <label htmlFor="role">Seleziona Ruolo *</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Info Card */}
              {selectedRoleInfo && (
                <div className="role-info-card">
                  <div className="role-info-header">
                    <Shield size={20} />
                    <strong>{selectedRoleInfo.label}</strong>
                  </div>
                  <p>{selectedRoleInfo.description}</p>

                  <div className="permissions-list">
                    <h4>Permessi:</h4>
                    {formData.role === 'super_admin' && (
                      <ul>
                        <li>✓ Accesso completo a tutte le sezioni</li>
                        <li>✓ Gestione utenti e ruoli</li>
                        <li>✓ Gestione organizzazioni</li>
                        <li>✓ CRM e pipeline vendite</li>
                        <li>✓ Configurazione sistema</li>
                        <li>✓ Database e sicurezza</li>
                      </ul>
                    )}

                    {formData.role === 'sales_agent' && (
                      <ul>
                        <li>✓ CRM - Gestione lead propri</li>
                        <li>✓ Pipeline vendite</li>
                        <li>✓ Firma contratti</li>
                        <li>✗ Accesso altre sezioni</li>
                        <li>✗ Gestione utenti</li>
                        <li>✗ Configurazione sistema</li>
                      </ul>
                    )}

                    {formData.role === 'account_manager' && (
                      <ul>
                        <li>✓ Gestione clienti esistenti</li>
                        <li>✓ Supporto e assistenza</li>
                        <li>✓ Visualizzazione CRM</li>
                        <li>✗ Creazione nuovi lead</li>
                        <li>✗ Gestione utenti</li>
                        <li>✗ Configurazione sistema</li>
                      </ul>
                    )}

                  </div>
                </div>
              )}
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
              {loading ? 'Creazione...' : 'Crea Utente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateUserModal
