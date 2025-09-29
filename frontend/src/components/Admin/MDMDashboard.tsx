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
  Search
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

const MDMDashboard: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([])
  const [commands, setCommands] = useState<DeviceCommand[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    kioskActive: 0
  })

  useEffect(() => {
    loadDevices()
    loadCommands()

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
        <h1>📱 Gestione Dispositivi POS</h1>
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
    </div>
  )
}

export default MDMDashboard