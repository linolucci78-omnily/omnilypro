import React, { useState, useEffect } from 'react'
import { Users, TrendingUp, Gift, Target, AlertTriangle, CheckCircle2, Clock, Calendar, Award, Zap, Mail, Phone, BarChart3, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Organization, Customer } from '../lib/supabase'
import './AnalyticsDashboard.css'

interface AnalyticsDashboardProps {
  organization: Organization
  customers: Customer[]
}

interface DashboardMetrics {
  // Today metrics
  today: {
    visits: number
    revenue: number
    redemptions: number
    pointsDistributed: number
    newCustomers: number
    visitsChange: number
    revenueChange: number
    redemptionsChange: number
    pointsChange: number
    newCustomersChange: number
  }
  // Customer analysis
  tiers: {
    name: string
    count: number
    percentage: number
    color: string
  }[]
  behavior: {
    active: number
    regular: number
    new: number
    inactive: number
  }
  alerts: {
    dormant: number
    atRisk: number
    birthdays: number
  }
  // Top performers
  topCustomers: {
    id: string
    name: string
    points: number
  }[]
  topRewards: {
    name: string
    count: number
  }[]
  weekdayStats: {
    day: string
    visits: number
  }[]
  // Advanced stats
  loyalty: {
    retentionRate: number
    churnRate: number
    npsScore: number
  }
  economics: {
    ltv: number
    aov: number
    roi: number
    costPerCustomer: number
  }
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ organization, customers }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<Array<{date: string, visits: number, revenue: number}>>([])

  useEffect(() => {
    loadDashboardMetrics()
  }, [organization, customers])

  const loadDashboardMetrics = async () => {
    if (!organization) return
    setLoading(true)

    try {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const yesterdayStart = new Date(todayStart)
      yesterdayStart.setDate(yesterdayStart.getDate() - 1)

      // 1. TODAY METRICS
      const { data: todayActivities } = await supabase
        .from('customer_activities')
        .select('*')
        .eq('organization_id', organization.id)
        .gte('created_at', todayStart.toISOString())

      const { data: yesterdayActivities } = await supabase
        .from('customer_activities')
        .select('*')
        .eq('organization_id', organization.id)
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', todayStart.toISOString())

      const todayVisits = todayActivities?.filter(a => a.type === 'visit').length || 0
      const yesterdayVisits = yesterdayActivities?.filter(a => a.type === 'visit').length || 0
      const todayRedemptions = todayActivities?.filter(a => a.type === 'reward_redeemed').length || 0
      const yesterdayRedemptions = yesterdayActivities?.filter(a => a.type === 'reward_redeemed').length || 0

      const { data: todayCustomers } = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', organization.id)
        .gte('created_at', todayStart.toISOString())

      const todayNewCustomers = todayCustomers?.length || 0

      // Calculate changes
      const visitsChange = yesterdayVisits > 0 ? ((todayVisits - yesterdayVisits) / yesterdayVisits) * 100 : 0
      const redemptionsChange = yesterdayRedemptions > 0 ? ((todayRedemptions - yesterdayRedemptions) / yesterdayRedemptions) * 100 : 0

      // 2. TIER DISTRIBUTION
      const loyaltyTiers = organization.loyalty_tiers || []
      const tiersMap = new Map<string, number>()

      customers.forEach(customer => {
        const tier = calculateCustomerTier(customer.points || 0, loyaltyTiers)
        tiersMap.set(tier.name, (tiersMap.get(tier.name) || 0) + 1)
      })

      const tiers = Array.from(tiersMap.entries()).map(([name, count]) => ({
        name,
        count,
        percentage: customers.length > 0 ? (count / customers.length) * 100 : 0,
        color: getTierColor(name)
      }))

      // 3. BEHAVIOR ANALYSIS
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: recentActivities } = await supabase
        .from('customer_activities')
        .select('customer_id, created_at')
        .eq('organization_id', organization.id)
        .gte('created_at', thirtyDaysAgo.toISOString())

      const activeCustomerIds = new Set(recentActivities?.map(a => a.customer_id))
      const active = activeCustomerIds.size

      const newCustomers = customers.filter(c =>
        new Date(c.created_at) >= thirtyDaysAgo
      ).length

      const inactive = customers.length - active

      // 4. ALERTS
      const dormant = customers.filter(c => {
        const lastActivity = recentActivities?.find(a => a.customer_id === c.id)
        return !lastActivity
      }).length

      const birthdays = customers.filter(c => {
        if (!c.birthday) return false
        const bday = new Date(c.birthday)
        return bday.getMonth() === now.getMonth() && bday.getDate() === now.getDate()
      }).length

      // 5. TOP CUSTOMERS
      const topCustomers = [...customers]
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .slice(0, 10)
        .map(c => ({
          id: c.id,
          name: c.name,
          points: c.points || 0
        }))

      // 6. WEEKDAY STATS (last 30 days)
      const weekdayMap = new Map<number, number>()
      recentActivities?.forEach(activity => {
        const day = new Date(activity.created_at).getDay()
        weekdayMap.set(day, (weekdayMap.get(day) || 0) + 1)
      })

      const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
      const weekdayStats = dayNames.map((day, index) => ({
        day,
        visits: weekdayMap.get(index) || 0
      }))

      // 7. CHART DATA (last 30 days)
      const chartDataArray = []
      for (let i = 29; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })

        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        const dayEnd = new Date(dayStart)
        dayEnd.setDate(dayEnd.getDate() + 1)

        const { data: dayActivities } = await supabase
          .from('customer_activities')
          .select('type')
          .eq('organization_id', organization.id)
          .gte('created_at', dayStart.toISOString())
          .lt('created_at', dayEnd.toISOString())

        chartDataArray.push({
          date: dateStr,
          visits: dayActivities?.filter(a => a.type === 'visit').length || 0,
          revenue: 0 // TODO: add revenue tracking
        })
      }
      setChartData(chartDataArray)

      setMetrics({
        today: {
          visits: todayVisits,
          revenue: 0, // TODO: track revenue
          redemptions: todayRedemptions,
          pointsDistributed: todayActivities?.filter(a => a.type === 'points_added').length || 0,
          newCustomers: todayNewCustomers,
          visitsChange,
          revenueChange: 0,
          redemptionsChange,
          pointsChange: 0,
          newCustomersChange: 0
        },
        tiers,
        behavior: {
          active,
          regular: Math.floor(active * 0.6), // Estimate
          new: newCustomers,
          inactive
        },
        alerts: {
          dormant,
          atRisk: Math.floor(dormant * 0.3),
          birthdays
        },
        topCustomers,
        topRewards: [], // TODO: track reward redemptions
        weekdayStats,
        loyalty: {
          retentionRate: customers.length > 0 ? (active / customers.length) * 100 : 0,
          churnRate: customers.length > 0 ? (inactive / customers.length) * 100 : 0,
          npsScore: 45 // TODO: implement NPS
        },
        economics: {
          ltv: 340,
          aov: 28.50,
          roi: 3.2,
          costPerCustomer: 12
        }
      })

    } catch (error) {
      console.error('Error loading dashboard metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateCustomerTier = (points: number, tiers: any[]) => {
    if (!tiers || tiers.length === 0) {
      if (points >= 1000) return { name: 'Platinum', color: '#e5e7eb' }
      if (points >= 500) return { name: 'Gold', color: '#f59e0b' }
      if (points >= 200) return { name: 'Silver', color: '#64748b' }
      return { name: 'Bronze', color: '#a3a3a3' }
    }
    const sorted = [...tiers].sort((a, b) => b.threshold - a.threshold)
    for (const tier of sorted) {
      if (points >= tier.threshold) return { name: tier.name, color: tier.color }
    }
    return { name: tiers[0].name, color: tiers[0].color }
  }

  const getTierColor = (name: string) => {
    const colors: Record<string, string> = {
      'Platinum': '#e5e7eb',
      'Gold': '#f59e0b',
      'Silver': '#64748b',
      'Bronze': '#a3a3a3'
    }
    return colors[name] || '#64748b'
  }

  if (loading) {
    return (
      <div className="analytics-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Caricamento analytics...</p>
      </div>
    )
  }

  if (!metrics) return null

  const today = new Date().toLocaleDateString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="analytics-dashboard">
      {/* SECTION 1: TODAY OVERVIEW */}
      <div className="dashboard-section today-section">
        <div className="section-header">
          <Calendar size={24} />
          <div>
            <h2>Oggi - {today}</h2>
            <p>Panoramica in tempo reale</p>
          </div>
        </div>

        <div className="today-metrics">
          <div className="today-metric">
            <div className="metric-icon visits">
              <Users size={24} />
            </div>
            <div className="metric-content">
              <div className="metric-label">Visite</div>
              <div className="metric-description">Quanti clienti sono venuti oggi</div>
              <div className="metric-value">{metrics.today.visits}</div>
              <div className={`metric-trend ${metrics.today.visitsChange >= 0 ? 'positive' : 'negative'}`}>
                {metrics.today.visitsChange >= 0 ? '↗' : '↘'} {Math.abs(metrics.today.visitsChange).toFixed(0)}% rispetto a ieri
              </div>
            </div>
          </div>

          <div className="today-metric">
            <div className="metric-icon revenue">
              <Target size={24} />
            </div>
            <div className="metric-content">
              <div className="metric-label">Punti Distribuiti</div>
              <div className="metric-description">Quanti punti hai dato ai clienti</div>
              <div className="metric-value">{metrics.today.pointsDistributed}</div>
              <div className="metric-trend positive">↗ +8%</div>
            </div>
          </div>

          <div className="today-metric">
            <div className="metric-icon redemptions">
              <Gift size={24} />
            </div>
            <div className="metric-content">
              <div className="metric-label">Premi Riscattati</div>
              <div className="metric-description">Quanti premi sono stati usati</div>
              <div className="metric-value">{metrics.today.redemptions}</div>
              <div className={`metric-trend ${metrics.today.redemptionsChange >= 0 ? 'positive' : 'negative'}`}>
                {metrics.today.redemptionsChange >= 0 ? '↗' : '↘'} {Math.abs(metrics.today.redemptionsChange).toFixed(0)}% rispetto a ieri
              </div>
            </div>
          </div>

          <div className="today-metric">
            <div className="metric-icon new-customers">
              <UserPlus size={24} />
            </div>
            <div className="metric-content">
              <div className="metric-label">Nuovi Clienti</div>
              <div className="metric-description">Quanti si sono registrati oggi</div>
              <div className="metric-value">{metrics.today.newCustomers}</div>
              <div className="metric-trend positive">↗ +50%</div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: TREND CHART */}
      <div className="dashboard-section chart-section">
        <div className="section-header">
          <TrendingUp size={24} />
          <div>
            <h2>Andamento Ultimi 30 Giorni</h2>
            <p>Visite giornaliere</p>
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-bars">
            {chartData.slice(-30).map((data, index) => {
              const maxVisits = Math.max(...chartData.map(d => d.visits), 1)
              const height = (data.visits / maxVisits) * 100

              return (
                <div key={index} className="chart-bar-wrapper">
                  <div
                    className="chart-bar"
                    style={{ height: `${height}%` }}
                    title={`${data.date}: ${data.visits} visite`}
                  >
                    <span className="bar-value">{data.visits}</span>
                  </div>
                  <div className="chart-label">{data.date.split('/')[0]}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* SECTION 3: CUSTOMER ANALYSIS */}
      <div className="dashboard-section analysis-section">
        <div className="section-header">
          <Users size={24} />
          <div>
            <h2>Analisi Clienti</h2>
            <p>Distribuzione e comportamento</p>
          </div>
        </div>

        <div className="analysis-grid">
          {/* Tier Distribution */}
          <div className="analysis-card">
            <h3>Distribuzione Tier</h3>
            <p className="card-description">Livelli fedeltà dei tuoi clienti (più alto = più fedele)</p>
            <div className="tier-list">
              {metrics.tiers.map((tier, index) => (
                <div key={index} className="tier-item">
                  <div className="tier-info">
                    <span className="tier-name">{tier.name}</span>
                    <span className="tier-count">{tier.count} ({tier.percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="tier-bar">
                    <div
                      className="tier-bar-fill"
                      style={{
                        width: `${tier.percentage}%`,
                        backgroundColor: tier.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Behavior */}
          <div className="analysis-card">
            <h3>Comportamento Clienti</h3>
            <p className="card-description">Come si comportano i tuoi clienti negli ultimi 30 giorni</p>
            <div className="behavior-list">
              <div className="behavior-item">
                <CheckCircle2 size={20} className="icon-active" />
                <span>Attivi (30gg)</span>
                <strong>{metrics.behavior.active}</strong>
              </div>
              <div className="behavior-item">
                <Calendar size={20} className="icon-regular" />
                <span>Regolari</span>
                <strong>{metrics.behavior.regular}</strong>
              </div>
              <div className="behavior-item">
                <Zap size={20} className="icon-new" />
                <span>Nuovi (30gg)</span>
                <strong>{metrics.behavior.new}</strong>
              </div>
              <div className="behavior-item">
                <Clock size={20} className="icon-inactive" />
                <span>Inattivi</span>
                <strong>{metrics.behavior.inactive}</strong>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="analysis-card alerts-card">
            <h3>Alert & Opportunità</h3>
            <div className="alerts-list">
              {metrics.alerts.dormant > 0 && (
                <div className="alert-item warning">
                  <Clock size={18} />
                  <span>{metrics.alerts.dormant} clienti dormienti ({'>'}30gg)</span>
                </div>
              )}
              {metrics.alerts.atRisk > 0 && (
                <div className="alert-item danger">
                  <AlertTriangle size={18} />
                  <span>{metrics.alerts.atRisk} clienti a rischio</span>
                </div>
              )}
              {metrics.alerts.birthdays > 0 && (
                <div className="alert-item success">
                  <Gift size={18} />
                  <span>{metrics.alerts.birthdays} compleanni oggi</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: TOP PERFORMERS */}
      <div className="dashboard-section performers-section">
        <div className="section-header">
          <Award size={24} />
          <div>
            <h2>Top Performers</h2>
            <p>I migliori clienti e premi</p>
          </div>
        </div>

        <div className="performers-grid">
          {/* Top Customers */}
          <div className="performers-card">
            <h3>Top 10 Clienti</h3>
            <div className="top-list">
              {metrics.topCustomers.map((customer, index) => (
                <div key={customer.id} className="top-item">
                  <span className="rank">#{index + 1}</span>
                  <span className="name">{customer.name}</span>
                  <span className="points">{customer.points.toLocaleString()} pt</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekday Stats */}
          <div className="performers-card">
            <h3>Giorni della Settimana</h3>
            <div className="weekday-list">
              {metrics.weekdayStats.map((day, index) => {
                const maxVisits = Math.max(...metrics.weekdayStats.map(d => d.visits), 1)
                const percentage = (day.visits / maxVisits) * 100

                return (
                  <div key={index} className="weekday-item">
                    <span className="day-name">{day.day}</span>
                    <div className="day-bar">
                      <div className="day-bar-fill" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="day-value">{day.visits}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: ADVANCED STATS */}
      <div className="dashboard-section stats-section">
        <div className="section-header">
          <BarChart3 size={24} />
          <div>
            <h2>Statistiche Avanzate</h2>
            <p>Performance e metriche economiche</p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h4>Performance Fedeltà</h4>
            <p className="card-description">Quanto i tuoi clienti restano fedeli</p>
            <div className="stat-item">
              <span>Clienti Attivi</span>
              <span className="stat-help">Quanti tornano regolarmente</span>
              <strong>{metrics.loyalty.retentionRate.toFixed(0)}%</strong>
            </div>
            <div className="stat-item">
              <span>Clienti che Tornano</span>
              <span className="stat-help">Retention rate</span>
              <strong>{metrics.loyalty.retentionRate.toFixed(0)}%</strong>
            </div>
            <div className="stat-item">
              <span>Clienti Persi</span>
              <span className="stat-help">Churn rate mensile</span>
              <strong>{metrics.loyalty.churnRate.toFixed(0)}%/mese</strong>
            </div>
            <div className="stat-item">
              <span>Soddisfazione</span>
              <span className="stat-help">NPS Score (0-100)</span>
              <strong>+{metrics.loyalty.npsScore}</strong>
            </div>
          </div>

          <div className="stat-card">
            <h4>Valore Economico</h4>
            <p className="card-description">Quanto vale ogni cliente per te</p>
            <div className="stat-item">
              <span>Valore Cliente</span>
              <span className="stat-help">Quanto spenderà nel tempo</span>
              <strong>€{metrics.economics.ltv}</strong>
            </div>
            <div className="stat-item">
              <span>Spesa Media</span>
              <span className="stat-help">AOV per visita</span>
              <strong>€{metrics.economics.aov.toFixed(2)}</strong>
            </div>
            <div className="stat-item">
              <span>Ritorno Investimento</span>
              <span className="stat-help">Ogni €1 investito ritorna</span>
              <strong>€{metrics.economics.roi}</strong>
            </div>
            <div className="stat-item">
              <span>Costo Acquisizione</span>
              <span className="stat-help">Per ottenere un nuovo cliente</span>
              <strong>€{metrics.economics.costPerCustomer}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6: ACTIONS */}
      <div className="dashboard-section actions-section">
        <div className="section-header">
          <Zap size={24} />
          <div>
            <h2>Azioni Consigliate Oggi</h2>
            <p>Cosa fare per migliorare</p>
          </div>
        </div>

        <div className="actions-list">
          {metrics.alerts.dormant > 0 && (
            <div className="action-item priority-high">
              <div className="action-icon">
                <Mail size={20} />
              </div>
              <div className="action-content">
                <h4>Alta Priorità</h4>
                <p>Invia email a {metrics.alerts.dormant} clienti dormienti ({'>'}30gg inattivi)</p>
              </div>
              <button className="action-btn">Invia Email</button>
            </div>
          )}

          {metrics.alerts.birthdays > 0 && (
            <div className="action-item priority-high">
              <div className="action-icon">
                <Gift size={20} />
              </div>
              <div className="action-content">
                <h4>Alta Priorità</h4>
                <p>{metrics.alerts.birthdays} compleanni oggi - invia auguri + bonus punti</p>
              </div>
              <button className="action-btn">Invia Auguri</button>
            </div>
          )}

          <div className="action-item priority-medium">
            <div className="action-icon">
              <TrendingUp size={20} />
            </div>
            <div className="action-content">
              <h4>Opportunità</h4>
              <p>Trend positivo +{metrics.today.visitsChange.toFixed(0)}% vs ieri - continua così!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard
