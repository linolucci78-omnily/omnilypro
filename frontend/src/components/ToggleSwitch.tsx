import React from 'react'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  primaryColor?: string
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  primaryColor = '#6366f1',
}) => {
  return (
    <div className="toggle-switch-container">
      <div className="toggle-content">
        <div className="toggle-text">
          {label && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="toggle-label">{label}</span>
              <span
                className="toggle-status-badge"
                style={{
                  backgroundColor: checked ? '#10b98120' : '#ef444420',
                  color: checked ? '#10b981' : '#ef4444',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {checked ? 'ON' : 'OFF'}
              </span>
            </div>
          )}
          {description && <span className="toggle-description">{description}</span>}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={`toggle-button ${checked ? 'toggle-checked' : 'toggle-unchecked'} ${disabled ? 'toggle-disabled' : ''}`}
          style={checked ? { backgroundColor: '#10b981' } : { backgroundColor: '#ef4444' }}
        >
          <span className="toggle-slider" />
        </button>
      </div>

      <style>{`
        .toggle-switch-container {
          width: 100%;
        }

        .toggle-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--omnily-spacing-4);
          padding: var(--omnily-spacing-4);
          background: var(--omnily-gray-50);
          border-radius: var(--omnily-border-radius-lg);
          transition: all 0.2s;
        }

        .toggle-content:hover {
          background: var(--omnily-gray-100);
          transform: translateY(-1px);
        }

        .toggle-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--omnily-spacing-1);
        }

        .toggle-label {
          font-weight: 600;
          font-size: var(--omnily-font-size-base);
          color: var(--omnily-gray-900);
        }

        .toggle-description {
          font-size: var(--omnily-font-size-sm);
          color: var(--omnily-gray-600);
          line-height: 1.4;
        }

        .toggle-button {
          position: relative;
          width: 52px;
          height: 28px;
          border-radius: 14px;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          flex-shrink: 0;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .toggle-button:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
        }

        .toggle-unchecked {
          /* Rosso - spento */
        }

        .toggle-checked {
          /* Verde - acceso */
        }

        .toggle-disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .toggle-slider {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 50%;
          transition: transform 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .toggle-checked .toggle-slider {
          transform: translateX(24px);
        }

        @media (max-width: 768px) {
          .toggle-content {
            gap: var(--omnily-spacing-3);
          }

          .toggle-label {
            font-size: var(--omnily-font-size-sm);
          }

          .toggle-description {
            font-size: var(--omnily-font-size-xs);
          }
        }
      `}</style>
    </div>
  )
}
