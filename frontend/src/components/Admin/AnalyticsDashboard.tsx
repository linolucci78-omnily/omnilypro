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
import PageLoader from '../UI/PageLoader'

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

interface SalesAgentStats {
  agent_id: string
  agent_name: string
  agent_email: string
  total_leads: number
  active_leads: number
  won_leads: number
  lost_leads: number
  conversion_rate: number
  pipeline_value: number
  won_value: number
  avg_deal_size: number
  avg_days_to_close: number
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
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'customers' | 'subscriptions' | 'performance' | 'sales_agents'>('revenue')
  const [salesAgents, setSalesAgents] = useState<SalesAgentStats[]>([])
  const [salesAgentsLoading, setSalesAgentsLoading] = useState(false)

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  useEffect(() => {
    if (activeMetric === 'sales_agents') {
      loadSalesAgentsData()
    }
  }, [activeMetric])

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
      const previousStartDate = new Date(now.getTime() - (days * 2) * 24 * 60 * 60 * 1000)

      console.log('📊 Loading Admin Analytics...', { timeRange, days, startDate: startDate.toISOString() })

      // ✅ LOAD REAL DATA FROM DATABASE

      // 💰 REVENUE & TRANSACTIONS - periodo corrente
      const { data: currentTransactions } = await supabase
        .from('transaction')
        .select('amount, created_at')
        .gte('created_at', startDate.toISOString())

      const totalRevenue = currentTransactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
      const totalTransactions = currentTransactions?.length || 0
      const avgValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

