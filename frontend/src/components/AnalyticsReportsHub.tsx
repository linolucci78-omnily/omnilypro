import React, { useState, useEffect } from 'react'
import {
  TrendingUp, TrendingDown, Users, ShoppingCart, Euro, Target,
  Calendar, Download, Filter, BarChart3, PieChart, LineChart,
  Award, Package, CreditCard, ArrowUp, ArrowDown, Percent,
  Clock, Star, Gift, Mail, Smartphone, Activity, FileText,
  RefreshCw, AlertCircle, CheckCircle, Zap, Bell, Loader, X
} from 'lucide-react'
import {
  LineChart as RechartsLine, Line, AreaChart, Area,
  BarChart as RechartsBar, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { analyticsService, type AnalyticsDashboard, type AIInsights } from '../services/analyticsService'
import './AnalyticsReportsHub.css'

interface AnalyticsReportsHubProps {
  organizationId: string
  organizationName: string
  primaryColor: string
  secondaryColor: string
}

const AnalyticsReportsHub: React.FC<AnalyticsReportsHubProps> = ({
  organizationId,
  organizationName,
  primaryColor,
  secondaryColor
}) => {
  const [timeRange, setTimeRange] = useState<7 | 30 | 90 | 365>(30)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsDashboard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCustomReports, setShowCustomReports] = useState(false)
  const [showAIInsights, setShowAIInsights] = useState(false)
  const [realtimeMode, setRealtimeMode] = useState(false)
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)

  const timeRanges = [
    { value: 7, label: 'Ultimi 7 giorni' },
    { value: 30, label: 'Ultimi 30 giorni' },
    { value: 90, label: 'Ultimi 90 giorni' },
    { value: 365, label: 'Ultimo anno' }
  ]

  useEffect(() => {
    loadData()
  }, [organizationId, timeRange])

  // Real-time auto-refresh
  useEffect(() => {
    if (!realtimeMode) return

    const interval = setInterval(() => {
      loadData()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [realtimeMode, organizationId, timeRange])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const dashboard = await analyticsService.getDashboard(organizationId, timeRange)
      console.log('📊 Analytics Dashboard loaded:', dashboard)
      console.log('📈 Revenue chart data:', dashboard.revenueChart)
      setData(dashboard)
    } catch (err) {
      console.error('Error loading analytics:', err)
      setError('Errore nel caricamento dei dati analytics')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const loadAIInsights = async () => {
    try {
      setLoadingInsights(true)
      const insights = await analyticsService.getAIInsights(organizationId, timeRange)
      setAiInsights(insights)
    } catch (err) {
      console.error('Error loading AI insights:', err)
    } finally {
      setLoadingInsights(false)
    }
  }

  const openAIInsights = () => {
    setShowAIInsights(true)
    if (!aiInsights) {
      loadAIInsights()
    }
  }

  const exportRevenueChart = () => {
    if (!data) return

    let csvContent = `Andamento Revenue - ${organizationName}\n`
    csvContent += `Periodo: Ultimi ${timeRange} giorni\n`
    csvContent += `Data Export: ${new Date().toLocaleDateString('it-IT')}\n\n`
    csvContent += `Data,Revenue (€),Transazioni\n`

    data.revenueChart.forEach(point => {
      csvContent += `${point.date},${point.revenue},${point.transactions}\n`
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `revenue_trend_${organizationName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToCSV = () => {
    if (!data) return

    // Prepare CSV content
    let csvContent = `Analytics Report - ${organizationName}\n`
    csvContent += `Periodo: Ultimi ${timeRange} giorni\n`
    csvContent += `Data Export: ${new Date().toLocaleDateString('it-IT')}\n\n`

    // KPI Section
    csvContent += `KPI,Valore,Variazione %\n`
    csvContent += `Revenue Totale,${data.kpi.totalRevenue},${data.kpi.revenueChange}\n`
    csvContent += `Clienti Attivi,${data.kpi.activeCustomers},${data.kpi.customersChange}\n`
    csvContent += `Transazioni,${data.kpi.totalTransactions},${data.kpi.transactionsChange}\n`
    csvContent += `Scontrino Medio,${data.kpi.averageTicket},${data.kpi.ticketChange}\n`
    csvContent += `Punti Distribuiti,${data.kpi.pointsDistributed},${data.kpi.pointsChange}\n`
    csvContent += `Premi Riscattati,${data.kpi.rewardsRedeemed},${data.kpi.rewardsChange}\n`
    csvContent += `Tasso Retention,${data.kpi.retentionRate}%,${data.kpi.retentionChange}\n`
    csvContent += `Customer LTV,${data.kpi.customerLTV},${data.kpi.ltvChange}\n\n`

    // Top Products
    if (data.topProducts.length > 0) {
      csvContent += `Top Prodotti\n`
      csvContent += `Posizione,Nome,Vendite,Revenue,Trend %\n`
      data.topProducts.forEach((product, index) => {
        csvContent += `${index + 1},${product.name},${product.sales},${product.revenue},${product.trend}\n`
      })
      csvContent += `\n`
    }

    // Category Revenue
    if (data.categoryRevenue.length > 0) {
      csvContent += `Revenue per Categoria\n`
      csvContent += `Categoria,Revenue,Percentuale,Transazioni\n`
      data.categoryRevenue.forEach(cat => {
        csvContent += `${cat.name},${cat.revenue},${cat.percentage}%,${cat.transactions}\n`
      })
      csvContent += `\n`
    }

    // Campaign Performance
    if (data.campaignPerformance.length > 0) {
      csvContent += `Performance Campagne\n`
      csvContent += `Campagna,Inviate,Aperte,Click,Open Rate %,Click Rate %,Conversion Rate %\n`
      data.campaignPerformance.forEach(campaign => {
        csvContent += `${campaign.name},${campaign.sent},${campaign.opened},${campaign.clicked},${campaign.openRate.toFixed(1)},${campaign.clickRate.toFixed(1)},${campaign.conversionRate.toFixed(1)}\n`
      })
      csvContent += `\n`
    }

    // Revenue Chart Data
    csvContent += `Andamento Revenue Giornaliero\n`
    csvContent += `Data,Revenue,Transazioni\n`
    data.revenueChart.forEach(point => {
      csvContent += `${point.date},${point.revenue},${point.transactions}\n`
    })

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `analytics_report_${organizationName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const CHART_COLORS = [primaryColor, secondaryColor, '#3b82f6', '#10b981', '#f59e0b', '#ec4899']

  if (loading && !data) {
    return (
      <div className="analytics-reports-hub" style={{'--primary-color': primaryColor} as React.CSSProperties}>
        <div className="analytics-loading">
          <Loader size={48} className="spinning" />
          <p>Caricamento analytics in corso...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="analytics-reports-hub" style={{'--primary-color': primaryColor} as React.CSSProperties}>
        <div className="analytics-error">
          <AlertCircle size={48} />
          <p>{error}</p>
          <button onClick={loadData} className="analytics-export-btn">
            <RefreshCw size={20} />
            Riprova
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const kpiCards = [
    {
      label: 'Revenue Totale',
      value: formatCurrency(data.kpi.totalRevenue),
      change: data.kpi.revenueChange,
      changeLabel: `${formatCurrency(data.kpi.totalRevenue * data.kpi.revenueChange / 100)} vs periodo precedente`,
      icon: <Euro size={28} />,
      color: '#10b981'
    },
    {
      label: 'Clienti Attivi',
      value: data.kpi.activeCustomers.toString(),
      change: data.kpi.customersChange,
      changeLabel: `${Math.abs(Math.round(data.kpi.activeCustomers * data.kpi.customersChange / 100))} ${data.kpi.customersChange >= 0 ? 'nuovi' : 'in meno'}`,
      icon: <Users size={28} />,
      color: '#3b82f6'
    },
    {
      label: 'Transazioni',
      value: data.kpi.totalTransactions.toString(),
      change: data.kpi.transactionsChange,
      changeLabel: `${Math.abs(Math.round(data.kpi.totalTransactions * data.kpi.transactionsChange / 100))} transazioni`,
      icon: <ShoppingCart size={28} />,
      color: '#f59e0b'
    },
    {
      label: 'Scontrino Medio',
      value: formatCurrency(data.kpi.averageTicket),
      change: data.kpi.ticketChange,
      changeLabel: `${formatCurrency(data.kpi.averageTicket * data.kpi.ticketChange / 100)} vs media`,
      icon: <Target size={28} />,
      color: '#ec4899'
    },
    {
      label: 'Punti Distribuiti',
      value: data.kpi.pointsDistributed.toLocaleString('it-IT'),
      change: data.kpi.pointsChange,
      changeLabel: `${Math.round(data.kpi.pointsDistributed * data.kpi.pointsChange / 100).toLocaleString('it-IT')} punti`,
      icon: <Award size={28} />,
      color: '#8b5cf6'
    },
    {
      label: 'Premi Riscattati',
      value: data.kpi.rewardsRedeemed.toString(),
      change: data.kpi.rewardsChange,
      changeLabel: `${Math.abs(Math.round(data.kpi.rewardsRedeemed * data.kpi.rewardsChange / 100))} riscatti`,
      icon: <Gift size={28} />,
      color: '#ef4444'
    },
    {
      label: 'Tasso Retention',
      value: `${data.kpi.retentionRate.toFixed(1)}%`,
      change: data.kpi.retentionChange,
      changeLabel: `${formatPercentage(data.kpi.retentionChange)} vs trimestre`,
      icon: <Percent size={28} />,
      color: '#06b6d4'
    },
    {
      label: 'Customer LTV',
      value: formatCurrency(data.kpi.customerLTV),
      change: data.kpi.ltvChange,
      changeLabel: `${formatCurrency(data.kpi.customerLTV * data.kpi.ltvChange / 100)} lifetime value`,
      icon: <TrendingUp size={28} />,
      color: '#14b8a6'
    }
  ]

  return (
    <div
      className="analytics-reports-hub"
      style={{
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor
      } as React.CSSProperties}
    >
      {/* Header */}
      <div className="analytics-hub-header">
        <div className="analytics-hub-header-content">
          <div className="analytics-hub-icon">
            <BarChart3 size={48} />
          </div>
          <div>
            <h1>Analytics & Report</h1>
            <p>Dashboard completa con metriche, KPI e analisi dettagliate</p>
          </div>
        </div>
        <div className="analytics-hub-actions">
          <select
            className="analytics-time-select"
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value) as any)}
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <button className="analytics-export-btn" onClick={exportToCSV}>
            <Download size={20} />
            Esporta Report
          </button>
          <button className="analytics-refresh-btn" onClick={loadData} disabled={loading}>
            <RefreshCw size={20} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="analytics-kpi-section">
        <h2>
          <Activity size={24} />
          Key Performance Indicators
        </h2>
        <div className="analytics-kpi-grid">
          {kpiCards.map((kpi, index) => (
            <div key={index} className="analytics-kpi-card">
              <div className="analytics-kpi-header">
                <div className="analytics-kpi-icon" style={{ background: kpi.color }}>
                  {kpi.icon}
                </div>
                <div className="analytics-kpi-trend">
                  {kpi.change >= 0 ? (
                    <ArrowUp size={20} style={{ color: '#10b981' }} />
                  ) : (
                    <ArrowDown size={20} style={{ color: '#ef4444' }} />
                  )}
                  <span style={{ color: kpi.change >= 0 ? '#10b981' : '#ef4444' }}>
                    {formatPercentage(kpi.change)}
                  </span>
                </div>
              </div>
              <div className="analytics-kpi-content">
                <div className="analytics-kpi-value">{kpi.value}</div>
                <div className="analytics-kpi-label">{kpi.label}</div>
                <div className="analytics-kpi-change">{kpi.changeLabel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="analytics-charts-section">
        {/* Revenue Trend Chart */}
        <div className="analytics-chart-card analytics-chart-large">
          <div className="analytics-chart-header">
            <div>
              <h3>
                <LineChart size={20} />
                Andamento Revenue
              </h3>
              <p>Trend vendite negli ultimi {timeRange} giorni</p>
            </div>
            <button className="analytics-chart-action" onClick={exportRevenueChart}>
              <Download size={16} />
              Export
            </button>
          </div>
          <div className="analytics-chart-container">
            {data?.revenueChart && data.revenueChart.length > 0 ? (
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <AreaChart data={data.revenueChart} width={800} height={300} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={primaryColor || '#dc2626'} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={primaryColor || '#dc2626'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(value) => {
                      try {
                        return new Date(value).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
                      } catch (e) {
                        return value
                      }
                    }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(value) => `€${value}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                    labelFormatter={(label) => {
                      try {
                        return new Date(label).toLocaleDateString('it-IT')
                      } catch (e) {
                        return label
                      }
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={primaryColor || '#dc2626'}
                    strokeWidth={3}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p>Nessun dato disponibile per il periodo selezionato</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>
                  Aggiungi transazioni per vedere il grafico revenue
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Category Revenue */}
        <div className="analytics-chart-card">
          <div className="analytics-chart-header">
            <div>
              <h3>
                <PieChart size={20} />
                Revenue per Categoria
              </h3>
              <p>Distribuzione vendite</p>
            </div>
          </div>
          <div className="analytics-categories-list">
            {data.categoryRevenue.map((cat, index) => (
              <div key={index} className="analytics-category-item">
                <div className="analytics-category-info">
                  <span className="analytics-category-name">{cat.name}</span>
                  <span className="analytics-category-revenue">{formatCurrency(cat.revenue)}</span>
                </div>
                <div className="analytics-category-bar-container">
                  <div
                    className="analytics-category-bar"
                    style={{ width: `${cat.percentage}%`, background: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                </div>
                <span className="analytics-category-percentage">{cat.percentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products */}
      {data.topProducts.length > 0 && (
        <div className="analytics-products-section">
          <h2>
            <Package size={24} />
            Top {data.topProducts.length} Prodotti Più Venduti
          </h2>
          <div className="analytics-products-table">
            <div className="analytics-table-header">
              <div>Prodotto</div>
              <div>Vendite</div>
              <div>Revenue</div>
              <div>Trend</div>
            </div>
            {data.topProducts.map((product, index) => (
              <div key={index} className="analytics-table-row">
                <div className="analytics-product-name">
                  <div className="analytics-product-rank">#{index + 1}</div>
                  {product.name}
                </div>
                <div className="analytics-product-sales">{product.sales}</div>
                <div className="analytics-product-revenue">{formatCurrency(product.revenue)}</div>
                <div className="analytics-product-trend">
                  {product.trend >= 0 ? (
                    <span className="trend-positive">
                      <ArrowUp size={16} /> {product.trend.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="trend-negative">
                      <ArrowDown size={16} /> {Math.abs(product.trend).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaign Performance */}
      {data.campaignPerformance.length > 0 && (
        <div className="analytics-campaigns-section">
          <h2>
            <Mail size={24} />
            Performance Campagne Marketing
          </h2>
          <div className="analytics-campaigns-table">
            <div className="analytics-table-header">
              <div>Campagna</div>
              <div>Inviate</div>
              <div>Aperte</div>
              <div>Click</div>
              <div>Conversion</div>
            </div>
            {data.campaignPerformance.map((campaign, index) => (
              <div key={index} className="analytics-table-row">
                <div className="analytics-campaign-name">
                  <Mail size={16} />
                  {campaign.name}
                </div>
                <div>{campaign.sent}</div>
                <div>
                  <span className="analytics-metric-highlight">{campaign.opened}</span>
                  <small>({campaign.openRate.toFixed(1)}%)</small>
                </div>
                <div>
                  <span className="analytics-metric-highlight">{campaign.clicked}</span>
                  <small>({campaign.clickRate.toFixed(1)}%)</small>
                </div>
                <div className="analytics-conversion-badge">{campaign.conversionRate.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Cards */}
      <div className="analytics-action-cards">
        <div
          className="analytics-action-card analytics-action-card-primary"
          onClick={() => setShowCustomReports(true)}
          style={{ cursor: 'pointer' }}
        >
          <div className="analytics-action-icon">
            <FileText size={32} />
          </div>
          <div className="analytics-action-content">
            <h3>Report Personalizzati</h3>
            <p>Crea report su misura per le tue esigenze</p>
            <ul className="analytics-action-features">
              <li><Filter size={16} />Filtri avanzati</li>
              <li><Calendar size={16} />Periodi personalizzati</li>
              <li><Download size={16} />Export Excel/PDF</li>
              <li><Clock size={16} />Report programmati</li>
            </ul>
          </div>
          <div className="active-badge">Attiva</div>
        </div>

        <div
          className="analytics-action-card analytics-action-card-secondary"
          onClick={openAIInsights}
          style={{ cursor: 'pointer' }}
        >
          <div className="analytics-action-icon">
            <Zap size={32} />
          </div>
          <div className="analytics-action-content">
            <h3>Insights AI</h3>
            <p>Analisi intelligente con machine learning</p>
            <ul className="analytics-action-features">
              <li><TrendingUp size={16} />Previsioni vendite</li>
              <li><Users size={16} />Segmentazione clienti</li>
              <li><AlertCircle size={16} />Anomaly detection</li>
              <li><Star size={16} />Raccomandazioni</li>
            </ul>
          </div>
          <div className="active-badge">Attiva</div>
        </div>

        <div
          className="analytics-action-card analytics-action-card-tertiary"
          onClick={() => setRealtimeMode(!realtimeMode)}
          style={{ cursor: 'pointer' }}
        >
          <div className="analytics-action-icon">
            <Activity size={32} />
          </div>
          <div className="analytics-action-content">
            <h3>Real-Time Dashboard</h3>
            <p>Monitoraggio live delle performance</p>
            <ul className="analytics-action-features">
              <li><RefreshCw size={16} />Aggiornamento real-time</li>
              <li><BarChart3 size={16} />Grafici interattivi</li>
              <li><Bell size={16} />Alert automatici</li>
              <li><Smartphone size={16} />Mobile responsive</li>
            </ul>
          </div>
          {realtimeMode ? (
            <div className="active-badge" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>LIVE</div>
          ) : (
            <div className="active-badge">Attiva</div>
          )}
        </div>
      </div>

      {/* Custom Reports Modal */}
      {showCustomReports && (
        <div className="analytics-modal-overlay" onClick={() => setShowCustomReports(false)}>
          <div className="analytics-modal" onClick={(e) => e.stopPropagation()}>
            <div className="analytics-modal-header">
              <h2>
                <FileText size={28} />
                Report Personalizzato
              </h2>
              <button className="analytics-modal-close" onClick={() => setShowCustomReports(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="analytics-modal-body">
              <div className="analytics-custom-report-form">
                <div className="form-section">
                  <label>Seleziona KPI da Includere:</label>
                  <div className="toggle-grid">
                    <div className="toggle-item">
                      <span>Revenue Totale</span>
                      <label className="toggle-switch">
                        <input type="checkbox" defaultChecked />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="toggle-item">
                      <span>Clienti Attivi</span>
                      <label className="toggle-switch">
                        <input type="checkbox" defaultChecked />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="toggle-item">
                      <span>Transazioni</span>
                      <label className="toggle-switch">
                        <input type="checkbox" defaultChecked />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="toggle-item">
                      <span>Scontrino Medio</span>
                      <label className="toggle-switch">
                        <input type="checkbox" defaultChecked />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="toggle-item">
                      <span>Punti Distribuiti</span>
                      <label className="toggle-switch">
                        <input type="checkbox" defaultChecked />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="toggle-item">
                      <span>Premi Riscattati</span>
                      <label className="toggle-switch">
                        <input type="checkbox" defaultChecked />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="toggle-item">
                      <span>Retention Rate</span>
                      <label className="toggle-switch">
                        <input type="checkbox" />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="toggle-item">
                      <span>Customer LTV</span>
                      <label className="toggle-switch">
                        <input type="checkbox" />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <label>Periodo Personalizzato:</label>
                  <div className="date-range">
                    <input type="date" className="analytics-input" />
                    <span>a</span>
                    <input type="date" className="analytics-input" />
                  </div>
                </div>

                <div className="form-section">
                  <label>Formato Export:</label>
                  <select className="analytics-input">
                    <option>CSV</option>
                    <option>Excel (XLSX)</option>
                    <option>PDF</option>
                  </select>
                </div>

                <div className="form-section">
                  <label>Frequenza Report (opzionale):</label>
                  <select className="analytics-input">
                    <option value="">Una tantum</option>
                    <option>Giornaliero</option>
                    <option>Settimanale</option>
                    <option>Mensile</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="analytics-modal-footer">
              <button className="analytics-btn-secondary" onClick={() => setShowCustomReports(false)}>
                Annulla
              </button>
              <button className="analytics-btn-primary" onClick={() => { exportToCSV(); setShowCustomReports(false); }}>
                <Download size={20} />
                Genera Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Modal */}
      {showAIInsights && (
        <div className="analytics-modal-overlay" onClick={() => setShowAIInsights(false)}>
          <div className="analytics-modal analytics-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="analytics-modal-header">
              <h2>
                <Zap size={28} />
                Insights AI
              </h2>
              <button className="analytics-modal-close" onClick={() => setShowAIInsights(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="analytics-modal-body">
              {loadingInsights ? (
                <div className="analytics-loading">
                  <Loader size={48} className="spinning" />
                  <p>Caricamento AI Insights...</p>
                </div>
              ) : aiInsights ? (
                <>
                  {/* Anomalies */}
                  {aiInsights.anomalies.length > 0 && (
                    <div className="ai-section">
                      <h3><AlertCircle size={22} /> Anomalie Rilevate</h3>
                      <div className="ai-anomalies">
                        {aiInsights.anomalies.map((anomaly, index) => (
                          <div key={index} className={`ai-anomaly-card ai-anomaly-${anomaly.type}`}>
                            <div className="ai-anomaly-header">
                              <AlertCircle size={24} />
                              <div>
                                <div className="ai-anomaly-title">{anomaly.title}</div>
                                <div className="ai-anomaly-metric">{anomaly.metric}</div>
                              </div>
                            </div>
                            <div className="ai-anomaly-description">{anomaly.description}</div>
                            <div className="ai-anomaly-values">
                              <span>Valore: {anomaly.value.toFixed(1)}</span>
                              <span>Soglia: {anomaly.threshold}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Predictions */}
                  <div className="ai-section">
                    <h3><TrendingUp size={22} /> Previsioni</h3>
                    <div className="ai-predictions-grid">
                      <div className="ai-prediction-card">
                        <div className="ai-prediction-label">Revenue Prossimo Mese</div>
                        <div className="ai-prediction-value">{formatCurrency(aiInsights.predictions.nextMonthRevenue)}</div>
                        <div className="ai-prediction-change">
                          Trend: {formatPercentage(aiInsights.predictions.growthRate)}
                        </div>
                      </div>
                      <div className="ai-prediction-card">
                        <div className="ai-prediction-label">Clienti Attivi Previsti</div>
                        <div className="ai-prediction-value">{aiInsights.predictions.nextMonthCustomers}</div>
                        <div className="ai-prediction-change">
                          Basato su trend storico
                        </div>
                      </div>
                      <div className="ai-prediction-card">
                        <div className="ai-prediction-label">Rischio Churn</div>
                        <div className="ai-prediction-value">{aiInsights.predictions.churnRisk.toFixed(1)}%</div>
                        <div className="ai-prediction-change">
                          {aiInsights.predictions.churnRisk > 20 ? 'Richiede attenzione' : 'Nella norma'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Segments */}
                  <div className="ai-section">
                    <h3><Users size={22} /> Segmentazione Clienti Reale</h3>
                    <div className="ai-segments-grid">
                      {aiInsights.customerSegments.map((segment, index) => (
                        <div key={index} className="ai-segment-card" style={{ borderLeft: `4px solid ${segment.color}` }}>
                          <div className="ai-segment-name">{segment.name}</div>
                          <div className="ai-segment-count">{segment.count} clienti</div>
                          <div className="ai-segment-avg">Media spesa: {formatCurrency(segment.avgSpent)}</div>
                          <div className="ai-segment-total">Revenue totale: {formatCurrency(segment.totalRevenue)}</div>
                          <div className="ai-segment-desc">{segment.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="ai-section">
                    <h3><Star size={22} /> Raccomandazioni Intelligenti</h3>
                    <div className="ai-recommendations">
                      {aiInsights.recommendations.map((rec, index) => (
                        <div key={index} className="ai-recommendation-card">
                          <div className="ai-rec-header">
                            <div className="ai-rec-icon">
                              <CheckCircle size={24} />
                            </div>
                            <div>
                              <div className="ai-rec-title">{rec.title}</div>
                              <div className={`ai-rec-impact ai-rec-impact-${rec.impact}`}>
                                Impatto: {rec.impact === 'high' ? 'Alto' : rec.impact === 'medium' ? 'Medio' : 'Basso'}
                              </div>
                            </div>
                          </div>
                          <div className="ai-rec-description">{rec.description}</div>
                          <div className="ai-rec-action">
                            <strong>Piano d'azione:</strong> {rec.actionable}
                          </div>
                          <div className="ai-rec-category">Categoria: {rec.category}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="analytics-loading">
                  <p>Nessun dato disponibile</p>
                </div>
              )}
            </div>
            <div className="analytics-modal-footer">
              <button className="analytics-btn-primary" onClick={() => setShowAIInsights(false)}>
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalyticsReportsHub
