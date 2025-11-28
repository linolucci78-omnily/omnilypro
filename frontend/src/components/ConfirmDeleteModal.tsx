import React, { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import './EditOrganizationModal.css'

interface ConfirmDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  itemName: string
  itemType?: string
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = 'azienda'
}) => {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = () => {
    if (inputValue.toLowerCase().trim() === itemName.toLowerCase().trim()) {
      onConfirm()
      handleClose()
    } else {
      setError('Nome non corretto. Riprova.')
    }
  }

  const handleClose = () => {
    setInputValue('')
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ background: '#fee2e2', borderBottom: '2px solid #ef4444' }}>
          <div className="modal-title">
            <AlertTriangle size={24} style={{ color: '#ef4444' }} />
            <h2 style={{ color: '#991b1b' }}>Conferma Eliminazione</h2>
          </div>
          <button onClick={handleClose} className="modal-close">
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{
            background: '#fef3c7',
            border: '2px solid #f59e0b',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px'
          }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#92400e' }}>
              ⚠️ ATTENZIONE - Questa azione è IRREVERSIBILE
            </p>
          </div>

          <p style={{ fontSize: '15px', color: '#374151', marginBottom: '15px' }}>
            Stai per eliminare <strong>{itemType}</strong>: <strong style={{ color: '#ef4444' }}>{itemName}</strong>
          </p>

          <div style={{
            background: '#fee2e2',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '20px'
          }}>
            <p style={{ fontSize: '13px', color: '#991b1b', margin: '5px 0', fontWeight: '500' }}>
              Questa azione eliminerà:
            </p>
            <ul style={{ margin: '10px 0', paddingLeft: '20px', fontSize: '13px', color: '#7f1d1d' }}>
              <li>TUTTI i dati dell'{itemType}</li>
              <li>Tutti i clienti associati</li>
              <li>Tutte le transazioni</li>
              <li>Tutti i report e statistiche</li>
            </ul>
          </div>

          <div className="form-group">
            <label style={{ fontWeight: '600', color: '#374151', fontSize: '14px' }}>
              Digita "<strong>{itemName}</strong>" per confermare:
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                setError('')
              }}
              placeholder={itemName}
              className="form-input"
              autoFocus
              style={{
                borderColor: error ? '#ef4444' : '#d1d5db',
                marginTop: '8px'
              }}
            />
            {error && (
              <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '5px' }}>
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="modal-actions" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
          <button onClick={handleClose} className="btn-secondary">
            Annulla
          </button>
          <button
            onClick={handleConfirm}
            className="btn-primary"
            disabled={!inputValue || inputValue.toLowerCase().trim() !== itemName.toLowerCase().trim()}
            style={{
              background: inputValue.toLowerCase().trim() === itemName.toLowerCase().trim() ? '#ef4444' : '#9ca3af',
              cursor: inputValue.toLowerCase().trim() === itemName.toLowerCase().trim() ? 'pointer' : 'not-allowed'
            }}
          >
            Elimina Definitivamente
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDeleteModal
