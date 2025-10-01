import React, { useState, useEffect } from 'react'
import {
  Palette,
  Upload,
  Download,
  Eye,
  Copy,
  Edit,
  Save,
  RefreshCw,
  Image,
  Type,
  Monitor,
  Smartphone,
  Settings,
  Check,
  X,
  Plus,
  Trash2,
  Code,
  Globe,
  Zap
} from 'lucide-react'
import './AdminLayout.css'

interface BrandTheme {
  id: string
  name: string
  description: string
  is_default: boolean
  is_active: boolean
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text_primary: string
    text_secondary: string
    success: string
    warning: string
    error: string
  }
  typography: {
    font_family: string
    font_size_base: string
    font_weight_normal: string
    font_weight_bold: string
    line_height: string
  }
  assets: {
    logo_light: string
    logo_dark: string
    favicon: string
    app_icon: string
    background_image?: string
  }
  customization: {
    border_radius: string
    shadow_level: string
    animation_speed: string
  }
  created_at: string
  updated_at: string
  usage_count: number
}

interface BrandAsset {
  id: string
  name: string
  type: 'logo' | 'icon' | 'image' | 'font'
  format: string
  size: string
  url: string
  created_at: string
  usage_count: number
}

const BrandingDashboard: React.FC = () => {
  const [themes, setThemes] = useState<BrandTheme[]>([])
  const [assets, setAssets] = useState<BrandAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'themes' | 'assets' | 'preview' | 'css'>('themes')
  const [selectedTheme, setSelectedTheme] = useState<BrandTheme | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')

  // Mock data
  const mockThemes: BrandTheme[] = [
    {
      id: '1',
      name: 'OMNILY Default',
      description: 'Tema principale di OMNILY con colori brand ufficiali',
      is_default: true,
      is_active: true,
      colors: {
        primary: '#3182CE',
        secondary: '#2D3748',
        accent: '#F59E0B',
        background: '#FFFFFF',
        surface: '#F7FAFC',
        text_primary: '#1A202C',
        text_secondary: '#4A5568',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444'
      },
      typography: {
        font_family: 'Inter, system-ui, sans-serif',
        font_size_base: '16px',
        font_weight_normal: '400',
        font_weight_bold: '600',
        line_height: '1.5'
      },
      assets: {
        logo_light: '/assets/logo-light.svg',
        logo_dark: '/assets/logo-dark.svg',
        favicon: '/assets/favicon.ico',
        app_icon: '/assets/app-icon.png'
      },
      customization: {
        border_radius: '8px',
        shadow_level: 'medium',
        animation_speed: 'normal'
      },
      created_at: '2024-12-01T10:00:00Z',
      updated_at: '2025-01-15T14:30:00Z',
      usage_count: 1247
    },
    {
      id: '2',
      name: 'Dark Professional',
      description: 'Tema scuro professionale per ambienti di lavoro',
      is_default: false,
      is_active: false,
      colors: {
        primary: '#60A5FA',
        secondary: '#374151',
        accent: '#FBBF24',
        background: '#111827',
        surface: '#1F2937',
        text_primary: '#F9FAFB',
        text_secondary: '#D1D5DB',
        success: '#34D399',
        warning: '#FBBF24',
        error: '#F87171'
      },
      typography: {
        font_family: 'Roboto, system-ui, sans-serif',
        font_size_base: '15px',
        font_weight_normal: '400',
        font_weight_bold: '500',
        line_height: '1.6'
      },
      assets: {
        logo_light: '/assets/logo-dark-theme.svg',
        logo_dark: '/assets/logo-dark-theme-alt.svg',
        favicon: '/assets/favicon-dark.ico',
        app_icon: '/assets/app-icon-dark.png'
      },
      customization: {
        border_radius: '6px',
        shadow_level: 'high',
        animation_speed: 'fast'
      },
      created_at: '2025-01-05T09:15:00Z',
      updated_at: '2025-01-12T16:45:00Z',
      usage_count: 89
    },
    {
      id: '3',
      name: 'Minimalist Light',
      description: 'Tema minimalista chiaro con focus su semplicità',
      is_default: false,
      is_active: false,
      colors: {
        primary: '#6366F1',
        secondary: '#64748B',
        accent: '#06B6D4',
        background: '#FEFEFE',
        surface: '#FAFAFA',
        text_primary: '#0F172A',
        text_secondary: '#64748B',
        success: '#22C55E',
        warning: '#F97316',
        error: '#EF4444'
      },
      typography: {
        font_family: 'Poppins, system-ui, sans-serif',
        font_size_base: '16px',
        font_weight_normal: '300',
        font_weight_bold: '600',
        line_height: '1.7'
      },
      assets: {
        logo_light: '/assets/logo-minimal.svg',
        logo_dark: '/assets/logo-minimal-dark.svg',
        favicon: '/assets/favicon-minimal.ico',
        app_icon: '/assets/app-icon-minimal.png'
      },
      customization: {
        border_radius: '12px',
        shadow_level: 'low',
        animation_speed: 'slow'
      },
      created_at: '2025-01-08T11:30:00Z',
      updated_at: '2025-01-10T09:20:00Z',
      usage_count: 34
    }
  ]

  const mockAssets: BrandAsset[] = [
    {
      id: '1',
      name: 'OMNILY Logo Light',
      type: 'logo',
      format: 'SVG',
      size: '12 KB',
      url: '/assets/logo-light.svg',
      created_at: '2024-12-01T10:00:00Z',
      usage_count: 1247
    },
    {
      id: '2',
      name: 'OMNILY Logo Dark',
      type: 'logo',
      format: 'SVG',
      size: '11 KB',
      url: '/assets/logo-dark.svg',
      created_at: '2024-12-01T10:05:00Z',
      usage_count: 89
    },
    {
      id: '3',
      name: 'App Icon 512x512',
      type: 'icon',
      format: 'PNG',
      size: '45 KB',
      url: '/assets/app-icon-512.png',
      created_at: '2024-12-01T10:10:00Z',
      usage_count: 567
    },
    {
      id: '4',
      name: 'Background Pattern',
      type: 'image',
      format: 'PNG',
      size: '234 KB',
      url: '/assets/bg-pattern.png',
      created_at: '2024-12-15T14:20:00Z',
      usage_count: 123
    }
  ]

  useEffect(() => {
    const timer = setTimeout(() => {
      setThemes(mockThemes)
      setAssets(mockAssets)
      setSelectedTheme(mockThemes[0])
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleThemeSelect = (theme: BrandTheme) => {
    setSelectedTheme(theme)
    setIsEditing(false)
  }

  const handleColorChange = (colorKey: string, value: string) => {
    if (selectedTheme) {
      setSelectedTheme({
        ...selectedTheme,
        colors: {
          ...selectedTheme.colors,
          [colorKey]: value
        }
      })
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const generateCSS = (theme: BrandTheme) => {
    return `
/* ${theme.name} - Generated CSS Variables */
:root {
  /* Colors */
  --color-primary: ${theme.colors.primary};
  --color-secondary: ${theme.colors.secondary};
  --color-accent: ${theme.colors.accent};
  --color-background: ${theme.colors.background};
  --color-surface: ${theme.colors.surface};
  --color-text-primary: ${theme.colors.text_primary};
  --color-text-secondary: ${theme.colors.text_secondary};
  --color-success: ${theme.colors.success};
  --color-warning: ${theme.colors.warning};
  --color-error: ${theme.colors.error};

  /* Typography */
  --font-family: ${theme.typography.font_family};
  --font-size-base: ${theme.typography.font_size_base};
  --font-weight-normal: ${theme.typography.font_weight_normal};
  --font-weight-bold: ${theme.typography.font_weight_bold};
  --line-height: ${theme.typography.line_height};

  /* Customization */
  --border-radius: ${theme.customization.border_radius};
  --shadow-level: ${theme.customization.shadow_level};
  --animation-speed: ${theme.customization.animation_speed};
}

/* Component Styles */
.btn-primary {
  background-color: var(--color-primary);
  color: white;
  border-radius: var(--border-radius);
  font-family: var(--font-family);
}

.btn-secondary {
  background-color: var(--color-secondary);
  color: white;
  border-radius: var(--border-radius);
  font-family: var(--font-family);
}

.card {
  background-color: var(--color-surface);
  border-radius: var(--border-radius);
  color: var(--color-text-primary);
}
    `.trim()
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-title">
              <Palette size={32} />
              <div>
                <h1>Brand & Temi</h1>
                <p>Caricamento sistema branding...</p>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div className="loading-spinner">Caricamento...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard"
         style={{ width: '100%', maxWidth: 'none', margin: 0, padding: 0, boxSizing: 'border-box' }}>
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <Palette size={32} />
            <div>
              <h1>Brand & Temi</h1>
              <p>Gestione temi, colori e risorse brand - {themes.length} temi disponibili</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-secondary">
              <Download size={16} />
              Esporta Tema
            </button>
            <button className="btn-secondary">
              <Upload size={16} />
              Importa Tema
            </button>
            <button className="btn-primary">
              <Plus size={16} />
              Nuovo Tema
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'themes' ? 'active' : ''}`}
          onClick={() => setActiveTab('themes')}
        >
          <Palette size={16} />
          Temi
        </button>
        <button
          className={`tab ${activeTab === 'assets' ? 'active' : ''}`}
          onClick={() => setActiveTab('assets')}
        >
          <Image size={16} />
          Asset
        </button>
        <button
          className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          <Eye size={16} />
          Anteprima
        </button>
        <button
          className={`tab ${activeTab === 'css' ? 'active' : ''}`}
          onClick={() => setActiveTab('css')}
        >
          <Code size={16} />
          CSS Export
        </button>
      </div>

      {activeTab === 'themes' && (
        <div className="dashboard-section">
          <div className="themes-layout" style={{
            display: 'grid',
            gridTemplateColumns: '300px 1fr',
            gap: '1rem',
            height: '600px'
          }}>
            {/* Themes List */}
            <div className="themes-sidebar">
              <h3>Temi Disponibili</h3>
              <div className="themes-list">
                {themes.map((theme) => (
                  <div
                    key={theme.id}
                    className={`theme-card ${selectedTheme?.id === theme.id ? 'selected' : ''}`}
                    onClick={() => handleThemeSelect(theme)}
                  >
                    <div className="theme-header">
                      <h4>{theme.name}</h4>
                      <div className="theme-badges">
                        {theme.is_default && (
                          <span className="badge default">Default</span>
                        )}
                        {theme.is_active && (
                          <span className="badge active">Attivo</span>
                        )}
                      </div>
                    </div>

                    <p className="theme-description">{theme.description}</p>

                    <div className="theme-colors">
                      <div
                        className="color-swatch"
                        style={{ backgroundColor: theme.colors.primary }}
                        title="Primary"
                      ></div>
                      <div
                        className="color-swatch"
                        style={{ backgroundColor: theme.colors.secondary }}
                        title="Secondary"
                      ></div>
                      <div
                        className="color-swatch"
                        style={{ backgroundColor: theme.colors.accent }}
                        title="Accent"
                      ></div>
                    </div>

                    <div className="theme-meta">
                      <span>Aggiornato: {formatDate(theme.updated_at)}</span>
                      <span>{theme.usage_count} utilizzi</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Theme Editor */}
            {selectedTheme && (
              <div className="theme-editor">
                <div className="editor-header">
                  <h3>{selectedTheme.name}</h3>
                  <div className="editor-actions">
                    {!isEditing ? (
                      <button
                        className="btn-primary"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit size={16} />
                        Modifica
                      </button>
                    ) : (
                      <div className="edit-actions">
                        <button className="btn-secondary" onClick={() => setIsEditing(false)}>
                          <X size={16} />
                          Annulla
                        </button>
                        <button className="btn-primary">
                          <Save size={16} />
                          Salva
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="editor-content">
                  {/* Colors Section */}
                  <div className="editor-section">
                    <h4>Colori</h4>
                    <div className="colors-grid">
                      {Object.entries(selectedTheme.colors).map(([key, value]) => (
                        <div key={key} className="color-input-group">
                          <label>{key.replace('_', ' ').toUpperCase()}</label>
                          <div className="color-input">
                            <input
                              type="color"
                              value={value}
                              onChange={(e) => handleColorChange(key, e.target.value)}
                              disabled={!isEditing}
                            />
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => handleColorChange(key, e.target.value)}
                              disabled={!isEditing}
                              className="color-hex"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Typography Section */}
                  <div className="editor-section">
                    <h4>Tipografia</h4>
                    <div className="typography-grid">
                      <div className="input-group">
                        <label>Font Family</label>
                        <input
                          type="text"
                          value={selectedTheme.typography.font_family}
                          disabled={!isEditing}
                          className="form-input"
                        />
                      </div>
                      <div className="input-group">
                        <label>Base Size</label>
                        <input
                          type="text"
                          value={selectedTheme.typography.font_size_base}
                          disabled={!isEditing}
                          className="form-input"
                        />
                      </div>
                      <div className="input-group">
                        <label>Normal Weight</label>
                        <input
                          type="text"
                          value={selectedTheme.typography.font_weight_normal}
                          disabled={!isEditing}
                          className="form-input"
                        />
                      </div>
                      <div className="input-group">
                        <label>Bold Weight</label>
                        <input
                          type="text"
                          value={selectedTheme.typography.font_weight_bold}
                          disabled={!isEditing}
                          className="form-input"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Customization Section */}
                  <div className="editor-section">
                    <h4>Personalizzazione</h4>
                    <div className="customization-grid">
                      <div className="input-group">
                        <label>Border Radius</label>
                        <select
                          value={selectedTheme.customization.border_radius}
                          disabled={!isEditing}
                          className="form-select"
                        >
                          <option value="4px">4px - Sharp</option>
                          <option value="8px">8px - Rounded</option>
                          <option value="12px">12px - Soft</option>
                          <option value="16px">16px - Very Soft</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Shadow Level</label>
                        <select
                          value={selectedTheme.customization.shadow_level}
                          disabled={!isEditing}
                          className="form-select"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'assets' && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Asset Brand</h2>
            <div className="header-actions">
              <button className="btn-secondary">
                <Upload size={16} />
                Carica Asset
              </button>
            </div>
          </div>

          <div className="assets-grid">
            {assets.map((asset) => (
              <div key={asset.id} className="asset-card">
                <div className="asset-preview">
                  {asset.type === 'logo' || asset.type === 'icon' ? (
                    <div className="asset-image">
                      <Image size={48} />
                    </div>
                  ) : (
                    <div className="asset-placeholder">
                      <Type size={48} />
                    </div>
                  )}
                </div>

                <div className="asset-info">
                  <h4>{asset.name}</h4>
                  <div className="asset-meta">
                    <span className="asset-type">{asset.type.toUpperCase()}</span>
                    <span className="asset-format">{asset.format}</span>
                    <span className="asset-size">{asset.size}</span>
                  </div>
                  <div className="asset-usage">
                    <Zap size={12} />
                    <span>{asset.usage_count} utilizzi</span>
                  </div>
                </div>

                <div className="asset-actions">
                  <button className="btn-icon">
                    <Eye size={16} />
                  </button>
                  <button className="btn-icon">
                    <Download size={16} />
                  </button>
                  <button className="btn-icon">
                    <Copy size={16} />
                  </button>
                  <button className="btn-icon danger">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'preview' && selectedTheme && (
        <div className="dashboard-section">
          <div className="preview-header">
            <h2>Anteprima Tema: {selectedTheme.name}</h2>
            <div className="preview-controls">
              <div className="device-toggle">
                <button
                  className={`device-btn ${previewDevice === 'desktop' ? 'active' : ''}`}
                  onClick={() => setPreviewDevice('desktop')}
                >
                  <Monitor size={16} />
                  Desktop
                </button>
                <button
                  className={`device-btn ${previewDevice === 'mobile' ? 'active' : ''}`}
                  onClick={() => setPreviewDevice('mobile')}
                >
                  <Smartphone size={16} />
                  Mobile
                </button>
              </div>
            </div>
          </div>

          <div className={`preview-frame ${previewDevice}`}>
            <div
              className="preview-content"
              style={{
                '--primary': selectedTheme.colors.primary,
                '--secondary': selectedTheme.colors.secondary,
                '--accent': selectedTheme.colors.accent,
                '--background': selectedTheme.colors.background,
                '--surface': selectedTheme.colors.surface,
                '--text-primary': selectedTheme.colors.text_primary,
                '--text-secondary': selectedTheme.colors.text_secondary,
                fontFamily: selectedTheme.typography.font_family,
                fontSize: selectedTheme.typography.font_size_base,
                backgroundColor: selectedTheme.colors.background,
                color: selectedTheme.colors.text_primary,
                borderRadius: selectedTheme.customization.border_radius,
                padding: '2rem'
              } as React.CSSProperties}
            >
              <h1 style={{ color: selectedTheme.colors.primary }}>
                OMNILY Pro Dashboard
              </h1>
              <p style={{ color: selectedTheme.colors.text_secondary }}>
                Questa è un'anteprima di come apparirà l'interfaccia con il tema selezionato.
              </p>

              <div className="preview-components">
                <button
                  style={{
                    backgroundColor: selectedTheme.colors.primary,
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: selectedTheme.customization.border_radius,
                    fontFamily: selectedTheme.typography.font_family,
                    fontWeight: selectedTheme.typography.font_weight_bold
                  }}
                >
                  Pulsante Primario
                </button>

                <button
                  style={{
                    backgroundColor: selectedTheme.colors.secondary,
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: selectedTheme.customization.border_radius,
                    fontFamily: selectedTheme.typography.font_family,
                    marginLeft: '1rem'
                  }}
                >
                  Pulsante Secondario
                </button>

                <div
                  style={{
                    backgroundColor: selectedTheme.colors.surface,
                    padding: '1.5rem',
                    borderRadius: selectedTheme.customization.border_radius,
                    marginTop: '1rem',
                    border: `1px solid ${selectedTheme.colors.secondary}20`
                  }}
                >
                  <h3 style={{ color: selectedTheme.colors.text_primary, margin: '0 0 1rem 0' }}>
                    Card Component
                  </h3>
                  <p style={{ color: selectedTheme.colors.text_secondary, margin: '0' }}>
                    Questo è un esempio di card con il tema applicato.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'css' && selectedTheme && (
        <div className="dashboard-section">
          <div className="css-header">
            <h2>CSS Export: {selectedTheme.name}</h2>
            <div className="css-actions">
              <button className="btn-secondary">
                <Copy size={16} />
                Copia CSS
              </button>
              <button className="btn-primary">
                <Download size={16} />
                Download File
              </button>
            </div>
          </div>

          <div className="css-code">
            <pre>
              <code>{generateCSS(selectedTheme)}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default BrandingDashboard