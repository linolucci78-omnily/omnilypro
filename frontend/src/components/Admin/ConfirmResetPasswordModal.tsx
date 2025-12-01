import React from 'react'
import { X, Mail, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import '../EditOrganizationModal.css'

interface ConfirmResetPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  email: string
}

const ConfirmResetPasswordModal: React.FC<ConfirmResetPasswordModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  email
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="edit-org-overlay" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="edit-org-modal"
            style={{ maxWidth: '500px' }}
          >
            {/* Header */}
            <div className="edit-org-header">
              <div className="edit-org-header-content">
                <Mail size={24} style={{ color: '#3b82f6' }} />
                <div>
                  <h2>Reset Password</h2>
                  <p style={{ fontSize: '14px', color: '#64748b' }}>Conferma invio email</p>
                </div>
              </div>
              <button onClick={onClose} className="edit-org-close-btn">
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="edit-org-content">
              <div className="edit-org-tab-content">
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <AlertCircle size={20} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', color: '#1e40af', margin: 0 }}>
                      Verrà inviata un'email di reset password a:
                    </p>
                    <p style={{ fontSize: '15px', color: '#1e3a8a', fontWeight: '600', margin: '8px 0 0 0' }}>
                      {email}
                    </p>
                  </div>
                </div>

                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                  L'utente riceverà un link per reimpostare la password. Il link sarà valido per 24 ore.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="edit-org-footer">
              <button onClick={onClose} className="btn-secondary">
                Annulla
              </button>
              <button onClick={onConfirm} className="btn-primary" style={{ background: '#3b82f6' }}>
                <Mail size={18} />
                Invia Email
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ConfirmResetPasswordModal
