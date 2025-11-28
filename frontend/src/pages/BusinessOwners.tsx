import React, { useState, useEffect } from 'react'
import {
  Building2,
  Users,
  User,
  Search,
  Filter,
  Plus,
  Download,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Phone,
  Mail,
  Globe,
  CreditCard,
  TrendingUp,
  UserPlus,
  MoreVertical,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  Shield,
  Zap,
  X,
  FileText,
  History,
  Ban,
  RefreshCw,
  Key,
  Settings,
  Save
} from 'lucide-react'
import PageLoader from '../components/UI/PageLoader'
import './BusinessOwners.css'
import '../components/EditOrganizationModal.css'
import InviteBusinessModal from '../components/InviteBusinessModal'
import ChangePlanModal from '../components/Admin/ChangePlanModal'
import SuspendAccountModal from '../components/Admin/SuspendAccountModal'
import AccountHistoryModal from '../components/Admin/AccountHistoryModal'
import { businessOwnerService } from '../services/businessOwnerService'
import { useToast } from '../contexts/ToastContext'

interface BusinessOwner {
  id: string
  name: string
  email: string
  phone?: string
  company: string
  businessType: string
  planType: 'free' | 'pro' | 'enterprise'
  planStatus: 'active' | 'trial' | 'expired' | 'cancelled'
  joinDate: string
  lastLogin?: string
  monthlyRevenue: number
  totalCustomers: number
  posEnabled: boolean
  supportTickets: number
  website?: string
  address?: string
  vatNumber?: string
  nextBilling?: string
}

