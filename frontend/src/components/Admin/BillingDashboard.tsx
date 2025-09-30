import React, { useState, useEffect } from 'react'
import {
  CreditCard,
  DollarSign,
  Package,
  TrendingUp,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Mail,
  Clock,
  Zap,
  Building2
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import './BillingDashboard.css'

interface Subscription {
  id: string
  organization_id: string
  organization_name: string
  plan_type: 'basic' | 'premium' | 'enterprise'
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid'
  current_period_start: string
  current_period_end: string
  amount: number
  currency: string
  stripe_subscription_id?: string
  stripe_customer_id?: string
  created_at: string
  updated_at: string
}

interface BillingStats {
  totalRevenue: number
  monthlyRevenue: number
  activeSubscriptions: number
  churnRate: number
  averageRevenuePerUser: number
  totalCustomers: number
}

interface Invoice {
  id: string
  subscription_id: string
  organization_name: string
  amount: number
  status: 'paid' | 'pending' | 'failed'
  due_date: string
  paid_at?: string
  stripe_invoice_id?: string
}

const BillingDashboard: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState<BillingStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
    churnRate: 0,
    averageRevenuePerUser: 0,
    totalCustomers: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'invoices' | 'analytics'>('subscriptions')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled' | 'past_due'>('all')
  const [planFilter, setPlanFilter] = useState<'all' | 'basic' | 'premium' | 'enterprise'>('all')

  useEffect(() => {
    loadBillingData()
  }, [])

  const loadBillingData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load subscriptions with organization data
      const { data: subsData, error: subsError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          organizations!inner(name, email)
        `)
        .order('created_at', { ascending: false })

      if (subsError) throw subsError

      // Transform data to include organization name
      const subscriptionsWithOrg: Subscription[] = (subsData || []).map((sub: any) => ({
        ...sub,
        organization_name: sub.organizations.name
      }))

      setSubscriptions(subscriptionsWithOrg)

      // Load invoices (mock data for now - would come from Stripe)
      const mockInvoices: Invoice[] = subscriptionsWithOrg.map((sub, index) => ({
        id: `inv_${index + 1}`,
        subscription_id: sub.id,
        organization_name: sub.organization_name,
        amount: sub.amount,
        status: Math.random() > 0.1 ? 'paid' : (Math.random() > 0.5 ? 'pending' : 'failed'),
        due_date: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString(),
        paid_at: Math.random() > 0.3 ? new Date().toISOString() : undefined,
        stripe_invoice_id: `in_${Math.random().toString(36).substr(2, 9)}`
      }))

      setInvoices(mockInvoices)

      // Calculate stats
      const totalRevenue = subscriptionsWithOrg
        .filter(sub => sub.status === 'active')
        .reduce((sum, sub) => sum + sub.amount, 0)

      const activeCount = subscriptionsWithOrg.filter(sub => sub.status === 'active').length
      const totalCount = subscriptionsWithOrg.length

      const billingStats: BillingStats = {
        totalRevenue: totalRevenue * 12, // Annual
        monthlyRevenue: totalRevenue,
        activeSubscriptions: activeCount,
        churnRate: totalCount > 0 ? ((totalCount - activeCount) / totalCount) * 100 : 0,
        averageRevenuePerUser: activeCount > 0 ? totalRevenue / activeCount : 0,
        totalCustomers: totalCount
      }

      setStats(billingStats)

    } catch (err) {
      console.error('Error loading billing data:', err)
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dei dati di fatturazione')
    } finally {
      setLoading(false)
    }
  }

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.organization_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.plan_type.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter
    const matchesPlan = planFilter === 'all' || sub.plan_type === planFilter

    return matchesSearch && matchesStatus && matchesPlan
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'success', icon: CheckCircle2, label: 'Attivo' },
      cancelled: { color: 'danger', icon: XCircle, label: 'Cancellato' },
      past_due: { color: 'warning', icon: AlertTriangle, label: 'Scaduto' },
      unpaid: { color: 'danger', icon: XCircle, label: 'Non Pagato' },
      paid: { color: 'success', icon: CheckCircle2, label: 'Pagato' },
      pending: { color: 'warning', icon: Clock, label: 'In Attesa' },
      failed: { color: 'danger', icon: XCircle, label: 'Fallito' }
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return null

    const Icon = config.icon

    return (
      <span className={`status-badge ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    )
  }

  const getPlanBadge = (plan: string) => {
    const planConfig = {
      basic: { color: 'basic', label: 'Basic', price: '€29/mese' },
      premium: { color: 'premium', label: 'Premium', price: '€99/mese' },
      enterprise: { color: 'enterprise', label: 'Enterprise', price: '€299/mese' }
    }

    const config = planConfig[plan as keyof typeof planConfig]
    if (!config) return null

    return (
      <div className="plan-info">
        <span className={`plan-badge ${config.color}`}>{config.label}</span>
        <span className="plan-price">{config.price}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Caricamento dati di fatturazione...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertTriangle size={48} />
        <h3>Errore nel caricamento</h3>
        <p>{error}</p>
        <button onClick={loadBillingData} className="btn-primary">
          <RefreshCw size={16} />
          Riprova
        </button>
      </div>
    )
  }

  return (
    <div className="billing-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Gestione Fatturazione</h1>
          <p>Dashboard completa per abbonamenti, fatture e ricavi</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">
            <Download size={16} />
            Esporta Report
          </button>
          <button onClick={loadBillingData} className="btn-secondary">
            <RefreshCw size={16} />
            Aggiorna
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="billing-stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">
            <DollarSign size={32} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(stats.monthlyRevenue)}</div>
            <div className="stat-label">Ricavi Mensili</div>
            <div className="stat-trend positive">
              <TrendingUp size={14} />
              +12.5% vs mese scorso
            </div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <Package size={32} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.activeSubscriptions}</div>
            <div className="stat-label">Abbonamenti Attivi</div>
            <div className="stat-detail">su {stats.totalCustomers} totali</div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">
            <Users size={32} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(stats.averageRevenuePerUser)}</div>
            <div className="stat-label">ARPU Medio</div>
            <div className="stat-detail">per utente/mese</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <TrendingUp size={32} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.churnRate.toFixed(1)}%</div>
            <div className="stat-label">Tasso di Abbandono</div>
            <div className="stat-detail">ultimi 30 giorni</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="billing-tabs">
        <button
          className={`tab ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          <Package size={16} />
          Abbonamenti
        </button>
        <button
          className={`tab ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          <CreditCard size={16} />
          Fatture
        </button>
        <button
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUp size={16} />
          Analytics
        </button>
      </div>

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="subscriptions-section">
          {/* Filters */}
          <div className="filters-section">
            <div className="search-container">
              <Search size={20} />
              <input
                type="text"
                placeholder="Cerca organizzazione o piano..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filters-container">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="filter-select"
              >
                <option value="all">Tutti gli stati</option>
                <option value="active">Attivi</option>
                <option value="cancelled">Cancellati</option>
                <option value="past_due">Scaduti</option>
              </select>

              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value as any)}
                className="filter-select"
              >
                <option value="all">Tutti i piani</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="subscriptions-table">
            <div className="table-header">
              <h3>Abbonamenti ({filteredSubscriptions.length})</h3>
            </div>

            <div className="table-container">
              <div className="table-header-row">
                <div className="table-cell">Organizzazione</div>
                <div className="table-cell">Piano</div>
                <div className="table-cell">Stato</div>
                <div className="table-cell">Importo</div>
                <div className="table-cell">Periodo</div>
                <div className="table-cell">Prossima Fattura</div>
                <div className="table-cell">Azioni</div>
              </div>

              {filteredSubscriptions.map((subscription) => (
                <div key={subscription.id} className="table-row">
                  <div className="table-cell">
                    <div className="org-info">
                      <Building2 size={16} />
                      <span className="org-name">{subscription.organization_name}</span>
                    </div>
                  </div>

                  <div className="table-cell">
                    {getPlanBadge(subscription.plan_type)}
                  </div>

                  <div className="table-cell">
                    {getStatusBadge(subscription.status)}
                  </div>

                  <div className="table-cell">
                    <div className="amount-info">
                      {formatCurrency(subscription.amount)}
                      <span className="billing-cycle">/mese</span>
                    </div>
                  </div>

                  <div className="table-cell">
                    <div className="period-info">
                      <div>{formatDate(subscription.current_period_start)}</div>
                      <div>{formatDate(subscription.current_period_end)}</div>
                    </div>
                  </div>

                  <div className="table-cell">
                    <div className="next-billing">
                      {subscription.status === 'active' ? (
                        <>
                          <Calendar size={14} />
                          {formatDate(subscription.current_period_end)}
                        </>
                      ) : (
                        <span className="no-billing">-</span>
                      )}
                    </div>
                  </div>

                  <div className="table-cell">
                    <div className="actions-container">
                      <button className="action-btn" title="Visualizza dettagli">
                        <Eye size={16} />
                      </button>
                      <button className="action-btn" title="Invia promemoria">
                        <Mail size={16} />
                      </button>
                      <button className="action-btn" title="Altre azioni">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredSubscriptions.length === 0 && (
                <div className="empty-state">
                  <Package size={48} />
                  <h3>Nessun abbonamento trovato</h3>
                  <p>Non ci sono abbonamenti che corrispondono ai criteri di ricerca.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="invoices-section">
          <div className="invoices-table">
            <div className="table-header">
              <h3>Fatture Recenti ({invoices.length})</h3>
            </div>

            <div className="table-container">
              <div className="table-header-row">
                <div className="table-cell">Organizzazione</div>
                <div className="table-cell">Importo</div>
                <div className="table-cell">Stato</div>
                <div className="table-cell">Scadenza</div>
                <div className="table-cell">Pagata il</div>
                <div className="table-cell">Stripe ID</div>
                <div className="table-cell">Azioni</div>
              </div>

              {invoices.map((invoice) => (
                <div key={invoice.id} className="table-row">
                  <div className="table-cell">
                    <div className="org-info">
                      <Building2 size={16} />
                      <span className="org-name">{invoice.organization_name}</span>
                    </div>
                  </div>

                  <div className="table-cell">
                    <div className="amount">{formatCurrency(invoice.amount)}</div>
                  </div>

                  <div className="table-cell">
                    {getStatusBadge(invoice.status)}
                  </div>

                  <div className="table-cell">
                    <div className="date">{formatDate(invoice.due_date)}</div>
                  </div>

                  <div className="table-cell">
                    <div className="date">
                      {invoice.paid_at ? formatDate(invoice.paid_at) : '-'}
                    </div>
                  </div>

                  <div className="table-cell">
                    <div className="stripe-id">{invoice.stripe_invoice_id}</div>
                  </div>

                  <div className="table-cell">
                    <div className="actions-container">
                      <button className="action-btn" title="Visualizza fattura">
                        <Eye size={16} />
                      </button>
                      <button className="action-btn" title="Download PDF">
                        <Download size={16} />
                      </button>
                      <button className="action-btn" title="Altre azioni">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="analytics-section">
          <div className="analytics-grid">
            <div className="analytics-card">
              <h3>Crescita Ricavi</h3>
              <div className="chart-placeholder">
                <TrendingUp size={64} />
                <p>Grafico ricavi mensili</p>
                <p className="chart-note">Da implementare con Chart.js</p>
              </div>
            </div>

            <div className="analytics-card">
              <h3>Distribuzione Piani</h3>
              <div className="chart-placeholder">
                <Package size={64} />
                <p>Grafico distribuzione piani</p>
                <p className="chart-note">Da implementare con Chart.js</p>
              </div>
            </div>

            <div className="analytics-card">
              <h3>Tasso di Conversione</h3>
              <div className="metrics-list">
                <div className="metric-item">
                  <span className="metric-label">Trial → Paid</span>
                  <span className="metric-value">23.5%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Basic → Premium</span>
                  <span className="metric-value">12.8%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Premium → Enterprise</span>
                  <span className="metric-value">5.2%</span>
                </div>
              </div>
            </div>

            <div className="analytics-card">
              <h3>Metriche Chiave</h3>
              <div className="metrics-list">
                <div className="metric-item">
                  <span className="metric-label">MRR (Monthly Recurring Revenue)</span>
                  <span className="metric-value">{formatCurrency(stats.monthlyRevenue)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">ARR (Annual Recurring Revenue)</span>
                  <span className="metric-value">{formatCurrency(stats.totalRevenue)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">LTV (Lifetime Value)</span>
                  <span className="metric-value">{formatCurrency(stats.averageRevenuePerUser * 24)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BillingDashboard