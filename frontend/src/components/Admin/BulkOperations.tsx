import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  CheckSquare,
  Square,
  RefreshCw,
  Power,
  Lock,
  Unlock,
  Download,
  Upload,
  Settings,
  Play,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter
} from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import { useConfirm } from '../../hooks/useConfirm'
import PageLoader from '../UI/PageLoader'
import './AdminLayout.css'

interface Device {
  id: string
  name: string
  android_id?: string
  device_model?: string
  organization_id: string
  store_location: string
  status: 'online' | 'offline' | 'setup' | 'maintenance'
  battery_level?: number
  wifi_ssid?: string
  kiosk_mode_active: boolean
  last_seen: string
  organization?: {
    name: string
  }
}

interface BulkCommandLog {
  id: string
  operation_type: string
  total_devices: number
  successful: number
  failed: number
  started_at: string
  completed_at?: string
  status: 'running' | 'completed' | 'failed'
}

const BulkOperations: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline'>('all')
  const [bulkLogs, setBulkLogs] = useState<BulkCommandLog[]>([])
  const { showSuccess, showError, showWarning } = useToast()
  const { showConfirm } = useConfirm()

  useEffect(() => {
    loadDevices()
    loadBulkLogs()
  }, [])

  const loadDevices = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('devices')
        .select(`
          *,
          organization:organizations(name)
        `)
        .order('name')

      if (error) throw error
      setDevices(data || [])
    } catch (error) {
      console.error('Error loading devices:', error)
      showError('Errore nel caricamento dei dispositivi')
    } finally {
      setLoading(false)
    }
  }

  const loadBulkLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('mdm_activity_logs')
        .select('*')
        .ilike('activity_type', 'bulk_%')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      // Transform to bulk command logs (simplified)
      const logs = (data || []).map(log => ({
        id: log.id,
        operation_type: log.activity_type.replace('bulk_', ''),
        total_devices: 0,
        successful: log.success ? 1 : 0,
        failed: log.success ? 0 : 1,
        started_at: log.created_at,
        completed_at: log.created_at,
        status: 'completed' as const
      }))
      setBulkLogs(logs)
    } catch (error) {
      console.error('Error loading bulk logs:', error)
    }
  }

  const toggleDeviceSelection = (deviceId: string) => {
    const newSelection = new Set(selectedDevices)
    if (newSelection.has(deviceId)) {
      newSelection.delete(deviceId)
    } else {
      newSelection.add(deviceId)
    }
    setSelectedDevices(newSelection)
  }

  const toggleSelectAll = () => {
    if (selectedDevices.size === filteredDevices.length) {
      setSelectedDevices(new Set())
    } else {
      setSelectedDevices(new Set(filteredDevices.map(d => d.id)))
    }
  }

  const selectByStatus = (status: 'online' | 'offline') => {
    const statusDevices = filteredDevices.filter(d => d.status === status)
    setSelectedDevices(new Set(statusDevices.map(d => d.id)))
  }

  const executeBulkCommand = async (commandType: string, payload = {}) => {
    if (selectedDevices.size === 0) {
      showWarning('Seleziona almeno un dispositivo')
      return
    }

    setExecuting(true)
    let successCount = 0
    let failCount = 0

    try {
      const commands = Array.from(selectedDevices).map(deviceId => ({
        device_id: deviceId,
        command_type: commandType,
        payload: payload,
        status: 'pending',
        command_title: `Bulk: ${commandType}`
      }))

      const { data, error } = await supabase
        .from('device_commands')
        .insert(commands)
        .select()

      if (error) throw error

      successCount = data?.length || 0

      // Log bulk operation
      await supabase
        .from('mdm_activity_logs')
        .insert([{
          activity_type: `bulk_${commandType}`,
          activity_title: `Bulk Operation: ${commandType}`,
          activity_description: `Executed ${commandType} on ${selectedDevices.size} devices`,
          success: true,
          device_id: null,
          organization_id: null
        }])

      showSuccess(`Comando inviato a ${successCount} dispositivi`)
      setSelectedDevices(new Set())
      loadBulkLogs()

    } catch (error) {
      console.error('Error executing bulk command:', error)
      failCount = selectedDevices.size - successCount
      showError(`Errore: ${successCount} riusciti, ${failCount} falliti`)
    } finally {
      setExecuting(false)
    }
  }

  const handleBulkReboot = () => {
    showConfirm(
      `Riavviare ${selectedDevices.size} dispositivi selezionati?`,
      () => executeBulkCommand('reboot'),
      {
        title: 'Riavvio Multiplo',
        confirmText: 'Riavvia Tutti',
        type: 'warning'
      }
    )
  }

  const handleBulkKioskOn = () => {
    showConfirm(
      `Attivare modalità Kiosk su ${selectedDevices.size} dispositivi?`,
      () => executeBulkCommand('kiosk_on'),
      {
        title: 'Attiva Kiosk',
        confirmText: 'Attiva',
        type: 'info'
      }
    )
  }

  const handleBulkKioskOff = () => {
    showConfirm(
      `Disattivare modalità Kiosk su ${selectedDevices.size} dispositivi?`,
      () => executeBulkCommand('kiosk_off'),
      {
        title: 'Disattiva Kiosk',
        confirmText: 'Disattiva',
        type: 'info'
      }
    )
  }

  const handleBulkShutdown = () => {
    showConfirm(
      `ATTENZIONE: Spegnere ${selectedDevices.size} dispositivi? Richiederanno riavvio manuale.`,
      () => executeBulkCommand('shutdown'),
      {
        title: 'Spegnimento Multiplo',
        confirmText: 'Spegni Tutti',
        type: 'danger'
      }
    )
  }

  const handleBulkAppUpdate = () => {
    showConfirm(
      `Inviare aggiornamento app a ${selectedDevices.size} dispositivi?`,
      () => executeBulkCommand('update_app', { package: 'com.omnily.bridge' }),
      {
        title: 'Aggiornamento App',
        confirmText: 'Aggiorna',
        type: 'info'
      }
    )
  }

  const handleBulkConfigSync = () => {
    executeBulkCommand('sync_config')
  }

  const filteredDevices = devices.filter(device => {
    const matchesSearch =
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.store_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.organization?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      filterStatus === 'all' || device.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const stats = {
    total: devices.length,
    selected: selectedDevices.size,
    online: devices.filter(d => d.status === 'online').length,
    offline: devices.filter(d => d.status === 'offline').length
  }

  if (loading) {
    return <PageLoader message="Caricamento dispositivi..." size="medium" />
  }

  return (
    <div className="admin-dashboard" style={{ width: '100%', maxWidth: 'none', margin: 0, padding: 0 }}>
      {/* Header */}
      <div className="dashboard-header" style={{ padding: '1.5rem' }}>
        <div className="header-title-section">
          <h1>⚡ Operazioni Multiple</h1>
          <p>Gestisci più dispositivi contemporaneamente</p>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-stats" style={{ padding: '0 1.5rem 1.5rem' }}>
        <div className="stat-card">
          <CheckSquare size={20} />
          <div>
            <div className="stat-value">{stats.selected}</div>
            <div className="stat-label">Selezionati</div>
          </div>
        </div>
        <div className="stat-card">
          <Settings size={20} />
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
      </div>

      {/* Bulk Actions */}
      {selectedDevices.size > 0 && (
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: '#f0f9ff',
          border: '2px solid #0284c7',
          borderRadius: '8px',
          margin: '0 1.5rem 1.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ fontWeight: '600', color: '#0369a1' }}>
              {selectedDevices.size} dispositivo/i selezionato/i
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className="action-btn primary"
                onClick={handleBulkReboot}
                disabled={executing}
              >
                <RefreshCw size={14} />
                Riavvia Tutti
              </button>
              <button
                className="action-btn success"
                onClick={handleBulkKioskOn}
                disabled={executing}
              >
                <Lock size={14} />
                Kiosk ON
              </button>
              <button
                className="action-btn warning"
                onClick={handleBulkKioskOff}
                disabled={executing}
              >
                <Unlock size={14} />
                Kiosk OFF
              </button>
              <button
                className="action-btn secondary"
                onClick={handleBulkAppUpdate}
                disabled={executing}
              >
                <Download size={14} />
                Aggiorna App
              </button>
              <button
                className="action-btn secondary"
                onClick={handleBulkConfigSync}
                disabled={executing}
              >
                <Upload size={14} />
                Sync Config
              </button>
              <button
                className="action-btn danger"
                onClick={handleBulkShutdown}
                disabled={executing}
              >
                <Power size={14} />
                Spegni
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Selection */}
      <div style={{ padding: '0 1.5rem 1.5rem' }}>
        <div className="search-bar" style={{ marginBottom: '1rem' }}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Cerca dispositivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className="btn-secondary"
            onClick={toggleSelectAll}
          >
            {selectedDevices.size === filteredDevices.length ? (
              <>
                <Square size={16} />
                Deseleziona Tutti
              </>
            ) : (
              <>
                <CheckSquare size={16} />
                Seleziona Tutti
              </>
            )}
          </button>
          <button
            className="btn-secondary"
            onClick={() => selectByStatus('online')}
          >
            Seleziona Solo Online
          </button>
          <button
            className="btn-secondary"
            onClick={() => selectByStatus('offline')}
          >
            Seleziona Solo Offline
          </button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <button
              className={`btn-secondary ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              Tutti
            </button>
            <button
              className={`btn-secondary ${filterStatus === 'online' ? 'active' : ''}`}
              onClick={() => setFilterStatus('online')}
            >
              Online
            </button>
            <button
              className={`btn-secondary ${filterStatus === 'offline' ? 'active' : ''}`}
              onClick={() => setFilterStatus('offline')}
            >
              Offline
            </button>
          </div>
        </div>
      </div>

      {/* Device List */}
      <div style={{ padding: '0 1.5rem' }}>
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead style={{
              backgroundColor: '#f9fafb',
              borderBottom: '2px solid #e5e7eb'
            }}>
              <tr>
                <th style={{
                  padding: '0.75rem',
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  width: '40px'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedDevices.size === filteredDevices.length && filteredDevices.length > 0}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                  Dispositivo
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                  Organizzazione
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                  Ubicazione
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                  Status
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                  Batteria
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                  Kiosk
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map(device => (
                <tr
                  key={device.id}
                  style={{
                    borderBottom: '1px solid #e5e7eb',
                    backgroundColor: selectedDevices.has(device.id) ? '#f0f9ff' : '#fff',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleDeviceSelection(device.id)}
                >
                  <td style={{ padding: '0.75rem' }}>
                    <input
                      type="checkbox"
                      checked={selectedDevices.has(device.id)}
                      onChange={() => toggleDeviceSelection(device.id)}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', fontWeight: '500' }}>
                    {device.name}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    {device.organization?.name || 'N/A'}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    {device.store_location}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: device.status === 'online' ? '#d1fae5' : '#fee2e2',
                      color: device.status === 'online' ? '#065f46' : '#991b1b'
                    }}>
                      {device.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                    {device.battery_level || 0}%
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {device.kiosk_mode_active ? (
                      <Lock size={16} style={{ color: '#059669' }} />
                    ) : (
                      <Unlock size={16} style={{ color: '#6b7280' }} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredDevices.length === 0 && (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <AlertTriangle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem' }}>
                Nessun dispositivo trovato
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                Non ci sono dispositivi che corrispondono ai filtri selezionati
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Operations History */}
      <div style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
          📊 Storico Operazioni Multiple
        </h3>
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {bulkLogs.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                    Operazione
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                    Dispositivi
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                    Riusciti
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                    Falliti
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                    Data
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {bulkLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>
                      {log.operation_type}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                      {log.total_devices || '-'}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#059669' }}>
                      {log.successful}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#dc2626' }}>
                      {log.failed}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {new Date(log.started_at).toLocaleString('it-IT')}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: log.status === 'completed' ? '#d1fae5' : '#fef3c7',
                        color: log.status === 'completed' ? '#065f46' : '#92400e'
                      }}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
              Nessuna operazione multipla eseguita
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BulkOperations
