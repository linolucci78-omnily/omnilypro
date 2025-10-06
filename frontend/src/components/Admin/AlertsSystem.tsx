import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Bell,
  AlertTriangle,
  Battery,
  WifiOff,
  HardDrive,
  XCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  BellOff,
  Trash2
} from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import PageLoader from '../UI/PageLoader'
import './AdminLayout.css'

interface Alert {
  id: string
  alert_type: 'battery_low' | 'device_offline' | 'storage_low' | 'command_failed' | 'critical'
  severity: 'low' | 'medium' | 'high' | 'critical'
  device_id?: string
  title: string
  message: string
  acknowledged: boolean
  acknowledged_at?: string
  acknowledged_by?: string
  created_at: string
  // Joined
  device?: {
    name: string
    status: string
  }
}

const AlertsSystem: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [devices, setDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'high' | 'medium'>('all')
  const [showOnlyUnacknowledged, setShowOnlyUnacknowledged] = useState(true)
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    // Carica alert esistenti e dispositivi
    loadAlerts()
    loadDevices()

    // Controlla alert ogni 30 secondi
    const interval = setInterval(() => {
      checkForAlerts()
    }, 30000)

    // Check iniziale
    checkForAlerts()

    // Real-time subscription per nuovi alert
    const subscription = supabase
      .channel('alerts-changes')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mdm_activity_logs'
        },
        () => {
          loadAlerts()
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      subscription.unsubscribe()
    }
  }, [])

  const loadAlerts = async () => {
    try {
      setLoading(true)

      // Per ora usiamo activity logs per gli alert
      // In produzione potresti avere una tabella dedicata "alerts"
      const { data, error } = await supabase
        .from('mdm_activity_logs')
        .select(`
          *,
          device:devices(name, status)
        `)
        .eq('success', false)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      // Trasforma activity logs in formato alert
      const transformedAlerts: Alert[] = (data || []).map(log => ({
        id: log.id,
        alert_type: determineAlertType(log.activity_type),
        severity: determineSeverity(log.activity_type),
        device_id: log.device_id,
        title: log.activity_title || 'Alert',
        message: log.error_details || log.activity_description || 'Unknown error',
        acknowledged: false,
        created_at: log.created_at,
        device: log.device
      }))

      setAlerts(transformedAlerts)
    } catch (error) {
      console.error('Error loading alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')

      if (error) throw error
      setDevices(data || [])
    } catch (error) {
      console.error('Error loading devices:', error)
    }
  }

  const checkForAlerts = async () => {
    // Controlla condizioni che richiedono alert
    devices.forEach(device => {
      // Alert: Batteria bassa
      if (device.battery_level && device.battery_level < 20) {
        createAlert({
          alert_type: 'battery_low',
          severity: device.battery_level < 10 ? 'critical' : 'high',
          device_id: device.id,
          title: `Batteria bassa: ${device.name}`,
          message: `Livello batteria: ${device.battery_level}%`
        })
      }

      // Alert: Dispositivo offline
      if (device.status === 'offline' && device.last_seen) {
        const lastSeen = new Date(device.last_seen)
        const now = new Date()
        const minutesOffline = (now.getTime() - lastSeen.getTime()) / (1000 * 60)

        if (minutesOffline > 30) {
          createAlert({
            alert_type: 'device_offline',
            severity: minutesOffline > 120 ? 'critical' : 'high',
            device_id: device.id,
            title: `Dispositivo offline: ${device.name}`,
            message: `Offline da ${Math.floor(minutesOffline)} minuti`
          })
        }
      }

      // Alert: Storage basso
      if (device.storage_free_gb && device.storage_free_gb < 2) {
        createAlert({
          alert_type: 'storage_low',
          severity: device.storage_free_gb < 1 ? 'critical' : 'medium',
          device_id: device.id,
          title: `Storage basso: ${device.name}`,
          message: `Spazio libero: ${device.storage_free_gb}GB`
        })
      }
    })
  }

  const createAlert = async (alertData: Omit<Alert, 'id' | 'acknowledged' | 'created_at'>) => {
    try {
      // Controlla se esiste già un alert simile nelle ultime 24h
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)

      const { data: existing } = await supabase
        .from('mdm_activity_logs')
        .select('id')
        .eq('device_id', alertData.device_id)
        .eq('activity_type', alertData.alert_type)
        .gte('created_at', oneDayAgo.toISOString())
        .single()

      // Se esiste già, non creare duplicati
      if (existing) return

      // Crea nuovo log per l'alert
      await supabase
        .from('mdm_activity_logs')
        .insert([{
          device_id: alertData.device_id,
          activity_type: alertData.alert_type,
          activity_title: alertData.title,
          activity_description: alertData.message,
          success: false,
          error_details: alertData.message
        }])

      // Reload alerts
      loadAlerts()
    } catch (error) {
      console.error('Error creating alert:', error)
    }
  }

  const handleAcknowledge = async (alertId: string) => {
    try {
      // In produzione, aggiorneresti il campo acknowledged
      // Per ora rimuoviamo dalla lista
      setAlerts(alerts.filter(a => a.id !== alertId))
      showSuccess('Alert confermato')
    } catch (error) {
      console.error('Error acknowledging alert:', error)
      showError('Errore nella conferma')
    }
  }

  const handleAcknowledgeAll = async () => {
    try {
      setAlerts(alerts.map(a => ({ ...a, acknowledged: true })))
      showSuccess('Tutti gli alert confermati')
    } catch (error) {
      console.error('Error acknowledging all alerts:', error)
      showError('Errore nella conferma multipla')
    }
  }

  const determineAlertType = (activityType: string): Alert['alert_type'] => {
    if (activityType.includes('battery')) return 'battery_low'
    if (activityType.includes('offline')) return 'device_offline'
    if (activityType.includes('storage')) return 'storage_low'
    if (activityType.includes('failed')) return 'command_failed'
    return 'critical'
  }

  const determineSeverity = (activityType: string): Alert['severity'] => {
    if (activityType.includes('critical')) return 'critical'
    if (activityType.includes('high')) return 'high'
    if (activityType.includes('medium')) return 'medium'
    return 'low'
  }

  const getAlertIcon = (type: Alert['alert_type']) => {
    switch (type) {
      case 'battery_low': return <Battery size={20} />
      case 'device_offline': return <WifiOff size={20} />
      case 'storage_low': return <HardDrive size={20} />
      case 'command_failed': return <XCircle size={20} />
      default: return <AlertTriangle size={20} />
    }
  }

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical': return { bg: '#fee2e2', color: '#991b1b', border: '#ef4444' }
      case 'high': return { bg: '#fed7aa', color: '#9a3412', border: '#f97316' }
      case 'medium': return { bg: '#fef3c7', color: '#92400e', border: '#f59e0b' }
      default: return { bg: '#e0e7ff', color: '#3730a3', border: '#6366f1' }
    }
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch =
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.device?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSeverity =
      filterSeverity === 'all' || alert.severity === filterSeverity

    const matchesAcknowledged = !showOnlyUnacknowledged || !alert.acknowledged

    return matchesSearch && matchesSeverity && matchesAcknowledged
  })

  const stats = {
    total: alerts.length,
    unacknowledged: alerts.filter(a => !a.acknowledged).length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length
  }

  if (loading) {
    return <PageLoader message="Caricamento alert..." size="medium" />
  }

  return (
    <div className="admin-dashboard" style={{ width: '100%', maxWidth: 'none', margin: 0, padding: 0 }}>
      {/* Header */}
      <div className="dashboard-header" style={{ padding: '1.5rem' }}>
        <div className="header-title-section">
          <h1>🔔 Sistema Alert</h1>
          <p>Monitora eventi critici e notifiche sistema</p>
        </div>
        <button className="btn-primary" onClick={handleAcknowledgeAll} disabled={stats.unacknowledged === 0}>
          <CheckCircle size={20} />
          Conferma Tutti
        </button>
      </div>

      {/* Stats */}
      <div className="dashboard-stats" style={{ padding: '0 1.5rem 1.5rem' }}>
        <div className="stat-card">
          <Bell size={20} />
          <div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Alert Totali</div>
          </div>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#fef3c7' }}>
          <BellOff size={20} style={{ color: '#f59e0b' }} />
          <div>
            <div className="stat-value">{stats.unacknowledged}</div>
            <div className="stat-label">Da Confermare</div>
          </div>
        </div>
        <div className="stat-card offline">
          <AlertTriangle size={20} />
          <div>
            <div className="stat-value">{stats.critical}</div>
            <div className="stat-label">Critici</div>
          </div>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#fed7aa' }}>
          <AlertTriangle size={20} style={{ color: '#f97316' }} />
          <div>
            <div className="stat-value">{stats.high}</div>
            <div className="stat-label">Alta Priorità</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: '0 1.5rem 1.5rem' }}>
        <div className="search-bar" style={{ marginBottom: '1rem' }}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Cerca alert..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className={`btn-secondary ${filterSeverity === 'all' ? 'active' : ''}`}
            onClick={() => setFilterSeverity('all')}
          >
            Tutti
          </button>
          <button
            className={`btn-secondary ${filterSeverity === 'critical' ? 'active' : ''}`}
            onClick={() => setFilterSeverity('critical')}
          >
            Critici
          </button>
          <button
            className={`btn-secondary ${filterSeverity === 'high' ? 'active' : ''}`}
            onClick={() => setFilterSeverity('high')}
          >
            High
          </button>
          <button
            className={`btn-secondary ${filterSeverity === 'medium' ? 'active' : ''}`}
            onClick={() => setFilterSeverity('medium')}
          >
            Medium
          </button>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginLeft: 'auto',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            <input
              type="checkbox"
              checked={showOnlyUnacknowledged}
              onChange={(e) => setShowOnlyUnacknowledged(e.target.checked)}
            />
            Solo da confermare
          </label>
        </div>
      </div>

      {/* Alerts List */}
      <div style={{ padding: '0 1.5rem' }}>
        {filteredAlerts.map(alert => {
          const colors = getSeverityColor(alert.severity)
          return (
            <div
              key={alert.id}
              style={{
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem'
              }}
            >
              <div style={{ color: colors.color, marginTop: '0.125rem' }}>
                {getAlertIcon(alert.alert_type)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.25rem'
                }}>
                  <h4 style={{
                    margin: 0,
                    color: colors.color,
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}>
                    {alert.title}
                  </h4>
                  <span style={{
                    padding: '0.125rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    backgroundColor: colors.color + '20',
                    color: colors.color,
                    textTransform: 'uppercase'
                  }}>
                    {alert.severity}
                  </span>
                </div>

                <p style={{
                  margin: '0.25rem 0',
                  color: colors.color,
                  fontSize: '0.875rem'
                }}>
                  {alert.message}
                </p>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginTop: '0.5rem',
                  fontSize: '0.8rem',
                  color: colors.color,
                  opacity: 0.8
                }}>
                  {alert.device && (
                    <span>📱 {alert.device.name}</span>
                  )}
                  <span>
                    <Clock size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                    {formatDate(alert.created_at)}
                  </span>
                </div>
              </div>

              {!alert.acknowledged && (
                <button
                  className="action-btn success"
                  onClick={() => handleAcknowledge(alert.id)}
                  style={{ marginTop: '0.125rem' }}
                >
                  <CheckCircle size={14} />
                  Conferma
                </button>
              )}
            </div>
          )
        })}

        {filteredAlerts.length === 0 && (
          <div className="no-devices" style={{ margin: '2rem 0' }}>
            <CheckCircle size={48} style={{ color: '#10b981' }} />
            <h3>Nessun alert</h3>
            <p>Non ci sono alert che corrispondono ai filtri selezionati.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AlertsSystem
