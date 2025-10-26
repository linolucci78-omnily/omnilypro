// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { Pipette, Check } from 'lucide-react';

interface ColorPickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  presetColors?: string[];
  showAlpha?: boolean;
}

const DEFAULT_PRESETS = [
  // Whites & Grays
  '#ffffff', '#f9fafb', '#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937', '#111827', '#000000',

  // Blues
  '#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a',

  // Purples
  '#f5f3ff', '#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95',

  // Greens
  '#f0fdf4', '#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d',

  // Reds
  '#fef2f2', '#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d',

  // Oranges
  '#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12',

  // Yellows
  '#fefce8', '#fef9c3', '#fef08a', '#fde047', '#facc15', '#eab308', '#ca8a04', '#a16207', '#854d0e', '#713f12',

  // Teal/Cyan
  '#f0fdfa', '#ccfbf1', '#99f6e4', '#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e', '#115e59', '#134e4a',
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  presetColors = DEFAULT_PRESETS,
  showAlpha = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomColor(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePresetClick = (color: string) => {
    onChange(color);
    setCustomColor(color);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onChange(newColor);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    if (newColor.match(/^#[0-9A-Fa-f]{0,8}$/)) {
      setCustomColor(newColor);
      if (newColor.length === 7 || newColor.length === 9) {
        onChange(newColor);
      }
    }
  };

  return (
    <div style={{ marginBottom: '16px' }} ref={pickerRef}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '13px',
          fontWeight: '600',
          color: '#374151'
        }}>
          {label}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        {/* Color display button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 12px',
            border: '1.5px solid #e5e7eb',
            borderRadius: '8px',
            background: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: value || 'transparent',
              border: '2px solid #e5e7eb',
              flexShrink: 0,
            }}
          />
          <span style={{
            flex: 1,
            textAlign: 'left',
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#374151'
          }}>
            {value || 'Seleziona colore'}
          </span>
          <Pipette size={16} color="#6b7280" />
        </button>

        {/* Dropdown palette */}
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
              padding: '16px',
              zIndex: 1000,
              maxHeight: '400px',
              overflowY: 'auto',
            }}
          >
            {/* Custom color input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280'
              }}>
                Colore Personalizzato
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={customColor}
                  onChange={handleCustomColorChange}
                  style={{
                    width: '48px',
                    height: '48px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                />
                <input
                  type="text"
                  value={customColor}
                  onChange={handleInputChange}
                  placeholder="#000000"
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
            </div>

            <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

            {/* Preset colors palette */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '12px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280'
              }}>
                Palette Colori
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))',
                  gap: '6px',
                }}
              >
                {presetColors.map((color, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handlePresetClick(color)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background: color,
                      border: value === color ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    title={color}
                  >
                    {value === color && (
                      <Check
                        size={16}
                        color={color === '#ffffff' || color === '#f9fafb' ? '#000' : '#fff'}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Transparent option */}
            <div style={{ marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => handlePresetClick('transparent')}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: value === 'transparent' ? '2px solid #3b82f6' : '2px solid #e5e7eb',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {value === 'transparent' && <Check size={16} />}
                Trasparente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
