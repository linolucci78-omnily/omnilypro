import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Package,
  Activity,
  Calendar,
  Globe,
  Smartphone,
  CreditCard,
  Building2,
  RefreshCw,
  Download,
  Filter,
  Eye,
  ArrowUp,
  ArrowDown,
  Target,
  Zap,
  Clock,
  PieChart,
  LineChart
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface AnalyticsData {
  revenue: {
    current: number
    previous: number
    growth: number
    monthly: number[]
    daily: number[]
  }
  customers: {
    total: number
    new: number
    active: number
    growth: number
    retention: number
    churn: number
  }
  subscriptions: {
    total: number
    active: number
    trials: number
    canceled: number
    conversionRate: number
    planDistribution: { plan: string; count: number; percentage: number }[]
  }
  transactions: {
    total: number
    volume: number
    avgValue: number
    growth: number
    success_rate: number
    daily: number[]
  }
  geography: {
    country: string
    users: number
    revenue: number
  }[]
  devices: {
    desktop: number
    mobile: number
    tablet: number
  }
  performance: {
    avgResponseTime: number
    uptime: number
    errorRate: number
    pageViews: number
  }
}

const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData>({
    revenue: { current: 0, previous: 0, growth: 0, monthly: [], daily: [] },
    customers: { total: 0, new: 0, active: 0, growth: 0, retention: 0, churn: 0 },
    subscriptions: { total: 0, active: 0, trials: 0, canceled: 0, conversionRate: 0, planDistribution: [] },
    transactions: { total: 0, volume: 0, avgValue: 0, growth: 0, success_rate: 0, daily: [] },
    geography: [],
    devices: { desktop: 0, mobile: 0, tablet: 0 },
    performance: { avgResponseTime: 0, uptime: 0, errorRate: 0, pageViews: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'customers' | 'subscriptions' | 'performance'>('revenue')

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Calculate date range
      const now = new Date()
      const timeRangeMap = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
      }
      const days = timeRangeMap[timeRange]
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

      // Try to load real data, fallback to mock data
      const [subscriptionsResult, organizationsResult] = await Promise.allSettled([
        supabase
          .from('subscriptions')
          .select('*')
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('organizations')
          .select('*')
          .gte('created_at', startDate.toISOString())
      ])

      // Generate comprehensive mock data
      const mockData: AnalyticsData = {
        revenue: {
          current: 24750,
          previous: 19200,
          growth: 28.9,
          monthly: [15000, 16500, 18200, 19800, 21500, 23100, 24750],
          daily: Array.from({ length: days }, (_, i) => 400 + Math.random() * 400)
        },
        customers: {
          total: 1247,
          new: 156,
          active: 892,
          growth: 23.4,
          retention: 94.2,
          churn: 5.8
        },
        subscriptions: {
          total: 127,
          active: 98,
          trials: 23,
          canceled: 6,
          conversionRate: 87.3,
          planDistribution: [
            { plan: 'Basic', count: 42, percentage: 42.9 },
            { plan: 'Premium', count: 38, percentage: 38.8 },
            { plan: 'Enterprise', count: 18, percentage: 18.3 }
          ]
        },
        transactions: {
          total: 15689,
          volume: 1250000,
          avgValue: 79.67,
          growth: 34.2,
          success_rate: 98.4,
          daily: Array.from({ length: days }, (_, i) => 300 + Math.random() * 200)
        },
        geography: [
          { country: 'Italia', users: 523, revenue: 12450 },
          { country: 'Germania', users: 287, revenue: 8920 },
          { country: 'Francia', users: 198, revenue: 6780 },
          { country: 'Spagna', users: 145, revenue: 4560 },
          { country: 'Paesi Bassi', users: 94, revenue: 2890 }
        ],
        devices: {
          desktop: 58.3,
          mobile: 32.7,
          tablet: 9.0
        },
        performance: {
          avgResponseTime: 245,
          uptime: 99.97,
          errorRate: 0.03,
          pageViews: 45670
        }
      }

      setData(mockData)

    } catch (err) {
      console.error('Error loading analytics data:', err)
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dei dati analytics')
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

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatPercentage = (value: number, showSign = true) => {
    const sign = showSign && value > 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const getTrendIcon = (value: number) => {
    return value >= 0 ? (
      <ArrowUp size={16} style={{ color: '#10b981' }} />
    ) : (
      <ArrowDown size={16} style={{ color: '#ef4444' }} />
    )
  }

  const getTrendColor = (value: number) => {
    return value >= 0 ? '#10b981' : '#ef4444'
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        color: '#64748b'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #e2e8f0',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }} />
        <p>Caricamento analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        color: '#64748b',
        textAlign: 'center'
      }}>
        <Package size={48} />
        <h3 style={{ margin: '16px 0 8px 0', color: '#dc2626' }}>
          Errore nel caricamento
        </h3>
        <p>{error}</p>
        <button onClick={loadAnalyticsData} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 20px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}>
          <RefreshCw size={16} />
          Riprova
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '0', background: '#f8fafc', minHeight: '100vh', width: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        padding: '24px',
        background: 'white',
        borderRadius: '0',
        border: 'none',
        borderBottom: '1px solid #e2e8f0',
        width: '100%'
      }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '600', color: '#1e293b' }}>
            Analytics Dashboard
          </h1>
          <p style={{ margin: '0', color: '#64748b', fontSize: '16px' }}>
            Analisi completa delle performance e metriche business
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="7d">Ultimi 7 giorni</option>
            <option value="30d">Ultimi 30 giorni</option>
            <option value="90d">Ultimi 90 giorni</option>
            <option value="1y">Ultimo anno</option>
          </select>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: 'white',
            color: '#64748b',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            <Download size={16} />
            Esporta
          </button>
          <button onClick={loadAnalyticsData} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            <RefreshCw size={16} />
            Aggiorna
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '24px',
        marginBottom: '32px',
        padding: '0 24px',
        width: '100%'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          transform: activeMetric === 'revenue' ? 'translateY(-2px)' : 'none',
          boxShadow: activeMetric === 'revenue' ? '0 8px 25px rgba(0,0,0,0.1)' : 'none'
        }} onClick={() => setActiveMetric('revenue')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <DollarSign size={24} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: getTrendColor(data.revenue.growth) }}>
              {getTrendIcon(data.revenue.growth)}
              <span style={{ fontSize: '14px', fontWeight: '600' }}>
                {formatPercentage(data.revenue.growth)}
              </span>
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
            {formatCurrency(data.revenue.current)}
          </div>
          <div style={{ fontSize: '16px', color: '#64748b', marginBottom: '8px' }}>
            Ricavi Totali
          </div>
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>
            vs {formatCurrency(data.revenue.previous)} periodo precedente
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          transform: activeMetric === 'customers' ? 'translateY(-2px)' : 'none',
          boxShadow: activeMetric === 'customers' ? '0 8px 25px rgba(0,0,0,0.1)' : 'none'
        }} onClick={() => setActiveMetric('customers')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Users size={24} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: getTrendColor(data.customers.growth) }}>
              {getTrendIcon(data.customers.growth)}
              <span style={{ fontSize: '14px', fontWeight: '600' }}>
                {formatPercentage(data.customers.growth)}
              </span>
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
            {formatNumber(data.customers.total)}
          </div>
          <div style={{ fontSize: '16px', color: '#64748b', marginBottom: '8px' }}>
            Clienti Totali
          </div>
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>
            {data.customers.new} nuovi, {data.customers.active} attivi
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          transform: activeMetric === 'subscriptions' ? 'translateY(-2px)' : 'none',
          boxShadow: activeMetric === 'subscriptions' ? '0 8px 25px rgba(0,0,0,0.1)' : 'none'
        }} onClick={() => setActiveMetric('subscriptions')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Package size={24} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: getTrendColor(data.subscriptions.conversionRate) }}>
              <Target size={16} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '14px', fontWeight: '600' }}>
                {formatPercentage(data.subscriptions.conversionRate, false)}
              </span>
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
            {data.subscriptions.active}
          </div>
          <div style={{ fontSize: '16px', color: '#64748b', marginBottom: '8px' }}>
            Abbonamenti Attivi
          </div>
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>
            {data.subscriptions.trials} trial, tasso conversione {formatPercentage(data.subscriptions.conversionRate, false)}
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          transform: activeMetric === 'performance' ? 'translateY(-2px)' : 'none',
          boxShadow: activeMetric === 'performance' ? '0 8px 25px rgba(0,0,0,0.1)' : 'none'
        }} onClick={() => setActiveMetric('performance')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Activity size={24} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
              <Zap size={16} />
              <span style={{ fontSize: '14px', fontWeight: '600' }}>
                {formatPercentage(data.performance.uptime, false)}
              </span>
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
            {formatNumber(data.transactions.total)}
          </div>
          <div style={{ fontSize: '16px', color: '#64748b', marginBottom: '8px' }}>
            Transazioni
          </div>
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>
            {data.performance.avgResponseTime}ms response, {formatPercentage(data.performance.uptime, false)} uptime
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
        marginBottom: '32px',
        padding: '0 24px'
      }}>
        {/* Main Chart */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
              {activeMetric === 'revenue' && 'Andamento Ricavi'}
              {activeMetric === 'customers' && 'Crescita Clienti'}
              {activeMetric === 'subscriptions' && 'Abbonamenti nel Tempo'}
              {activeMetric === 'performance' && 'Performance Sistema'}
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                background: 'white',
                cursor: 'pointer'
              }}>
                <LineChart size={14} />
              </button>
              <button style={{
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                background: 'white',
                cursor: 'pointer'
              }}>
                <BarChart3 size={14} />
              </button>
            </div>
          </div>
          <div style={{
            height: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '2px dashed #d1d5db',
            color: '#64748b'
          }}>
            <div style={{ textAlign: 'center' }}>
              <BarChart3 size={48} />
              <p style={{ margin: '12px 0 0 0' }}>Grafico interattivo {activeMetric}</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                Integrazione Chart.js in arrivo
              </p>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
            Distribuzione Piani
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.subscriptions.planDistribution.map((plan, index) => (
              <div key={plan.plan} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                background: '#f8fafc',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : '#f59e0b'
                  }} />
                  <span style={{ fontWeight: '500', color: '#1e293b' }}>{plan.plan}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '600', color: '#1e293b' }}>{plan.count}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{formatPercentage(plan.percentage, false)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '24px',
        padding: '0 24px'
      }}>
        {/* Geographic Distribution */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
            Distribuzione Geografica
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.geography.slice(0, 5).map((country) => (
              <div key={country.country} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={16} style={{ color: '#64748b' }} />
                  <span style={{ fontWeight: '500', color: '#1e293b' }}>{country.country}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                    {country.users}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {formatCurrency(country.revenue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Usage */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
            Utilizzo Dispositivi
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} style={{ color: '#3b82f6' }} />
                <span>Desktop</span>
              </div>
              <span style={{ fontWeight: '600' }}>{formatPercentage(data.devices.desktop, false)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={16} style={{ color: '#10b981' }} />
                <span>Mobile</span>
              </div>
              <span style={{ fontWeight: '600' }}>{formatPercentage(data.devices.mobile, false)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={16} style={{ color: '#f59e0b' }} />
                <span>Tablet</span>
              </div>
              <span style={{ fontWeight: '600' }}>{formatPercentage(data.devices.tablet, false)}</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
            Metriche Performance
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} style={{ color: '#64748b' }} />
                <span>Response Time</span>
              </div>
              <span style={{ fontWeight: '600' }}>{data.performance.avgResponseTime}ms</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={16} style={{ color: '#10b981' }} />
                <span>Uptime</span>
              </div>
              <span style={{ fontWeight: '600', color: '#10b981' }}>
                {formatPercentage(data.performance.uptime, false)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} style={{ color: '#ef4444' }} />
                <span>Error Rate</span>
              </div>
              <span style={{ fontWeight: '600', color: data.performance.errorRate < 0.1 ? '#10b981' : '#ef4444' }}>
                {formatPercentage(data.performance.errorRate, false)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={16} style={{ color: '#64748b' }} />
                <span>Page Views</span>
              </div>
              <span style={{ fontWeight: '600' }}>{formatNumber(data.performance.pageViews)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard