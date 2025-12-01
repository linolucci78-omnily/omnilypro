import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Users,
  User,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  MoreVertical,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe,
  CreditCard,
  Monitor
} from 'lucide-react'
import { organizationsApi } from '../lib/supabase'
import type { Organization } from '../lib/supabase'
import PageLoader from '../components/UI/PageLoader'
import EditOrganizationModal from '../components/EditOrganizationModal'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import { useToast } from '../contexts/ToastContext'
import './Admin.css'

const Admin: React.FC = () => {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [orgToView, setOrgToView] = useState<Organization | null>(null)

  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    try {
      setLoading(true)
      const data = await organizationsApi.getAllForAdmin()
      setOrganizations(data)
    } catch (error) {
      console.error('Error loading organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.phone?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'active' && org.is_active) ||
      (filterStatus === 'inactive' && !org.is_active)

    return matchesSearch && matchesFilter
  })

  const handleSelectOrg = (orgId: string) => {
    setSelectedOrgs(prev =>
      prev.includes(orgId)
        ? prev.filter(id => id !== orgId)
        : [...prev, orgId]
    )
  }

  const handleSelectAll = () => {
    setSelectedOrgs(
      selectedOrgs.length === filteredOrganizations.length
        ? []
        : filteredOrganizations.map(org => org.id)
    )
  }

  const handleEditOrganization = (org: Organization) => {
    setSelectedOrganization(org)
    setShowEditModal(true)
  }

  const handleSaveOrganization = async (id: string, data: Partial<Organization>) => {
    await organizationsApi.update(id, data)
    await loadOrganizations()
  }

  const handleDeleteOrganization = async (org: Organization) => {
    setOrgToDelete(org)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!orgToDelete) return

    try {
      await organizationsApi.delete(orgToDelete.id)
      await loadOrganizations()
      showSuccess('Azienda eliminata', `"${orgToDelete.name}" è stata eliminata con successo`)
    } catch (error) {
      console.error('Error deleting organization:', error)
      showError('Errore eliminazione', 'Si è verificato un errore durante l\'eliminazione dell\'azienda')
    }
  }

  const handleViewDetails = (org: Organization) => {
    setOrgToView(org)
    setShowDetailsModal(true)
  }

  const handleDeleteSelected = async () => {
    if (window.confirm(`Sei sicuro di voler eliminare ${selectedOrgs.length} organizzazioni?`)) {
      try {
        await organizationsApi.bulkDelete(selectedOrgs)
        setSelectedOrgs([])
        loadOrganizations()
      } catch (error) {
        console.error('Error deleting organizations:', error)
        alert('Errore durante l\'eliminazione delle organizzazioni')
      }
    }
  }

  const handleEnterDashboard = (org: Organization) => {
    // Salva l'organizzazione selezionata in localStorage
    localStorage.setItem('selectedOrganizationId', org.id)
    localStorage.setItem('selectedOrganizationName', org.name)
    localStorage.setItem('selectedOrganizationSlug', org.slug)

    // Apri la dashboard in una nuova tab
    window.open('/dashboard', '_blank')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT')
  }

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
        {isActive ? 'Attivo' : 'Inattivo'}
      </span>
    )
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div className="header-left">
          <Building2 size={32} />
          <div className="header-info">
            <h1>Amministrazione OMNILY PRO</h1>
            <p>Gestisci tutte le organizzazioni del sistema</p>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn-secondary">
            <Download size={18} />
            Esporta CSV
          </button>
          <button
            className="btn-primary"
            onClick={() => navigate('/admin/new-organization')}
          >
            <Plus size={18} />
            Nuova Azienda
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Building2 size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{organizations.length}</div>
            <div className="stat-label">Aziende Totali</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon active">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{organizations.filter(o => o.is_active).length}</div>
            <div className="stat-label">Aziende Attive</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <CreditCard size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{organizations.filter(o => o.pos_enabled).length}</div>
            <div className="stat-label">Con POS Attivo</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">
              {organizations.filter(o => {
                const created = new Date(o.created_at)
                const monthAgo = new Date()
                monthAgo.setMonth(monthAgo.getMonth() - 1)
                return created >= monthAgo
              }).length}
            </div>
            <div className="stat-label">Nuove (30gg)</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Cerca per nome, email o telefono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={18} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="all">Tutti</option>
            <option value="active">Solo Attivi</option>
            <option value="inactive">Solo Inattivi</option>
          </select>
        </div>

        {selectedOrgs.length > 0 && (
          <div className="selected-actions">
            <span>{selectedOrgs.length} selezionate</span>
            <button className="btn-danger" onClick={handleDeleteSelected}>
              <Trash2 size={16} />
              Elimina
            </button>
          </div>
        )}
      </div>

      {/* Organizations Table */}
      <div className="organizations-table-container">
        {loading ? (
          <PageLoader message="Caricamento organizzazioni..." size="medium" inline />
        ) : (
          <table className="organizations-table">
            <thead>
              <tr>
                <th>
                  <label className="table-checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={filteredOrganizations.length > 0 && selectedOrgs.length === filteredOrganizations.length}
                      onChange={handleSelectAll}
                    />
                  </label>
                </th>
                <th>Azienda</th>
                <th>Contatti</th>
                <th>Ubicazione</th>
                <th>POS</th>
                <th>Piano</th>
                <th>Utenti</th>
                <th>Clienti</th>
                <th>Ricavi</th>
                <th>Stato</th>
                <th>Creata</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrganizations.map(org => (
                <tr key={org.id} className={selectedOrgs.includes(org.id) ? 'selected' : ''}>
                  <td>
                    <label className="table-checkbox-wrapper">
                      <input
                        type="checkbox"
                        checked={selectedOrgs.includes(org.id)}
                        onChange={() => handleSelectOrg(org.id)}
                      />
                    </label>
                  </td>

                  <td>
                    <div className="org-info">
                      <div className="org-logo">
                        {org.logo_url ? (
                          <img src={org.logo_url} alt="Logo" />
                        ) : (
                          <div
                            className="logo-placeholder"
                            style={{ backgroundColor: org.primary_color }}
                          >
                            {org.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="org-details">
                        <div className="org-name">{org.name}</div>
                        <div className="org-type">{org.business_type}</div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="contact-info">
                      {org.email && (
                        <div className="contact-item">
                          <Mail size={14} />
                          <span>{org.email}</span>
                        </div>
                      )}
                      {org.phone && (
                        <div className="contact-item">
                          <Phone size={14} />
                          <span>{org.phone}</span>
                        </div>
                      )}
                      {org.website && (
                        <div className="contact-item">
                          <Globe size={14} />
                          <span>{org.website}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td>
                    <div className="location-info">
                      <MapPin size={14} />
                      <span>{org.address || 'Non specificato'}</span>
                    </div>
                  </td>

                  <td>
                    <div className="pos-info">
                      {org.pos_enabled ? (
                        <span className="pos-badge enabled">
                          <CreditCard size={12} />
                          {org.pos_model || 'Z108'}
                        </span>
                      ) : (
                        <span className="pos-badge disabled">Off</span>
                      )}
                    </div>
                  </td>

                  <td>
                    <div className="plan-info">
                      <span className={`plan-badge ${org.omnilypro_plans?.slug || org.plan_type || 'starter'}`}>
                        {org.omnilypro_plans?.name || (org.plan_type === 'pro' ? 'PRO' : org.plan_type === 'enterprise' ? 'ENT' : 'FREE')}
                      </span>
                    </div>
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <div className="users-count">
                      <Users size={12} />
                      <span>{org.user_count || 0}</span>
                    </div>
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <div className="users-count">
                      <User size={12} />
                      <span>{org.customer_count || 0}</span>
                    </div>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div className="revenue-info">
                      <span className="revenue-amount">
                        €{org.monthly_revenue ? org.monthly_revenue.toFixed(0) : '0'}
                      </span>
                      <span className="revenue-period">/mese</span>
                    </div>
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    {getStatusBadge(org.is_active)}
                  </td>

                  <td>
                    <div className="date-compact">
                      {new Date(org.created_at).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit'
                      })}
                    </div>
                  </td>

                  <td>
                    <div className="actions-menu">
                      <button
                        className="action-btn primary"
                        onClick={() => handleEnterDashboard(org)}
                        title="Accedi al Dashboard Azienda"
                      >
                        <Monitor size={16} />
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => handleViewDetails(org)}
                        title="Visualizza Dettagli"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => handleEditOrganization(org)}
                        title="Modifica Azienda"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="action-btn danger"
                        onClick={() => handleDeleteOrganization(org)}
                        title="Elimina Azienda"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filteredOrganizations.length === 0 && (
          <div className="empty-state">
            <Building2 size={48} />
            <h3>Nessuna organizzazione trovata</h3>
            <p>Non ci sono aziende che corrispondono ai tuoi filtri di ricerca.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <div className="pagination-info">
          Mostrando {filteredOrganizations.length} di {organizations.length} organizzazioni
        </div>
        <div className="pagination-controls">
          <button className="btn-secondary">Precedente</button>
          <span className="page-numbers">
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
          </span>
          <button className="btn-secondary">Successivo</button>
        </div>
      </div>

      {/* Edit Organization Modal */}
      <EditOrganizationModal
        isOpen={showEditModal}
        organization={selectedOrganization}
        onClose={() => {
          setShowEditModal(false)
          setSelectedOrganization(null)
        }}
        onSave={handleSaveOrganization}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setOrgToDelete(null)
        }}
        onConfirm={confirmDelete}
        itemName={orgToDelete?.name || ''}
        itemType="azienda"
      />

      {/* Organization Details Modal */}
      {showDetailsModal && orgToView && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
                Dettagli Organizzazione
              </h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false)
                  setOrgToView(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '0 8px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px', alignItems: 'start' }}>
                <span style={{ fontWeight: 600, color: '#666' }}>Nome:</span>
                <span style={{ color: '#1a1a1a' }}>{orgToView.name}</span>

                <span style={{ fontWeight: 600, color: '#666' }}>Slug:</span>
                <span style={{ color: '#1a1a1a', fontFamily: 'monospace' }}>{orgToView.slug}</span>

                <span style={{ fontWeight: 600, color: '#666' }}>Piano:</span>
                <span style={{ color: '#1a1a1a' }}>
                  {orgToView.omnilypro_plans?.name || 'Nessun Piano'}
                </span>

                <span style={{ fontWeight: 600, color: '#666' }}>Stato:</span>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: orgToView.is_active ? '#dcfce7' : '#fee2e2',
                  color: orgToView.is_active ? '#15803d' : '#b91c1c',
                  width: 'fit-content'
                }}>
                  {orgToView.is_active ? 'Attiva' : 'Inattiva'}
                </span>

                <span style={{ fontWeight: 600, color: '#666' }}>POS:</span>
                <span style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: orgToView.pos_enabled ? '#dbeafe' : '#f3f4f6',
                  color: orgToView.pos_enabled ? '#1e40af' : '#6b7280',
                  width: 'fit-content'
                }}>
                  {orgToView.pos_enabled ? `Attivo (${orgToView.pos_model || 'Standard'})` : 'Disattivato'}
                </span>

                {orgToView.email && (
                  <>
                    <span style={{ fontWeight: 600, color: '#666' }}>Email:</span>
                    <span style={{ color: '#1a1a1a' }}>{orgToView.email}</span>
                  </>
                )}

                {orgToView.phone && (
                  <>
                    <span style={{ fontWeight: 600, color: '#666' }}>Telefono:</span>
                    <span style={{ color: '#1a1a1a' }}>{orgToView.phone}</span>
                  </>
                )}

                {orgToView.website && (
                  <>
                    <span style={{ fontWeight: 600, color: '#666' }}>Sito Web:</span>
                    <span style={{ color: '#1a1a1a' }}>{orgToView.website}</span>
                  </>
                )}

                {orgToView.address && (
                  <>
                    <span style={{ fontWeight: 600, color: '#666' }}>Indirizzo:</span>
                    <span style={{ color: '#1a1a1a' }}>{orgToView.address}</span>
                  </>
                )}

                <span style={{ fontWeight: 600, color: '#666' }}>Utenti:</span>
                <span style={{ color: '#1a1a1a' }}>{orgToView.user_count || 0}</span>

                <span style={{ fontWeight: 600, color: '#666' }}>Clienti:</span>
                <span style={{ color: '#1a1a1a' }}>{orgToView.customer_count || 0}</span>

                <span style={{ fontWeight: 600, color: '#666' }}>Ricavi Mensili:</span>
                <span style={{ color: '#1a1a1a', fontWeight: 600 }}>
                  €{(orgToView.monthly_revenue || 0).toFixed(2)}
                </span>

                <span style={{ fontWeight: 600, color: '#666' }}>Creata il:</span>
                <span style={{ color: '#1a1a1a' }}>
                  {new Date(orgToView.created_at).toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                <button
                  onClick={() => handleEnterDashboard(orgToView)}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Monitor size={16} />
                  Accedi al Dashboard
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false)
                    setOrgToView(null)
                    handleEditOrganization(orgToView)
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: '#f3f4f6',
                    color: '#1a1a1a',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Edit size={16} />
                  Modifica
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin