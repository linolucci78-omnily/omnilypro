import React, { useState, useEffect } from 'react'
import {
  Activity, Users, Building2, CreditCard, TrendingUp, TrendingDown,
  Server, Database, Wifi, Shield, AlertTriangle, CheckCircle,
  Clock, Zap, HardDrive, Cpu, BarChart3, DollarSign
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import './SystemOverview.css'

interface SystemMetrics {
  totalOrganizations: number
  activeUsers: number
  totalRevenue: number
  monthlyGrowth: number
  activeSubscriptions: number
  pendingCustomers: number
  systemUptime: number
  databaseSize: number
  apiResponseTime: number
  activeConnections: number
}

const SystemOverview: React.FC = () => {
  const { user, isSuperAdmin } = useAuth()
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [systemStatus, setSystemStatus] = useState<'operational' | 'warning' | 'critical'>('operational')

  useEffect(() => {
    loadSystemMetrics()

    // Refresh metrics every 30 seconds
    const interval = setInterval(loadSystemMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadSystemMetrics = async () => {
    try {
      setLoading(true)

      // Fetch real metrics from database
      const [orgsResult, usersResult, subsResult, pendingResult] = await Promise.all([
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('subscriptions').select('id, amount', { count: 'exact' }).eq('status', 'active'),
        supabase.from('customers').select('id', { count: 'exact', head: true }).eq('activation_status', 'pending')
      ])

      // Calculate total revenue from active subscriptions
      const totalRevenue = subsResult.data?.reduce((sum, sub) => sum + (sub.amount || 0), 0) || 0

      // Mock some system metrics (in a real app, these would come from monitoring APIs)
      const mockMetrics: SystemMetrics = {
        totalOrganizations: orgsResult.count || 0,
        activeUsers: usersResult.count || 0,
        totalRevenue: totalRevenue,
        monthlyGrowth: 12.5, // Would be calculated from historical data
        activeSubscriptions: subsResult.count || 0,
        pendingCustomers: pendingResult.count || 0,
        systemUptime: 99.98,
        databaseSize: 2.4, // GB
        apiResponseTime: 145, // ms
        activeConnections: 47
      }

      setMetrics(mockMetrics)

      // Determine system status
      if (mockMetrics.systemUptime < 99) {
        setSystemStatus('critical')
      } else if (mockMetrics.apiResponseTime > 500) {
        setSystemStatus('warning')
      } else {
        setSystemStatus('operational')
      }
    } catch (error) {
      console.error('Error loading system metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !metrics) {
    return (
      <div className="system-overview-loading">
        <div className="spinner"></div>
        <p>Caricamento metriche di sistema...</p>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('it-IT').format(num)
  }

  return (
    <div className="system-overview">
      {/* Header */}
      <div className="overview-header">
        <div>
          <h1 className="overview-title">System Command Center</h1>
          <p className="overview-subtitle">Monitoraggio in tempo reale della piattaforma OmnilyPro</p>
        </div>
        <div className={`system-status-badge ${systemStatus}`}>
          {systemStatus === 'operational' && <CheckCircle size={18} />}
          {systemStatus === 'warning' && <AlertTriangle size={18} />}
          {systemStatus === 'critical' && <AlertTriangle size={18} />}
          <span>
            {systemStatus === 'operational' && 'Sistema Operativo'}
            {systemStatus === 'warning' && 'Attenzione'}
            {systemStatus === 'critical' && 'Critico'}
          </span>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="quick-stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">
            <Building2 size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Organizzazioni Attive</div>
            <div className="stat-value">{formatNumber(metrics.totalOrganizations)}</div>
            <div className="stat-trend positive">
              <TrendingUp size={14} />
              <span>+{metrics.monthlyGrowth}% questo mese</span>
            </div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Utenti Attivi</div>
            <div className="stat-value">{formatNumber(metrics.activeUsers)}</div>
            <div className="stat-trend positive">
              <TrendingUp size={14} />
              <span>+8.2% questo mese</span>
            </div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Entrate Mensili</div>
            <div className="stat-value">{formatCurrency(metrics.totalRevenue)}</div>
            <div className="stat-trend positive">
              <TrendingUp size={14} />
              <span>+15.3% questo mese</span>
            </div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">
            <CreditCard size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Abbonamenti Attivi</div>
            <div className="stat-value">{formatNumber(metrics.activeSubscriptions)}</div>
            <div className="stat-trend positive">
              <TrendingUp size={14} />
              <span>+{metrics.monthlyGrowth}% questo mese</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="overview-content-grid">
        {/* System Health */}
        <div className="overview-card">
          <div className="card-header">
            <h3>
              <Activity size={20} />
              Salute Sistema
            </h3>
            <span className="update-time">
              <Clock size={14} />
              Aggiornato ora
            </span>
          </div>
          <div className="health-metrics">
            <div className="health-item">
              <div className="health-label">
                <Server size={16} />
                <span>Uptime Sistema</span>
              </div>
              <div className="health-value">
                <span className="value-large">{metrics.systemUptime}%</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${metrics.systemUptime}%` }}></div>
                </div>
              </div>
            </div>

            <div className="health-item">
              <div className="health-label">
                <Zap size={16} />
                <span>Tempo Risposta API</span>
              </div>
              <div className="health-value">
                <span className="value-large">{metrics.apiResponseTime}ms</span>
                <div className="progress-bar">
                  <div className="progress-fill success" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>

            <div className="health-item">
              <div className="health-label">
                <Database size={16} />
                <span>Utilizzo Database</span>
              </div>
              <div className="health-value">
                <span className="value-large">{metrics.databaseSize} GB</span>
                <div className="progress-bar">
                  <div className="progress-fill warning" style={{ width: '24%' }}></div>
                </div>
              </div>
            </div>

            <div className="health-item">
              <div className="health-label">
                <Wifi size={16} />
                <span>Connessioni Attive</span>
              </div>
              <div className="health-value">
                <span className="value-large">{metrics.activeConnections}</span>
                <div className="progress-bar">
                  <div className="progress-fill info" style={{ width: '47%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="overview-card">
          <div className="card-header">
            <h3>
              <BarChart3 size={20} />
              Attività Recente
            </h3>
          </div>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon success">
                <CheckCircle size={16} />
              </div>
              <div className="activity-content">
                <div className="activity-title">Nuova organizzazione creata</div>
                <div className="activity-time">2 minuti fa</div>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-icon info">
                <Users size={16} />
              </div>
              <div className="activity-content">
                <div className="activity-title">12 nuovi utenti registrati</div>
                <div className="activity-time">15 minuti fa</div>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-icon warning">
                <AlertTriangle size={16} />
              </div>
              <div className="activity-content">
                <div className="activity-title">{metrics.pendingCustomers} clienti in attesa di attivazione</div>
                <div className="activity-time">30 minuti fa</div>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-icon success">
                <CreditCard size={16} />
              </div>
              <div className="activity-content">
                <div className="activity-title">Pagamento abbonamento ricevuto</div>
                <div className="activity-time">1 ora fa</div>
              </div>
            </div>

            <div className="activity-item">
              <div className="activity-icon info">
                <Shield size={16} />
              </div>
              <div className="activity-content">
                <div className="activity-title">Backup automatico completato</div>
                <div className="activity-time">2 ore fa</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="overview-card">
          <div className="card-header">
            <h3>
              <Zap size={20} />
              Azioni Rapide
            </h3>
          </div>
          <div className="quick-actions">
            <a href="/admin/organizations" className="action-button">
              <Building2 size={18} />
              <span>Gestione Organizzazioni</span>
            </a>
            <a href="/admin/users" className="action-button">
              <Users size={18} />
              <span>Gestione Utenti</span>
            </a>
            <a href="/admin/pending-customers" className="action-button">
              <Clock size={18} />
              <span>Clienti da Attivare</span>
            </a>
            <a href="/admin/subscriptions" className="action-button">
              <CreditCard size={18} />
              <span>Abbonamenti</span>
            </a>
            <a href="/admin/analytics" className="action-button">
              <BarChart3 size={18} />
              <span>Analytics</span>
            </a>
            <a href="/admin/database" className="action-button">
              <Database size={18} />
              <span>Database</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemOverview
