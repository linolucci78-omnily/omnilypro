import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Package,
  Upload,
  Download,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  Edit,
  TrendingUp,
  Smartphone,
  Shield
} from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import { useConfirm } from '../../hooks/useConfirm'
import Toast from '../UI/Toast'
import ConfirmModal from '../UI/ConfirmModal'
import PageLoader from '../UI/PageLoader'
import './AdminLayout.css'

interface App {
  id: string
  app_name: string
  package_name: string
  version_name: string
  version_code: number
  apk_url: string
  apk_size_mb: number
  apk_hash_sha256?: string
  description?: string
  changelog?: string
  min_android_version?: number
  required_permissions?: string[]
  is_active: boolean
  is_mandatory: boolean
  rollout_percentage: number
  target_device_models?: string[]
  upload_date: string
  uploaded_by?: string
  install_count: number
  success_rate_percent?: number
  created_at: string
  updated_at: string
}

const AppRepositoryManager: React.FC = () => {
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('active')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingApp, setEditingApp] = useState<App | null>(null)
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast()
  const { confirmState, showConfirm, hideConfirm, handleConfirm } = useConfirm()

  const [formData, setFormData] = useState({
    app_name: '',
    package_name: '',
    version_name: '',
    version_code: 1,
    apk_url: '',
    apk_size_mb: 0,
    description: '',
    changelog: '',
    min_android_version: 21,
    is_mandatory: false,
    rollout_percentage: 100,
    required_permissions: [] as string[],
    target_device_models: [] as string[]
  })

  useEffect(() => {
    loadApps()
  }, [])

  const loadApps = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('app_repository')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setApps(data || [])
    } catch (error) {
      console.error('Error loading apps:', error)
      showError('Errore nel caricamento delle app')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveApp = async () => {
    if (!formData.app_name || !formData.package_name || !formData.version_name || !formData.apk_url) {
      showWarning('Compila tutti i campi obbligatori')
      return
    }

    try {
      const appData = {
        ...formData,
        is_active: true,
        install_count: 0,
        upload_date: new Date().toISOString()
      }

      if (editingApp) {
        // Update existing app
        const { error } = await supabase
          .from('app_repository')
          .update(appData)
          .eq('id', editingApp.id)

        if (error) throw error
        showSuccess('App aggiornata con successo')
      } else {
        // Create new app
        const { error } = await supabase
          .from('app_repository')
          .insert([appData])

        if (error) throw error
        showSuccess('App aggiunta con successo')
      }

      resetForm()
      setShowAddModal(false)
      loadApps()
    } catch (error: any) {
      console.error('Error saving app:', error)
      showError(error.message || 'Errore nel salvataggio dell\'app')
    }
  }

  const handleDeleteApp = async (appId: string) => {
    showConfirm(
      'Sei sicuro di voler eliminare questa app dal repository? Questa azione non può essere annullata.',
      async () => {
        try {
          const { error } = await supabase
            .from('app_repository')
            .delete()
            .eq('id', appId)

          if (error) throw error
          showSuccess('App eliminata con successo')
          loadApps()
        } catch (error) {
          console.error('Error deleting app:', error)
          showError('Errore nell\'eliminazione dell\'app')
        }
      },
      {
        title: 'Elimina App',
        confirmText: 'Elimina',
        type: 'danger'
      }
    )
  }

  const handleToggleActive = async (app: App) => {
    try {
      const { error } = await supabase
        .from('app_repository')
        .update({ is_active: !app.is_active })
        .eq('id', app.id)

      if (error) throw error
      showSuccess(`App ${!app.is_active ? 'attivata' : 'disattivata'} con successo`)
      loadApps()
    } catch (error) {
      console.error('Error toggling app status:', error)
      showError('Errore nel cambio stato dell\'app')
    }
  }

  const resetForm = () => {
    setFormData({
      app_name: '',
      package_name: '',
      version_name: '',
      version_code: 1,
      apk_url: '',
      apk_size_mb: 0,
      description: '',
      changelog: '',
      min_android_version: 21,
      is_mandatory: false,
      rollout_percentage: 100,
      required_permissions: [],
      target_device_models: []
    })
    setEditingApp(null)
  }

  const openEditModal = (app: App) => {
    setFormData({
      app_name: app.app_name,
      package_name: app.package_name,
      version_name: app.version_name,
      version_code: app.version_code,
      apk_url: app.apk_url,
      apk_size_mb: app.apk_size_mb,
      description: app.description || '',
      changelog: app.changelog || '',
      min_android_version: app.min_android_version || 21,
      is_mandatory: app.is_mandatory,
      rollout_percentage: app.rollout_percentage,
      required_permissions: app.required_permissions || [],
      target_device_models: app.target_device_models || []
    })
    setEditingApp(app)
    setShowAddModal(true)
  }

  const filteredApps = apps.filter(app => {
    const matchesSearch =
      app.app_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.package_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.version_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter =
      filterActive === 'all' ||
      (filterActive === 'active' && app.is_active) ||
      (filterActive === 'inactive' && !app.is_active)

    return matchesSearch && matchesFilter
  })

  const stats = {
    total: apps.length,
    active: apps.filter(a => a.is_active).length,
    mandatory: apps.filter(a => a.is_mandatory).length,
    totalInstalls: apps.reduce((sum, a) => sum + a.install_count, 0)
  }

  if (loading) {
    return <PageLoader message="Caricamento repository app..." size="medium" />
  }

  return (
    <div className="admin-dashboard" style={{ width: '100%', maxWidth: 'none', margin: 0, padding: 0 }}>
      {/* Header */}
      <div className="dashboard-header" style={{ padding: '1.5rem' }}>
        <div className="header-title-section">
          <h1>📦 Repository App</h1>
          <p>Gestisci le applicazioni disponibili per i dispositivi POS</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
          <Plus size={20} />
          Aggiungi App
        </button>
      </div>

      {/* Stats */}
      <div className="dashboard-stats" style={{ padding: '0 1.5rem 1.5rem' }}>
        <div className="stat-card">
          <Package size={20} />
          <div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">App Totali</div>
          </div>
        </div>
        <div className="stat-card online">
          <CheckCircle size={20} />
          <div>
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Attive</div>
          </div>
        </div>
        <div className="stat-card warning">
          <Shield size={20} />
          <div>
            <div className="stat-value">{stats.mandatory}</div>
            <div className="stat-label">Obbligatorie</div>
          </div>
        </div>
        <div className="stat-card">
          <Download size={20} />
          <div>
            <div className="stat-value">{stats.totalInstalls}</div>
            <div className="stat-label">Installazioni</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="search-bar" style={{ margin: '0 1.5rem 1.5rem' }}>
        <Search size={20} />
        <input
          type="text"
          placeholder="Cerca per nome, package o versione..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
          <button
            className={`btn-secondary ${filterActive === 'all' ? 'active' : ''}`}
            onClick={() => setFilterActive('all')}
          >
            Tutte
          </button>
          <button
            className={`btn-secondary ${filterActive === 'active' ? 'active' : ''}`}
            onClick={() => setFilterActive('active')}
          >
            Attive
          </button>
          <button
            className={`btn-secondary ${filterActive === 'inactive' ? 'active' : ''}`}
            onClick={() => setFilterActive('inactive')}
          >
            Inattive
          </button>
        </div>
      </div>

      {/* Apps Grid */}
      <div className="devices-grid" style={{ padding: '0 1.5rem' }}>
        {filteredApps.map(app => (
          <div key={app.id} className={`device-card ${app.is_active ? 'online' : 'offline'}`}>
            <div className="device-header">
              <div className="device-info">
                <h3>{app.app_name}</h3>
                <p className="organization" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {app.package_name}
                </p>
                <p className="location">
                  <Package size={14} />
                  v{app.version_name} (build {app.version_code})
                </p>
              </div>
              <div className="device-status">
                {app.is_active ? (
                  <CheckCircle className="status-icon online" size={16} />
                ) : (
                  <AlertTriangle className="status-icon offline" size={16} />
                )}
                <span className="status-text">{app.is_active ? 'Attiva' : 'Inattiva'}</span>
              </div>
            </div>

            <div className="device-metrics">
              <div className="metric">
                <Download size={16} />
                <span>{app.install_count} install</span>
              </div>
              <div className="metric">
                <TrendingUp size={16} />
                <span>{app.success_rate_percent || 0}% success</span>
              </div>
              <div className="metric">
                <Smartphone size={16} />
                <span>API {app.min_android_version}+</span>
              </div>
            </div>

            {app.description && (
              <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0.5rem 0' }}>
                {app.description.length > 100 ? app.description.substring(0, 100) + '...' : app.description}
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              {app.is_mandatory && (
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  backgroundColor: '#fee2e2',
                  color: '#991b1b'
                }}>
                  Obbligatoria
                </span>
              )}
              {app.rollout_percentage < 100 && (
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  backgroundColor: '#fef3c7',
                  color: '#92400e'
                }}>
                  Rollout {app.rollout_percentage}%
                </span>
              )}
            </div>

            <div className="device-actions" style={{ marginTop: '1rem' }}>
              <button
                className="action-btn primary"
                onClick={() => openEditModal(app)}
              >
                <Edit size={14} />
                Modifica
              </button>
              <button
                className={`action-btn ${app.is_active ? 'warning' : 'success'}`}
                onClick={() => handleToggleActive(app)}
              >
                {app.is_active ? 'Disattiva' : 'Attiva'}
              </button>
              <button
                className="action-btn danger"
                onClick={() => handleDeleteApp(app.id)}
              >
                <Trash2 size={14} />
                Elimina
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredApps.length === 0 && (
        <div className="no-devices" style={{ margin: '2rem 0' }}>
          <Package size={48} />
          <h3>Nessuna app trovata</h3>
          <p>Non ci sono app che corrispondono ai criteri di ricerca.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="device-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="device-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>{editingApp ? '✏️ Modifica App' : '➕ Aggiungi Nuova App'}</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            <div className="modal-content">
              <div className="add-device-form">
                <div className="form-section">
                  <h4>📱 Informazioni App</h4>
                  <div className="form-row">
                    <label>Nome App:</label>
                    <input
                      type="text"
                      placeholder="es. OMNILY Bridge POS"
                      value={formData.app_name}
                      onChange={(e) => setFormData({...formData, app_name: e.target.value})}
                    />
                  </div>
                  <div className="form-row">
                    <label>Package Name:</label>
                    <input
                      type="text"
                      placeholder="es. com.omnily.bridge"
                      value={formData.package_name}
                      onChange={(e) => setFormData({...formData, package_name: e.target.value})}
                      style={{ fontFamily: 'monospace' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-row">
                      <label>Version Name:</label>
                      <input
                        type="text"
                        placeholder="1.0.0"
                        value={formData.version_name}
                        onChange={(e) => setFormData({...formData, version_name: e.target.value})}
                      />
                    </div>
                    <div className="form-row">
                      <label>Version Code:</label>
                      <input
                        type="number"
                        value={formData.version_code}
                        onChange={(e) => setFormData({...formData, version_code: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>📦 File APK</h4>
                  <div className="form-row">
                    <label>URL APK:</label>
                    <input
                      type="text"
                      placeholder="https://storage.supabase.co/..."
                      value={formData.apk_url}
                      onChange={(e) => setFormData({...formData, apk_url: e.target.value})}
                    />
                  </div>
                  <div className="form-row">
                    <label>Dimensione (MB):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.apk_size_mb}
                      onChange={(e) => setFormData({...formData, apk_size_mb: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h4>📝 Descrizione</h4>
                  <div className="form-row">
                    <label>Descrizione:</label>
                    <textarea
                      rows={3}
                      placeholder="Descrizione breve dell'app..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                  <div className="form-row">
                    <label>Changelog:</label>
                    <textarea
                      rows={3}
                      placeholder="Novità di questa versione..."
                      value={formData.changelog}
                      onChange={(e) => setFormData({...formData, changelog: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h4>⚙️ Configurazione Deployment</h4>
                  <div className="form-row">
                    <label>Min Android Version (API Level):</label>
                    <input
                      type="number"
                      value={formData.min_android_version}
                      onChange={(e) => setFormData({...formData, min_android_version: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="form-row">
                    <label>Rollout Percentage (%):</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.rollout_percentage}
                      onChange={(e) => setFormData({...formData, rollout_percentage: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="form-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.is_mandatory}
                        onChange={(e) => setFormData({...formData, is_mandatory: e.target.checked})}
                      />
                      Update obbligatorio (forza installazione su tutti i dispositivi)
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button className="action-btn secondary" onClick={() => setShowAddModal(false)}>
                  Annulla
                </button>
                <button className="action-btn success" onClick={handleSaveApp}>
                  <Package size={16} />
                  {editingApp ? 'Salva Modifiche' : 'Aggiungi App'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        type={confirmState.type}
        onConfirm={handleConfirm}
        onCancel={hideConfirm}
      />
    </div>
  )
}

export default AppRepositoryManager
