import React, { useState, useEffect } from 'react'
import { X, Mail, Send, Settings, Eye, Database, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'
import './CardManagementPanel.css'

interface EmailLog {
  id: string
  organization_id: string | null
  template_type: string
  to_email: string
  to_name: string | null
  subject: string
  status: string
  error_message: string | null
  sent_at: string | null
  created_at: string
}

interface EmailMarketingPanelProps {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  organizationName: string
}

const EmailMarketingPanel: React.FC<EmailMarketingPanelProps> = ({
  isOpen,
  onClose,
  organizationId,
  organizationName
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'templates' | 'settings'>('logs')
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const { showError } = useToast()

  useEffect(() => {
    if (isOpen && organizationId) {
      loadEmailLogs()
    }
  }, [isOpen, organizationId])

  const loadEmailLogs = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Error loading email logs:', error)
      showError('Errore nel caricamento dei log email')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return '✅'
      case 'failed':
      case 'bounced':
        return '❌'
      case 'pending':
        return '⏳'
      default:
        return '📧'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredLogs = filterStatus === 'all'
    ? logs
    : logs.filter(log => log.status === filterStatus)

  const stats = {
    total: logs.length,
    sent: logs.filter(l => l.status === 'sent' || l.status === 'delivered').length,
    failed: logs.filter(l => l.status === 'failed' || l.status === 'bounced').length,
    pending: logs.filter(l => l.status === 'pending').length
  }

  if (!isOpen) return null

  return (
    <div className="slide-panel-overlay" onClick={onClose}>
      <div className="card-management-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="panel-header">
          <div className="panel-title">
            <Mail size={24} style={{ color: '#3b82f6' }} />
            <div>
              <h2>Email Marketing</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
                {organizationName}
              </p>
            </div>
          </div>
          <button className="panel-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="panel-tabs">
          <button
            className={`panel-tab ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <Database size={16} />
            Log Email
          </button>
          <button
            className={`panel-tab ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            <FileText size={16} />
            Template
          </button>
          <button
            className={`panel-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={16} />
            Impostazioni
          </button>
        </div>

        {/* Content */}
        <div className="panel-content">
          {activeTab === 'logs' && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>{stats.total}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Totale</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#d1fae5', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#065f46' }}>{stats.sent}</div>
                  <div style={{ fontSize: '12px', color: '#065f46' }}>Inviate</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#fee2e2', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#991b1b' }}>{stats.failed}</div>
                  <div style={{ fontSize: '12px', color: '#991b1b' }}>Fallite</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#92400e' }}>{stats.pending}</div>
                  <div style={{ fontSize: '12px', color: '#92400e' }}>In Attesa</div>
                </div>
              </div>

              {/* Filter */}
              <div style={{ marginBottom: '16px' }}>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">Tutti gli stati</option>
                  <option value="sent">Inviate</option>
                  <option value="delivered">Consegnate</option>
                  <option value="failed">Fallite</option>
                  <option value="bounced">Rimbalzate</option>
                  <option value="pending">In Attesa</option>
                </select>
              </div>

              {/* Logs List */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    Caricamento...
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    <Mail size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
                    <p style={{ margin: 0 }}>Nessuna email trovata</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        style={{
                          padding: '12px',
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827', marginBottom: '4px' }}>
                              {getStatusIcon(log.status)} {log.to_name || log.to_email}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              {log.to_email}
                            </div>
                          </div>
                          <div style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'right' }}>
                            {formatDate(log.sent_at || log.created_at)}
                          </div>
                        </div>
                        <div style={{ fontSize: '13px', color: '#374151', marginBottom: '4px' }}>
                          <strong>Oggetto:</strong> {log.subject}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          <strong>Template:</strong> {log.template_type}
                        </div>
                        {log.error_message && (
                          <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px', padding: '8px', backgroundColor: '#fee2e2', borderRadius: '4px' }}>
                            ❌ {log.error_message}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
              <FileText size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                Template Email
              </h3>
              <p style={{ margin: 0, fontSize: '14px' }}>
                Funzionalità in arrivo - personalizza i tuoi template email
              </p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
              <Settings size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                Impostazioni Email
              </h3>
              <p style={{ margin: 0, fontSize: '14px' }}>
                Funzionalità in arrivo - configura logo, colori e branding
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmailMarketingPanel
