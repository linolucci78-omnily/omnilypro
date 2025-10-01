import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  Users, 
  TrendingUp, 
  CreditCard,
  Activity,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Zap,
  Globe,
  User,
  ArrowUp,
  ArrowDown,
  MoreHorizontal
} from 'lucide-react'
import { organizationsApi } from '../lib/supabase'
import PageLoader from '../components/UI/PageLoader'
import './AdminDashboard.css'

interface DashboardStats {
  organizations: {
    total: number
    active: number
    newThisMonth: number
    growth: number
  }
  revenue: {
    monthly: number
    yearly: number
    growth: number
  }
  pos: {
    active: number
    transactions: number
    growth: number
  }
  users: {
    total: number
    active: number
    growth: number
  }
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    organizations: { total: 0, active: 0, newThisMonth: 0, growth: 0 },
    revenue: { monthly: 0, yearly: 0, growth: 0 },
    pos: { active: 0, transactions: 0, growth: 0 },
    users: { total: 0, active: 0, growth: 0 }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      // Load real data from API
      const orgStats = await organizationsApi.getStats()
      
      // Mock additional data for demo
      setStats({
        organizations: {
          total: orgStats.total,
          active: orgStats.active,
          newThisMonth: orgStats.newThisMonth,
          growth: 15.3
        },
        revenue: {
          monthly: 12450,
          yearly: 148500,
          growth: 23.7
        },
        pos: {
          active: orgStats.withPOS,
          transactions: 2847,
          growth: 18.2
        },
        users: {
          total: orgStats.total * 3, // Approx 3 users per org
          active: orgStats.active * 2,
          growth: 12.8
        }
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0
    return (
      <span className={`growth ${isPositive ? 'positive' : 'negative'}`}>
        {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
        {Math.abs(growth)}%
      </span>
    )
  }

  if (loading) {
    return <PageLoader message="Caricamento dashboard amministrazione..." size="medium" />
  }

  return (
    <div className="admin-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Dashboard Amministrazione</h1>
          <p>Panoramica completa del sistema OMNILY PRO</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">
            <Calendar size={16} />
            Ultimi 30 giorni
          </button>
          <button className="btn-primary">
            <TrendingUp size={16} />
            Report Completo
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="stats-main-grid">
        <div className="stat-card primary">
          <div className="stat-header">
            <div className="stat-icon">
              <Building2 size={24} />
            </div>
            <div className="stat-trend">
              {formatGrowth(stats.organizations.growth)}
            </div>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.organizations.total.toLocaleString()}</div>
            <div className="stat-label">Aziende Totali</div>
            <div className="stat-detail">
              {stats.organizations.active} attive • {stats.organizations.newThisMonth} nuove questo mese
            </div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-header">
            <div className="stat-icon">
              <DollarSign size={24} />
            </div>
            <div className="stat-trend">
              {formatGrowth(stats.revenue.growth)}
            </div>
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(stats.revenue.monthly)}</div>
            <div className="stat-label">Ricavi Mensili</div>
            <div className="stat-detail">
              {formatCurrency(stats.revenue.yearly)} quest'anno
            </div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-header">
            <div className="stat-icon">
              <CreditCard size={24} />
            </div>
            <div className="stat-trend">
              {formatGrowth(stats.pos.growth)}
            </div>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.pos.active}</div>
            <div className="stat-label">POS Attivi</div>
            <div className="stat-detail">
              {stats.pos.transactions.toLocaleString()} transazioni
            </div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-header">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-trend">
              {formatGrowth(stats.users.growth)}
            </div>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.users.total.toLocaleString()}</div>
            <div className="stat-label">Utenti Totali</div>
            <div className="stat-detail">
              {stats.users.active.toLocaleString()} attivi
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="stats-secondary-grid">
        <div className="mini-stat">
          <Activity size={20} />
          <div className="mini-stat-info">
            <div className="mini-stat-value">99.8%</div>
            <div className="mini-stat-label">Uptime</div>
          </div>
        </div>
        
        <div className="mini-stat">
          <Zap size={20} />
          <div className="mini-stat-info">
            <div className="mini-stat-value">1.2s</div>
            <div className="mini-stat-label">Response Time</div>
          </div>
        </div>
        
        <div className="mini-stat">
          <Globe size={20} />
          <div className="mini-stat-info">
            <div className="mini-stat-value">12</div>
            <div className="mini-stat-label">Paesi</div>
          </div>
        </div>
        
        <div className="mini-stat">
          <CheckCircle2 size={20} />
          <div className="mini-stat-info">
            <div className="mini-stat-value">47</div>
            <div className="mini-stat-label">Issues Risolte</div>
          </div>
        </div>
      </div>

      {/* Dashboard Content Grid */}
      <div className="dashboard-content-grid">
        {/* Recent Activity */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Attività Recenti</h3>
            <button className="card-menu">
              <MoreHorizontal size={16} />
            </button>
          </div>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon new">
                <Building2 size={16} />
              </div>
              <div className="activity-content">
                <div className="activity-title">Nuova azienda registrata</div>
                <div className="activity-detail">Pizzeria Da Mario - Milano</div>
                <div className="activity-time">2 minuti fa</div>
              </div>
            </div>
            
            <div className="activity-item">
              <div className="activity-icon success">
                <CreditCard size={16} />
              </div>
              <div className="activity-content">
                <div className="activity-title">POS configurato</div>
                <div className="activity-detail">Bar Central - Roma</div>
                <div className="activity-time">15 minuti fa</div>
              </div>
            </div>
            
            <div className="activity-item">
              <div className="activity-icon warning">
                <AlertCircle size={16} />
              </div>
              <div className="activity-content">
                <div className="activity-title">Errore sistema POS</div>
                <div className="activity-detail">Ristorante Bella Vista - Napoli</div>
                <div className="activity-time">1 ora fa</div>
              </div>
            </div>
            
            <div className="activity-item">
              <div className="activity-icon info">
                <User size={16} />
              </div>
              <div className="activity-content">
                <div className="activity-title">Nuovo utente</div>
                <div className="activity-detail">admin@gelateriafreddi.it</div>
                <div className="activity-time">2 ore fa</div>
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Stato Sistema</h3>
            <div className="status-indicator online"></div>
          </div>
          <div className="health-metrics">
            <div className="health-item">
              <div className="health-label">Database</div>
              <div className="health-status online">Online</div>
              <div className="health-value">99.9%</div>
            </div>
            
            <div className="health-item">
              <div className="health-label">API Server</div>
              <div className="health-status online">Online</div>
              <div className="health-value">100%</div>
            </div>
            
            <div className="health-item">
              <div className="health-label">POS Gateway</div>
              <div className="health-status online">Online</div>
              <div className="health-value">98.7%</div>
            </div>
            
            <div className="health-item">
              <div className="health-label">Email Service</div>
              <div className="health-status warning">Degraded</div>
              <div className="health-value">85.2%</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Azioni Rapide</h3>
          </div>
          <div className="quick-actions">
            <button className="quick-action">
              <Building2 size={20} />
              <span>Nuova Azienda</span>
            </button>
            
            <button className="quick-action">
              <User size={20} />
              <span>Gestisci Utenti</span>
            </button>
            
            <button className="quick-action">
              <CreditCard size={20} />
              <span>Config POS</span>
            </button>
            
            <button className="quick-action">
              <TrendingUp size={20} />
              <span>Report</span>
            </button>
          </div>
        </div>

        {/* Top Organizations */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Top Aziende</h3>
            <button className="card-menu">
              <MoreHorizontal size={16} />
            </button>
          </div>
          <div className="top-orgs">
            <div className="org-item">
              <div className="org-info">
                <div className="org-name">Pizzeria Da Mario</div>
                <div className="org-detail">1.2K clienti • 450 transazioni</div>
              </div>
              <div className="org-revenue">{formatCurrency(2450)}</div>
            </div>
            
            <div className="org-item">
              <div className="org-info">
                <div className="org-name">Bar Central</div>
                <div className="org-detail">850 clienti • 320 transazioni</div>
              </div>
              <div className="org-revenue">{formatCurrency(1890)}</div>
            </div>
            
            <div className="org-item">
              <div className="org-info">
                <div className="org-name">Gelateria Freddi</div>
                <div className="org-detail">620 clienti • 180 transazioni</div>
              </div>
              <div className="org-revenue">{formatCurrency(1240)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard