import React, { useState, useEffect } from 'react'
import { demoRequestsApi, DemoRequest } from '../../services/demoRequestService'
import {
  Users, Mail, Phone, Building2, Clock, DollarSign, Target,
  CheckCircle2, XCircle, AlertCircle, Calendar, Eye, MessageSquare,
  Filter, Search, Download, RefreshCw
} from 'lucide-react'
import './DemoRequestsDashboard.css'

const DemoRequestsDashboard: React.FC = () => {
  const [requests, setRequests] = useState<DemoRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<DemoRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<DemoRequest | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    contacted: 0,
    approved: 0,
    converted: 0
  })

  useEffect(() => {
    fetchRequests()
    fetchStats()
  }, [])

  useEffect(() => {
    filterRequests()
  }, [requests, statusFilter, searchQuery])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const data = await demoRequestsApi.getAll()
      setRequests(data)
    } catch (error) {
      console.error('Error fetching demo requests:', error)
      alert('Errore nel caricamento delle richieste')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const data = await demoRequestsApi.getStats()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const filterRequests = () => {
    let filtered = requests

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(req =>
        req.company_name?.toLowerCase().includes(query) ||
        req.contact_name?.toLowerCase().includes(query) ||
        req.contact_email?.toLowerCase().includes(query) ||
        req.industry?.toLowerCase().includes(query)
      )
    }

    setFilteredRequests(filtered)
  }

  const handleStatusChange = async (id: string, newStatus: any, notes?: string) => {
    try {
      await demoRequestsApi.updateStatus(id, newStatus, notes)
      await fetchRequests()
      await fetchStats()
      alert('Stato aggiornato con successo!')
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Errore nell\'aggiornamento dello stato')
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'status-pending'
      case 'contacted': return 'status-contacted'
      case 'approved': return 'status-approved'
      case 'converted': return 'status-converted'
      case 'rejected': return 'status-rejected'
      default: return 'status-pending'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} />
      case 'contacted': return <MessageSquare size={16} />
      case 'approved': return <CheckCircle2 size={16} />
      case 'converted': return <CheckCircle2 size={16} />
      case 'rejected': return <XCircle size={16} />
      default: return <AlertCircle size={16} />
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const exportToCSV = () => {
    const headers = ['Company', 'Contact', 'Email', 'Phone', 'Industry', 'Status', 'Created']
    const rows = filteredRequests.map(req => [
      req.company_name,
      req.contact_name,
      req.contact_email,
      req.contact_phone,
      req.industry || '',
      req.status || '',
      formatDate(req.created_at)
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `demo-requests-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="demo-requests-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Richieste Demo</h1>
          <p>Gestisci le richieste di demo dai potenziali clienti</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchRequests} className="btn-refresh">
            <RefreshCw size={18} />
            Aggiorna
          </button>
          <button onClick={exportToCSV} className="btn-export">
            <Download size={18} />
            Esporta CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon">
            <Users />
          </div>
          <div className="stat-content">
            <p className="stat-label">Totale Richieste</p>
            <p className="stat-value">{stats.total}</p>
          </div>
        </div>

        <div className="stat-card stat-pending">
          <div className="stat-icon">
            <Clock />
          </div>
          <div className="stat-content">
            <p className="stat-label">In Attesa</p>
            <p className="stat-value">{stats.pending}</p>
          </div>
        </div>

        <div className="stat-card stat-contacted">
          <div className="stat-icon">
            <MessageSquare />
          </div>
          <div className="stat-content">
            <p className="stat-label">Contattati</p>
            <p className="stat-value">{stats.contacted}</p>
          </div>
        </div>

        <div className="stat-card stat-converted">
          <div className="stat-icon">
            <CheckCircle2 />
          </div>
          <div className="stat-content">
            <p className="stat-label">Convertiti</p>
            <p className="stat-value">{stats.converted}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Cerca per azienda, nome, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          <button
            className={statusFilter === 'all' ? 'active' : ''}
            onClick={() => setStatusFilter('all')}
          >
            Tutti ({stats.total})
          </button>
          <button
            className={statusFilter === 'pending' ? 'active' : ''}
            onClick={() => setStatusFilter('pending')}
          >
            In Attesa ({stats.pending})
          </button>
          <button
            className={statusFilter === 'contacted' ? 'active' : ''}
            onClick={() => setStatusFilter('contacted')}
          >
            Contattati ({stats.contacted})
          </button>
          <button
            className={statusFilter === 'approved' ? 'active' : ''}
            onClick={() => setStatusFilter('approved')}
          >
            Approvati ({stats.approved})
          </button>
          <button
            className={statusFilter === 'converted' ? 'active' : ''}
            onClick={() => setStatusFilter('converted')}
          >
            Convertiti ({stats.converted})
          </button>
        </div>
      </div>

      {/* Requests Table */}
      {loading ? (
        <div className="loading-state">
          <RefreshCw className="spin" size={32} />
          <p>Caricamento richieste...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <h3>Nessuna richiesta trovata</h3>
          <p>Le richieste demo appariranno qui quando i clienti compileranno il form</p>
        </div>
      ) : (
        <div className="requests-table">
          <table>
            <thead>
              <tr>
                <th>Azienda</th>
                <th>Contatto</th>
                <th>Settore</th>
                <th>Sedi</th>
                <th>Budget</th>
                <th>Timeline</th>
                <th>Stato</th>
                <th>Data</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(request => (
                <tr key={request.id}>
                  <td>
                    <div className="company-cell">
                      <Building2 size={16} />
                      <strong>{request.company_name}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="contact-cell">
                      <div>{request.contact_name}</div>
                      <div className="contact-email">{request.contact_email}</div>
                      <div className="contact-phone">{request.contact_phone}</div>
                    </div>
                  </td>
                  <td>{request.industry || 'N/A'}</td>
                  <td>{request.locations_count || 'N/A'}</td>
                  <td>{request.budget_range || 'N/A'}</td>
                  <td>
                    {request.timeline === 'immediately' && '⚡ Immediato'}
                    {request.timeline === '1-month' && '📅 1 mese'}
                    {request.timeline === '1-3-months' && '📆 1-3 mesi'}
                    {request.timeline === 'exploring' && '🔍 Esplorando'}
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      {request.status || 'pending'}
                    </span>
                  </td>
                  <td>{formatDate(request.created_at)}</td>
                  <td>
                    <button
                      className="btn-view"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <Eye size={16} />
                      Dettagli
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedRequest.company_name}</h2>
              <button className="btn-close" onClick={() => setSelectedRequest(null)}>×</button>
            </div>

            <div className="modal-body">
              {/* Company Info */}
              <div className="detail-section">
                <h3>Informazioni Azienda</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Nome Azienda:</strong>
                    <span>{selectedRequest.company_name}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Sito Web:</strong>
                    <a href={selectedRequest.website} target="_blank" rel="noopener noreferrer">
                      {selectedRequest.website}
                    </a>
                  </div>
                  <div className="detail-item">
                    <strong>Settore:</strong>
                    <span>{selectedRequest.industry}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Dipendenti:</strong>
                    <span>{selectedRequest.employees_count}</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="detail-section">
                <h3>Informazioni Contatto</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Nome:</strong>
                    <span>{selectedRequest.contact_name}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Email:</strong>
                    <a href={`mailto:${selectedRequest.contact_email}`}>
                      {selectedRequest.contact_email}
                    </a>
                  </div>
                  <div className="detail-item">
                    <strong>Telefono:</strong>
                    <a href={`tel:${selectedRequest.contact_phone}`}>
                      {selectedRequest.contact_phone}
                    </a>
                  </div>
                  <div className="detail-item">
                    <strong>Ruolo:</strong>
                    <span>{selectedRequest.contact_role}</span>
                  </div>
                </div>
              </div>

              {/* Business Info */}
              <div className="detail-section">
                <h3>Dettagli Business</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Punti Vendita:</strong>
                    <span>{selectedRequest.locations_count}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Città:</strong>
                    <span>{selectedRequest.locations_cities || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <strong>POS Esistente:</strong>
                    <span>{selectedRequest.existing_pos}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Sistema POS:</strong>
                    <span>{selectedRequest.existing_pos_name || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Programma Fedeltà:</strong>
                    <span>{selectedRequest.has_loyalty_program}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Clienti Attivi:</strong>
                    <span>{selectedRequest.active_customers_count}</span>
                  </div>
                </div>
              </div>

              {/* Goals */}
              {selectedRequest.goals && selectedRequest.goals.length > 0 && (
                <div className="detail-section">
                  <h3>Obiettivi</h3>
                  <div className="goals-list">
                    {selectedRequest.goals.map((goal, index) => (
                      <span key={index} className="goal-badge">{goal}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline & Budget */}
              <div className="detail-section">
                <h3>Timeline & Budget</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Timeline:</strong>
                    <span>{selectedRequest.timeline}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Budget:</strong>
                    <span>{selectedRequest.budget_range}</span>
                  </div>
                </div>
              </div>

              {/* Status Management */}
              <div className="detail-section">
                <h3>Gestione Stato</h3>
                <div className="status-actions">
                  <button
                    className="btn-status btn-contacted"
                    onClick={() => handleStatusChange(selectedRequest.id!, 'contacted')}
                  >
                    <MessageSquare size={16} />
                    Contattato
                  </button>
                  <button
                    className="btn-status btn-approved"
                    onClick={() => handleStatusChange(selectedRequest.id!, 'approved')}
                  >
                    <CheckCircle2 size={16} />
                    Approvato
                  </button>
                  <button
                    className="btn-status btn-converted"
                    onClick={() => handleStatusChange(selectedRequest.id!, 'converted')}
                  >
                    <CheckCircle2 size={16} />
                    Convertito
                  </button>
                  <button
                    className="btn-status btn-rejected"
                    onClick={() => handleStatusChange(selectedRequest.id!, 'rejected')}
                  >
                    <XCircle size={16} />
                    Rifiutato
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DemoRequestsDashboard