const BusinessOwners: React.FC = () => {
  const toast = useToast()
  const [owners, setOwners] = useState<BusinessOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPlan, setFilterPlan] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedOwners, setSelectedOwners] = useState<string[]>([])

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState<string | null>(null)
  const [selectedOwner, setSelectedOwner] = useState<BusinessOwner | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)

  // New modal states
  const [showChangePlanModal, setShowChangePlanModal] = useState(false)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  // Mock data per demo - proprietari aziende che usano OMNILY PRO
  const mockOwners: BusinessOwner[] = [
    {
      id: '1',
      name: 'Mario Lombardi',
      email: 'mario@pizzeriadamario.it',
      phone: '+39 347 123 4567',
      company: 'Pizzeria Da Mario',
      businessType: 'Ristorazione',
      planType: 'pro',
      planStatus: 'active',
      joinDate: '2023-01-15',
      lastLogin: '2024-01-10',
      monthlyRevenue: 149.99,
      totalCustomers: 342,
      posEnabled: true,
      supportTickets: 2,
      website: 'pizzeriadamario.it',
      address: 'Via Roma 15, Milano',
      vatNumber: 'IT12345678901',
      nextBilling: '2024-02-15'
    },
    {
      id: '2',
      name: 'Anna Centrale',
      email: 'anna@barcentral.it',
      phone: '+39 342 987 6543',
      company: 'Bar Central',
      businessType: 'Bar/Caffetteria',
      planType: 'free',
      planStatus: 'active',
      joinDate: '2023-06-22',
      lastLogin: '2024-01-08',
      monthlyRevenue: 0,
      totalCustomers: 156,
      posEnabled: false,
      supportTickets: 0,
      website: 'barcentral.mi',
      address: 'Corso Buenos Aires 88, Milano'
    },
    {
      id: '3',
      name: 'Giuseppe Freddi',
      email: 'info@gelateriafreddi.it',
      phone: '+39 351 456 7890',
      company: 'Gelateria Freddi',
      businessType: 'Gelateria',
      planType: 'enterprise',
      planStatus: 'active',
      joinDate: '2023-03-10',
      lastLogin: '2024-01-05',
      monthlyRevenue: 299.99,
      totalCustomers: 578,
      posEnabled: true,
      supportTickets: 1,
      website: 'gelateriafreddi.com',
      address: 'Navigli 22, Milano',
      vatNumber: 'IT98765432109',
      nextBilling: '2024-02-10'
    },
    {
      id: '4',
      name: 'Carla Bella',
      email: 'carla@bellavista.it',
      phone: '+39 348 321 0987',
      company: 'Ristorante Bella Vista',
      businessType: 'Ristorante',
      planType: 'pro',
      planStatus: 'trial',
      joinDate: '2023-12-18',
      lastLogin: '2023-12-20',
      monthlyRevenue: 0,
      totalCustomers: 45,
      posEnabled: false,
      supportTickets: 3,
      website: 'bellavista.it',
      address: 'Via Torino 45, Milano',
      nextBilling: '2024-01-18'
    }
  ]

  useEffect(() => {
    loadOwners()
  }, [])

  const loadOwners = async () => {
    try {
      setLoading(true)
      setTimeout(() => {
        setOwners(mockOwners)
        setLoading(false)
      }, 800)
    } catch (error) {
      console.error('Error loading business owners:', error)
      setLoading(false)
    }
  }

  const filteredOwners = owners.filter(owner => {
    const matchesSearch = owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         owner.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         owner.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesPlan = filterPlan === 'all' || owner.planType === filterPlan
    const matchesStatus = filterStatus === 'all' || owner.planStatus === filterStatus
    
    return matchesSearch && matchesPlan && matchesStatus
  })

  const handleSelectOwner = (ownerId: string) => {
    setSelectedOwners(prev => 
      prev.includes(ownerId) 
        ? prev.filter(id => id !== ownerId)
        : [...prev, ownerId]
    )
  }

  const handleSelectAll = () => {
    setSelectedOwners(
      selectedOwners.length === filteredOwners.length
        ? []
        : filteredOwners.map(owner => owner.id)
    )
  }

  // Action handlers
  const handleViewDetails = (owner: BusinessOwner) => {
    setSelectedOwner(owner)
    setShowDetailsModal(true)
  }

  const handleEdit = (owner: BusinessOwner) => {
    setSelectedOwner(owner)
    setShowEditModal(true)
  }

  const handleManagePermissions = (owner: BusinessOwner) => {
    setSelectedOwner(owner)
    setShowPermissionsModal(true)
  }

  const handleSendEmail = (owner: BusinessOwner) => {
    setSelectedOwner(owner)
    setShowEmailModal(true)
  }

  const handleToggleMoreMenu = (ownerId: string) => {
    setShowMoreMenu(showMoreMenu === ownerId ? null : ownerId)
  }

  const handleChangePlan = (owner: BusinessOwner) => {
    setSelectedOwner(owner)
    setShowChangePlanModal(true)
    setShowMoreMenu(null)
  }

  const handleChangePlanConfirm = async (newPlan: 'free' | 'pro' | 'enterprise') => {
    if (!selectedOwner) return

    try {
      await businessOwnerService.changePlan(selectedOwner.id, newPlan, 'Admin')
      toast.success(`Piano cambiato con successo a ${newPlan.toUpperCase()}`)

      // Aggiorna localmente
      setOwners(prev => prev.map(o =>
        o.id === selectedOwner.id ? { ...o, planType: newPlan } : o
      ))
    } catch (error: any) {
      toast.error(error.message || 'Errore durante il cambio piano')
    }
  }

  const handleSuspendAccount = (owner: BusinessOwner) => {
    setSelectedOwner(owner)
    setShowSuspendModal(true)
    setShowMoreMenu(null)
  }

  const handleSuspendAccountConfirm = async (reason: string, duration?: 'temporary' | 'permanent') => {
    if (!selectedOwner) return

    try {
      await businessOwnerService.suspendAccount(selectedOwner.id, reason, duration || 'temporary', 'Admin')
      toast.success(`Account di ${selectedOwner.company} sospeso con successo`)

      // Aggiorna localmente
      setOwners(prev => prev.map(o =>
        o.id === selectedOwner.id ? { ...o, planStatus: 'cancelled' as any } : o
      ))
    } catch (error: any) {
      toast.error(error.message || 'Errore durante la sospensione')
    }
  }

  const handleExportData = (owner: BusinessOwner) => {
    try {
      const csvContent = businessOwnerService.exportToCSV(owner)
      const filename = `${owner.company.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`
      businessOwnerService.downloadCSV(csvContent, filename)
      toast.success(`Dati di ${owner.company} esportati con successo`)
    } catch (error) {
      toast.error('Errore durante l\'esportazione')
    }
    setShowMoreMenu(null)
  }

  const handleViewHistory = (owner: BusinessOwner) => {
    setSelectedOwner(owner)
    setShowHistoryModal(true)
    setShowMoreMenu(null)
  }

  const handleResetPassword = async (owner: BusinessOwner) => {
    if (window.confirm(`Inviare email di reset password a ${owner.email}?`)) {
      try {
        await businessOwnerService.sendPasswordReset(owner.email)
        toast.success(`Email di reset inviata a ${owner.email}`)
      } catch (error: any) {
        toast.error(error.message || 'Errore durante l\'invio email')
      }
      setShowMoreMenu(null)
    }
  }

  const getPlanBadge = (planType: string) => {
    const planConfig = {
      free: { label: 'FREE', color: '#6b7280', bg: '#f3f4f6' },
      pro: { label: 'PRO', color: '#3b82f6', bg: '#dbeafe' },
      enterprise: { label: 'ENTERPRISE', color: '#8b5cf6', bg: '#ede9fe' }
    }
    const config = planConfig[planType as keyof typeof planConfig]
    
    return (
      <span 
        className="plan-badge"
        style={{ 
          backgroundColor: config.bg,
          color: config.color
        }}
      >
        {config.label}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Attivo', color: '#16a34a', bg: '#dcfce7', icon: CheckCircle2 },
      trial: { label: 'Trial', color: '#d97706', bg: '#fef3c7', icon: Clock },
      expired: { label: 'Scaduto', color: '#dc2626', bg: '#fee2e2', icon: AlertCircle },
      cancelled: { label: 'Cancellato', color: '#6b7280', bg: '#f3f4f6', icon: AlertCircle }
    }
    const config = statusConfig[status as keyof typeof statusConfig]
    const IconComponent = config.icon
    
    return (
      <span 
        className="status-badge"
        style={{ 
          backgroundColor: config.bg,
          color: config.color
        }}
      >
        <IconComponent size={12} />
        {config.label}
      </span>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT')
  }

  const getOwnerStats = () => {
    return {
      total: owners.length,
      active: owners.filter(o => o.planStatus === 'active').length,
      trial: owners.filter(o => o.planStatus === 'trial').length,
      totalRevenue: owners.reduce((sum, o) => sum + o.monthlyRevenue, 0),
      totalCustomers: owners.reduce((sum, o) => sum + o.totalCustomers, 0),
      supportTickets: owners.reduce((sum, o) => sum + o.supportTickets, 0),
      posEnabled: owners.filter(o => o.posEnabled).length
    }
  }

  const stats = getOwnerStats()

  return (
    <div className="business-owners">
      {/* Page Header */}
      <div className="owners-header">
        <div className="header-left">
          <Building2 size={32} />
          <div className="header-info">
            <h1>Clienti Aziendali</h1>
            <p>Gestisci i clienti business che usano OMNILY PRO</p>
          </div>
        </div>
        
        <div className="header-actions">
          <button className="btn-secondary">
            <Download size={18} />
            Esporta Report
          </button>
          <button className="btn-primary">
            <UserPlus size={18} />
            Invita Azienda
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="owners-stats-grid">
        <div className="stat-card primary">
          <div className="stat-header">
            <div className="stat-icon">
              <Building2 size={24} />
            </div>
            <div className="stat-trend positive">
              <TrendingUp size={16} />
              +{stats.trial}
            </div>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Aziende Totali</div>
            <div className="stat-detail">{stats.active} attive, {stats.trial} in trial</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-header">
            <div className="stat-icon">
              <DollarSign size={24} />
            </div>
            <div className="stat-badge">MRR</div>
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
            <div className="stat-label">Ricavi Mensili</div>
            <div className="stat-detail">{formatCurrency(stats.totalRevenue * 12)} annui</div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-header">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-badge">TOTAL</div>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalCustomers.toLocaleString()}</div>
            <div className="stat-label">Clienti Finali</div>
            <div className="stat-detail">Tutti i programmi fedeltà</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-header">
            <div className="stat-icon">
              <AlertCircle size={24} />
            </div>
            <div className="stat-badge">SUPPORT</div>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.supportTickets}</div>
            <div className="stat-label">Ticket Aperti</div>
            <div className="stat-detail">{stats.posEnabled} con POS attivo</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="owners-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Cerca per nome, azienda o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-group">
          <Filter size={18} />
          <select 
            value={filterPlan} 
            onChange={(e) => setFilterPlan(e.target.value)}
          >
            <option value="all">Tutti i Piani</option>
            <option value="free">FREE</option>
            <option value="pro">PRO</option>
            <option value="enterprise">ENTERPRISE</option>
          </select>
          
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tutti gli Stati</option>
            <option value="active">Attivi</option>
            <option value="trial">In Trial</option>
            <option value="expired">Scaduti</option>
            <option value="cancelled">Cancellati</option>
          </select>
        </div>
        
        {selectedOwners.length > 0 && (
          <div className="selected-actions">
            <span>{selectedOwners.length} selezionati</span>
            <button className="btn-secondary">
              <Mail size={16} />
              Email
            </button>
            <button className="btn-secondary">
              <Edit size={16} />
              Modifica Piano
            </button>
            <button className="btn-danger">
              <Trash2 size={16} />
              Sospendi
            </button>
          </div>
        )}
      </div>

      {/* Owners Table */}
      <div className="owners-table-container">
        {loading ? (
          <PageLoader message="Caricamento proprietari aziendali..." size="medium" inline />
        ) : (
          <table className="owners-table">
            <thead>
              <tr>
                <th>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={selectedOwners.length === filteredOwners.length && filteredOwners.length > 0}
                      onChange={handleSelectAll}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </th>
                <th>Proprietario</th>
                <th>Azienda</th>
                <th>Contatti</th>
                <th>Piano</th>
                <th>Stato</th>
                <th>Clienti</th>
                <th>Ricavi</th>
                <th>Support</th>
                <th>Ultimo Login</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredOwners.map(owner => (
                <tr key={owner.id} className={selectedOwners.includes(owner.id) ? 'selected' : ''}>
                  <td>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={selectedOwners.includes(owner.id)}
                        onChange={() => handleSelectOwner(owner.id)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  
                  <td>
                    <div className="owner-info">
                      <div className="owner-avatar">
                        {owner.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="owner-details">
                        <div className="owner-name">{owner.name}</div>
                        <div className="owner-joined">
                          Cliente dal {formatDate(owner.joinDate)}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td>
                    <div className="business-info">
                      <div className="business-name">{owner.company}</div>
                      <div className="business-type">{owner.businessType}</div>
                    </div>
                  </td>
                  
                  <td>
                    <div className="contact-info">
                      <div className="contact-item">
                        <Mail size={14} />
                        <span>{owner.email}</span>
                      </div>
                      {owner.phone && (
                        <div className="contact-item">
                          <Phone size={14} />
                          <span>{owner.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td>
                    {getPlanBadge(owner.planType)}
                  </td>
                  
                  <td>
                    {getStatusBadge(owner.planStatus)}
                  </td>
                  
                  <td>
                    <div className="customers-count">
                      <Users size={16} />
                      <span>{owner.totalCustomers.toLocaleString()}</span>
                    </div>
                  </td>
                  
                  <td>
                    <div className="revenue-info">
                      <span className="revenue-amount">
                        {formatCurrency(owner.monthlyRevenue)}
                      </span>
                      <span className="revenue-period">/mese</span>
                    </div>
                  </td>
                  
                  <td style={{ textAlign: 'center' }}>
                    <div className={`support-tickets ${owner.supportTickets > 0 ? 'has-tickets' : ''}`}>
                      {owner.supportTickets > 0 ? (
                        <span className="ticket-count">{owner.supportTickets}</span>
                      ) : (
                        <CheckCircle2 size={16} color="#16a34a" />
                      )}
                    </div>
                  </td>
                  
                  <td>
                    <div className="last-login">
                      {owner.lastLogin ? (
                        <>
                          <Clock size={14} />
                          <span>{formatDate(owner.lastLogin)}</span>
                        </>
                      ) : (
                        <span className="no-login">Mai</span>
                      )}
                    </div>
                  </td>
                  
                  <td>
                    <div className="actions-menu">
                      <button
                        className="action-btn"
                        onClick={() => handleViewDetails(owner)}
                        title="Visualizza Dettagli"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => handleEdit(owner)}
                        title="Modifica Organizzazione"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => handleManagePermissions(owner)}
                        title="Gestisci Permessi"
                      >
                        <Shield size={16} />
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => handleSendEmail(owner)}
                        title="Invia Email"
                      >
                        <Mail size={16} />
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => handleToggleMoreMenu(owner.id)}
                        title="Altre Azioni"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* More Actions Dropdown */}
                      {showMoreMenu === owner.id && (
                        <div className="more-actions-dropdown">
                          <button onClick={() => handleChangePlan(owner, 'pro')}>
                            <Zap size={16} />
                            Cambia Piano
                          </button>
                          <button onClick={() => handleViewHistory(owner)}>
                            <History size={16} />
                            Storico Attività
                          </button>
                          <button onClick={() => handleExportData(owner)}>
                            <Download size={16} />
                            Esporta Dati
                          </button>
                          <button onClick={() => handleResetPassword(owner)}>
                            <Key size={16} />
                            Reset Password
                          </button>
                          <button
                            onClick={() => handleSuspendAccount(owner)}
                            className="danger"
                          >
                            <Ban size={16} />
                            Sospendi Account
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {!loading && filteredOwners.length === 0 && (
          <div className="empty-state">
            <Building2 size={64} />
            <h3>Nessun proprietario trovato</h3>
            <p>Non ci sono proprietari che corrispondono ai tuoi filtri di ricerca.</p>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {showDetailsModal && selectedOwner && (
        <>
          <div className="edit-org-overlay" onClick={() => setShowDetailsModal(false)} />
          <div className="edit-org-modal">
            {/* Header */}
            <div className="edit-org-header">
              <div className="edit-org-header-content">
                <Building2 size={24} />
                <div>
                  <h2>Dettagli Organizzazione</h2>
                  <p>{selectedOwner.company}</p>
                </div>
              </div>
              <button className="edit-org-close-btn" onClick={() => setShowDetailsModal(false)}>
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="edit-org-content">
              <div className="details-grid">
                <div className="detail-section">
                  <h3><Users size={18} /> Proprietario</h3>
                  <div className="detail-row">
                    <span className="detail-label">Nome:</span>
                    <span className="detail-value">{selectedOwner.name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedOwner.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Telefono:</span>
                    <span className="detail-value">{selectedOwner.phone || 'N/A'}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3><Building2 size={18} /> Azienda</h3>
                  <div className="detail-row">
                    <span className="detail-label">Nome:</span>
                    <span className="detail-value">{selectedOwner.company}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Tipo:</span>
                    <span className="detail-value">{selectedOwner.businessType}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Indirizzo:</span>
                    <span className="detail-value">{selectedOwner.address || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">P.IVA:</span>
                    <span className="detail-value">{selectedOwner.vatNumber || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Sito Web:</span>
                    <span className="detail-value">{selectedOwner.website || 'N/A'}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3><CreditCard size={18} /> Piano & Fatturazione</h3>
                  <div className="detail-row">
                    <span className="detail-label">Piano:</span>
                    <span className="detail-value">{getPlanBadge(selectedOwner.planType)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Stato:</span>
                    <span className="detail-value">{getStatusBadge(selectedOwner.planStatus)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Ricavi:</span>
                    <span className="detail-value">{formatCurrency(selectedOwner.monthlyRevenue)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Prossima Fattura:</span>
                    <span className="detail-value">{selectedOwner.nextBilling ? formatDate(selectedOwner.nextBilling) : 'N/A'}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3><TrendingUp size={18} /> Statistiche</h3>
                  <div className="detail-row">
                    <span className="detail-label">Clienti:</span>
                    <span className="detail-value">{selectedOwner.totalCustomers.toLocaleString()}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">POS:</span>
                    <span className="detail-value">{selectedOwner.posEnabled ? 'Attivo' : 'Non attivo'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Ticket:</span>
                    <span className="detail-value">{selectedOwner.supportTickets}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Iscrizione:</span>
                    <span className="detail-value">{formatDate(selectedOwner.joinDate)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Ultimo Login:</span>
                    <span className="detail-value">{selectedOwner.lastLogin ? formatDate(selectedOwner.lastLogin) : 'Mai'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="edit-org-footer">
              <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>
                Chiudi
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedOwner && (
        <>
          <div className="edit-org-overlay" onClick={() => setShowEditModal(false)} />
          <div className="edit-org-modal">
            {/* Header */}
            <div className="edit-org-header">
              <div className="edit-org-header-content">
                <Edit size={24} />
                <div>
                  <h2>Modifica Organizzazione</h2>
                  <p>{selectedOwner.company}</p>
                </div>
              </div>
              <button className="edit-org-close-btn" onClick={() => setShowEditModal(false)}>
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="edit-org-content">
              <form className="edit-form">
                <div className="form-group">
                  <label className="form-label">
                    <User size={16} />
                    Nome Proprietario
                  </label>
                  <input type="text" defaultValue={selectedOwner.name} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <Mail size={16} />
                    Email
                  </label>
                  <input type="email" defaultValue={selectedOwner.email} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <Phone size={16} />
                    Telefono
                  </label>
                  <input type="tel" defaultValue={selectedOwner.phone} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <Building2 size={16} />
                    Nome Azienda
                  </label>
                  <input type="text" defaultValue={selectedOwner.company} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <Zap size={16} />
                    Tipo di Business
                  </label>
                  <input type="text" defaultValue={selectedOwner.businessType} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <CreditCard size={16} />
                    Piano
                  </label>
                  <select defaultValue={selectedOwner.planType} className="form-select">
                    <option value="free">FREE</option>
                    <option value="pro">PRO</option>
                    <option value="enterprise">ENTERPRISE</option>
                  </select>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="edit-org-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                Annulla
              </button>
              <button type="submit" className="btn-primary">
                <Save size={18} />
                Salva Modifiche
              </button>
            </div>
          </div>
        </>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedOwner && (
        <>
          <div className="edit-org-overlay" onClick={() => setShowPermissionsModal(false)} />
          <div className="edit-org-modal">
            {/* Header */}
            <div className="edit-org-header">
              <div className="edit-org-header-content">
                <Shield size={24} />
                <div>
                  <h2>Gestisci Permessi</h2>
                  <p>{selectedOwner.company}</p>
                </div>
              </div>
              <button className="edit-org-close-btn" onClick={() => setShowPermissionsModal(false)}>
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="edit-org-content">
              <div className="permissions-list">
                <div className="permission-item">
                  <div className="permission-info">
                    <Shield size={20} />
                    <div>
                      <h4>Accesso POS</h4>
                      <p>Abilita/disabilita l'accesso al sistema POS</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked={selectedOwner.posEnabled} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="permission-item">
                  <div className="permission-info">
                    <Users size={20} />
                    <div>
                      <h4>Gestione Utenti</h4>
                      <p>Consenti di aggiungere/rimuovere utenti</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked={true} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="permission-item">
                  <div className="permission-info">
                    <FileText size={20} />
                    <div>
                      <h4>Report Avanzati</h4>
                      <p>Accesso ai report e analitiche avanzate</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked={selectedOwner.planType !== 'free'} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="permission-item">
                  <div className="permission-info">
                    <Settings size={20} />
                    <div>
                      <h4>Impostazioni Azienda</h4>
                      <p>Modifica impostazioni e configurazioni</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked={true} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="edit-org-footer">
              <button className="btn-secondary" onClick={() => setShowPermissionsModal(false)}>
                Chiudi
              </button>
              <button className="btn-primary">
                <Save size={18} />
                Salva Permessi
              </button>
            </div>
          </div>
        </>
      )}

      {/* Send Email Modal */}
      {showEmailModal && selectedOwner && (
        <>
          <div className="edit-org-overlay" onClick={() => setShowEmailModal(false)} />
          <div className="edit-org-modal">
            {/* Header */}
            <div className="edit-org-header">
              <div className="edit-org-header-content">
                <Mail size={24} />
                <div>
                  <h2>Invia Email</h2>
                  <p>{selectedOwner.name}</p>
                </div>
              </div>
              <button className="edit-org-close-btn" onClick={() => setShowEmailModal(false)}>
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="edit-org-content">
              <form className="email-form">
                <div className="form-group">
                  <label className="form-label">
                    <Mail size={16} />
                    Destinatario
                  </label>
                  <input type="email" value={selectedOwner.email} disabled className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <FileText size={16} />
                    Oggetto
                  </label>
                  <input type="text" placeholder="Inserisci oggetto..." className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <Edit size={16} />
                    Messaggio
                  </label>
                  <textarea rows={6} placeholder="Scrivi il tuo messaggio..." className="form-textarea"></textarea>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <Settings size={16} />
                    Template
                  </label>
                  <select className="form-select">
                    <option value="">Personalizzato</option>
                    <option value="welcome">Email di Benvenuto</option>
                    <option value="upgrade">Invito Upgrade Piano</option>
                    <option value="reminder">Promemoria Fattura</option>
                    <option value="support">Richiesta Feedback</option>
                  </select>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="edit-org-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowEmailModal(false)}>
                Annulla
              </button>
              <button type="submit" className="btn-primary">
                <Mail size={18} />
                Invia Email
              </button>
            </div>
          </div>
        </>
      )}
      {/* Invite Modal */}
      <InviteBusinessModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />

      {/* Change Plan Modal */}
      {selectedOwner && (
        <ChangePlanModal
          isOpen={showChangePlanModal}
          onClose={() => setShowChangePlanModal(false)}
          businessOwner={{
            id: selectedOwner.id,
            name: selectedOwner.name,
            email: selectedOwner.email,
            company: selectedOwner.company,
            planType: selectedOwner.planType
          }}
          onConfirm={handleChangePlanConfirm}
        />
      )}

      {/* Suspend Account Modal */}
      {selectedOwner && (
        <SuspendAccountModal
          isOpen={showSuspendModal}
          onClose={() => setShowSuspendModal(false)}
          businessOwner={{
            id: selectedOwner.id,
            name: selectedOwner.name,
            email: selectedOwner.email,
            company: selectedOwner.company,
            planType: selectedOwner.planType
          }}
          onConfirm={handleSuspendAccountConfirm}
        />
      )}

      {/* Account History Modal */}
      {selectedOwner && (
        <AccountHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          businessOwner={{
            id: selectedOwner.id,
            name: selectedOwner.name,
            email: selectedOwner.email,
            company: selectedOwner.company
          }}
          onLoadHistory={businessOwnerService.loadHistory.bind(businessOwnerService)}
        />
      )}
    </div>
  )
}

export default BusinessOwners