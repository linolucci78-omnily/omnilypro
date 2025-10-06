import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Calendar,
  Clock,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Smartphone,
  AlertTriangle
} from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import { useConfirm } from '../../hooks/useConfirm'
import Toast from '../UI/Toast'
import ConfirmModal from '../UI/ConfirmModal'
import PageLoader from '../UI/PageLoader'
import './AdminLayout.css'

interface ScheduledCommand {
  id: string
  device_id: string
  command_type: string
  command_title?: string
  payload?: any
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled'
  scheduled_for: string
  started_at?: string
  completed_at?: string
  error_message?: string
  created_at: string
  // Joined
  device?: {
    name: string
    status: string
  }
}

interface Device {
  id: string
  name: string
  status: string
}

const CommandScheduler: React.FC = () => {
  const [scheduledCommands, setScheduledCommands] = useState<ScheduledCommand[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'failed'>('pending')
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast()
  const { confirmState, showConfirm, hideConfirm, handleConfirm } = useConfirm()

  const [scheduleForm, setScheduleForm] = useState({
    device_id: '',
    command_type: 'reboot',
    scheduled_date: '',
    scheduled_time: '',
    command_title: ''
  })

  useEffect(() => {
    loadScheduledCommands()
    loadDevices()

    // Auto-refresh ogni 30 secondi
    const interval = setInterval(loadScheduledCommands, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadScheduledCommands = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('device_commands')
        .select(`
          *,
          device:devices(name, status)
        `)
        .not('scheduled_for', 'is', null)
        .order('scheduled_for', { ascending: true })
        .limit(200)

      if (error) throw error
      setScheduledCommands(data || [])
    } catch (error) {
      console.error('Error loading scheduled commands:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('id, name, status')
        .order('name')

      if (error) throw error
      setDevices(data || [])
    } catch (error) {
      console.error('Error loading devices:', error)
    }
  }

  const handleScheduleCommand = async () => {
    if (!scheduleForm.device_id || !scheduleForm.scheduled_date || !scheduleForm.scheduled_time) {
      showWarning('Compila tutti i campi obbligatori')
      return
    }

    try {
      const scheduledFor = new Date(`${scheduleForm.scheduled_date}T${scheduleForm.scheduled_time}:00`)

      if (scheduledFor <= new Date()) {
        showError('La data/ora deve essere nel futuro')
        return
      }

      const { error } = await supabase
        .from('device_commands')
        .insert([{
          device_id: scheduleForm.device_id,
          command_type: scheduleForm.command_type,
          command_title: scheduleForm.command_title || `Scheduled ${scheduleForm.command_type}`,
          status: 'pending',
          scheduled_for: scheduledFor.toISOString()
        }])

      if (error) throw error

      showSuccess('Comando programmato con successo')
      setShowScheduleModal(false)
      resetForm()
      loadScheduledCommands()
    } catch (error: any) {
      console.error('Error scheduling command:', error)
      showError(error.message || 'Errore nella programmazione del comando')
    }
  }

  const handleCancelCommand = async (commandId: string) => {
    showConfirm(
      'Sei sicuro di voler cancellare questo comando programmato?',
      async () => {
        try {
          const { error } = await supabase
            .from('device_commands')
            .update({ status: 'cancelled' })
            .eq('id', commandId)

          if (error) throw error
          showSuccess('Comando cancellato')
          loadScheduledCommands()
        } catch (error) {
          console.error('Error cancelling command:', error)
          showError('Errore nella cancellazione')
        }
      },
      {
        title: 'Cancella Comando',
        confirmText: 'Cancella',
        type: 'danger'
      }
    )
  }

  const handleExecuteNow = async (command: ScheduledCommand) => {
    showConfirm(
      'Vuoi eseguire questo comando immediatamente invece di aspettare l\'orario programmato?',
      async () => {
        try {
          const { error } = await supabase
            .from('device_commands')
            .update({
              scheduled_for: new Date().toISOString(),
              status: 'pending'
            })
            .eq('id', command.id)

          if (error) throw error
          showSuccess('Comando in esecuzione')
          loadScheduledCommands()
        } catch (error) {
          console.error('Error executing command:', error)
          showError('Errore nell\'esecuzione')
        }
      },
      {
        title: 'Esegui Ora',
        confirmText: 'Esegui',
        type: 'warning'
      }
    )
  }

  const resetForm = () => {
    setScheduleForm({
      device_id: '',
      command_type: 'reboot',
      scheduled_date: '',
      scheduled_time: '',
      command_title: ''
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const getTimeUntil = (scheduledFor: string) => {
    const now = new Date().getTime()
    const scheduled = new Date(scheduledFor).getTime()
    const diff = scheduled - now

    if (diff <= 0) return 'Scaduto'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      return `${Math.floor(hours / 24)}g ${hours % 24}h`
    }
    return `${hours}h ${minutes}m`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="status-icon" size={16} style={{ color: '#f59e0b' }} />
      case 'executing': return <RefreshCw className="status-icon" size={16} style={{ color: '#3b82f6' }} />
      case 'completed': return <CheckCircle className="status-icon" size={16} style={{ color: '#10b981' }} />
      case 'failed': return <XCircle className="status-icon" size={16} style={{ color: '#ef4444' }} />
      case 'cancelled': return <XCircle className="status-icon" size={16} style={{ color: '#6b7280' }} />
      default: return <Clock className="status-icon" size={16} />
    }
  }

  const filteredCommands = scheduledCommands.filter(cmd => {
    const matchesSearch =
      cmd.device?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmd.command_type.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'pending' && cmd.status === 'pending') ||
      (filterStatus === 'completed' && cmd.status === 'completed') ||
      (filterStatus === 'failed' && cmd.status === 'failed')

    return matchesSearch && matchesFilter
  })

  const stats = {
    total: scheduledCommands.length,
    pending: scheduledCommands.filter(c => c.status === 'pending').length,
    completed: scheduledCommands.filter(c => c.status === 'completed').length,
    failed: scheduledCommands.filter(c => c.status === 'failed').length
  }

  if (loading) {
    return <PageLoader message="Caricamento comandi programmati..." size="medium" />
  }

  return (
    <div className="admin-dashboard" style={{ width: '100%', maxWidth: 'none', margin: 0, padding: 0 }}>
      {/* Header */}
      <div className="dashboard-header" style={{ padding: '1.5rem' }}>
        <div className="header-title-section">
          <h1>📅 Comandi Programmati</h1>
          <p>Programma comandi per esecuzione futura</p>
        </div>
        <button className="btn-primary" onClick={() => setShowScheduleModal(true)}>
          <Calendar size={20} />
          Programma Comando
        </button>
      </div>

      {/* Stats */}
      <div className="dashboard-stats" style={{ padding: '0 1.5rem 1.5rem' }}>
        <div className="stat-card">
          <Calendar size={20} />
          <div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Totali</div>
          </div>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#fef3c7' }}>
          <Clock size={20} style={{ color: '#f59e0b' }} />
          <div>
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">In Attesa</div>
          </div>
        </div>
        <div className="stat-card online">
          <CheckCircle size={20} />
          <div>
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completati</div>
          </div>
        </div>
        <div className="stat-card offline">
          <XCircle size={20} />
          <div>
            <div className="stat-value">{stats.failed}</div>
            <div className="stat-label">Falliti</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: '0 1.5rem 1.5rem' }}>
        <div className="search-bar" style={{ marginBottom: '1rem' }}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Cerca per dispositivo o comando..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn-secondary ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            Tutti
          </button>
          <button
            className={`btn-secondary ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            In Attesa
          </button>
          <button
            className={`btn-secondary ${filterStatus === 'completed' ? 'active' : ''}`}
            onClick={() => setFilterStatus('completed')}
          >
            Completati
          </button>
          <button
            className={`btn-secondary ${filterStatus === 'failed' ? 'active' : ''}`}
            onClick={() => setFilterStatus('failed')}
          >
            Falliti
          </button>
        </div>
      </div>

      {/* Commands Grid */}
      <div className="devices-grid" style={{ padding: '0 1.5rem' }}>
        {filteredCommands.map(cmd => (
          <div key={cmd.id} className="device-card">
            <div className="device-header">
              <div className="device-info">
                <h3>{cmd.command_title || cmd.command_type}</h3>
                {cmd.device && (
                  <p className="organization">
                    <Smartphone size={14} />
                    {cmd.device.name}
                  </p>
                )}
                <p className="location">
                  <Calendar size={14} />
                  {formatDateTime(cmd.scheduled_for)}
                </p>
              </div>
              <div className="device-status">
                {getStatusIcon(cmd.status)}
                <span className="status-text">{cmd.status}</span>
              </div>
            </div>

            <div className="device-metrics">
              <div className="metric">
                <Clock size={16} />
                <span>{cmd.status === 'pending' ? `Tra ${getTimeUntil(cmd.scheduled_for)}` : 'Eseguito'}</span>
              </div>
            </div>

            {cmd.error_message && (
              <div style={{
                padding: '0.5rem',
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                borderRadius: '6px',
                fontSize: '0.85rem',
                marginTop: '0.5rem'
              }}>
                <AlertTriangle size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                {cmd.error_message}
              </div>
            )}

            <div className="device-actions" style={{ marginTop: '1rem' }}>
              {cmd.status === 'pending' && (
                <>
                  <button
                    className="action-btn success"
                    onClick={() => handleExecuteNow(cmd)}
                  >
                    <Play size={14} />
                    Esegui Ora
                  </button>
                  <button
                    className="action-btn danger"
                    onClick={() => handleCancelCommand(cmd.id)}
                  >
                    <Trash2 size={14} />
                    Cancella
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredCommands.length === 0 && (
        <div className="no-devices" style={{ margin: '2rem 0' }}>
          <Calendar size={48} />
          <h3>Nessun comando programmato</h3>
          <p>Non ci sono comandi programmati che corrispondono ai filtri.</p>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="device-modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="device-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📅 Programma Nuovo Comando</h2>
              <button className="close-btn" onClick={() => setShowScheduleModal(false)}>×</button>
            </div>

            <div className="modal-content">
              <div className="add-device-form">
                <div className="form-section">
                  <h4>🎯 Comando</h4>
                  <div className="form-row">
                    <label>Dispositivo:</label>
                    <select
                      value={scheduleForm.device_id}
                      onChange={(e) => setScheduleForm({...scheduleForm, device_id: e.target.value})}
                    >
                      <option value="">Seleziona dispositivo...</option>
                      {devices.map(device => (
                        <option key={device.id} value={device.id}>
                          {device.name} ({device.status})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Tipo Comando:</label>
                    <select
                      value={scheduleForm.command_type}
                      onChange={(e) => setScheduleForm({...scheduleForm, command_type: e.target.value})}
                    >
                      <option value="reboot">Riavvio</option>
                      <option value="shutdown">Spegnimento</option>
                      <option value="kiosk_on">Attiva Kiosk</option>
                      <option value="kiosk_off">Disattiva Kiosk</option>
                      <option value="update_app">Aggiorna App</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <label>Titolo (opzionale):</label>
                    <input
                      type="text"
                      value={scheduleForm.command_title}
                      onChange={(e) => setScheduleForm({...scheduleForm, command_title: e.target.value})}
                      placeholder="es. Manutenzione notturna"
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h4>⏰ Programmazione</h4>
                  <div className="form-row">
                    <label>Data:</label>
                    <input
                      type="date"
                      value={scheduleForm.scheduled_date}
                      onChange={(e) => setScheduleForm({...scheduleForm, scheduled_date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="form-row">
                    <label>Ora:</label>
                    <input
                      type="time"
                      value={scheduleForm.scheduled_time}
                      onChange={(e) => setScheduleForm({...scheduleForm, scheduled_time: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button className="action-btn secondary" onClick={() => setShowScheduleModal(false)}>
                  Annulla
                </button>
                <button className="action-btn success" onClick={handleScheduleCommand}>
                  <Calendar size={16} />
                  Programma Comando
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

export default CommandScheduler
