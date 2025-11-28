import React, { useState, useEffect } from 'react'
import {
  Palette,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  RefreshCw,
  Copy,
  Check,
  Calendar,
  X,
  Save,
  Image,
  Code,
  Monitor,
  Smartphone
} from 'lucide-react'
import PageLoader from '../UI/PageLoader'
import { useToast } from '../../contexts/ToastContext'
import { useTheme, BrandTheme } from '../../contexts/ThemeContext'

const BrandingDashboard: React.FC = () => {
  const { showSuccess, showError } = useToast()
  const { themes, currentTheme, setTheme, saveTheme, deleteTheme, createTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTheme, setSelectedTheme] = useState<BrandTheme | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop')

  // Apply theme preview in real-time while editing
  useEffect(() => {
    if (isEditing && selectedTheme) {
      // Apply CSS variables directly to DOM for live preview
      const root = document.documentElement
      root.style.setProperty('--primary-color', selectedTheme.colors.primary)
      root.style.setProperty('--secondary-color', selectedTheme.colors.secondary)
      root.style.setProperty('--accent-color', selectedTheme.colors.accent)
      root.style.setProperty('--background-color', selectedTheme.colors.background)
      root.style.setProperty('--surface-color', selectedTheme.colors.surface)
      root.style.setProperty('--text-primary-color', selectedTheme.colors.text_primary)
      root.style.setProperty('--text-secondary-color', selectedTheme.colors.text_secondary)
      root.style.setProperty('--success-color', selectedTheme.colors.success)
      root.style.setProperty('--warning-color', selectedTheme.colors.warning)
      root.style.setProperty('--error-color', selectedTheme.colors.error)
      root.style.setProperty('--border-radius', selectedTheme.customization.border_radius)

      // Apply sidebar colors
      root.style.setProperty('--sidebar-background', selectedTheme.sidebar.background)
      root.style.setProperty('--sidebar-text', selectedTheme.sidebar.text)
      root.style.setProperty('--sidebar-text-hover', selectedTheme.sidebar.text_hover)
      root.style.setProperty('--sidebar-text-active', selectedTheme.sidebar.text_active)
      root.style.setProperty('--sidebar-background-hover', selectedTheme.sidebar.background_hover)
      root.style.setProperty('--sidebar-background-active', selectedTheme.sidebar.background_active)
      root.style.setProperty('--sidebar-border-color', selectedTheme.sidebar.border_color)
      root.style.setProperty('--sidebar-logo-text', selectedTheme.sidebar.logo_text)

      const shadowMap = {
        'low': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'medium': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'high': '0 10px 15px rgba(0, 0, 0, 0.2)'
      }
      root.style.setProperty('--box-shadow', shadowMap[selectedTheme.customization.shadow_level as keyof typeof shadowMap] || shadowMap.medium)
    }
  }, [selectedTheme, isEditing])

  const filteredThemes = themes.filter(theme =>
    theme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    theme.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const handleEdit = (theme: BrandTheme) => {
    setSelectedTheme({ ...theme })
    setIsEditing(true)
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

  const handleSidebarChange = (sidebarKey: string, value: string) => {
    if (selectedTheme) {
      setSelectedTheme({
        ...selectedTheme,
        sidebar: {
          ...selectedTheme.sidebar,
          [sidebarKey]: value
        }
      })
    }
  }

  const handleSave = () => {
    if (selectedTheme) {
      saveTheme(selectedTheme)
      setIsEditing(false)
      showSuccess('Tema salvato con successo!')
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setSelectedTheme(null)
    // Restore current theme
    if (currentTheme) {
      const root = document.documentElement
      root.style.setProperty('--primary-color', currentTheme.colors.primary)
      root.style.setProperty('--secondary-color', currentTheme.colors.secondary)
      root.style.setProperty('--accent-color', currentTheme.colors.accent)
      root.style.setProperty('--background-color', currentTheme.colors.background)
      root.style.setProperty('--surface-color', currentTheme.colors.surface)
      root.style.setProperty('--text-primary-color', currentTheme.colors.text_primary)
      root.style.setProperty('--text-secondary-color', currentTheme.colors.text_secondary)
      root.style.setProperty('--success-color', currentTheme.colors.success)
      root.style.setProperty('--warning-color', currentTheme.colors.warning)
      root.style.setProperty('--error-color', currentTheme.colors.error)
      root.style.setProperty('--border-radius', currentTheme.customization.border_radius)
    }
  }

  const handleCopyCSS = (theme: BrandTheme) => {
    const css = `
:root {
  --primary: ${theme.colors.primary};
  --secondary: ${theme.colors.secondary};
  --accent: ${theme.colors.accent};
  --background: ${theme.colors.background};
  --surface: ${theme.colors.surface};
  --text-primary: ${theme.colors.text_primary};
  --text-secondary: ${theme.colors.text_secondary};
  --success: ${theme.colors.success};
  --warning: ${theme.colors.warning};
  --error: ${theme.colors.error};
  --font-family: ${theme.typography.font_family};
  --border-radius: ${theme.customization.border_radius};
}`.trim()

    navigator.clipboard.writeText(css)
    showSuccess('CSS copiato negli appunti!')
  }

  if (loading) {
    return <PageLoader message="Caricamento temi..." size="medium" />
  }

  const totalThemes = themes.length
  const activeThemes = themes.filter(t => t.is_active).length
  const totalUsage = themes.reduce((sum, t) => sum + t.usage_count, 0)

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div className="header-left">
          <div className="header-info">
            <h1>Brand & Temi</h1>
            <p>Gestione temi, colori e risorse brand del sistema</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">
            <Download size={18} />
            Esporta Tema
          </button>
          <button className="btn-secondary">
            <Upload size={18} />
            Importa Tema
          </button>
          <button className="btn-primary">
            <Plus size={18} />
            Nuovo Tema
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Palette size={24} />
          </div>
          <div>
            <div className="stat-value">{totalThemes}</div>
            <div className="stat-label">Temi Totali</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon active">
            <Check size={24} />
          </div>
          <div>
            <div className="stat-value">{activeThemes}</div>
            <div className="stat-label">Temi Attivi</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <Eye size={24} />
          </div>
          <div>
            <div className="stat-value">{totalUsage.toLocaleString()}</div>
            <div className="stat-label">Visualizzazioni Totali</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Cerca temi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button className="btn-secondary" onClick={() => setSearchTerm('')}>
          <RefreshCw size={18} />
          Reset
        </button>
      </div>

      {/* Themes Table */}
      <div className="organizations-table-container">
        <table className="organizations-table">
          <thead>
            <tr>
              <th>Nome Tema</th>
              <th>Colori Brand</th>
              <th>Tipografia</th>
              <th>Personalizzazione</th>
              <th style={{ textAlign: 'center' }}>Stato</th>
              <th style={{ textAlign: 'right' }}>Utilizzi</th>
              <th style={{ textAlign: 'center' }}>Ultimo Aggiornamento</th>
              <th style={{ textAlign: 'center' }}>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredThemes.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  Nessun tema trovato
                </td>
              </tr>
            ) : (
              filteredThemes.map((theme) => (
                <tr key={theme.id}>
                  <td>
                    <div className="org-info">
                      <div>
                        <div className="org-name">{theme.name}</div>
                        <div className="org-type">{theme.description}</div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          backgroundColor: theme.colors.primary,
                          border: '1px solid #e5e7eb'
                        }}
                        title={`Primary: ${theme.colors.primary}`}
                      />
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          backgroundColor: theme.colors.secondary,
                          border: '1px solid #e5e7eb'
                        }}
                        title={`Secondary: ${theme.colors.secondary}`}
                      />
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          backgroundColor: theme.colors.accent,
                          border: '1px solid #e5e7eb'
                        }}
                        title={`Accent: ${theme.colors.accent}`}
                      />
                    </div>
                  </td>

                  <td>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      <div style={{ fontWeight: 600, color: '#374151' }}>
                        {theme.typography.font_family.split(',')[0]}
                      </div>
                      <div style={{ fontSize: '12px', marginTop: '2px' }}>
                        {theme.typography.font_size_base} • {theme.typography.font_weight_normal}/{theme.typography.font_weight_bold}
                      </div>
                    </div>
                  </td>

                  <td>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      <div>Border: <span style={{ fontWeight: 500, color: '#374151' }}>{theme.customization.border_radius}</span></div>
                      <div style={{ marginTop: '2px' }}>Shadow: <span style={{ fontWeight: 500, color: '#374151' }}>{theme.customization.shadow_level}</span></div>
                    </div>
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      {theme.is_default && (
                        <span className="plan-badge pro">DEFAULT</span>
                      )}
                      {theme.is_active ? (
                        <span className="status-badge active">Attivo</span>
                      ) : (
                        <button
                          className="status-badge inactive"
                          style={{ cursor: 'pointer', border: 'none', background: '#fee2e2', color: '#dc2626' }}
                          onClick={() => {
                            setTheme(theme.id)
                            showSuccess(`Tema "${theme.name}" attivato!`)
                          }}
                          title="Clicca per attivare questo tema"
                        >
                          Attiva
                        </button>
                      )}
                    </div>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div className="users-count">
                      <Eye size={14} />
                      <span>{theme.usage_count.toLocaleString()}</span>
                    </div>
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <div className="date-compact">
                      <Calendar size={14} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }} />
                      {formatDate(theme.updated_at)}
                    </div>
                  </td>

                  <td>
                    <div className="actions-menu">
                      <button
                        className="action-btn"
                        title="Anteprima"
                        onClick={() => {
                          setSelectedTheme(theme)
                          setShowPreview(true)
                        }}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="action-btn primary"
                        title="Modifica"
                        onClick={() => handleEdit(theme)}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="action-btn"
                        title="Copia CSS"
                        onClick={() => handleCopyCSS(theme)}
                      >
                        <Copy size={16} />
                      </button>
                      {!theme.is_default && (
                        <button
                          className="action-btn danger"
                          title="Elimina"
                          onClick={() => showError('Funzione elimina in sviluppo')}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <div className="pagination-info">
          Mostrando <strong>{filteredThemes.length}</strong> di <strong>{totalThemes}</strong> temi
        </div>
      </div>

      {/* EDIT MODAL */}
      {isEditing && selectedTheme && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }} onClick={handleCancel}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            maxWidth: '1400px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              background: 'white',
              zIndex: 10
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#1f2937' }}>
                  Modifica Tema: {selectedTheme.name}
                </h2>
                <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                  {selectedTheme.description}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-secondary" onClick={handleCancel}>
                  <X size={18} />
                  Annulla
                </button>
                <button className="btn-primary" onClick={handleSave}>
                  <Save size={18} />
                  Salva Modifiche
                </button>
              </div>
            </div>

            {/* Modal Content - Split Layout */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Left: Controls */}
              <div style={{ flex: '0 0 500px', padding: '24px', overflowY: 'auto', borderRight: '1px solid #e5e7eb' }}>
                {/* Colori Section */}
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Palette size={20} />
                    Colori Brand
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {Object.entries(selectedTheme.colors).map(([key, value]) => (
                      <div key={key}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', textTransform: 'capitalize' }}>
                          {key.replace('_', ' ')}
                        </label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="color"
                            value={value}
                            onChange={(e) => handleColorChange(key, e.target.value)}
                            style={{ width: '50px', height: '36px', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleColorChange(key, e.target.value)}
                            style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sidebar Section */}
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Code size={20} />
                    Sidebar & Navigation
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {Object.entries(selectedTheme.sidebar).map(([key, value]) => (
                      <div key={key}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', textTransform: 'capitalize' }}>
                          {key.replace(/_/g, ' ')}
                        </label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="color"
                            value={value}
                            onChange={(e) => handleSidebarChange(key, e.target.value)}
                            style={{ width: '48px', height: '36px', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}
                          />
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleSidebarChange(key, e.target.value)}
                            style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tipografia Section */}
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Code size={20} />
                    Tipografia
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                        Font Family
                      </label>
                      <input
                        type="text"
                        value={selectedTheme.typography.font_family}
                        onChange={(e) => setSelectedTheme({ ...selectedTheme, typography: { ...selectedTheme.typography, font_family: e.target.value } })}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                        Base Size
                      </label>
                      <input
                        type="text"
                        value={selectedTheme.typography.font_size_base}
                        onChange={(e) => setSelectedTheme({ ...selectedTheme, typography: { ...selectedTheme.typography, font_size_base: e.target.value } })}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                        Normal Weight
                      </label>
                      <input
                        type="text"
                        value={selectedTheme.typography.font_weight_normal}
                        onChange={(e) => setSelectedTheme({ ...selectedTheme, typography: { ...selectedTheme.typography, font_weight_normal: e.target.value } })}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                        Bold Weight
                      </label>
                      <input
                        type="text"
                        value={selectedTheme.typography.font_weight_bold}
                        onChange={(e) => setSelectedTheme({ ...selectedTheme, typography: { ...selectedTheme.typography, font_weight_bold: e.target.value } })}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Personalizzazione Section */}
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Image size={20} />
                    Personalizzazione
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                        Border Radius
                      </label>
                      <select
                        value={selectedTheme.customization.border_radius}
                        onChange={(e) => setSelectedTheme({ ...selectedTheme, customization: { ...selectedTheme.customization, border_radius: e.target.value } })}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                      >
                        <option value="4px">4px - Sharp</option>
                        <option value="6px">6px - Slightly Rounded</option>
                        <option value="8px">8px - Rounded</option>
                        <option value="12px">12px - Soft</option>
                        <option value="16px">16px - Very Soft</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                        Shadow Level
                      </label>
                      <select
                        value={selectedTheme.customization.shadow_level}
                        onChange={(e) => setSelectedTheme({ ...selectedTheme, customization: { ...selectedTheme.customization, shadow_level: e.target.value } })}
                        style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: LIVE PREVIEW */}
              <div style={{ flex: 1, padding: '24px', background: '#f3f4f6', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <Eye size={20} />
                    Anteprima Live
                  </h3>
                  <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>
                    Cambia i colori a sinistra per vedere l'anteprima aggiornarsi in tempo reale
                  </span>
                </div>

                <div style={{
                  background: selectedTheme.colors.background,
                  padding: '32px',
                  borderRadius: selectedTheme.customization.border_radius,
                  boxShadow: selectedTheme.customization.shadow_level === 'low' ? '0 1px 3px rgba(0,0,0,0.1)' :
                             selectedTheme.customization.shadow_level === 'high' ? '0 20px 40px rgba(0,0,0,0.2)' :
                             '0 10px 20px rgba(0,0,0,0.15)',
                  fontFamily: selectedTheme.typography.font_family,
                  fontSize: selectedTheme.typography.font_size_base
                }}>
                  <h1 style={{ color: selectedTheme.colors.primary, fontSize: '28px', fontWeight: selectedTheme.typography.font_weight_bold, marginBottom: '12px', margin: '0 0 12px 0' }}>
                    OMNILY Pro Dashboard
                  </h1>
                  <p style={{ color: selectedTheme.colors.text_secondary, marginBottom: '24px', margin: '0 0 24px 0' }}>
                    Questa è un'anteprima live del tema. Modifica i colori per vederli in tempo reale!
                  </p>

                  <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <button style={{
                      background: selectedTheme.colors.primary,
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: selectedTheme.customization.border_radius,
                      fontWeight: selectedTheme.typography.font_weight_bold,
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}>
                      Pulsante Primario
                    </button>
                    <button style={{
                      background: selectedTheme.colors.secondary,
                      color: selectedTheme.colors.text_primary === '#1A202C' ? 'white' : selectedTheme.colors.text_primary,
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: selectedTheme.customization.border_radius,
                      fontWeight: selectedTheme.typography.font_weight_normal,
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}>
                      Secondario
                    </button>
                    <button style={{
                      background: selectedTheme.colors.accent,
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: selectedTheme.customization.border_radius,
                      fontWeight: selectedTheme.typography.font_weight_bold,
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}>
                      Accent
                    </button>
                  </div>

                  <div style={{
                    background: selectedTheme.colors.surface,
                    padding: '16px',
                    borderRadius: selectedTheme.customization.border_radius,
                    marginBottom: '16px'
                  }}>
                    <h3 style={{ color: selectedTheme.colors.text_primary, margin: '0 0 8px 0', fontWeight: selectedTheme.typography.font_weight_bold, fontSize: '16px' }}>
                      Card Example
                    </h3>
                    <p style={{ color: selectedTheme.colors.text_secondary, margin: 0, fontSize: '14px' }}>
                      Questo è un esempio di card con sfondo surface.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div style={{ background: selectedTheme.colors.success, color: 'white', padding: '12px', borderRadius: selectedTheme.customization.border_radius, textAlign: 'center', fontSize: '13px', fontWeight: selectedTheme.typography.font_weight_bold }}>
                      Success
                    </div>
                    <div style={{ background: selectedTheme.colors.warning, color: 'white', padding: '12px', borderRadius: selectedTheme.customization.border_radius, textAlign: 'center', fontSize: '13px', fontWeight: selectedTheme.typography.font_weight_bold }}>
                      Warning
                    </div>
                    <div style={{ background: selectedTheme.colors.error, color: 'white', padding: '12px', borderRadius: selectedTheme.customization.border_radius, textAlign: 'center', fontSize: '13px', fontWeight: selectedTheme.typography.font_weight_bold }}>
                      Error
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {showPreview && selectedTheme && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }} onClick={() => setShowPreview(false)}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            maxWidth: '1200px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Preview Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#1f2937' }}>
                  Anteprima: {selectedTheme.name}
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  className={`btn-secondary ${previewDevice === 'desktop' ? 'active' : ''}`}
                  onClick={() => setPreviewDevice('desktop')}
                  style={{ background: previewDevice === 'desktop' ? '#3b82f6' : undefined, color: previewDevice === 'desktop' ? 'white' : undefined }}
                >
                  <Monitor size={18} />
                  Desktop
                </button>
                <button
                  className={`btn-secondary ${previewDevice === 'mobile' ? 'active' : ''}`}
                  onClick={() => setPreviewDevice('mobile')}
                  style={{ background: previewDevice === 'mobile' ? '#3b82f6' : undefined, color: previewDevice === 'mobile' ? 'white' : undefined }}
                >
                  <Smartphone size={18} />
                  Mobile
                </button>
                <button className="btn-secondary" onClick={() => setShowPreview(false)}>
                  <X size={18} />
                  Chiudi
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div style={{
              padding: '40px',
              background: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '500px'
            }}>
              <div style={{
                width: previewDevice === 'desktop' ? '100%' : '375px',
                background: selectedTheme.colors.background,
                padding: '32px',
                borderRadius: selectedTheme.customization.border_radius,
                boxShadow: selectedTheme.customization.shadow_level === 'low' ? '0 1px 3px rgba(0,0,0,0.1)' :
                           selectedTheme.customization.shadow_level === 'high' ? '0 20px 40px rgba(0,0,0,0.2)' :
                           '0 10px 20px rgba(0,0,0,0.15)',
                fontFamily: selectedTheme.typography.font_family,
                fontSize: selectedTheme.typography.font_size_base
              }}>
                <h1 style={{ color: selectedTheme.colors.primary, fontSize: '32px', fontWeight: selectedTheme.typography.font_weight_bold, marginBottom: '12px' }}>
                  OMNILY Pro Dashboard
                </h1>
                <p style={{ color: selectedTheme.colors.text_secondary, marginBottom: '24px' }}>
                  Questa è un'anteprima del tema con tutti i colori e stili applicati.
                </p>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                  <button style={{
                    background: selectedTheme.colors.primary,
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: selectedTheme.customization.border_radius,
                    fontWeight: selectedTheme.typography.font_weight_bold,
                    cursor: 'pointer'
                  }}>
                    Pulsante Primario
                  </button>
                  <button style={{
                    background: selectedTheme.colors.secondary,
                    color: selectedTheme.colors.text_primary === '#1A202C' ? 'white' : selectedTheme.colors.text_primary,
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: selectedTheme.customization.border_radius,
                    fontWeight: selectedTheme.typography.font_weight_normal,
                    cursor: 'pointer'
                  }}>
                    Pulsante Secondario
                  </button>
                  <button style={{
                    background: selectedTheme.colors.accent,
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: selectedTheme.customization.border_radius,
                    fontWeight: selectedTheme.typography.font_weight_bold,
                    cursor: 'pointer'
                  }}>
                    Accent
                  </button>
                </div>

                <div style={{
                  background: selectedTheme.colors.surface,
                  padding: '20px',
                  borderRadius: selectedTheme.customization.border_radius,
                  marginBottom: '16px'
                }}>
                  <h3 style={{ color: selectedTheme.colors.text_primary, margin: '0 0 8px 0', fontWeight: selectedTheme.typography.font_weight_bold }}>
                    Card Example
                  </h3>
                  <p style={{ color: selectedTheme.colors.text_secondary, margin: 0 }}>
                    Questo è un esempio di card con sfondo surface.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1, background: selectedTheme.colors.success, color: 'white', padding: '12px', borderRadius: selectedTheme.customization.border_radius, textAlign: 'center', fontSize: '14px', fontWeight: selectedTheme.typography.font_weight_bold }}>
                    Success
                  </div>
                  <div style={{ flex: 1, background: selectedTheme.colors.warning, color: 'white', padding: '12px', borderRadius: selectedTheme.customization.border_radius, textAlign: 'center', fontSize: '14px', fontWeight: selectedTheme.typography.font_weight_bold }}>
                    Warning
                  </div>
                  <div style={{ flex: 1, background: selectedTheme.colors.error, color: 'white', padding: '12px', borderRadius: selectedTheme.customization.border_radius, textAlign: 'center', fontSize: '14px', fontWeight: selectedTheme.typography.font_weight_bold }}>
                    Error
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BrandingDashboard
