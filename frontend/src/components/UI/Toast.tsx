import React, { useEffect } from 'react'
import { CheckCircle, AlertTriangle, X, Info } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  isVisible: boolean
  onClose: () => void
  autoClose?: boolean
  duration?: number
}

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  isVisible,
  onClose,
  autoClose = true,
  duration = 4000
}) => {
  useEffect(() => {
    if (autoClose && isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, autoClose, duration, onClose])

  const getIcon = () => {
    const iconStyle = { strokeWidth: 2 }
    switch (type) {
      case 'success':
        return <CheckCircle size={18} style={{ ...iconStyle, color: '#10b981' }} />
      case 'error':
        return <AlertTriangle size={18} style={{ ...iconStyle, color: '#ef4444' }} />
      case 'warning':
        return <AlertTriangle size={18} style={{ ...iconStyle, color: '#f59e0b' }} />
      case 'info':
        return <Info size={18} style={{ ...iconStyle, color: '#3b82f6' }} />
    }
  }

  const getStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      top: '20px',
      right: '20px',
      zIndex: 9999,
      padding: '10px 14px',
      borderRadius: '6px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      minWidth: '240px',
      maxWidth: '360px',
      fontSize: '13px',
      fontWeight: '400',
      transform: isVisible ? 'translateX(0)' : 'translateX(120%)',
      transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      border: '1px solid'
    }

    switch (type) {
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          borderColor: 'rgba(16, 185, 129, 0.15)',
          color: '#374151',
          backdropFilter: 'blur(12px)'
        }
      case 'error':
        return {
          ...baseStyles,
          backgroundColor: '#fee2e2',
          borderColor: '#ef4444',
          color: '#991b1b'
        }
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: '#fef3c7',
          borderColor: '#f59e0b',
          color: '#92400e'
        }
      case 'info':
        return {
          ...baseStyles,
          backgroundColor: '#dbeafe',
          borderColor: '#3b82f6',
          color: '#1e40af'
        }
    }
  }

  if (!isVisible) return null

  return (
    <div style={getStyles()}>
      {getIcon()}
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.7,
          transition: 'opacity 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
      >
        <X size={16} />
      </button>
    </div>
  )
}

export default Toast