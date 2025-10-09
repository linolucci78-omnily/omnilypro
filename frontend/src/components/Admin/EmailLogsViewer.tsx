import React, { useState, useEffect } from 'react'
import { Mail, CheckCircle, XCircle, Clock, Eye, RefreshCw, Filter } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../hooks/useToast'

interface EmailLog {
  id: string
  organization_id: string | null
  template_type: string
  to_email: string
  to_name: string | null
  subject: string
  from_email: string
  status: string
  resend_email_id: string | null
  error_message: string | null
  sent_at: string | null
  created_at: string
  organizations?: {
    name: string
  }
}

const EmailLogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<EmailLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const { showError } = useToast()

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [logs, filterStatus, searchTerm])

  const loadLogs = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*, organizations(name)')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      setLogs(data || [])
    } catch (error) {
      console.error('Error loading logs:', error)
      showError('Errore nel caricamento dei log')
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...logs]

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(log => log.status === filterStatus)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(log =>
        log.to_email.toLowerCase().includes(term) ||
        log.subject.toLowerCase().includes(term) ||
        (log.to_name && log.to_name.toLowerCase().includes(term))
      )
    }

    setFilteredLogs(filtered)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle size={16} style={{ color: '#10b981' }} />
      case 'failed':
      case 'bounced':
        return <XCircle size={16} style={{ color: '#ef4444' }} />
      case 'pending':
        return <Clock size={16} style={{ color: '#f59e0b' }} />
      default:
        return <Mail size={16} style={{ color: '#6b7280' }} />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      sent: { bg: '#d1fae5', text: '#065f46' },
      delivered: { bg: '#d1fae5', text: '#065f46' },
      failed: { bg: '#fee2e2', text: '#991b1b' },
      bounced: { bg: '#fee2e2', text: '#991b1b' },
      pending: { bg: '#fef3c7', text: '#92400e' },
      opened: { bg: '#dbeafe', text: '#1e40af' },
      clicked: { bg: '#e0e7ff', text: '#3730a3' }
    }

    const color = colors[status as keyof typeof colors] || { bg: '#f3f4f6', text: '#374151' }

    return (
      <span style={{
        padding: '4px 8px',
        backgroundColor: color.bg,
        color: color.text,
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '500'
      }}>
        {status.toUpperCase()}
      </span>
    )
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

  // Stats
  const stats = {
    total: logs.length,
    sent: logs.filter(l => l.status === 'sent' || l.status === 'delivered').length,
    failed: logs.filter(l => l.status === 'failed' || l.status === 'bounced').length,
    pending: logs.filter(l => l.status === 'pending').length
  }

  if (isLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p style={{ color: '#6b7280' }}>Caricamento log...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Mail size={24} style={{ color: '#3b82f6' }} />
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            Log Email Inviate
          </h3>
        </div>
        <button
          onClick={loadLogs}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            color: '#374151'
          }}
        >
          <RefreshCw size={16} />
          Aggiorna
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Totale</div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>{stats.total}</div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '12px', color: '#065f46', marginBottom: '4px' }}>Inviate</div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#065f46' }}>{stats.sent}</div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
          <div style={{ fontSize: '12px', color: '#991b1b', marginBottom: '4px' }}>Fallite</div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#991b1b' }}>{stats.failed}</div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
          <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '4px' }}>In Attesa</div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#92400e' }}>{stats.pending}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Cerca per email, nome o oggetto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '10px 12px',
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

      {/* Table */}
      {filteredLogs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <Mail size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
          <p style={{ margin: 0 }}>Nessun log trovato</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Stato
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Destinatario
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Oggetto
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Tipo
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Data
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getStatusIcon(log.status)}
                      {getStatusBadge(log.status)}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontSize: '14px', color: '#111827', fontWeight: '500' }}>
                      {log.to_name || log.to_email}
                    </div>
                    {log.to_name && (
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{log.to_email}</div>
                    )}
                    {log.organizations && (
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                        {log.organizations.name}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontSize: '14px', color: '#374151' }}>{log.subject}</div>
                    {log.error_message && (
                      <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                        ❌ {log.error_message}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {log.template_type}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#6b7280' }}>
                    {formatDate(log.sent_at || log.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default EmailLogsViewer
