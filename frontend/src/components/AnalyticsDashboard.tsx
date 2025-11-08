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
  // Peak hours
  peakHours: {
    hour: string
    visits: number
    description: string
  }
  // Economic stats
  economicStats: {
    monthlyRevenue: number
    lastMonthRevenue: number
    monthlyGrowth: number
    yearlyRevenue: number
    dailyAverage: number
    weeklyGrowth: number
    revenueByTimeSlot: {
      morning: number      // 7-11
      lunch: number        // 11-15
      afternoon: number    // 15-18
      dinner: number       // 18-22
      night: number        // 22-7
    }
  }
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ organization, customers }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<Array<{date: string, visits: number, revenue: number}>>([])
  const [hourlyData, setHourlyData] = useState<Array<{hour: string, visits: number}>>([])

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
        .select('activity_type, monetary_value, points_earned')
        .eq('organization_id', organization.id)
        .gte('created_at', todayStart.toISOString())

      const { data: yesterdayActivities } = await supabase
        .from('customer_activities')
        .select('activity_type, monetary_value, points_earned')
        .eq('organization_id', organization.id)
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', todayStart.toISOString())

      const todayVisits = todayActivities?.filter(a => a.activity_type === 'visit').length || 0
      const yesterdayVisits = yesterdayActivities?.filter(a => a.activity_type === 'visit').length || 0
      const todayRedemptions = todayActivities?.filter(a => a.activity_type === 'reward_redeemed').length || 0
      const yesterdayRedemptions = yesterdayActivities?.filter(a => a.activity_type === 'reward_redeemed').length || 0

      // Revenue tracking reale
      const todayRevenue = todayActivities
        ?.filter(a => a.activity_type === 'transaction')
        .reduce((sum, a) => sum + (a.monetary_value || 0), 0) || 0
      const yesterdayRevenue = yesterdayActivities
        ?.filter(a => a.activity_type === 'transaction')
        .reduce((sum, a) => sum + (a.monetary_value || 0), 0) || 0

      const { data: todayCustomers } = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', organization.id)
        .gte('created_at', todayStart.toISOString())

      const todayNewCustomers = todayCustomers?.length || 0

      const { data: yesterdayNewCustomers } = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', organization.id)
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', todayStart.toISOString())

      const yesterdayNewCustomersCount = yesterdayNewCustomers?.length || 0

      const todayPoints = todayActivities?.filter(a => a.activity_type === 'points_added').reduce((sum, a) => sum + (a.points_earned || 0), 0) || 0
      const yesterdayPoints = yesterdayActivities?.filter(a => a.activity_type === 'points_added').reduce((sum, a) => sum + (a.points_earned || 0), 0) || 0

      // Calculate changes
      const visitsChange = yesterdayVisits > 0 ? ((todayVisits - yesterdayVisits) / yesterdayVisits) * 100 : 0
      const redemptionsChange = yesterdayRedemptions > 0 ? ((todayRedemptions - yesterdayRedemptions) / yesterdayRedemptions) * 100 : 0
      const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0
      const pointsChange = yesterdayPoints > 0 ? ((todayPoints - yesterdayPoints) / yesterdayPoints) * 100 : 0
      const newCustomersChange = yesterdayNewCustomersCount > 0 ? ((todayNewCustomers - yesterdayNewCustomersCount) / yesterdayNewCustomersCount) * 100 : 0

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
        .select('customer_id, created_at, activity_type, monetary_value')
        .eq('organization_id', organization.id)
        .gte('created_at', thirtyDaysAgo.toISOString())

      const activeCustomerIds = new Set(recentActivities?.map(a => a.customer_id))
      const active = activeCustomerIds.size

      // Calcola clienti regolari (almeno 3 visite negli ultimi 30 giorni)
      const customerVisitCounts = new Map<string, number>()
      recentActivities?.forEach(activity => {
        if (activity.activity_type === 'visit') {
          customerVisitCounts.set(
            activity.customer_id,
            (customerVisitCounts.get(activity.customer_id) || 0) + 1
          )
        }
      })
      const regular = Array.from(customerVisitCounts.values()).filter(count => count >= 3).length

      const newCustomers = customers.filter(c =>
        new Date(c.created_at) >= thirtyDaysAgo
      ).length

      const inactive = customers.length - active

      // CALCOLI ECONOMICI REALI
      // Ottieni TUTTE le transazioni per calcolare metriche economiche
      const { data: allTransactions } = await supabase
        .from('customer_activities')
        .select('customer_id, monetary_value, activity_type')
        .eq('organization_id', organization.id)
        .eq('activity_type', 'transaction')
        .not('monetary_value', 'is', null)

      // AOV (Average Order Value) - spesa media per transazione
      const totalRevenue = allTransactions?.reduce((sum, t) => sum + (t.monetary_value || 0), 0) || 0
      const transactionCount = allTransactions?.length || 0
      const aov = transactionCount > 0 ? totalRevenue / transactionCount : 0

      // LTV (Lifetime Value) - valore medio per cliente
      const customersWithTransactions = new Set(allTransactions?.map(t => t.customer_id))
      const ltv = customersWithTransactions.size > 0 ? totalRevenue / customersWithTransactions.size : 0

      // Calcola quanti clienti hanno fatto almeno una transazione
      const payingCustomers = customersWithTransactions.size
      const totalCustomers = customers.length

      // Costo Acquisizione (stimato) - Revenue / Numero Clienti
      // In assenza di dati marketing, usiamo una stima basata su revenue/cliente
      const costPerCustomer = totalCustomers > 0 ? (totalRevenue * 0.1) / totalCustomers : 0

      // ROI - assumiamo che il 10% del revenue sia il costo marketing
      const estimatedMarketingCost = totalRevenue * 0.1
      const roi = estimatedMarketingCost > 0 ? totalRevenue / estimatedMarketingCost : 0

      // 4. ALERTS
      const dormant = customers.filter(c => {
        const lastActivity = recentActivities?.find(a => a.customer_id === c.id)
        return !lastActivity
      }).length

      // At risk: attivi 30-60 giorni fa, ma non negli ultimi 30 giorni
      const sixtyDaysAgo = new Date()
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

      const { data: olderActivities } = await supabase
        .from('customer_activities')
        .select('customer_id')
        .eq('organization_id', organization.id)
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString())

      const olderActiveIds = new Set(olderActivities?.map(a => a.customer_id))
      const atRisk = Array.from(olderActiveIds).filter(
        customerId => !activeCustomerIds.has(customerId)
      ).length

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

      // 6.5. HOURLY STATS (last 30 days)
      const hourlyMap = new Map<number, number>()
      recentActivities?.forEach(activity => {
        const hour = new Date(activity.created_at).getHours()
        hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1)
      })

      const hourlyStatsArray = []
      for (let hour = 0; hour < 24; hour++) {
        const visits = hourlyMap.get(hour) || 0
        hourlyStatsArray.push({
          hour: `${hour.toString().padStart(2, '0')}:00`,
          visits
        })
      }

      setHourlyData(hourlyStatsArray)

      // Calcola fascia oraria di picco (SOLO DATI REALI)
      const peakHour = hourlyStatsArray.reduce((max, current) =>
        current.visits > max.visits ? current : max
      , { hour: '00:00', visits: 0 })

      // Determina descrizione fascia oraria
      const peakHourNum = parseInt(peakHour.hour.split(':')[0])
      let peakDescription = ''
      if (peakHourNum >= 7 && peakHourNum <= 10) {
        peakDescription = 'Mattino - Colazione'
      } else if (peakHourNum >= 11 && peakHourNum <= 14) {
        peakDescription = 'Pranzo'
      } else if (peakHourNum >= 15 && peakHourNum <= 17) {
        peakDescription = 'Pomeriggio - Merenda'
      } else if (peakHourNum >= 18 && peakHourNum <= 21) {
        peakDescription = 'Cena/Aperitivo'
      } else if (peakHourNum >= 22 || peakHourNum <= 2) {
        peakDescription = 'Notte'
      } else {
        peakDescription = 'Altro orario'
      }

      // 6.6. STATISTICHE ECONOMICHE AVANZATE
      // Revenue mensile corrente
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const { data: monthTransactions } = await supabase
        .from('customer_activities')
        .select('monetary_value')
        .eq('organization_id', organization.id)
        .eq('activity_type', 'transaction')
        .gte('created_at', monthStart.toISOString())
        .not('monetary_value', 'is', null)

      const monthlyRevenue = monthTransactions?.reduce((sum, t) => sum + (t.monetary_value || 0), 0) || 0

      // Revenue mese precedente
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1)
      const { data: lastMonthTransactions } = await supabase
        .from('customer_activities')
        .select('monetary_value')
        .eq('organization_id', organization.id)
        .eq('activity_type', 'transaction')
        .gte('created_at', lastMonthStart.toISOString())
        .lt('created_at', lastMonthEnd.toISOString())
        .not('monetary_value', 'is', null)

      const lastMonthRevenue = lastMonthTransactions?.reduce((sum, t) => sum + (t.monetary_value || 0), 0) || 0
      const monthlyGrowth = lastMonthRevenue > 0 ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0

      // Revenue annuale (ultimi 12 mesi)
      const yearStart = new Date(now.getFullYear(), now.getMonth() - 11, 1)
      const { data: yearTransactions } = await supabase
        .from('customer_activities')
        .select('monetary_value')
        .eq('organization_id', organization.id)
        .eq('activity_type', 'transaction')
        .gte('created_at', yearStart.toISOString())
        .not('monetary_value', 'is', null)

      const yearlyRevenue = yearTransactions?.reduce((sum, t) => sum + (t.monetary_value || 0), 0) || 0

      // Media giornaliera mese corrente
      const daysInMonth = now.getDate()
      const dailyAverage = daysInMonth > 0 ? monthlyRevenue / daysInMonth : 0

      // Crescita settimanale (ultimi 7 giorni vs 7 giorni precedenti)
      const sevenDaysAgoDate = new Date()
      sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7)
      const fourteenDaysAgoDate = new Date()
      fourteenDaysAgoDate.setDate(fourteenDaysAgoDate.getDate() - 14)

      const { data: lastWeekTransactions } = await supabase
        .from('customer_activities')
        .select('monetary_value')
        .eq('organization_id', organization.id)
        .eq('activity_type', 'transaction')
        .gte('created_at', sevenDaysAgoDate.toISOString())
        .not('monetary_value', 'is', null)

      const { data: previousWeekTransactions } = await supabase
        .from('customer_activities')
        .select('monetary_value')
        .eq('organization_id', organization.id)
        .eq('activity_type', 'transaction')
        .gte('created_at', fourteenDaysAgoDate.toISOString())
        .lt('created_at', sevenDaysAgoDate.toISOString())
        .not('monetary_value', 'is', null)

      const lastWeekRevenue = lastWeekTransactions?.reduce((sum, t) => sum + (t.monetary_value || 0), 0) || 0
      const previousWeekRevenue = previousWeekTransactions?.reduce((sum, t) => sum + (t.monetary_value || 0), 0) || 0
      const weeklyGrowth = previousWeekRevenue > 0 ? ((lastWeekRevenue - previousWeekRevenue) / previousWeekRevenue) * 100 : 0

      // Revenue per fascia oraria (ultimi 30 giorni)
      const { data: timeSlotTransactions } = await supabase
        .from('customer_activities')
        .select('monetary_value, created_at')
        .eq('organization_id', organization.id)
        .eq('activity_type', 'transaction')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .not('monetary_value', 'is', null)

      let morning = 0, lunch = 0, afternoon = 0, dinner = 0, night = 0

      timeSlotTransactions?.forEach(t => {
        const hour = new Date(t.created_at).getHours()
        const value = t.monetary_value || 0
        if (hour >= 7 && hour < 11) morning += value
        else if (hour >= 11 && hour < 15) lunch += value
        else if (hour >= 15 && hour < 18) afternoon += value
        else if (hour >= 18 && hour < 22) dinner += value
        else night += value
      })

      // 7. CHART DATA (last 30 days) - SOLO DATI REALI
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
          .select('activity_type, monetary_value')
          .eq('organization_id', organization.id)
          .gte('created_at', dayStart.toISOString())
          .lt('created_at', dayEnd.toISOString())

        const visits = dayActivities?.filter(a => a.activity_type === 'visit').length || 0
        const revenue = dayActivities
          ?.filter(a => a.activity_type === 'transaction')
          .reduce((sum, a) => sum + (a.monetary_value || 0), 0) || 0

        chartDataArray.push({
          date: dateStr,
          visits,
          revenue: Math.round(revenue * 100) / 100
        })
      }

      setChartData(chartDataArray)

      setMetrics({
        today: {
          visits: todayVisits,
          revenue: Math.round(todayRevenue * 100) / 100,
          redemptions: todayRedemptions,
          pointsDistributed: todayActivities?.filter(a => a.activity_type === 'points_added').reduce((sum, a) => sum + (a.points_earned || 0), 0) || 0,
          newCustomers: todayNewCustomers,
          visitsChange,
          revenueChange,
          redemptionsChange,
          pointsChange,
          newCustomersChange
        },
        tiers,
        behavior: {
          active,
          regular,
          new: newCustomers,
          inactive
        },
        alerts: {
          dormant,
          atRisk,
          birthdays
        },
        topCustomers,
        topRewards: [], // Richiede aggiunta campo reward_id in customer_activities per tracciamento preciso
        weekdayStats,
        loyalty: {
          retentionRate: customers.length > 0 ? (active / customers.length) * 100 : 0,
          churnRate: customers.length > 0 ? (inactive / customers.length) * 100 : 0,
          npsScore: customers.length > 0 ? Math.round((active / customers.length) * 100) : 0 // NPS basato su retention
        },
        economics: {
          ltv: Math.round(ltv * 100) / 100, // Arrotonda a 2 decimali
          aov: Math.round(aov * 100) / 100,
          roi: Math.round(roi * 100) / 100,
          costPerCustomer: Math.round(costPerCustomer * 100) / 100
        },
        peakHours: {
          hour: peakHour.hour,
          visits: peakHour.visits,
          description: peakDescription
        },
        economicStats: {
          monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
          lastMonthRevenue: Math.round(lastMonthRevenue * 100) / 100,
          monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
          yearlyRevenue: Math.round(yearlyRevenue * 100) / 100,
          dailyAverage: Math.round(dailyAverage * 100) / 100,
          weeklyGrowth: Math.round(weeklyGrowth * 100) / 100,
          revenueByTimeSlot: {
            morning: Math.round(morning * 100) / 100,
            lunch: Math.round(lunch * 100) / 100,
            afternoon: Math.round(afternoon * 100) / 100,
            dinner: Math.round(dinner * 100) / 100,
            night: Math.round(night * 100) / 100
          }
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

      {/* SECTION 2: STATISTICHE ECONOMICHE */}
      {metrics.economicStats && (
      <div className="dashboard-section stats-section">
        <div className="section-header">
          <TrendingUp size={24} />
          <div>
            <h2>Statistiche Economiche</h2>
            <p>Revenue e performance finanziarie</p>
          </div>
        </div>

        <div className="analysis-grid">
          {/* Revenue Mensile */}
          <div className="analysis-card">
            <h3>Revenue Mensile</h3>
            <p className="card-description">Fatturato mese corrente e crescita</p>
            <div className="behavior-list">
              <div className="behavior-item">
                <TrendingUp size={20} className="icon-active" />
                <span>Mese Corrente</span>
                <strong>€{metrics.economicStats.monthlyRevenue.toFixed(2)}</strong>
              </div>
              <div className="behavior-item">
                <Calendar size={20} className="icon-regular" />
                <span>Mese Scorso</span>
                <strong>€{metrics.economicStats.lastMonthRevenue.toFixed(2)}</strong>
              </div>
              <div className="behavior-item">
                {metrics.economicStats.monthlyGrowth >= 0 ? (
                  <TrendingUp size={20} className="icon-new" />
                ) : (
                  <AlertTriangle size={20} className="icon-inactive" />
                )}
                <span>Crescita Mensile</span>
                <strong style={{ color: metrics.economicStats.monthlyGrowth >= 0 ? '#10b981' : '#ef4444' }}>
                  {metrics.economicStats.monthlyGrowth >= 0 ? '+' : ''}{metrics.economicStats.monthlyGrowth.toFixed(1)}%
                </strong>
              </div>
              <div className="behavior-item">
                <BarChart3 size={20} className="icon-regular" />
                <span>Media Giornaliera</span>
                <strong>€{metrics.economicStats.dailyAverage.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          {/* Revenue Annuale */}
          <div className="analysis-card">
            <h3>Performance Annuale</h3>
            <p className="card-description">Ultimi 12 mesi e trend settimanale</p>
            <div className="behavior-list">
              <div className="behavior-item">
                <Award size={20} className="icon-active" />
                <span>Revenue Annuale</span>
                <strong>€{metrics.economicStats.yearlyRevenue.toFixed(2)}</strong>
              </div>
              <div className="behavior-item">
                {metrics.economicStats.weeklyGrowth >= 0 ? (
                  <TrendingUp size={20} className="icon-new" />
                ) : (
                  <AlertTriangle size={20} className="icon-inactive" />
                )}
                <span>Crescita Settimanale</span>
                <strong style={{ color: metrics.economicStats.weeklyGrowth >= 0 ? '#10b981' : '#ef4444' }}>
                  {metrics.economicStats.weeklyGrowth >= 0 ? '+' : ''}{metrics.economicStats.weeklyGrowth.toFixed(1)}%
                </strong>
              </div>
              <div className="behavior-item">
                <Calendar size={20} className="icon-regular" />
                <span>Media Mensile</span>
                <strong>€{(metrics.economicStats.yearlyRevenue / 12).toFixed(2)}</strong>
              </div>
            </div>
          </div>

          {/* Revenue per Fascia Oraria */}
          <div className="analysis-card">
            <h3>Revenue per Fascia Oraria</h3>
            <p className="card-description">Fatturato per orario (ultimi 30 giorni)</p>
            <div className="behavior-list">
              <div className="behavior-item">
                <Clock size={20} className="icon-active" />
                <span>Mattino (7-11)</span>
                <strong>€{metrics.economicStats.revenueByTimeSlot.morning.toFixed(2)}</strong>
              </div>
              <div className="behavior-item">
                <Gift size={20} className="icon-regular" />
                <span>Pranzo (11-15)</span>
                <strong>€{metrics.economicStats.revenueByTimeSlot.lunch.toFixed(2)}</strong>
              </div>
              <div className="behavior-item">
                <Users size={20} className="icon-new" />
                <span>Pomeriggio (15-18)</span>
                <strong>€{metrics.economicStats.revenueByTimeSlot.afternoon.toFixed(2)}</strong>
              </div>
              <div className="behavior-item">
                <Target size={20} className="icon-active" />
                <span>Cena (18-22)</span>
                <strong>€{metrics.economicStats.revenueByTimeSlot.dinner.toFixed(2)}</strong>
              </div>
              <div className="behavior-item">
                <Clock size={20} className="icon-inactive" />
                <span>Notte (22-7)</span>
                <strong>€{metrics.economicStats.revenueByTimeSlot.night.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* SECTION 3: TREND CHART */}
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

      {/* SECTION 2.5: HOURLY CHART */}
      <div className="dashboard-section chart-section">
        <div className="section-header">
          <Clock size={24} />
          <div>
            <h2>Fasce Orarie Visite (Ultimi 30 Giorni)</h2>
            <p className="card-description">Scopri gli orari di punta del tuo negozio</p>
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-bars">
            {hourlyData.map((data, index) => {
              const maxVisits = Math.max(...hourlyData.map(d => d.visits), 1)
              const height = (data.visits / maxVisits) * 100

              // Evidenzia le ore di punta (più di 75% del massimo)
              const isPeakHour = data.visits >= maxVisits * 0.75

              return (
                <div key={index} className="chart-bar-wrapper">
                  <div
                    className={`chart-bar ${isPeakHour ? 'peak-hour' : ''}`}
                    style={{ height: `${height}%` }}
                    title={`${data.hour}: ${data.visits} visite${isPeakHour ? ' - ORA DI PUNTA' : ''}`}
                  >
                    <span className="bar-value">{data.visits > 0 ? data.visits : ''}</span>
                  </div>
                  <div className="chart-label" style={{ fontSize: '9px' }}>{data.hour.split(':')[0]}</div>
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
              {metrics.tiers.length > 0 ? (
                metrics.tiers.map((tier, index) => (
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
                ))
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  <Users size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                  <p>Nessun cliente registrato ancora</p>
                  <p style={{ fontSize: '12px' }}>I tier appariranno quando avrai clienti con punti</p>
                </div>
              )}
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
            <p className="card-description">Situazioni che richiedono la tua attenzione</p>
            <div className="alerts-list">
              {metrics.alerts.dormant > 0 ? (
                <div className="alert-item warning">
                  <Clock size={18} />
                  <span>{metrics.alerts.dormant} clienti dormienti ({'>'}30gg)</span>
                </div>
              ) : (
                <div className="alert-item success">
                  <CheckCircle2 size={18} />
                  <span>Nessun cliente dormiente - ottimo lavoro!</span>
                </div>
              )}

              {metrics.alerts.atRisk > 0 ? (
                <div className="alert-item danger">
                  <AlertTriangle size={18} />
                  <span>{metrics.alerts.atRisk} clienti a rischio</span>
                </div>
              ) : (
                <div className="alert-item success">
                  <CheckCircle2 size={18} />
                  <span>Nessun cliente a rischio - continua così!</span>
                </div>
              )}

              {metrics.alerts.birthdays > 0 ? (
                <div className="alert-item success">
                  <Gift size={18} />
                  <span>{metrics.alerts.birthdays} compleanno{metrics.alerts.birthdays > 1 ? 'i' : ''} oggi - invia auguri!</span>
                </div>
              ) : (
                <div className="alert-item" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                  <Calendar size={18} />
                  <span>Nessun compleanno oggi</span>
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
            <p className="card-description">I tuoi clienti più fedeli con più punti</p>
            <div className="top-list">
              {metrics.topCustomers.length > 0 ? (
                metrics.topCustomers.map((customer, index) => (
                  <div key={customer.id} className="top-item">
                    <span className="rank">#{index + 1}</span>
                    <span className="name">{customer.name}</span>
                    <span className="points">{customer.points.toLocaleString()} pt</span>
                  </div>
                ))
              ) : (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontStyle: 'italic'
                }}>
                  Nessun cliente registrato ancora
                </div>
              )}
            </div>
          </div>

          {/* Weekday Stats */}
          <div className="performers-card">
            <h3>Giorni della Settimana</h3>
            <p className="card-description">Quali giorni hai più clienti</p>
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

        <div className="analysis-grid">
          {/* Performance Fedeltà */}
          <div className="analysis-card">
            <h3>Performance Fedeltà</h3>
            <p className="card-description">Quanto i tuoi clienti restano fedeli</p>
            <div className="behavior-list">
              <div className="behavior-item">
                <CheckCircle2 size={20} className="icon-active" />
                <span>Clienti Attivi</span>
                <strong>{metrics.loyalty.retentionRate.toFixed(0)}%</strong>
              </div>
              <div className="behavior-item">
                <TrendingUp size={20} className="icon-regular" />
                <span>Retention Rate</span>
                <strong>{metrics.loyalty.retentionRate.toFixed(0)}%</strong>
              </div>
              <div className="behavior-item">
                <AlertTriangle size={20} className="icon-inactive" />
                <span>Churn Rate</span>
                <strong>{metrics.loyalty.churnRate.toFixed(0)}%</strong>
              </div>
              <div className="behavior-item">
                <Award size={20} className="icon-new" />
                <span>NPS Score</span>
                <strong>+{metrics.loyalty.npsScore}</strong>
              </div>
            </div>
          </div>

          {/* Valore Economico */}
          <div className="analysis-card">
            <h3>Valore Economico</h3>
            <p className="card-description">Quanto vale ogni cliente per te</p>
            <div className="behavior-list">
              <div className="behavior-item">
                <Users size={20} className="icon-active" />
                <span>Valore Cliente (LTV)</span>
                <strong>€{metrics.economics.ltv}</strong>
              </div>
              <div className="behavior-item">
                <Gift size={20} className="icon-regular" />
                <span>Spesa Media (AOV)</span>
                <strong>€{metrics.economics.aov.toFixed(2)}</strong>
              </div>
              <div className="behavior-item">
                <TrendingUp size={20} className="icon-new" />
                <span>ROI</span>
                <strong>€{metrics.economics.roi}</strong>
              </div>
              <div className="behavior-item">
                <Target size={20} className="icon-inactive" />
                <span>Costo Acquisizione</span>
                <strong>€{metrics.economics.costPerCustomer}</strong>
              </div>
            </div>
          </div>

          {/* Fascia Oraria di Picco */}
          <div className="analysis-card">
            <h3>Fascia Oraria di Picco</h3>
            <p className="card-description">Quando hai più affluenza di clienti (ultimi 30 giorni)</p>
            <div className="behavior-list">
              <div className="behavior-item">
                <Clock size={20} className="icon-active" />
                <span>Orario di Punta</span>
                <strong>{metrics.peakHours.hour}</strong>
              </div>
              <div className="behavior-item">
                <Users size={20} className="icon-regular" />
                <span>Clienti in Fascia</span>
                <strong>{metrics.peakHours.visits}</strong>
              </div>
              <div className="behavior-item">
                <Calendar size={20} className="icon-new" />
                <span>Tipo Fascia</span>
                <strong style={{ fontSize: '14px' }}>{metrics.peakHours.description}</strong>
              </div>
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
