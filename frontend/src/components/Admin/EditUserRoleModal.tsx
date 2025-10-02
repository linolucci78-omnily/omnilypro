import React, { useState } from 'react'
import { X, Shield, Info } from 'lucide-react'
import type { UserRole } from '../../services/usersService'
import './EditUserRoleModal.css'

interface EditUserRoleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (newRole: UserRole) => void
  currentEmail: string
  currentRole: UserRole
}

const EditUserRoleModal: React.FC<EditUserRoleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentEmail,
  currentRole
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole)

  const roles = [
    {
      value: 'super_admin' as UserRole,
      label: 'Super Admin',
      description: 'Accesso completo a tutto il sistema',
      color: '#dc2626'
    },
    {
      value: 'sales_agent' as UserRole,
      label: 'Agente Vendite',
      description: 'Accesso CRM e gestione lead',
      color: '#3b82f6'
    },
    {
      value: 'account_manager' as UserRole,
      label: 'Account Manager',
      description: 'Gestione clienti e supporto',
      color: '#8b5cf6'
    },
    {
      value: 'organization_owner' as UserRole,
      label: 'Proprietario Organizzazione',
      description: 'Accesso alla propria organizzazione',
      color: '#059669'
    },
    {
      value: 'organization_staff' as UserRole,
      label: 'Staff Organizzazione',
      description: 'Permessi limitati organizzazione',
      color: '#64748b'
    }
  ]

  const handleSave = () => {
    if (selectedRole !== currentRole) {
      onSave(selectedRole)
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="edit-role-modal-overlay" onClick={onClose}>
      <div className="edit-role-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="edit-role-modal-header">
          <div>
            <h2 className="edit-role-modal-title">
              <Shield size={24} />
              Modifica Ruolo
            </h2>
            <p className="edit-role-modal-subtitle">{currentEmail}</p>
          </div>
          <button className="edit-role-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="edit-role-modal-content">
          <div className="current-role-info">
            <Info size={18} />
            <span>Ruolo attuale: <strong>{roles.find(r => r.value === currentRole)?.label}</strong></span>
          </div>

          <div className="roles-list">
            {roles.map((role) => (
              <label
                key={role.value}
                className={`role-option ${selectedRole === role.value ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={selectedRole === role.value}
                  onChange={() => setSelectedRole(role.value)}
                />
                <div className="role-option-content">
                  <div className="role-option-header">
                    <span
                      className="role-option-badge"
                      style={{
                        background: `${role.color}20`,
                        color: role.color
                      }}
                    >
                      {role.label}
                    </span>
                    {selectedRole === role.value && (
                      <span className="role-selected-indicator">✓</span>
                    )}
                  </div>
                  <p className="role-option-description">{role.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="edit-role-modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Annulla
          </button>
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={selectedRole === currentRole}
          >
            Salva Modifiche
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditUserRoleModal
