import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  Users, 
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
  CreditCard
} from 'lucide-react'
import { organizationsApi } from '../lib/supabase'
import type { Organization } from '../lib/supabase'
import './Admin.css'

const Admin: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([])

  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    try {
      setLoading(true)
      const data = await organizationsApi.getAll()
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
          <button className="btn-primary">
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
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Caricamento organizzazioni...</p>
          </div>
        ) : (
          <table className="organizations-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedOrgs.length === filteredOrganizations.length && filteredOrganizations.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Azienda</th>
                <th>Contatti</th>
                <th>Ubicazione</th>
                <th>POS</th>
                <th>Piano</th>
                <th>Utenti</th>
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
                    <input
                      type="checkbox"
                      checked={selectedOrgs.includes(org.id)}
                      onChange={() => handleSelectOrg(org.id)}
                    />
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
                      <span className={`plan-badge ${org.plan_type}`}>
                        {org.plan_type === 'pro' ? 'PRO' : org.plan_type === 'enterprise' ? 'ENT' : 'FREE'}
                      </span>
                    </div>
                  </td>
                  
                  <td style={{ textAlign: 'center' }}>
                    <div className="users-count">
                      <Users size={12} />
                      <span>{Math.floor(Math.random() * 8) + 1}</span>
                    </div>
                  </td>
                  
                  <td style={{ textAlign: 'right' }}>
                    <div className="revenue-info">
                      <span className="revenue-amount">
                        €{(Math.random() * 2000 + 500).toFixed(0)}
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
                      <button className="action-btn">
                        <Eye size={16} />
                      </button>
                      <button className="action-btn">
                        <Edit size={16} />
                      </button>
                      <button className="action-btn danger">
                        <Trash2 size={16} />
                      </button>
                      <button className="action-btn">
                        <MoreVertical size={16} />
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
    </div>
  )
}

export default Admin