import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Smartphone,
  MapPin,
  Battery,
  Wifi,
  Power,
  Settings,
  Lock,
  Unlock,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Plus
} from 'lucide-react'
import './MDMDashboard.css'

interface Device {
  id: string
  name: string
  android_id: string
  device_model: string
  organization_id: string
  store_location: string
  status: 'online' | 'offline' | 'setup' | 'maintenance'
  last_seen: string
  wifi_ssid: string
  battery_level: number
  kiosk_mode_active: boolean
  current_app_package: string
  latitude: number
  longitude: number
  language: string
  created_at: string

  // Join data
  organization?: {
    name: string
  }
}

interface DeviceCommand {
  id: string
  device_id: string
  command_type: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  completed_at: string
  error_message: string
}

interface Organization {
  id: string
  name: string
}

const MDMDashboard: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([])
  const [commands, setCommands] = useState<DeviceCommand[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showStoreConfigModal, setShowStoreConfigModal] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [qrCodeData, setQrCodeData] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    kioskActive: 0
  })

  // Form state for new device
  const [deviceForm, setDeviceForm] = useState({
    name: '',
    device_model: 'Z108',
    organization_id: '',
    store_location: '',
    store_address: '',
    wifi_ssid: '',
    wifi_password: '',
    wifi_security: 'WPA2',
    kiosk_auto_start: true,
    main_app_package: 'com.omnily.bridge'
  })

  useEffect(() => {
    loadDevices()
    loadCommands()
    loadOrganizations()

    // Real-time subscription per device updates
    const deviceSubscription = supabase
      .channel('device-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devices'
        },
        () => {
          loadDevices()
        }
      )
      .subscribe()

    // Auto-refresh ogni 30 secondi
    const interval = setInterval(loadDevices, 30000)

    return () => {
      deviceSubscription.unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const loadDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select(`
          *,
          organization:organizations(name)
        `)
        .order('last_seen', { ascending: false })

      if (error) throw error

      setDevices(data || [])

      // Calculate stats
      const total = data?.length || 0
      const online = data?.filter(d => d.status === 'online').length || 0
      const offline = data?.filter(d => d.status === 'offline').length || 0
      const kioskActive = data?.filter(d => d.kiosk_mode_active).length || 0

      setStats({ total, online, offline, kioskActive })

    } catch (error) {
      console.error('Error loading devices:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCommands = async () => {
    try {
      const { data, error } = await supabase
        .from('device_commands')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setCommands(data || [])
    } catch (error) {
      console.error('Error loading commands:', error)
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

  const sendCommand = async (deviceId: string, commandType: string, payload = {}) => {
    try {
      const { error } = await supabase
        .from('device_commands')
        .insert({
          device_id: deviceId,
          command_type: commandType,
          payload: payload,
          status: 'pending'
        })

      if (error) throw error

      loadCommands()
      alert(`Comando "${commandType}" inviato al dispositivo`)
    } catch (error) {
      console.error('Error sending command:', error)
      alert('Errore invio comando')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="status-icon online" size={16} />
      case 'offline': return <AlertTriangle className="status-icon offline" size={16} />
      case 'setup': return <Clock className="status-icon setup" size={16} />
      case 'maintenance': return <Settings className="status-icon maintenance" size={16} />
      default: return <AlertTriangle className="status-icon" size={16} />
    }
  }

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Ora'
    if (diffMins < 60) return `${diffMins}m fa`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h fa`
    return `${Math.floor(diffMins / 1440)}g fa`
  }

  const handleCreateDevice = async () => {
    if (!deviceForm.name || !deviceForm.organization_id || !deviceForm.store_location) {
      alert('Compila tutti i campi obbligatori')
      return
    }

    setFormLoading(true)
    try {
      // Generate unique Android ID
      const androidId = `android_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

      const { error } = await supabase
        .from('devices')
        .insert({
          name: deviceForm.name,
          android_id: androidId,
          device_model: deviceForm.device_model,
          organization_id: deviceForm.organization_id,
          store_location: deviceForm.store_location,
          status: 'setup',
          wifi_ssid: deviceForm.wifi_ssid,
          kiosk_mode_active: false,
          current_app_package: deviceForm.main_app_package,
          language: 'it',
          created_at: new Date().toISOString()
        })

      if (error) throw error

      // Create store config if WiFi is provided
      if (deviceForm.wifi_ssid && deviceForm.wifi_password) {
        await supabase
          .from('store_configs')
          .insert({
            store_name: deviceForm.store_location,
            organization_id: deviceForm.organization_id,
            wifi_ssid: deviceForm.wifi_ssid,
            wifi_password: deviceForm.wifi_password,
            wifi_security_type: deviceForm.wifi_security,
            pos_terminal_count: 1,
            kiosk_auto_start: deviceForm.kiosk_auto_start,
            main_app_package: deviceForm.main_app_package
          })
      }

      // Reset form
      setDeviceForm({
        name: '',
        device_model: 'Z108',
        organization_id: '',
        store_location: '',
        store_address: '',
        wifi_ssid: '',
        wifi_password: '',
        wifi_security: 'WPA2',
        kiosk_auto_start: true,
        main_app_package: 'com.omnily.bridge'
      })

      setShowAddDeviceModal(false)
      loadDevices()
      alert('Dispositivo creato con successo!')

    } catch (error) {
      console.error('Error creating device:', error)
      alert('Errore durante la creazione del dispositivo')
    } finally {
      setFormLoading(false)
    }
  }

  const handleGenerateQR = () => {
    if (!deviceForm.name || !deviceForm.organization_id) {
      alert('Compila almeno nome dispositivo e organizzazione per generare il QR Code')
      return
    }

    const setupData = {
      deviceName: deviceForm.name,
      organizationId: deviceForm.organization_id,
      storeLocation: deviceForm.store_location,
      wifiSSID: deviceForm.wifi_ssid,
      wifiPassword: deviceForm.wifi_password,
      wifiSecurity: deviceForm.wifi_security,
      kioskAutoStart: deviceForm.kiosk_auto_start,
      mainAppPackage: deviceForm.main_app_package,
      setupUrl: `${window.location.origin}/device-setup`
    }

    setQrCodeData(JSON.stringify(setupData))
    setShowQRModal(true)
  }

  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.store_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.organization?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="mdm-dashboard loading">
        <RefreshCw className="loading-spinner" size={24} />
        <p>Caricamento dispositivi...</p>
      </div>
    )
  }

  return (
    <div className="mdm-dashboard">
      {/* Header con statistiche */}
      <div className="mdm-header">
        <div className="header-title-section">
          <h1>📱 Gestione Dispositivi POS</h1>
          <div className="header-actions">
            <button
              className="btn-primary"
              onClick={() => setShowAddDeviceModal(true)}
            >
              <Plus size={20} />
              Aggiungi Dispositivo
            </button>
            <button
              className="btn-secondary"
              onClick={() => setShowQRModal(true)}
            >
              <Download size={20} />
              Genera QR Setup
            </button>
            <button
              className="btn-secondary"
              onClick={() => setShowStoreConfigModal(true)}
            >
              <Settings size={20} />
              Configurazioni Store
            </button>
          </div>
        </div>
        <div className="stats-cards">
          <div className="stat-card">
            <Smartphone size={20} />
            <div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Totali</div>
            </div>
          </div>
          <div className="stat-card online">
            <CheckCircle size={20} />
            <div>
              <div className="stat-value">{stats.online}</div>
              <div className="stat-label">Online</div>
            </div>
          </div>
          <div className="stat-card offline">
            <AlertTriangle size={20} />
            <div>
              <div className="stat-value">{stats.offline}</div>
              <div className="stat-label">Offline</div>
            </div>
          </div>
          <div className="stat-card kiosk">
            <Lock size={20} />
            <div>
              <div className="stat-value">{stats.kioskActive}</div>
              <div className="stat-label">Kiosk Attivo</div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra ricerca */}
      <div className="search-bar">
        <Search size={20} />
        <input
          type="text"
          placeholder="Cerca dispositivo, negozio o organizzazione..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Lista dispositivi */}
      <div className="devices-grid">
        {filteredDevices.map(device => (
          <div
            key={device.id}
            className={`device-card ${device.status}`}
            onClick={() => setSelectedDevice(device)}
          >
            <div className="device-header">
              <div className="device-info">
                <h3>{device.name}</h3>
                <p className="organization">{device.organization?.name}</p>
                <p className="location">
                  <MapPin size={14} />
                  {device.store_location}
                </p>
              </div>
              <div className="device-status">
                {getStatusIcon(device.status)}
                <span className="status-text">{device.status}</span>
              </div>
            </div>

            <div className="device-metrics">
              <div className="metric">
                <Battery size={16} />
                <span>{device.battery_level || 0}%</span>
              </div>
              <div className="metric">
                <Wifi size={16} />
                <span>{device.wifi_ssid || 'N/A'}</span>
              </div>
              <div className="metric">
                <Clock size={16} />
                <span>{getTimeSince(device.last_seen)}</span>
              </div>
            </div>

            <div className="device-actions">
              <button
                className="action-btn primary"
                onClick={(e) => {
                  e.stopPropagation()
                  sendCommand(device.id, 'reboot')
                }}
                disabled={device.status === 'offline'}
              >
                <RefreshCw size={14} />
                Riavvia
              </button>

              <button
                className={`action-btn ${device.kiosk_mode_active ? 'danger' : 'success'}`}
                onClick={(e) => {
                  e.stopPropagation()
                  sendCommand(device.id, device.kiosk_mode_active ? 'kiosk_off' : 'kiosk_on')
                }}
                disabled={device.status === 'offline'}
              >
                {device.kiosk_mode_active ? <Unlock size={14} /> : <Lock size={14} />}
                {device.kiosk_mode_active ? 'Sblocca' : 'Kiosk'}
              </button>

              <button
                className="action-btn secondary"
                onClick={(e) => {
                  e.stopPropagation()
                  sendCommand(device.id, 'locate')
                }}
                disabled={device.status === 'offline'}
              >
                <MapPin size={14} />
                Localizza
              </button>
            </div>

            {device.kiosk_mode_active && (
              <div className="kiosk-indicator">
                <Lock size={12} />
                Modalità Kiosk Attiva
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredDevices.length === 0 && (
        <div className="no-devices">
          <Smartphone size={48} />
          <h3>Nessun dispositivo trovato</h3>
          <p>Non ci sono dispositivi che corrispondono ai criteri di ricerca.</p>
        </div>
      )}

      {/* Device Detail Modal */}
      {selectedDevice && (
        <div className="device-modal-overlay" onClick={() => setSelectedDevice(null)}>
          <div className="device-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedDevice.name}</h2>
              <button
                className="close-btn"
                onClick={() => setSelectedDevice(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="device-details">
                <div className="detail-group">
                  <h4>Informazioni Generali</h4>
                  <div className="detail-row">
                    <span>Organizzazione:</span>
                    <span>{selectedDevice.organization?.name}</span>
                  </div>
                  <div className="detail-row">
                    <span>Negozio:</span>
                    <span>{selectedDevice.store_location}</span>
                  </div>
                  <div className="detail-row">
                    <span>Modello:</span>
                    <span>{selectedDevice.device_model || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span>Android ID:</span>
                    <span className="mono">{selectedDevice.android_id}</span>
                  </div>
                </div>

                <div className="detail-group">
                  <h4>Status Sistema</h4>
                  <div className="detail-row">
                    <span>Status:</span>
                    <span className={`status-badge ${selectedDevice.status}`}>
                      {selectedDevice.status}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span>Batteria:</span>
                    <span>{selectedDevice.battery_level || 0}%</span>
                  </div>
                  <div className="detail-row">
                    <span>WiFi:</span>
                    <span>{selectedDevice.wifi_ssid || 'Non connesso'}</span>
                  </div>
                  <div className="detail-row">
                    <span>Ultimo ping:</span>
                    <span>{getTimeSince(selectedDevice.last_seen)}</span>
                  </div>
                </div>

                <div className="detail-group">
                  <h4>Configurazione</h4>
                  <div className="detail-row">
                    <span>Modalità Kiosk:</span>
                    <span className={selectedDevice.kiosk_mode_active ? 'active' : 'inactive'}>
                      {selectedDevice.kiosk_mode_active ? 'Attiva' : 'Non attiva'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span>App corrente:</span>
                    <span className="mono">{selectedDevice.current_app_package || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span>Lingua:</span>
                    <span>{selectedDevice.language}</span>
                  </div>
                </div>

                {selectedDevice.latitude && selectedDevice.longitude && (
                  <div className="detail-group">
                    <h4>Posizione GPS</h4>
                    <div className="detail-row">
                      <span>Coordinate:</span>
                      <span className="mono">
                        {selectedDevice.latitude.toFixed(6)}, {selectedDevice.longitude.toFixed(6)}
                      </span>
                    </div>
                    <button
                      className="action-btn secondary"
                      onClick={() => {
                        const url = `https://www.google.com/maps?q=${selectedDevice.latitude},${selectedDevice.longitude}`
                        window.open(url, '_blank')
                      }}
                    >
                      <MapPin size={14} />
                      Vedi su Mappa
                    </button>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  className="action-btn primary"
                  onClick={() => sendCommand(selectedDevice.id, 'reboot')}
                  disabled={selectedDevice.status === 'offline'}
                >
                  <RefreshCw size={16} />
                  Riavvia Dispositivo
                </button>

                <button
                  className={`action-btn ${selectedDevice.kiosk_mode_active ? 'danger' : 'success'}`}
                  onClick={() => sendCommand(
                    selectedDevice.id,
                    selectedDevice.kiosk_mode_active ? 'kiosk_off' : 'kiosk_on'
                  )}
                  disabled={selectedDevice.status === 'offline'}
                >
                  {selectedDevice.kiosk_mode_active ? <Unlock size={16} /> : <Lock size={16} />}
                  {selectedDevice.kiosk_mode_active ? 'Disattiva Kiosk' : 'Attiva Kiosk'}
                </button>

                <button
                  className="action-btn warning"
                  onClick={() => {
                    if (confirm('Sei sicuro di voler spegnere il dispositivo?')) {
                      sendCommand(selectedDevice.id, 'shutdown')
                    }
                  }}
                  disabled={selectedDevice.status === 'offline'}
                >
                  <Power size={16} />
                  Spegni
                </button>

                <button
                  className="action-btn secondary"
                  onClick={() => sendCommand(selectedDevice.id, 'locate')}
                  disabled={selectedDevice.status === 'offline'}
                >
                  <MapPin size={16} />
                  Localizza
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Device Modal */}
      {showAddDeviceModal && (
        <div className="device-modal-overlay" onClick={() => setShowAddDeviceModal(false)}>
          <div className="device-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Aggiungi Nuovo Dispositivo POS</h2>
              <button
                className="close-btn"
                onClick={() => setShowAddDeviceModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="add-device-form">
                <div className="form-section">
                  <h4>📱 Informazioni Dispositivo</h4>
                  <div className="form-row">
                    <label>Nome Dispositivo:</label>
                    <input
                      type="text"
                      placeholder="es. POS-Milano-01"
                      value={deviceForm.name}
                      onChange={(e) => setDeviceForm({...deviceForm, name: e.target.value})}
                    />
                  </div>
                  <div className="form-row">
                    <label>Modello:</label>
                    <select
                      value={deviceForm.device_model}
                      onChange={(e) => setDeviceForm({...deviceForm, device_model: e.target.value})}
                    >
                      <option value="Z108">Z108 Terminal</option>
                      <option value="custom">Altro Modello</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Android ID:</label>
                    <input type="text" placeholder="Verrà generato automaticamente" disabled />
                  </div>
                </div>

                <div className="form-section">
                  <h4>🏪 Associazione Store</h4>
                  <div className="form-row">
                    <label>Organizzazione:</label>
                    <select
                      value={deviceForm.organization_id}
                      onChange={(e) => setDeviceForm({...deviceForm, organization_id: e.target.value})}
                    >
                      <option value="">Seleziona Organizzazione...</option>
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Negozio/Ubicazione:</label>
                    <input
                      type="text"
                      placeholder="es. Milano Centro, Roma Termini"
                      value={deviceForm.store_location}
                      onChange={(e) => setDeviceForm({...deviceForm, store_location: e.target.value})}
                    />
                  </div>
                  <div className="form-row">
                    <label>Indirizzo:</label>
                    <input
                      type="text"
                      placeholder="Via Roma 123, Milano"
                      value={deviceForm.store_address}
                      onChange={(e) => setDeviceForm({...deviceForm, store_address: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h4>📶 Configurazione WiFi</h4>
                  <div className="form-row">
                    <label>Nome WiFi (SSID):</label>
                    <input
                      type="text"
                      placeholder="Nome rete WiFi store"
                      value={deviceForm.wifi_ssid}
                      onChange={(e) => setDeviceForm({...deviceForm, wifi_ssid: e.target.value})}
                    />
                  </div>
                  <div className="form-row">
                    <label>Password WiFi:</label>
                    <input
                      type="password"
                      placeholder="Password rete WiFi"
                      value={deviceForm.wifi_password}
                      onChange={(e) => setDeviceForm({...deviceForm, wifi_password: e.target.value})}
                    />
                  </div>
                  <div className="form-row">
                    <label>Tipo Sicurezza:</label>
                    <select
                      value={deviceForm.wifi_security}
                      onChange={(e) => setDeviceForm({...deviceForm, wifi_security: e.target.value})}
                    >
                      <option value="WPA2">WPA2</option>
                      <option value="WPA3">WPA3</option>
                      <option value="OPEN">Aperta</option>
                    </select>
                  </div>
                </div>

                <div className="form-section">
                  <h4>⚙️ Configurazione Kiosk</h4>
                  <div className="form-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={deviceForm.kiosk_auto_start}
                        onChange={(e) => setDeviceForm({...deviceForm, kiosk_auto_start: e.target.checked})}
                      />
                      Attiva modalità Kiosk all'avvio
                    </label>
                  </div>
                  <div className="form-row">
                    <label>App principale:</label>
                    <select
                      value={deviceForm.main_app_package}
                      onChange={(e) => setDeviceForm({...deviceForm, main_app_package: e.target.value})}
                    >
                      <option value="com.omnily.bridge">OMNILY Bridge POS</option>
                      <option value="custom">Altra App</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="action-btn secondary"
                  onClick={() => setShowAddDeviceModal(false)}
                >
                  Annulla
                </button>
                <button
                  className="action-btn primary"
                  onClick={handleGenerateQR}
                  disabled={formLoading}
                >
                  <Download size={16} />
                  Genera QR Code Setup
                </button>
                <button
                  className="action-btn success"
                  onClick={handleCreateDevice}
                  disabled={formLoading}
                >
                  <Plus size={16} />
                  {formLoading ? 'Creando...' : 'Crea Dispositivo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="device-modal-overlay" onClick={() => setShowQRModal(false)}>
          <div className="device-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📱 QR Code Setup Dispositivo</h2>
              <button
                className="close-btn"
                onClick={() => setShowQRModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{
                  backgroundColor: '#fff',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px',
                  margin: '20px 0',
                  minHeight: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  color: '#6b7280'
                }}>
                  📱 QR Code verrà generato qui
                  <br /><br />
                  <small style={{ fontSize: '12px', display: 'block' }}>
                    Dati configurazione:
                    <br />
                    {qrCodeData && JSON.stringify(JSON.parse(qrCodeData), null, 2)}
                  </small>
                </div>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>
                  Inquadra questo QR Code con il dispositivo Android per configurazione automatica.
                </p>
              </div>

              <div className="modal-actions">
                <button
                  className="action-btn secondary"
                  onClick={() => setShowQRModal(false)}
                >
                  Chiudi
                </button>
                <button className="action-btn primary">
                  <Download size={16} />
                  Scarica QR Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Store Config Modal */}
      {showStoreConfigModal && (
        <div className="device-modal-overlay" onClick={() => setShowStoreConfigModal(false)}>
          <div className="device-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚙️ Configurazioni Store</h2>
              <button
                className="close-btn"
                onClick={() => setShowStoreConfigModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <Settings size={48} style={{ color: '#6b7280', marginBottom: '16px' }} />
                <h3 style={{ color: '#374151', marginBottom: '8px' }}>Configurazioni Store</h3>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>
                  Gestione configurazioni avanzate per store e dispositivi.
                  <br />Questa funzionalità sarà implementata nel prossimo aggiornamento.
                </p>
              </div>

              <div className="modal-actions">
                <button
                  className="action-btn secondary"
                  onClick={() => setShowStoreConfigModal(false)}
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MDMDashboard