import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Package,
  Download,
  Upload,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Clock,
  Smartphone,
  RefreshCw,
  Settings,
  Eye
} from 'lucide-react'
import { useToast } from '../../hooks/useToast'
import { useConfirm } from '../../hooks/useConfirm'
import PageLoader from '../UI/PageLoader'
import './AdminLayout.css'

interface App {
  id: string
  package_name: string
  app_name: string
  version_name: string
  version_code: number
  apk_url: string
  apk_size_mb: number
  is_mandatory: boolean
  rollout_percentage: number
  is_active: boolean
  install_count: number
  upload_date: string
  release_notes?: string
  apk_checksum?: string
}

interface Device {
  id: string
  name: string
  organization_id: string
  store_location: string
  status: 'online' | 'offline' | 'setup' | 'maintenance'
  current_app_package?: string
  current_app_version?: string
  organization?: {
    name: string
  }
}

interface PushCampaign {
  id: string
  app_id: string
  target_devices: number
  completed_devices: number
  failed_devices: number
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed'
  started_at: string
  completed_at?: string
  rollout_speed: 'slow' | 'medium' | 'fast'
  app?: App
}

const AppPushUpdate: React.FC = () => {
  const [apps, setApps] = useState<App[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [campaigns, setCampaigns] = useState<PushCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<App | null>(null)
  const [showPushModal, setShowPushModal] = useState(false)
  const { showSuccess, showError, showWarning } = useToast()
  const { showConfirm } = useConfirm()

  const [pushForm, setPushForm] = useState({
    target: 'all' as 'all' | 'organization' | 'specific',
    organization_id: '',
    device_ids: [] as string[],
    rollout_speed: 'medium' as 'slow' | 'medium' | 'fast',
    is_mandatory: false,
    schedule_type: 'immediate' as 'immediate' | 'scheduled',
    scheduled_time: ''
  })

  useEffect(() => {
    loadApps()
    loadDevices()
    loadCampaigns()

    // Auto-refresh campaigns every 30 seconds
    const interval = setInterval(loadCampaigns, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadApps = async () => {
    try {
      const { data, error } = await supabase
        .from('app_repository')
        .select('*')
        .eq('is_active', true)
        .order('upload_date', { ascending: false })

      if (error) throw error
      setApps(data || [])
    } catch (error) {
      console.error('Error loading apps:', error)
      showError('Errore nel caricamento delle app')
    }
  }

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
    } finally {
      setLoading(false)
    }
  }

  const loadCampaigns = async () => {
    try {
      // Load recent push campaigns from activity logs
      const { data, error } = await supabase
        .from('mdm_activity_logs')
        .select('*')
        .ilike('activity_type', 'app_push%')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      // Transform to campaigns (simplified)
      const campaignsData = (data || []).map(log => ({
        id: log.id,
        app_id: log.device_id || '',
        target_devices: 1,
        completed_devices: log.success ? 1 : 0,
        failed_devices: log.success ? 0 : 1,
        status: 'completed' as const,
        started_at: log.created_at,
        completed_at: log.created_at,
        rollout_speed: 'medium' as const
      }))

      setCampaigns(campaignsData)
    } catch (error) {
      console.error('Error loading campaigns:', error)
    }
  }

  const handleStartPush = async () => {
    if (!selectedApp) {
      showError('Seleziona un\'app')
      return
    }

    // Determine target devices
    let targetDevices: Device[] = []
    if (pushForm.target === 'all') {
      targetDevices = devices.filter(d => d.status === 'online')
    } else if (pushForm.target === 'organization') {
      if (!pushForm.organization_id) {
        showWarning('Seleziona un\'organizzazione')
        return
      }
      targetDevices = devices.filter(d =>
        d.status === 'online' && d.organization_id === pushForm.organization_id
      )
    } else if (pushForm.target === 'specific') {
      if (pushForm.device_ids.length === 0) {
        showWarning('Seleziona almeno un dispositivo')
        return
      }
      targetDevices = devices.filter(d =>
        d.status === 'online' && pushForm.device_ids.includes(d.id)
      )
    }

    if (targetDevices.length === 0) {
      showError('Nessun dispositivo online trovato per i criteri selezionati')
      return
    }

    showConfirm(
      `Avviare push update di "${selectedApp.app_name}" v${selectedApp.version_name} su ${targetDevices.length} dispositivi?`,
      async () => {
        try {
          // Create commands for each device
          const commands = targetDevices.map(device => ({
            device_id: device.id,
            command_type: 'update_app',
            command_title: `Update: ${selectedApp.app_name} v${selectedApp.version_name}`,
            payload: {
              package_name: selectedApp.package_name,
              apk_url: selectedApp.apk_url,
              apk_checksum: selectedApp.apk_checksum || '',
              version_code: selectedApp.version_code,
              version_name: selectedApp.version_name,
              is_mandatory: pushForm.is_mandatory
            },
            status: 'pending',
            scheduled_for: pushForm.schedule_type === 'scheduled' ? pushForm.scheduled_time : null
          }))

          const { error } = await supabase
            .from('device_commands')
            .insert(commands)

          if (error) throw error

          // Log campaign
          await supabase
            .from('mdm_activity_logs')
            .insert([{
              activity_type: 'app_push_campaign',
              activity_title: `App Push: ${selectedApp.app_name}`,
              activity_description: `Started push update for ${targetDevices.length} devices`,
              success: true,
              device_id: null,
              organization_id: pushForm.organization_id || null
            }])

          showSuccess(`Push update avviato su ${targetDevices.length} dispositivi`)
          setShowPushModal(false)
          resetPushForm()
          loadCampaigns()

        } catch (error) {
          console.error('Error starting push:', error)
          showError('Errore durante l\'avvio del push update')
        }
      },
      {
        title: 'Avvia Push Update',
        confirmText: 'Avvia',
        type: 'info'
      }
    )
  }

  const resetPushForm = () => {
    setPushForm({
      target: 'all',
      organization_id: '',
      device_ids: [],
      rollout_speed: 'medium',
      is_mandatory: false,
      schedule_type: 'immediate',
      scheduled_time: ''
    })
    setSelectedApp(null)
  }

  const getRolloutSpeedLabel = (speed: string) => {
    switch (speed) {
      case 'slow': return '🐢 Lento (10 dev/5min)'
      case 'medium': return '🚶 Medio (25 dev/5min)'
      case 'fast': return '🏃 Veloce (50 dev/5min)'
      default: return speed
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return { bg: '#d1fae5', color: '#065f46' }
      case 'running': return { bg: '#dbeafe', color: '#1e40af' }
      case 'paused': return { bg: '#fef3c7', color: '#92400e' }
      case 'failed': return { bg: '#fee2e2', color: '#991b1b' }
      default: return { bg: '#f3f4f6', color: '#374151' }
    }
  }

  const stats = {
    totalApps: apps.length,
    activeDevices: devices.filter(d => d.status === 'online').length,
    runningCampaigns: campaigns.filter(c => c.status === 'running').length,
    completedToday: campaigns.filter(c => {
      const today = new Date().toDateString()
      return new Date(c.started_at).toDateString() === today && c.status === 'completed'
    }).length
  }

  if (loading) {
    return <PageLoader message="Caricamento app push..." size="medium" />
  }

  return (
    <div className="admin-dashboard" style={{ width: '100%', maxWidth: 'none', margin: 0, padding: 0 }}>
      {/* Header */}
      <div className="dashboard-header" style={{ padding: '1.5rem' }}>
        <div className="header-title-section">
          <h1>📲 App Push Update</h1>
          <p>Gestione aggiornamenti automatici applicazioni</p>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-stats" style={{ padding: '0 1.5rem 1.5rem' }}>
        <div className="stat-card">
          <Package size={20} />
          <div>
            <div className="stat-value">{stats.totalApps}</div>
            <div className="stat-label">App Disponibili</div>
          </div>
        </div>
        <div className="stat-card online">
          <Smartphone size={20} />
          <div>
            <div className="stat-value">{stats.activeDevices}</div>
            <div className="stat-label">Dispositivi Online</div>
          </div>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#dbeafe' }}>
          <TrendingUp size={20} style={{ color: '#1e40af' }} />
          <div>
            <div className="stat-value">{stats.runningCampaigns}</div>
            <div className="stat-label">Push Attivi</div>
          </div>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#d1fae5' }}>
          <CheckCircle size={20} style={{ color: '#065f46' }} />
          <div>
            <div className="stat-value">{stats.completedToday}</div>
            <div className="stat-label">Completati Oggi</div>
          </div>
        </div>
      </div>

      {/* Available Apps */}
      <div style={{ padding: '0 1.5rem 1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
          📦 App Disponibili per Push
        </h3>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
          {apps.map(app => (
            <div
              key={app.id}
              style={{
                backgroundColor: '#fff',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: '600' }}>
                    {app.app_name}
                  </h4>
                  <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: '#6b7280', fontFamily: 'monospace' }}>
                    {app.package_name}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af'
                    }}>
                      v{app.version_name} ({app.version_code})
                    </span>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: '#f3f4f6',
                      color: '#374151'
                    }}>
                      {app.apk_size_mb || 'N/A'} MB
                    </span>
                    {app.is_mandatory && (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: '#fee2e2',
                        color: '#991b1b'
                      }}>
                        Obbligatorio
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                    📊 Rollout: {app.rollout_percentage}% • Installazioni: {app.install_count}
                  </div>
                  {app.release_notes && (
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.4' }}>
                      {app.release_notes}
                    </p>
                  )}
                </div>
              </div>
              <button
                className="btn-primary"
                onClick={() => {
                  setSelectedApp(app)
                  setShowPushModal(true)
                }}
                style={{ marginTop: '1rem', width: '100%' }}
              >
                <Upload size={16} />
                Avvia Push Update
              </button>
            </div>
          ))}
        </div>

        {apps.length === 0 && (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '2px dashed #e5e7eb'
          }}>
            <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.5, color: '#6b7280' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem' }}>
              Nessuna app disponibile
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
              Carica app nel Repository App per iniziare
            </p>
          </div>
        )}
      </div>

      {/* Push Campaigns History */}
      <div style={{ padding: '0 1.5rem 1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
          📊 Storico Push Campaign
        </h3>
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {campaigns.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                    App
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                    Target
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                    Completati
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                    Falliti
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                    Progress
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                    Data Inizio
                  </th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', fontSize: '0.875rem' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(campaign => {
                  const progress = campaign.target_devices > 0
                    ? Math.round(((campaign.completed_devices + campaign.failed_devices) / campaign.target_devices) * 100)
                    : 0
                  const colors = getStatusColor(campaign.status)

                  return (
                    <tr key={campaign.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem', fontWeight: '500' }}>
                        {campaign.app?.app_name || 'App Push'}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                        {campaign.target_devices}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#059669' }}>
                        {campaign.completed_devices}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#dc2626' }}>
                        {campaign.failed_devices}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{
                          width: '100px',
                          height: '8px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '9999px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${progress}%`,
                            height: '100%',
                            backgroundColor: '#3b82f6',
                            transition: 'width 0.3s'
                          }} />
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {new Date(campaign.started_at).toLocaleString('it-IT')}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: colors.bg,
                          color: colors.color
                        }}>
                          {campaign.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
              Nessuna campagna push eseguita
            </div>
          )}
        </div>
      </div>

      {/* Push Modal */}
      {showPushModal && selectedApp && (
        <div className="device-modal-overlay" onClick={() => setShowPushModal(false)}>
          <div className="device-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🚀 Configura Push Update</h2>
              <button className="close-btn" onClick={() => setShowPushModal(false)}>×</button>
            </div>

            <div className="modal-content">
              <div style={{
                padding: '1rem',
                backgroundColor: '#f0f9ff',
                border: '1px solid #0284c7',
                borderRadius: '8px',
                marginBottom: '1.5rem'
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0369a1' }}>
                  {selectedApp.app_name} v{selectedApp.version_name}
                </h4>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#0369a1' }}>
                  {selectedApp.package_name} • {selectedApp.apk_size_mb || 'N/A'} MB
                </p>
              </div>

              <div className="add-device-form">
                <div className="form-section">
                  <h4>🎯 Target Dispositivi</h4>
                  <div className="form-row">
                    <label>
                      <input
                        type="radio"
                        checked={pushForm.target === 'all'}
                        onChange={() => setPushForm({ ...pushForm, target: 'all' })}
                      />
                      Tutti i dispositivi online ({devices.filter(d => d.status === 'online').length})
                    </label>
                  </div>
                  <div className="form-row">
                    <label>
                      <input
                        type="radio"
                        checked={pushForm.target === 'organization'}
                        onChange={() => setPushForm({ ...pushForm, target: 'organization' })}
                      />
                      Per organizzazione
                    </label>
                  </div>
                  {pushForm.target === 'organization' && (
                    <div className="form-row" style={{ marginLeft: '2rem' }}>
                      <select
                        value={pushForm.organization_id}
                        onChange={(e) => setPushForm({ ...pushForm, organization_id: e.target.value })}
                      >
                        <option value="">Seleziona organizzazione...</option>
                        {Array.from(new Set(devices.map(d => d.organization_id))).map(orgId => {
                          const org = devices.find(d => d.organization_id === orgId)?.organization
                          return (
                            <option key={orgId} value={orgId}>
                              {org?.name || orgId}
                            </option>
                          )
                        })}
                      </select>
                    </div>
                  )}
                  <div className="form-row">
                    <label>
                      <input
                        type="radio"
                        checked={pushForm.target === 'specific'}
                        onChange={() => setPushForm({ ...pushForm, target: 'specific', device_ids: [] })}
                      />
                      Dispositivi specifici
                    </label>
                  </div>
                  {pushForm.target === 'specific' && (
                    <div style={{ marginLeft: '2rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '0.5rem' }}>
                      {devices.filter(d => d.status === 'online').map(device => (
                        <div key={device.id} className="form-row" style={{ marginBottom: '0.5rem' }}>
                          <label>
                            <input
                              type="checkbox"
                              checked={pushForm.device_ids.includes(device.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setPushForm({ ...pushForm, device_ids: [...pushForm.device_ids, device.id] })
                                } else {
                                  setPushForm({ ...pushForm, device_ids: pushForm.device_ids.filter(id => id !== device.id) })
                                }
                              }}
                            />
                            {device.name} ({device.store_location || 'N/A'})
                          </label>
                        </div>
                      ))}
                      {devices.filter(d => d.status === 'online').length === 0 && (
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                          Nessun dispositivo online disponibile
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="form-section">
                  <h4>⚡ Velocità Rollout</h4>
                  <div className="form-row">
                    <select
                      value={pushForm.rollout_speed}
                      onChange={(e) => setPushForm({ ...pushForm, rollout_speed: e.target.value as any })}
                    >
                      <option value="slow">{getRolloutSpeedLabel('slow')}</option>
                      <option value="medium">{getRolloutSpeedLabel('medium')}</option>
                      <option value="fast">{getRolloutSpeedLabel('fast')}</option>
                    </select>
                  </div>
                </div>

                <div className="form-section">
                  <h4>⚙️ Opzioni</h4>
                  <div className="form-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={pushForm.is_mandatory}
                        onChange={(e) => setPushForm({ ...pushForm, is_mandatory: e.target.checked })}
                      />
                      Aggiornamento obbligatorio
                    </label>
                  </div>
                </div>

                <div className="form-section">
                  <h4>📅 Programmazione</h4>
                  <div className="form-row">
                    <label>
                      <input
                        type="radio"
                        checked={pushForm.schedule_type === 'immediate'}
                        onChange={() => setPushForm({ ...pushForm, schedule_type: 'immediate' })}
                      />
                      Immediato
                    </label>
                  </div>
                  <div className="form-row">
                    <label>
                      <input
                        type="radio"
                        checked={pushForm.schedule_type === 'scheduled'}
                        onChange={() => setPushForm({ ...pushForm, schedule_type: 'scheduled' })}
                      />
                      Programmato
                    </label>
                  </div>
                  {pushForm.schedule_type === 'scheduled' && (
                    <div className="form-row" style={{ marginLeft: '2rem' }}>
                      <input
                        type="datetime-local"
                        value={pushForm.scheduled_time}
                        onChange={(e) => setPushForm({ ...pushForm, scheduled_time: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="action-btn secondary"
                  onClick={() => {
                    setShowPushModal(false)
                    resetPushForm()
                  }}
                >
                  Annulla
                </button>
                <button
                  className="action-btn success"
                  onClick={handleStartPush}
                >
                  <Play size={16} />
                  Avvia Push Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppPushUpdate
