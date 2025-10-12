import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface InputField {
  name: string
  label: string
  type?: 'text' | 'url' | 'email' | 'number'
  placeholder?: string
  required?: boolean
  defaultValue?: string
  multiline?: boolean
  rows?: number
}

interface InputModalProps {
  isOpen: boolean
  title: string
  icon?: string
  fields: InputField[]
  confirmText?: string
  cancelText?: string
  onConfirm: (values: Record<string, string>) => void
  onCancel: () => void
  confirmButtonColor?: string
}

const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  title,
  icon,
  fields,
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  onConfirm,
  onCancel,
  confirmButtonColor = '#3b82f6'
}) => {
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      // Inizializza i valori con i defaultValue dei campi
      const initialValues: Record<string, string> = {}
      fields.forEach(field => {
        initialValues[field.name] = field.defaultValue || ''
      })
      setValues(initialValues)
    }
  }, [isOpen, fields])

  if (!isOpen) return null

  const handleConfirm = () => {
    // Validazione: controlla che tutti i campi required siano compilati
    const missingFields = fields.filter(
      field => field.required && !values[field.name]?.trim()
    )

    if (missingFields.length > 0) {
      return
    }

    onConfirm(values)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleConfirm()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001,
          padding: '20px'
        }}
        onClick={onCancel}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '500px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          zIndex: 10002
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyPress}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            {icon && (
              <span style={{ fontSize: '24px' }}>{icon}</span>
            )}
            <h3
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827'
              }}
            >
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Form Fields */}
        <div
          style={{
            padding: '24px',
            maxHeight: '60vh',
            overflowY: 'auto'
          }}
        >
          {fields.map((field, index) => (
            <div
              key={field.name}
              style={{ marginBottom: index < fields.length - 1 ? '20px' : '0' }}
            >
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}
              >
                {field.label}
                {field.required && (
                  <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                )}
              </label>
              {field.multiline ? (
                <textarea
                  value={values[field.name] || ''}
                  onChange={(e) =>
                    setValues({ ...values, [field.name]: e.target.value })
                  }
                  placeholder={field.placeholder}
                  rows={field.rows || 3}
                  autoFocus={index === 0}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  value={values[field.name] || ''}
                  onChange={(e) =>
                    setValues({ ...values, [field.name]: e.target.value })
                  }
                  placeholder={field.placeholder}
                  autoFocus={index === 0}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            padding: '20px 24px',
            borderTop: '1px solid #e5e7eb',
            justifyContent: 'flex-end'
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: '10px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: '#f9fafb',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb'
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '10px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: confirmButtonColor,
              color: 'white',
              border: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </>
  )
}

export default InputModal
