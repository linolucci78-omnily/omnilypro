import React, { useState, useEffect } from 'react'
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Star,
  Gift,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  TrendingUp,
  UserPlus,
  MoreVertical,
  Award,
  Clock,
  Euro,
  Zap,
  Cake
} from 'lucide-react'
import PageLoader from '../components/UI/PageLoader'
import './BusinessCustomers.css'

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  joinDate: string
  lastVisit?: string
  points: number
  totalSpent: number
  visits: number
  tier: string // Tier dinamico basato sulla configurazione dell'organizzazione
  isActive: boolean
  organizationId: string
  birthDate?: string
  preferences?: string[]
}

const BusinessCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTier, setFilterTier] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<string>('')

  // Mock data per demo
  const mockCustomers: Customer[] = [
    {
      id: '1',
      name: 'Mario Rossi',
      email: 'mario.rossi@email.com',
      phone: '+39 347 123 4567',
      address: 'Via Roma 15, Milano',
      joinDate: '2023-01-15',
      lastVisit: '2024-01-10',
      points: 1250,
      totalSpent: 2850.50,
      visits: 45,
      tier: 'Gold',
      isActive: true,
      organizationId: 'org1',
      birthDate: '1985-03-20',
      preferences: ['pizza', 'birra']
    },
    {
      id: '2',
      name: 'Anna Bianchi',
      email: 'anna.bianchi@email.com',
      phone: '+39 342 987 6543',
      address: 'Corso Venezia 8, Milano',
      joinDate: '2023-06-22',
      lastVisit: '2024-01-08',
      points: 750,
      totalSpent: 1420.30,
      visits: 23,
      tier: 'Silver',
      isActive: true,
      organizationId: 'org1',
      birthDate: '1992-07-14',
      preferences: ['pasta', 'vino']
    },
    {
      id: '3',
      name: 'Luca Ferrari',
      email: 'luca.ferrari@email.com',
      phone: '+39 351 456 7890',
      address: 'Piazza Duomo 12, Milano',
      joinDate: '2023-11-03',
      lastVisit: '2024-01-05',
      points: 2100,
      totalSpent: 4200.80,
      visits: 67,
      tier: 'Platinum',
      isActive: true,
      organizationId: 'org1',
      birthDate: '1978-12-05',
      preferences: ['gelato', 'caffè']
    },
    {
      id: '4',
      name: 'Giulia Verdi',
      email: 'giulia.verdi@email.com',
      phone: '+39 348 321 0987',
      address: 'Via Torino 22, Milano',
      joinDate: '2023-08-18',
      lastVisit: '2023-12-15',
      points: 320,
      totalSpent: 890.25,
      visits: 12,
      tier: 'Bronze',
      isActive: false,
      organizationId: 'org1',
      birthDate: '1995-09-30'
    }
  ]

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      // Simulate API call
      setTimeout(() => {
        setCustomers(mockCustomers)
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error loading customers:', error)
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTier = filterTier === 'all' || customer.tier.toLowerCase() === filterTier.toLowerCase()
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && customer.isActive) ||
                         (filterStatus === 'inactive' && !customer.isActive)
    
    return matchesSearch && matchesTier && matchesStatus
  })

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    )
  }

  const handleSelectAll = () => {
    setSelectedCustomers(
      selectedCustomers.length === filteredCustomers.length 
        ? [] 
        : filteredCustomers.map(customer => customer.id)
    )
  }

  const getTierBadge = (tier: string) => {
    // Genera colore dinamico basato sul nome del tier invece di hardcoded
    // Questo permette di supportare tier personalizzati come "Start", "Interpraise", ecc.
    const generateColorFromTier = (tierName: string): { color: string; bg: string } => {
      // Fallback per tier conosciuti (backward compatibility)
      const knownTiers: Record<string, { color: string; bg: string }> = {
        Bronze: { color: '#cd7f32', bg: '#fef3c7' },
        Bronzo: { color: '#cd7f32', bg: '#fef3c7' },
        Silver: { color: '#c0c0c0', bg: '#f3f4f6' },
        Argento: { color: '#c0c0c0', bg: '#f3f4f6' },
        Gold: { color: '#ffd700', bg: '#fef3c7' },
        Oro: { color: '#ffd700', bg: '#fef3c7' },
        Platinum: { color: '#e5e4e2', bg: '#f3f4f6' }
      };

      if (knownTiers[tierName]) {
        return knownTiers[tierName];
      }

      // Per tier personalizzati, genera colori dinamici ma consistenti
      const colors = [
        { color: '#3b82f6', bg: '#dbeafe' }, // Blue
        { color: '#8b5cf6', bg: '#ede9fe' }, // Purple
        { color: '#ec4899', bg: '#fce7f3' }, // Pink
        { color: '#10b981', bg: '#d1fae5' }, // Green
        { color: '#f59e0b', bg: '#fef3c7' }, // Amber
        { color: '#ef4444', bg: '#fee2e2' }, // Red
      ];

      // Usa hash del nome per selezionare un colore consistente
      const hash = tierName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return colors[hash % colors.length];
    };

    const config = generateColorFromTier(tier);

    return (
      <span
        className="tier-badge"
        style={{
          backgroundColor: config.bg,
          color: config.color,
          border: `1px solid ${config.color}30`
        }}
      >
        <Award size={12} />
        {tier}
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

  const calculateAge = (birthDate: string | undefined): number | null => {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const getCustomerStats = () => {
    return {
      total: customers.length,
      active: customers.filter(c => c.isActive).length,
      totalPoints: customers.reduce((sum, c) => sum + c.points, 0),
      totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
      avgOrderValue: customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.reduce((sum, c) => sum + c.visits, 0),
      topTier: customers.filter(c => c.tier === 'Platinum' || c.tier === 'Gold').length
    }
  }

  const stats = getCustomerStats()

  return (
    <div className="business-customers">
      {/* Page Header */}
      <div className="customers-header">
        <div className="header-left">
          <Users size={32} />
          <div className="header-info">
            <h1>Gestione Clienti</h1>
            <p>Gestisci tutti i clienti del programma fedeltà</p>
          </div>
        </div>
        
        <div className="header-actions">
          <button className="btn-secondary">
            <Download size={18} />
            Esporta CSV
          </button>
          <button className="btn-secondary">
            <Upload size={18} />
            Importa
          </button>
          <button 
            className="btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={18} />
            Nuovo Cliente
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="customers-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.total.toLocaleString()}</div>
            <div className="stat-label">Clienti Totali</div>
            <div className="stat-detail">{stats.active} attivi</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon gold">
            <Star size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalPoints.toLocaleString()}</div>
            <div className="stat-label">Punti Totali</div>
            <div className="stat-detail">Nel sistema</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon success">
            <Euro size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
            <div className="stat-label">Ricavi Totali</div>
            <div className="stat-detail">{formatCurrency(stats.avgOrderValue)} medio</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon premium">
            <Award size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.topTier}</div>
            <div className="stat-label">Clienti VIP</div>
            <div className="stat-detail">Gold & Platinum</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="customers-filters">
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
            value={filterTier} 
            onChange={(e) => setFilterTier(e.target.value)}
          >
            <option value="all">Tutti i Tier</option>
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
          
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="all">Tutti</option>
            <option value="active">Solo Attivi</option>
            <option value="inactive">Solo Inattivi</option>
          </select>
        </div>
        
        {selectedCustomers.length > 0 && (
          <div className="selected-actions">
            <span>{selectedCustomers.length} selezionati</span>
            <button className="btn-secondary">
              <Mail size={16} />
              Email
            </button>
            <button className="btn-secondary">
              <Gift size={16} />
              Premi
            </button>
            <button className="btn-danger">
              <Trash2 size={16} />
              Elimina
            </button>
          </div>
        )}
      </div>

      {/* Customers Table */}
      <div className="customers-table-container">
        {loading ? (
          <PageLoader message="Caricamento clienti aziendali..." size="medium" inline />
        ) : (
          <table className="customers-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Cliente</th>
                <th>Contatti</th>
                <th>Tier</th>
                <th>Punti</th>
                <th>Spesa Totale</th>
                <th>Visite</th>
                <th>Ultima Visita</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className={selectedCustomers.includes(customer.id) ? 'selected' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={() => handleSelectCustomer(customer.id)}
                    />
                  </td>
                  
                  <td>
                    <div className="customer-info">
                      <div className="customer-avatar">
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="customer-details">
                        <div className="customer-name">{customer.name}</div>
                        <div className="customer-joined">
                          Cliente dal {formatDate(customer.joinDate)}
                          {customer.birthDate && calculateAge(customer.birthDate) !== null && (
                            <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                              • <Cake size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '2px' }} />
                              {calculateAge(customer.birthDate)} anni
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td>
                    <div className="contact-info">
                      <div className="contact-item">
                        <Mail size={14} />
                        <span>{customer.email}</span>
                      </div>
                      {customer.phone && (
                        <div className="contact-item">
                          <Phone size={14} />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td>
                    {getTierBadge(customer.tier)}
                  </td>
                  
                  <td>
                    <div className="points-info">
                      <Star size={16} color="#fbbf24" />
                      <span className="points-value">{customer.points.toLocaleString()}</span>
                    </div>
                  </td>
                  
                  <td>
                    <div className="spending-info">
                      <span className="spending-amount">{formatCurrency(customer.totalSpent)}</span>
                      <span className="avg-order">
                        {formatCurrency(customer.totalSpent / customer.visits)} medio
                      </span>
                    </div>
                  </td>
                  
                  <td>
                    <div className="visits-info">
                      <span className="visits-count">{customer.visits}</span>
                      <span className="visits-label">visite</span>
                    </div>
                  </td>
                  
                  <td>
                    <div className="last-visit">
                      {customer.lastVisit ? (
                        <>
                          <Calendar size={14} />
                          <span>{formatDate(customer.lastVisit)}</span>
                        </>
                      ) : (
                        <span className="no-visits">Mai</span>
                      )}
                    </div>
                  </td>
                  
                  <td>
                    <span className={`status-badge ${customer.isActive ? 'active' : 'inactive'}`}>
                      {customer.isActive ? 'Attivo' : 'Inattivo'}
                    </span>
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
                        <Gift size={16} />
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
        
        {!loading && filteredCustomers.length === 0 && (
          <div className="empty-state">
            <Users size={48} />
            <h3>Nessun cliente trovato</h3>
            <p>Non ci sono clienti che corrispondono ai tuoi filtri di ricerca.</p>
            <button 
              className="btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <UserPlus size={18} />
              Aggiungi Primo Cliente
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <div className="pagination-info">
          Mostrando {filteredCustomers.length} di {customers.length} clienti
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

      {/* Quick Insights Panel */}
      <div className="quick-insights">
        <h3>Insights Rapidi</h3>
        <div className="insights-grid">
          <div className="insight-item">
            <TrendingUp size={20} />
            <div className="insight-info">
              <div className="insight-value">+12%</div>
              <div className="insight-label">Nuovi clienti questo mese</div>
            </div>
          </div>
          
          <div className="insight-item">
            <Zap size={20} />
            <div className="insight-info">
              <div className="insight-value">85%</div>
              <div className="insight-label">Tasso di retention</div>
            </div>
          </div>
          
          <div className="insight-item">
            <Gift size={20} />
            <div className="insight-info">
              <div className="insight-value">347</div>
              <div className="insight-label">Premi riscattati</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BusinessCustomers