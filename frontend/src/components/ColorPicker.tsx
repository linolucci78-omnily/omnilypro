import React, { useState } from 'react'
import { Palette } from 'lucide-react'

interface ColorPickerProps {
  label: string
  value: string
  onChange: (color: string) => void
  description?: string
  primaryColor?: string
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  description,
  primaryColor = '#ef4444'
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="form-group">
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Palette size={16} style={{ color: primaryColor }} />
        {label}
      </label>

      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          borderRadius: '12px',
          border: '2px solid var(--omnily-border-color)',
          padding: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          background: 'white',
          boxShadow: isOpen ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.05)',
          transform: isOpen ? 'scale(1.02)' : 'scale(1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Color Circle Preview */}
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: value,
            border: '3px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(0,0,0,0.1)',
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Shine effect */}
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.5)',
              filter: 'blur(4px)'
            }} />
          </div>

          {/* Color Info */}
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--omnily-gray-800)',
              marginBottom: '2px',
              letterSpacing: '0.5px'
            }}>
              {value.toUpperCase()}
            </div>
            {description && (
              <div style={{
                fontSize: '13px',
                color: 'var(--omnily-gray-500)',
                marginTop: '2px'
              }}>
                {description}
              </div>
            )}
          </div>

          {/* Color Picker Input (Hidden but functional) */}
          <input
            type="color"
            value={value}
            onChange={(e) => {
              e.stopPropagation()
              onChange(e.target.value)
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              border: '2px solid var(--omnily-border-color)',
              cursor: 'pointer',
              flexShrink: 0
            }}
          />
        </div>
      </div>
    </div>
  )
}
