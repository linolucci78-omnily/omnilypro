import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  Users, 
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
  Zap
} from 'lucide-react'
import PageLoader from '../components/UI/PageLoader'
import './BusinessOwners.css'

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
  const [owners, setOwners] = useState<BusinessOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPlan, setFilterPlan] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedOwners, setSelectedOwners] = useState<string[]>([])

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
                  <input
                    type="checkbox"
                    checked={selectedOwners.length === filteredOwners.length && filteredOwners.length > 0}
                    onChange={handleSelectAll}
                  />
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
                    <input
                      type="checkbox"
                      checked={selectedOwners.includes(owner.id)}
                      onChange={() => handleSelectOwner(owner.id)}
                    />
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
                      <button className="action-btn">
                        <Eye size={16} />
                      </button>
                      <button className="action-btn">
                        <Edit size={16} />
                      </button>
                      <button className="action-btn">
                        <Shield size={16} />
                      </button>
                      <button className="action-btn">
                        <Mail size={16} />
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
        
        {!loading && filteredOwners.length === 0 && (
          <div className="empty-state">
            <Building2 size={64} />
            <h3>Nessun proprietario trovato</h3>
            <p>Non ci sono proprietari che corrispondono ai tuoi filtri di ricerca.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BusinessOwners