      // 💰 REVENUE & TRANSACTIONS - periodo precedente
      const { data: previousTransactions } = await supabase
        .from('transaction')
        .select('amount')
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString())

      const previousRevenue = previousTransactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
      const previousTotalTransactions = previousTransactions?.length || 0

      const revenueGrowth = previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0

      const transactionsGrowth = previousTotalTransactions > 0
        ? ((totalTransactions - previousTotalTransactions) / previousTotalTransactions) * 100
        : 0

      // 👥 CUSTOMERS
      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })

      const { count: newCustomers } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())

      const { count: activeCustomers } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .gte('updated_at', startDate.toISOString())

      const { count: previousNewCustomers } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString())

      const customersGrowth = previousNewCustomers && previousNewCustomers > 0
        ? ((newCustomers || 0) - previousNewCustomers) / previousNewCustomers * 100
        : 0

      // 📦 SUBSCRIPTIONS
      const { count: totalSubs } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })

      const { count: activeSubs } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')

      const { count: trialSubs } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'trial')

      const { count: canceledSubs } = await supabase
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'canceled')

      const conversionRate = totalSubs && totalSubs > 0
        ? (activeSubs || 0) / totalSubs * 100
        : 0

      // Plan distribution
      const { data: subscriptionsByPlan } = await supabase
        .from('subscriptions')
        .select('plan_id')
        .eq('status', 'active')

      const planDistribution: { plan: string; count: number; percentage: number }[] = []
      if (subscriptionsByPlan && subscriptionsByPlan.length > 0) {
        const planCounts = subscriptionsByPlan.reduce((acc, s) => {
          const plan = s.plan_id || 'Unknown'
          acc[plan] = (acc[plan] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        Object.entries(planCounts).forEach(([plan, count]) => {
          planDistribution.push({
            plan,
            count,
            percentage: (count / (activeSubs || 1)) * 100
          })
        })
      }

      // Aggregazioni giornaliere per grafici
      const dailyRevenue = new Map<string, number>()
      const dailyTransactions = new Map<string, number>()

      // Inizializza tutti i giorni
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]
        dailyRevenue.set(dateStr, 0)
        dailyTransactions.set(dateStr, 0)
      }

      // Popola con dati reali
      currentTransactions?.forEach(t => {
        const dateStr = t.created_at.split('T')[0]
        dailyRevenue.set(dateStr, (dailyRevenue.get(dateStr) || 0) + (t.amount || 0))
        dailyTransactions.set(dateStr, (dailyTransactions.get(dateStr) || 0) + 1)
      })

      const realData: AnalyticsData = {
        revenue: {
          current: totalRevenue,
          previous: previousRevenue,
          growth: revenueGrowth,
          monthly: [], // TODO: calcolare per mese
          daily: Array.from(dailyRevenue.values())
        },
        customers: {
          total: totalCustomers || 0,
          new: newCustomers || 0,
          active: activeCustomers || 0,
          growth: customersGrowth,
          retention: 0, // TODO: calcolare retention reale
          churn: 0
        },
        subscriptions: {
          total: totalSubs || 0,
          active: activeSubs || 0,
          trials: trialSubs || 0,
          canceled: canceledSubs || 0,
          conversionRate,
          planDistribution
        },
        transactions: {
          total: totalTransactions,
          volume: totalRevenue,
          avgValue,
          growth: transactionsGrowth,
          success_rate: 100, // Assumiamo 100% success per ora
          daily: Array.from(dailyTransactions.values())
        },
        // ⚠️ Queste metriche richiedono tracking aggiuntivo non implementato
        geography: [],
        devices: {
          desktop: 0,
          mobile: 0,
          tablet: 0
        },
        performance: {
          avgResponseTime: 0,
          uptime: 0,
          errorRate: 0,
          pageViews: 0
        }
      }

      console.log('✅ Admin Analytics loaded:', {
        revenue: totalRevenue,
        customers: totalCustomers,
        transactions: totalTransactions
      })

      setData(realData)

    } catch (err) {
      console.error('Error loading analytics data:', err)
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dei dati analytics')
    } finally {
      setLoading(false)
    }
  }

  const loadSalesAgentsData = async () => {
    try {
      setSalesAgentsLoading(true)
      console.log('📊 Loading sales agents analytics...')

      // Get all sales agents from users table
      const { data: agents, error: agentsError } = await supabase
        .from('users')
        .select('id, email')
        .eq('role', 'sales_agent')
        .eq('is_active', true)

      if (agentsError) {
        console.error('Error loading agents:', agentsError)
        throw agentsError
      }

      if (!agents || agents.length === 0) {
        console.log('⚠️ No sales agents found')
        setSalesAgents([])
        return
      }

      console.log(`✅ Found ${agents.length} sales agents`)

      // Get all leads
      const { data: leads, error: leadsError } = await supabase
        .from('crm_leads')
        .select('*')

      if (leadsError) {
        console.error('Error loading leads:', leadsError)
        throw leadsError
      }

      console.log(`✅ Found ${leads?.length || 0} total leads`)

      // Calculate stats for each agent
      const agentStats: SalesAgentStats[] = agents.map(agent => {
        const agentLeads = leads?.filter(l => l.sales_agent_id === agent.id) || []
        const activeLeads = agentLeads.filter(l => !['won', 'lost'].includes(l.stage))
        const wonLeads = agentLeads.filter(l => l.stage === 'won')
        const lostLeads = agentLeads.filter(l => l.stage === 'lost')

        const pipelineValue = activeLeads.reduce((sum, l) => sum + (l.estimated_monthly_value || 0), 0)
        const wonValue = wonLeads.reduce((sum, l) => sum + (l.estimated_monthly_value || 0), 0)

        const totalClosed = wonLeads.length + lostLeads.length
        const conversionRate = totalClosed > 0 ? (wonLeads.length / totalClosed) * 100 : 0

        const avgDealSize = wonLeads.length > 0
          ? wonLeads.reduce((sum, l) => sum + (l.estimated_monthly_value || 0), 0) / wonLeads.length
          : 0

        // Calculate avg days to close for won leads
        const daysToClose = wonLeads
          .filter(l => l.won_at && l.created_at)
          .map(l => {
            const created = new Date(l.created_at)
            const won = new Date(l.won_at!)
            return Math.floor((won.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
          })

        const avgDaysToClose = daysToClose.length > 0
          ? daysToClose.reduce((sum, days) => sum + days, 0) / daysToClose.length
          : 0

        return {
          agent_id: agent.id,
          agent_name: agent.email.split('@')[0], // Use email username as name
          agent_email: agent.email,
          total_leads: agentLeads.length,
          active_leads: activeLeads.length,
          won_leads: wonLeads.length,
          lost_leads: lostLeads.length,
          conversion_rate: conversionRate,
          pipeline_value: pipelineValue,
          won_value: wonValue,
          avg_deal_size: avgDealSize,
          avg_days_to_close: avgDaysToClose
        }
      })

      // Sort by won_value descending
      agentStats.sort((a, b) => b.won_value - a.won_value)

      console.log('✅ Sales agents stats calculated:', agentStats)
      setSalesAgents(agentStats)

    } catch (err) {
      console.error('Error loading sales agents data:', err)
    } finally {
      setSalesAgentsLoading(false)
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
    return <PageLoader message="Caricamento analytics..." size="medium" />
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
    <div className="analytics-dashboard">
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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

        {/* Sales Agents Card */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          transform: activeMetric === 'sales_agents' ? 'translateY(-2px)' : 'none',
          boxShadow: activeMetric === 'sales_agents' ? '0 8px 25px rgba(0,0,0,0.1)' : 'none'
        }} onClick={() => setActiveMetric('sales_agents')}>
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
              <Target size={24} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
              <ArrowUp size={16} />
              <span style={{ fontSize: '14px', fontWeight: '600' }}>
                {salesAgents.length > 0
                  ? `${(salesAgents.reduce((sum, a) => sum + a.conversion_rate, 0) / salesAgents.length).toFixed(1)}%`
                  : '0%'}
              </span>
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>
            {salesAgents.length}
          </div>
          <div style={{ fontSize: '16px', color: '#64748b', marginBottom: '8px' }}>
            Agenti Vendita
          </div>
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>
            {salesAgents.reduce((sum, a) => sum + a.won_leads, 0)} deal chiusi, {formatCurrency(salesAgents.reduce((sum, a) => sum + a.pipeline_value, 0))} pipeline
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
              {activeMetric === 'sales_agents' && 'Performance Agenti Vendita'}
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
          {/* Sales Agents Table */}
          {activeMetric === 'sales_agents' ? (
            <div style={{ overflowX: 'auto' }}>
              {salesAgentsLoading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <RefreshCw size={32} className="spin" />
                  <p style={{ marginTop: '16px', color: '#64748b' }}>Caricamento dati agenti...</p>
                </div>
              ) : salesAgents.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <Target size={48} style={{ color: '#cbd5e1' }} />
                  <p style={{ marginTop: '16px', color: '#64748b' }}>Nessun agente di vendita trovato</p>
                  <p style={{ marginTop: '8px', fontSize: '14px', color: '#94a3b8' }}>
                    Crea il primo agente dalla sezione Gestione Utenti
                  </p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                        Agente
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                        Lead Totali
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                        Attivi
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                        Vinti
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                        Conv. Rate
                      </th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                        Pipeline Value
                      </th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                        Won Value
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                        Avg Days
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesAgents.map((agent, index) => (
                      <tr key={agent.agent_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: index === 0 ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' :
                                         index === 1 ? 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)' :
                                         index === 2 ? 'linear-gradient(135deg, #fdba74 0%, #fb923c 100%)' :
                                         'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '600',
                              fontSize: '14px'
                            }}>
                              #{index + 1}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', color: '#1e293b' }}>{agent.agent_name}</div>
                              <div style={{ fontSize: '13px', color: '#64748b' }}>{agent.agent_email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#1e293b' }}>
                          {agent.total_leads}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            background: '#dbeafe',
                            color: '#1e40af',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}>
                            {agent.active_leads}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            background: '#d1fae5',
                            color: '#065f46',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}>
                            {agent.won_leads}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <div style={{
                              width: '60px',
                              height: '8px',
                              background: '#f1f5f9',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${agent.conversion_rate}%`,
                                height: '100%',
                                background: agent.conversion_rate >= 70 ? '#10b981' :
                                          agent.conversion_rate >= 40 ? '#f59e0b' : '#ef4444',
                                borderRadius: '4px'
                              }} />
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                              {agent.conversion_rate.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>
                          {formatCurrency(agent.pipeline_value)}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                          {formatCurrency(agent.won_value)}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
                          {agent.avg_days_to_close > 0 ? `${agent.avg_days_to_close.toFixed(0)}d` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
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
          )}
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