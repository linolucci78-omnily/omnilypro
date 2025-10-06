import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Store,
  Plus,
  Edit,
  Trash2,
  Search,
  Building2,
  Wifi,
  Clock,
  Settings as SettingsIcon,
  Save,
  Download
} from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import { useConfirm } from '../../hooks/useConfirm'
import Toast from '../UI/Toast'
import ConfirmModal from '../UI/ConfirmModal'
import PageLoader from '../UI/PageLoader'
import './AdminLayout.css'

interface StoreConfig {
  id?: string
  store_name: string
  organization_id: string
  store_code?: string
  wifi_ssid?: string
  wifi_password?: string
  wifi_security_type?: string
  backup_wifi_ssid?: string
  backup_wifi_password?: string
  default_language: string
  default_timezone: string
  default_volume_level: number
  screen_brightness: number
  screen_timeout_minutes: number
  pos_settings?: any
  kiosk_default_app?: string
  kiosk_auto_start: boolean
  main_app_package: string
  allowed_apps?: string[]
  opening_hours?: any
  auto_shutdown_enabled: boolean
  shutdown_time?: string
  startup_time?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
  // Joined
  organization?: {
    name: string
  }
}

interface Organization {
  id: string
  name: string
}

const StoreConfigManager: React.FC = () => {
  const [configs, setConfigs] = useState<StoreConfig[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingConfig, setEditingConfig] = useState<StoreConfig | null>(null)
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast()
  const { confirmState, showConfirm, hideConfirm, handleConfirm } = useConfirm()

  const defaultConfig: Omit<StoreConfig, 'id'> = {
    store_name: '',
    organization_id: '',
    store_code: '',
    wifi_ssid: '',
    wifi_password: '',
    wifi_security_type: 'WPA2',
    default_language: 'it_IT',
    default_timezone: 'Europe/Rome',
    default_volume_level: 70,
    screen_brightness: 80,
    screen_timeout_minutes: 15,
    kiosk_auto_start: true,
    main_app_package: 'com.omnily.bridge',
    auto_shutdown_enabled: false,
    is_active: true
  }

  const [formData, setFormData] = useState<Omit<StoreConfig, 'id'>>(defaultConfig)

  useEffect(() => {
    loadConfigs()
    loadOrganizations()
  }, [])

  const loadConfigs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('store_configs')
        .select(`
          *,
          organization:organizations(name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setConfigs(data || [])
    } catch (error) {
      console.error('Error loading store configs:', error)
      showError('Errore nel caricamento delle configurazioni')
    } finally {
      setLoading(false)
    }
  }

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name')

      if (error) throw error
      setOrganizations(data || [])
    } catch (error) {
      console.error('Error loading organizations:', error)
    }
  }

  const handleSave = async () => {
    if (!formData.store_name || !formData.organization_id) {
      showWarning('Compila nome store e organizzazione')
      return
    }

    try {
      if (editingConfig?.id) {
        // Update
        const { error } = await supabase
          .from('store_configs')
          .update(formData)
          .eq('id', editingConfig.id)

        if (error) throw error
        showSuccess('Configurazione aggiornata con successo')
      } else {
        // Insert
        const { error } = await supabase
          .from('store_configs')
          .insert([formData])

        if (error) throw error
        showSuccess('Configurazione creata con successo')
      }

      resetForm()
      setShowModal(false)
      loadConfigs()
    } catch (error: any) {
      console.error('Error saving config:', error)
      showError(error.message || 'Errore nel salvataggio')
    }
  }

  const handleDelete = async (id: string) => {
    showConfirm(
      'Sei sicuro di voler eliminare questa configurazione?',
      async () => {
        try {
          const { error } = await supabase
            .from('store_configs')
            .delete()
            .eq('id', id)

          if (error) throw error
          showSuccess('Configurazione eliminata')
          loadConfigs()
        } catch (error) {
          console.error('Error deleting config:', error)
          showError('Errore nell\'eliminazione')
        }
      },
      {
        title: 'Elimina Configurazione',
        confirmText: 'Elimina',
        type: 'danger'
      }
    )
  }

  const openEditModal = (config: StoreConfig) => {
    setFormData({
      store_name: config.store_name,
      organization_id: config.organization_id,
      store_code: config.store_code || '',
      wifi_ssid: config.wifi_ssid || '',
      wifi_password: config.wifi_password || '',
      wifi_security_type: config.wifi_security_type || 'WPA2',
      backup_wifi_ssid: config.backup_wifi_ssid || '',
      backup_wifi_password: config.backup_wifi_password || '',
      default_language: config.default_language,
      default_timezone: config.default_timezone,
      default_volume_level: config.default_volume_level,
      screen_brightness: config.screen_brightness,
      screen_timeout_minutes: config.screen_timeout_minutes,
      kiosk_default_app: config.kiosk_default_app || '',
      kiosk_auto_start: config.kiosk_auto_start,
      main_app_package: config.main_app_package,
      auto_shutdown_enabled: config.auto_shutdown_enabled,
      shutdown_time: config.shutdown_time || '',
      startup_time: config.startup_time || '',
      is_active: config.is_active
    })
    setEditingConfig(config)
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData(defaultConfig)
    setEditingConfig(null)
  }

  const filteredConfigs = configs.filter(config =>
    config.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.organization?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.store_code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <PageLoader message="Caricamento configurazioni store..." size="medium" />
  }

  return (
    <div className="admin-dashboard" style={{ width: '100%', maxWidth: 'none', margin: 0, padding: 0 }}>
      {/* Header */}
      <div className="dashboard-header" style={{ padding: '1.5rem' }}>
        <div className="header-title-section">
          <h1>🏪 Configurazioni Store</h1>
          <p>Gestisci le configurazioni dei negozi e punti vendita</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={20} />
          Nuova Configurazione
        </button>
      </div>

      {/* Stats */}
      <div className="dashboard-stats" style={{ padding: '0 1.5rem 1.5rem' }}>
        <div className="stat-card">
          <Store size={20} />
          <div>
            <div className="stat-value">{configs.length}</div>
            <div className="stat-label">Configurazioni</div>
          </div>
        </div>
        <div className="stat-card online">
          <Building2 size={20} />
          <div>
            <div className="stat-value">{configs.filter(c => c.is_active).length}</div>
            <div className="stat-label">Attive</div>
          </div>
        </div>
        <div className="stat-card">
          <Wifi size={20} />
          <div>
            <div className="stat-value">{configs.filter(c => c.wifi_ssid).length}</div>
            <div className="stat-label">Con WiFi</div>
          </div>
        </div>
        <div className="stat-card">
          <Clock size={20} />
          <div>
            <div className="stat-value">{configs.filter(c => c.auto_shutdown_enabled).length}</div>
            <div className="stat-label">Auto Shutdown</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar" style={{ margin: '0 1.5rem 1.5rem' }}>
        <Search size={20} />
        <input
          type="text"
          placeholder="Cerca per nome store, organizzazione o codice..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Configs Grid */}
      <div className="devices-grid" style={{ padding: '0 1.5rem' }}>
        {filteredConfigs.map(config => (
          <div key={config.id} className={`device-card ${config.is_active ? 'online' : 'offline'}`}>
            <div className="device-header">
              <div className="device-info">
                <h3>{config.store_name}</h3>
                <p className="organization">
                  <Building2 size={14} />
                  {config.organization?.name}
                </p>
                {config.store_code && (
                  <p className="location">
                    <Store size={14} />
                    Codice: {config.store_code}
                  </p>
                )}
              </div>
            </div>

            <div className="device-metrics">
              {config.wifi_ssid && (
                <div className="metric">
                  <Wifi size={16} />
                  <span>{config.wifi_ssid}</span>
                </div>
              )}
              <div className="metric">
                <SettingsIcon size={16} />
                <span>{config.kiosk_auto_start ? 'Kiosk Auto' : 'Manual'}</span>
              </div>
              {config.auto_shutdown_enabled && (
                <div className="metric">
                  <Clock size={16} />
                  <span>Shutdown {config.shutdown_time}</span>
                </div>
              )}
            </div>

            <div className="device-actions" style={{ marginTop: '1rem' }}>
              <button className="action-btn primary" onClick={() => openEditModal(config)}>
                <Edit size={14} />
                Modifica
              </button>
              <button className="action-btn danger" onClick={() => config.id && handleDelete(config.id)}>
                <Trash2 size={14} />
                Elimina
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredConfigs.length === 0 && (
        <div className="no-devices" style={{ margin: '2rem 0' }}>
          <Store size={48} />
          <h3>Nessuna configurazione trovata</h3>
          <p>Non ci sono configurazioni store che corrispondono alla ricerca.</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="device-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="device-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h2>{editingConfig ? '✏️ Modifica Configurazione' : '➕ Nuova Configurazione'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-content">
              <div className="add-device-form">
                {/* Info Store */}
                <div className="form-section">
                  <h4>🏪 Informazioni Store</h4>
                  <div className="form-row">
                    <label>Nome Store:</label>
                    <input
                      type="text"
                      value={formData.store_name}
                      onChange={(e) => setFormData({...formData, store_name: e.target.value})}
                      placeholder="es. Milano Centro"
                    />
                  </div>
                  <div className="form-row">
                    <label>Organizzazione:</label>
                    <select
                      value={formData.organization_id}
                      onChange={(e) => setFormData({...formData, organization_id: e.target.value})}
                    >
                      <option value="">Seleziona...</option>
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Codice Store (opzionale):</label>
                    <input
                      type="text"
                      value={formData.store_code || ''}
                      onChange={(e) => setFormData({...formData, store_code: e.target.value})}
                      placeholder="es. MI01"
                    />
                  </div>
                </div>

                {/* WiFi */}
                <div className="form-section">
                  <h4>📶 Configurazione WiFi</h4>
                  <div className="form-row">
                    <label>SSID WiFi Principale:</label>
                    <input
                      type="text"
                      value={formData.wifi_ssid || ''}
                      onChange={(e) => setFormData({...formData, wifi_ssid: e.target.value})}
                    />
                  </div>
                  <div className="form-row">
                    <label>Password WiFi:</label>
                    <input
                      type="password"
                      value={formData.wifi_password || ''}
                      onChange={(e) => setFormData({...formData, wifi_password: e.target.value})}
                    />
                  </div>
                  <div className="form-row">
                    <label>Tipo Sicurezza:</label>
                    <select
                      value={formData.wifi_security_type || 'WPA2'}
                      onChange={(e) => setFormData({...formData, wifi_security_type: e.target.value})}
                    >
                      <option value="WPA2">WPA2</option>
                      <option value="WPA3">WPA3</option>
                      <option value="OPEN">OPEN</option>
                    </select>
                  </div>
                </div>

                {/* Display */}
                <div className="form-section">
                  <h4>🖥️ Impostazioni Display</h4>
                  <div className="form-row">
                    <label>Luminosità (%): {formData.screen_brightness}</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.screen_brightness}
                      onChange={(e) => setFormData({...formData, screen_brightness: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="form-row">
                    <label>Timeout Screen (minuti):</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={formData.screen_timeout_minutes}
                      onChange={(e) => setFormData({...formData, screen_timeout_minutes: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="form-row">
                    <label>Volume (%): {formData.default_volume_level}</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.default_volume_level}
                      onChange={(e) => setFormData({...formData, default_volume_level: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                {/* Kiosk */}
                <div className="form-section">
                  <h4>🔒 Modalità Kiosk</h4>
                  <div className="form-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.kiosk_auto_start}
                        onChange={(e) => setFormData({...formData, kiosk_auto_start: e.target.checked})}
                      />
                      Avvia automaticamente in modalità Kiosk
                    </label>
                  </div>
                  <div className="form-row">
                    <label>App Principale:</label>
                    <input
                      type="text"
                      value={formData.main_app_package}
                      onChange={(e) => setFormData({...formData, main_app_package: e.target.value})}
                      placeholder="com.omnily.bridge"
                    />
                  </div>
                </div>

                {/* Auto Shutdown */}
                <div className="form-section">
                  <h4>⏰ Orari Automatici</h4>
                  <div className="form-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.auto_shutdown_enabled}
                        onChange={(e) => setFormData({...formData, auto_shutdown_enabled: e.target.checked})}
                      />
                      Abilita spegnimento/accensione automatico
                    </label>
                  </div>
                  {formData.auto_shutdown_enabled && (
                    <>
                      <div className="form-row">
                        <label>Orario Spegnimento:</label>
                        <input
                          type="time"
                          value={formData.shutdown_time || ''}
                          onChange={(e) => setFormData({...formData, shutdown_time: e.target.value})}
                        />
                      </div>
                      <div className="form-row">
                        <label>Orario Accensione:</label>
                        <input
                          type="time"
                          value={formData.startup_time || ''}
                          onChange={(e) => setFormData({...formData, startup_time: e.target.value})}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button className="action-btn secondary" onClick={() => setShowModal(false)}>
                  Annulla
                </button>
                <button className="action-btn success" onClick={handleSave}>
                  <Save size={16} />
                  {editingConfig ? 'Salva Modifiche' : 'Crea Configurazione'}
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

export default StoreConfigManager
