import React from 'react'
import { Paintbrush, Image as ImageIcon, Sparkles } from 'lucide-react'
import { ToggleSwitch } from './ToggleSwitch'

interface StylingConfig {
  [key: string]: any
}

interface WebsiteStylingTabProps {
  config: StylingConfig
  updateConfig: (key: string, value: any) => void
  primaryColor: string
}

export const WebsiteStylingTab: React.FC<WebsiteStylingTabProps> = ({
  config,
  updateConfig,
  primaryColor,
}) => {
  const sections = [
    {
      id: 'hero',
      label: 'Hero (Sezione Principale)',
      icon: '🚀',
      defaultBg: '#0f172a',
      defaultType: 'gradient',
    },
    {
      id: 'about',
      label: 'Chi Siamo',
      icon: '👋',
      defaultBg: '#ffffff',
    },
    {
      id: 'services',
      label: 'Servizi',
      icon: '💼',
      defaultBg: '#f8fafc',
    },
    {
      id: 'gallery',
      label: 'Gallery',
      icon: '📸',
      defaultBg: '#ffffff',
    },
    {
      id: 'loyalty',
      label: 'Programma Fedeltà',
      icon: '🎁',
      defaultBg: '#f8fafc',
    },
    {
      id: 'testimonials',
      label: 'Recensioni',
      icon: '⭐',
      defaultBg: '#f8fafc',
    },
    {
      id: 'pricing',
      label: 'Listino',
      icon: '💰',
      defaultBg: '#ffffff',
    },
    {
      id: 'team',
      label: 'Team',
      icon: '👥',
      defaultBg: '#ffffff',
    },
    {
      id: 'video',
      label: 'Video',
      icon: '🎬',
      defaultBg: '#000000',
    },
    {
      id: 'contact',
      label: 'Contatti',
      icon: '📧',
      defaultBg: '#f8fafc',
    },
  ]

  return (
    <div className="config-section">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--omnily-spacing-3)',
          marginBottom: 'var(--omnily-spacing-6)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--omnily-border-radius-lg)',
            background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paintbrush size={24} style={{ color: primaryColor }} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0 }}>🎨 Personalizza Ogni Sezione</h3>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: 'var(--omnily-font-size-sm)',
              color: 'var(--omnily-gray-600)',
            }}
          >
            Controlla colori, sfondi, overlay e effetti per ogni sezione del sito
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 'var(--omnily-spacing-6)' }}>
        {sections.map((section) => (
          <div
            key={section.id}
            style={{
              background: 'white',
              borderRadius: 'var(--omnily-border-radius-xl)',
              padding: 'var(--omnily-spacing-5)',
              border: '2px solid var(--omnily-border-color)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            }}
          >
            {/* Section Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--omnily-spacing-3)',
                marginBottom: 'var(--omnily-spacing-4)',
                paddingBottom: 'var(--omnily-spacing-4)',
                borderBottom: '1px solid var(--omnily-border-color)',
              }}
            >
              <span style={{ fontSize: '32px' }}>{section.icon}</span>
              <h4 style={{ margin: 0, fontSize: 'var(--omnily-font-size-lg)', fontWeight: 700 }}>
                {section.label}
              </h4>
            </div>

            {/* Background Type */}
            <div style={{ marginBottom: 'var(--omnily-spacing-4)' }}>
              <label
                style={{
                  display: 'block',
                  fontWeight: 600,
                  marginBottom: 'var(--omnily-spacing-2)',
                  color: 'var(--omnily-gray-700)',
                }}
              >
                Tipo Sfondo
              </label>
              <div style={{ display: 'flex', gap: 'var(--omnily-spacing-2)' }}>
                {[
                  { value: 'color', label: '🎨 Colore Solido' },
                  { value: 'gradient', label: '🌈 Gradiente' },
                  { value: 'image', label: '🖼️ Immagine' },
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => updateConfig(`website_${section.id}_bg_type`, type.value)}
                    style={{
                      flex: 1,
                      padding: 'var(--omnily-spacing-3)',
                      borderRadius: 'var(--omnily-border-radius-md)',
                      border: '2px solid',
                      borderColor:
                        (config[`website_${section.id}_bg_type`] || 'color') === type.value
                          ? primaryColor
                          : 'var(--omnily-border-color)',
                      background:
                        (config[`website_${section.id}_bg_type`] || 'color') === type.value
                          ? `${primaryColor}10`
                          : 'white',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 'var(--omnily-font-size-sm)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Inputs based on type */}
            {(config[`website_${section.id}_bg_type`] || 'color') === 'color' && (
              <div style={{ marginBottom: 'var(--omnily-spacing-4)' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    marginBottom: 'var(--omnily-spacing-2)',
                    color: 'var(--omnily-gray-700)',
                  }}
                >
                  Colore Sfondo
                </label>
                <div style={{
                  padding: 'var(--omnily-spacing-4)',
                  borderRadius: 'var(--omnily-border-radius-lg)',
                  border: '2px solid var(--omnily-border-color)',
                  background: '#fafafa',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: config[`website_${section.id}_bg_color`] || section.defaultBg,
                      border: '3px solid white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 'var(--omnily-font-size-base)', fontWeight: 700, color: '#1f2937', marginBottom: '2px' }}>
                        {(config[`website_${section.id}_bg_color`] || section.defaultBg).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 'var(--omnily-font-size-xs)', color: '#6b7280' }}>
                        Sfondo solido della sezione
                      </div>
                    </div>
                    <input
                      type="color"
                      value={config[`website_${section.id}_bg_color`] || section.defaultBg}
                      onChange={(e) => updateConfig(`website_${section.id}_bg_color`, e.target.value)}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        border: '2px solid var(--omnily-border-color)',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {(config[`website_${section.id}_bg_type`] || 'color') === 'gradient' && (
              <div style={{ marginBottom: 'var(--omnily-spacing-4)' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    marginBottom: 'var(--omnily-spacing-2)',
                    color: 'var(--omnily-gray-700)',
                  }}
                >
                  Gradiente Sfondo
                </label>

                {/* Colore Inizio Gradiente */}
                <div style={{
                  padding: 'var(--omnily-spacing-4)',
                  borderRadius: 'var(--omnily-border-radius-lg)',
                  border: '2px solid var(--omnily-border-color)',
                  background: '#fafafa',
                  marginBottom: 'var(--omnily-spacing-3)',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: config[`website_${section.id}_bg_gradient_start`] || '#f8fafc',
                      border: '3px solid white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 'var(--omnily-font-size-base)', fontWeight: 700, color: '#1f2937', marginBottom: '2px' }}>
                        {(config[`website_${section.id}_bg_gradient_start`] || '#f8fafc').toUpperCase()}
                      </div>
                      <div style={{ fontSize: 'var(--omnily-font-size-xs)', color: '#6b7280' }}>
                        Colore Inizio
                      </div>
                    </div>
                    <input
                      type="color"
                      value={config[`website_${section.id}_bg_gradient_start`] || '#f8fafc'}
                      onChange={(e) => updateConfig(`website_${section.id}_bg_gradient_start`, e.target.value)}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        border: '2px solid var(--omnily-border-color)',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </div>

                {/* Colore Fine Gradiente */}
                <div style={{
                  padding: 'var(--omnily-spacing-4)',
                  borderRadius: 'var(--omnily-border-radius-lg)',
                  border: '2px solid var(--omnily-border-color)',
                  background: '#fafafa',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: config[`website_${section.id}_bg_gradient_end`] || '#e2e8f0',
                      border: '3px solid white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 'var(--omnily-font-size-base)', fontWeight: 700, color: '#1f2937', marginBottom: '2px' }}>
                        {(config[`website_${section.id}_bg_gradient_end`] || '#e2e8f0').toUpperCase()}
                      </div>
                      <div style={{ fontSize: 'var(--omnily-font-size-xs)', color: '#6b7280' }}>
                        Colore Fine
                      </div>
                    </div>
                    <input
                      type="color"
                      value={config[`website_${section.id}_bg_gradient_end`] || '#e2e8f0'}
                      onChange={(e) => updateConfig(`website_${section.id}_bg_gradient_end`, e.target.value)}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        border: '2px solid var(--omnily-border-color)',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {(config[`website_${section.id}_bg_type`] || 'color') === 'image' && (
              <div style={{ marginBottom: 'var(--omnily-spacing-4)' }}>
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    marginBottom: 'var(--omnily-spacing-2)',
                    color: 'var(--omnily-gray-700)',
                  }}
                >
                  URL Immagine Sfondo
                </label>
                <input
                  type="url"
                  value={config[`website_${section.id}_bg_image`] || ''}
                  onChange={(e) => updateConfig(`website_${section.id}_bg_image`, e.target.value)}
                  placeholder="https://esempio.com/immagine.jpg"
                  style={{
                    width: '100%',
                    padding: 'var(--omnily-spacing-3)',
                    borderRadius: 'var(--omnily-border-radius-md)',
                    border: '2px solid var(--omnily-border-color)',
                    fontSize: 'var(--omnily-font-size-base)',
                  }}
                />
              </div>
            )}

            {/* Text Color - Card Style */}
            <div style={{ marginBottom: 'var(--omnily-spacing-4)' }}>
              <label
                style={{
                  display: 'block',
                  fontWeight: 600,
                  marginBottom: 'var(--omnily-spacing-2)',
                  color: 'var(--omnily-gray-700)',
                }}
              >
                Colore Testo
              </label>
              <div style={{
                padding: 'var(--omnily-spacing-4)',
                borderRadius: 'var(--omnily-border-radius-lg)',
                border: '2px solid var(--omnily-border-color)',
                background: '#fafafa',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: config[`website_${section.id}_text_color`] || '#1f2937',
                    border: '3px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 'var(--omnily-font-size-base)', fontWeight: 700, color: '#1f2937', marginBottom: '2px' }}>
                      {(config[`website_${section.id}_text_color`] || '#1f2937').toUpperCase()}
                    </div>
                    <div style={{ fontSize: 'var(--omnily-font-size-xs)', color: '#6b7280' }}>
                      Colore del testo in questa sezione
                    </div>
                  </div>
                  <input
                    type="color"
                    value={config[`website_${section.id}_text_color`] || '#1f2937'}
                    onChange={(e) => updateConfig(`website_${section.id}_text_color`, e.target.value)}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      border: '2px solid var(--omnily-border-color)',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Font Override */}
            <div style={{ marginBottom: 'var(--omnily-spacing-4)' }}>
              <label
                style={{
                  display: 'block',
                  fontWeight: 600,
                  marginBottom: 'var(--omnily-spacing-2)',
                  color: 'var(--omnily-gray-700)',
                }}
              >
                Font Personalizzato (Opzionale)
              </label>
              <select
                value={config[`website_${section.id}_font`] || ''}
                onChange={(e) => updateConfig(`website_${section.id}_font`, e.target.value)}
                style={{
                  width: '100%',
                  padding: 'var(--omnily-spacing-3)',
                  borderRadius: 'var(--omnily-border-radius-md)',
                  border: '2px solid var(--omnily-border-color)',
                  fontSize: 'var(--omnily-font-size-base)',
                  cursor: 'pointer',
                }}
              >
                <option value="">Usa Font Globale</option>
                <option value="Inter">Inter (Default)</option>
                <option value="Playfair Display">Playfair Display (Elegante)</option>
                <option value="Montserrat">Montserrat (Moderno)</option>
                <option value="Lora">Lora (Serif Classico)</option>
                <option value="Raleway">Raleway (Leggero)</option>
                <option value="Poppins">Poppins (Arrotondato)</option>
                <option value="Roboto">Roboto (Versatile)</option>
                <option value="Open Sans">Open Sans (Neutrale)</option>
                <option value="Merriweather">Merriweather (Lettura)</option>
                <option value="Oswald">Oswald (Bold)</option>
              </select>
              <small
                style={{
                  display: 'block',
                  marginTop: 'var(--omnily-spacing-2)',
                  fontSize: 'var(--omnily-font-size-xs)',
                  color: 'var(--omnily-gray-500)',
                }}
              >
                ℹ️ Se vuoto, usa il font configurato nella tab Tipografia & Colori
              </small>
            </div>

            {/* Effects Toggles */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--omnily-spacing-3)',
                marginTop: 'var(--omnily-spacing-4)',
                paddingTop: 'var(--omnily-spacing-4)',
                borderTop: '1px solid var(--omnily-border-color)',
              }}
            >
              <ToggleSwitch
                checked={config[`website_${section.id}_enable_parallax`] ?? false}
                onChange={(checked) =>
                  updateConfig(`website_${section.id}_enable_parallax`, checked)
                }
                label="Parallax"
                description="Effetto profondità allo scroll"
              />
              <ToggleSwitch
                checked={config[`website_${section.id}_enable_overlay`] ?? false}
                onChange={(checked) =>
                  updateConfig(`website_${section.id}_enable_overlay`, checked)
                }
                label="Overlay"
                description="Oscura sfondo immagine"
              />
            </div>

            {/* Overlay Controls */}
            {config[`website_${section.id}_enable_overlay`] && (
              <div
                style={{
                  marginTop: 'var(--omnily-spacing-4)',
                  padding: 'var(--omnily-spacing-4)',
                  background: 'var(--omnily-gray-50)',
                  borderRadius: 'var(--omnily-border-radius-md)',
                }}
              >
                <div style={{ marginBottom: 'var(--omnily-spacing-3)' }}>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      marginBottom: 'var(--omnily-spacing-2)',
                      color: 'var(--omnily-gray-700)',
                      fontSize: 'var(--omnily-font-size-sm)',
                    }}
                  >
                    Colore Overlay
                  </label>
                  <div style={{
                    padding: 'var(--omnily-spacing-3)',
                    borderRadius: 'var(--omnily-border-radius-lg)',
                    border: '2px solid var(--omnily-border-color)',
                    background: 'white',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--omnily-spacing-3)' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: config[`website_${section.id}_overlay_color`] || '#000000',
                        border: '3px solid white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 'var(--omnily-font-size-sm)', fontWeight: 700, color: '#1f2937' }}>
                          {(config[`website_${section.id}_overlay_color`] || '#000000').toUpperCase()}
                        </div>
                      </div>
                      <input
                        type="color"
                        value={config[`website_${section.id}_overlay_color`] || '#000000'}
                        onChange={(e) => updateConfig(`website_${section.id}_overlay_color`, e.target.value)}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          border: '2px solid var(--omnily-border-color)',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 600,
                      marginBottom: 'var(--omnily-spacing-2)',
                      color: 'var(--omnily-gray-700)',
                      fontSize: 'var(--omnily-font-size-sm)',
                    }}
                  >
                    Opacità: {Math.round((config[`website_${section.id}_overlay_opacity`] || 0.5) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config[`website_${section.id}_overlay_opacity`] || 0.5}
                    onChange={(e) =>
                      updateConfig(`website_${section.id}_overlay_opacity`, parseFloat(e.target.value))
                    }
                    style={{
                      width: '100%',
                      height: '8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Special effects for Loyalty */}
            {section.id === 'loyalty' && (
              <div style={{ marginTop: 'var(--omnily-spacing-3)' }}>
                <ToggleSwitch
                  checked={config.website_loyalty_enable_particles ?? true}
                  onChange={(checked) => updateConfig('website_loyalty_enable_particles', checked)}
                  label="Particelle Animate"
                  description="Icone fluttuanti in background"
                />
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  )
}
