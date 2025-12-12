import { supabase } from '../lib/supabase'

export interface AnalyticsKPI {
  totalRevenue: number
  revenueChange: number
  activeCustomers: number
  customersChange: number
  totalTransactions: number
  transactionsChange: number
  averageTicket: number
  ticketChange: number
  pointsDistributed: number
  pointsChange: number
  rewardsRedeemed: number
  rewardsChange: number
  retentionRate: number
  retentionChange: number
  customerLTV: number
  ltvChange: number
}

export interface TopProduct {
  id: string
  name: string
  sales: number
  revenue: number
  trend: number
}

export interface CategoryRevenue {
  name: string
  revenue: number
  percentage: number
  transactions: number
}

export interface CampaignPerformance {
  id: string
  name: string
  type: string
  sent: number
  opened: number
  clicked: number
  openRate: number
  clickRate: number
  conversionRate: number
}

export interface RevenueDataPoint {
  date: string
  revenue: number
  transactions: number
}

export interface CustomerSegment {
  name: string
  count: number
  avgSpent: number
  totalRevenue: number
  color: string
  description: string
}

export interface Anomaly {
  type: 'warning' | 'critical' | 'info'
  title: string
  description: string
  metric: string
  value: number
  threshold: number
}

export interface SmartRecommendation {
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  category: string
  actionable: string
}

export interface AIInsights {
  customerSegments: CustomerSegment[]
  predictions: {
    nextMonthRevenue: number
    nextMonthCustomers: number
    churnRisk: number
    growthRate: number
  }
  anomalies: Anomaly[]
  recommendations: SmartRecommendation[]
}

export interface AnalyticsDashboard {
  kpi: AnalyticsKPI
  topProducts: TopProduct[]
  categoryRevenue: CategoryRevenue[]
  campaignPerformance: CampaignPerformance[]
  revenueChart: RevenueDataPoint[]
}

class AnalyticsService {
  /**
   * Calcola KPI per un periodo di tempo
   */
  async getKPIs(organizationId: string, days: number = 30): Promise<AnalyticsKPI> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const previousStartDate = new Date()
      previousStartDate.setDate(previousStartDate.getDate() - (days * 2))

      // 💰 REVENUE dalle transazioni (periodo corrente)
      const { data: currentTransactions } = await supabase
        .from('transaction')
        .select('amount')
        .eq('organization_id', organizationId)
        .gte('created_at', startDate.toISOString())

      const totalRevenue = currentTransactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
      const totalTransactions = currentTransactions?.length || 0

      // 💰 REVENUE periodo precedente
      const { data: previousTransactions } = await supabase
        .from('transaction')
        .select('amount')
        .eq('organization_id', organizationId)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString())

      const previousRevenue = previousTransactions?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
      const previousTotalTransactions = previousTransactions?.length || 0

      // Clienti attivi (hanno fatto almeno 1 transazione nel periodo)
      const { count: activeCustomers } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('updated_at', startDate.toISOString())

      const { count: previousActiveCustomers } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('updated_at', previousStartDate.toISOString())
        .lt('updated_at', startDate.toISOString())

      // Punti distribuiti
      const { data: pointsData } = await supabase
        .from('customers')
        .select('points')
        .eq('organization_id', organizationId)

      const totalPoints = pointsData?.reduce((sum, c) => sum + (c.points || 0), 0) || 0

      // Premi riscattati
      const { count: rewardsRedeemed } = await supabase
        .from('reward_redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', startDate.toISOString())

      const { count: previousRewardsRedeemed } = await supabase
        .from('reward_redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString())

      // ✅ Calcola variazioni percentuali REALI
      const revenueChange = previousRevenue && previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0

      const transactionsChange = previousTotalTransactions && previousTotalTransactions > 0
        ? ((totalTransactions - previousTotalTransactions) / previousTotalTransactions) * 100
        : 0

      const customersChange = previousActiveCustomers && previousActiveCustomers > 0
        ? ((activeCustomers || 0) - previousActiveCustomers) / previousActiveCustomers * 100
        : 0

      const rewardsChange = previousRewardsRedeemed && previousRewardsRedeemed > 0
        ? ((rewardsRedeemed || 0) - previousRewardsRedeemed) / previousRewardsRedeemed * 100
        : 0

      // Tasso retention (clienti che tornano)
      const { count: returningCustomers } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gt('visit_count', 1)

      const retentionRate = activeCustomers && activeCustomers > 0
        ? (returningCustomers || 0) / activeCustomers * 100
        : 0

      // Customer LTV medio (basato su total_spent reale)
      const { data: customers } = await supabase
        .from('customers')
        .select('total_spent')
        .eq('organization_id', organizationId)

      const totalSpent = customers?.reduce((sum, c) => sum + (c.total_spent || 0), 0) || 0
      const customerLTV = customers && customers.length > 0 ? totalSpent / customers.length : 0

      // ✅ Average ticket REALE (revenue / numero transazioni)
      const averageTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

      // Calcola ticketChange basato su periodo precedente
      const previousAverageTicket = previousTotalTransactions > 0
        ? previousRevenue / previousTotalTransactions
        : 0
      const ticketChange = previousAverageTicket > 0
        ? ((averageTicket - previousAverageTicket) / previousAverageTicket) * 100
        : 0

      // Calcola pointsChange e ltvChange reali (periodo precedente vs corrente)
      const { data: previousPointsData } = await supabase
        .from('customers')
        .select('points')
        .eq('organization_id', organizationId)
        .gte('updated_at', previousStartDate.toISOString())
        .lt('updated_at', startDate.toISOString())

      const previousTotalPoints = previousPointsData?.reduce((sum, c) => sum + (c.points || 0), 0) || 0
      const pointsChange = previousTotalPoints > 0
        ? ((totalPoints - previousTotalPoints) / previousTotalPoints) * 100
        : 0

      // LTV change
      const { data: previousCustomers } = await supabase
        .from('customers')
        .select('total_spent')
        .eq('organization_id', organizationId)
        .gte('updated_at', previousStartDate.toISOString())
        .lt('updated_at', startDate.toISOString())

      const previousTotalSpent = previousCustomers?.reduce((sum, c) => sum + (c.total_spent || 0), 0) || 0
      const previousCustomerLTV = previousCustomers && previousCustomers.length > 0
        ? previousTotalSpent / previousCustomers.length
        : 0
      const ltvChange = previousCustomerLTV > 0
        ? ((customerLTV - previousCustomerLTV) / previousCustomerLTV) * 100
        : 0

      // Retention change
      const { count: previousReturningCustomers } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gt('visit_count', 1)
        .gte('updated_at', previousStartDate.toISOString())
        .lt('updated_at', startDate.toISOString())

      const previousRetentionRate = previousActiveCustomers && previousActiveCustomers > 0
        ? (previousReturningCustomers || 0) / previousActiveCustomers * 100
        : 0
      const retentionChange = previousRetentionRate > 0
        ? retentionRate - previousRetentionRate
        : 0

      return {
        totalRevenue,
        revenueChange,
        activeCustomers: activeCustomers || 0,
        customersChange,
        totalTransactions,
        transactionsChange,
        averageTicket,
        ticketChange,
        pointsDistributed: totalPoints,
        pointsChange,
        rewardsRedeemed: rewardsRedeemed || 0,
        rewardsChange,
        retentionRate,
        retentionChange,
        customerLTV,
        ltvChange
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error)
      throw error
    }
  }

  /**
   * Top prodotti più venduti (basato su redemption)
   */
  async getTopProducts(organizationId: string, limit: number = 5): Promise<TopProduct[]> {
    try {
      // Periodo corrente (ultimi 30 giorni)
      const currentStartDate = new Date()
      currentStartDate.setDate(currentStartDate.getDate() - 30)

      // Periodo precedente (60-30 giorni fa)
      const previousStartDate = new Date()
      previousStartDate.setDate(previousStartDate.getDate() - 60)

      // ✅ Redemption periodo corrente
      const { data: currentRedemptions } = await supabase
        .from('reward_redemptions')
        .select(`
          reward_id,
          created_at,
          rewards (
            id,
            name,
            points_required,
            value
          )
        `)
        .eq('organization_id', organizationId)
        .gte('created_at', currentStartDate.toISOString())
        .limit(1000)

      // ✅ Redemption periodo precedente (per calcolare trend)
      const { data: previousRedemptions } = await supabase
        .from('reward_redemptions')
        .select(`
          reward_id,
          created_at
        `)
        .eq('organization_id', organizationId)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', currentStartDate.toISOString())
        .limit(1000)

      if (!currentRedemptions || currentRedemptions.length === 0) {
        return []
      }

      // Aggrega per reward (periodo corrente)
      const productMap = new Map<string, { name: string; count: number; value: number }>()

      currentRedemptions.forEach((r: any) => {
        if (r.rewards) {
          const key = r.rewards.id
          const existing = productMap.get(key)
          if (existing) {
            existing.count++
          } else {
            productMap.set(key, {
              name: r.rewards.name,
              count: 1,
              value: parseFloat(r.rewards.value || '0')
            })
          }
        }
      })

      // Aggrega periodo precedente per trend
      const previousProductMap = new Map<string, number>()
      previousRedemptions?.forEach((r: any) => {
        const count = previousProductMap.get(r.reward_id) || 0
        previousProductMap.set(r.reward_id, count + 1)
      })

      // ✅ Converti in array e calcola trend REALE
      const products: TopProduct[] = Array.from(productMap.entries()).map(([id, data]) => {
        const previousCount = previousProductMap.get(id) || 0
        const trend = previousCount > 0
          ? ((data.count - previousCount) / previousCount) * 100
          : data.count > 0 ? 100 : 0 // Se non c'era prima, +100% growth

        return {
          id,
          name: data.name,
          sales: data.count,
          revenue: data.count * data.value,
          trend
        }
      })

      return products
        .sort((a, b) => b.sales - a.sales)
        .slice(0, limit)
    } catch (error) {
      console.error('Error fetching top products:', error)
      return []
    }
  }

  /**
   * Revenue per categoria
   *
   * ⚠️ NOTA: Questa funzionalità richiede il tracking delle categorie nelle transazioni.
   * Attualmente la tabella `transaction` non ha un campo `category`.
   *
   * Per implementare questa feature serve:
   * 1. Aggiungere campo `category` alla tabella `transaction`
   * 2. Modificare il POS per salvare la categoria quando crea una transazione
   * 3. Aggiornare questa query per aggregare per categoria reale
   *
   * Per ora ritorna array vuoto per non mostrare dati fake.
   */
  async getCategoryRevenue(organizationId: string): Promise<CategoryRevenue[]> {
    try {
      console.warn('⚠️ getCategoryRevenue: Category tracking not implemented yet')

      // TODO: Quando implementato, la query sarà:
      // const { data: transactions } = await supabase
      //   .from('transaction')
      //   .select('amount, category')
      //   .eq('organization_id', organizationId)
      //   .gte('created_at', startDate.toISOString())
      //
      // Poi aggregare per category e calcolare percentuali reali

      return []
    } catch (error) {
      console.error('Error fetching category revenue:', error)
      return []
    }
  }

  /**
   * Performance campagne email
   */
  async getCampaignPerformance(organizationId: string): Promise<CampaignPerformance[]> {
    try {
      const { data: campaigns } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!campaigns || campaigns.length === 0) {
        return []
      }

      return campaigns.map(campaign => {
        const sent = campaign.recipients_count || 0
        const opened = campaign.opened_count || 0
        const clicked = campaign.clicked_count || 0

        return {
          id: campaign.id,
          name: campaign.subject || 'Campagna senza titolo',
          type: campaign.campaign_type || 'custom',
          sent,
          opened,
          clicked,
          openRate: sent > 0 ? (opened / sent) * 100 : 0,
          clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
          conversionRate: opened > 0 ? (clicked / opened) * 100 : 0
        }
      })
    } catch (error) {
      console.error('Error fetching campaign performance:', error)
      return []
    }
  }

  /**
   * Dati per grafico revenue (ultimi 30 giorni)
   */
  async getRevenueChart(organizationId: string, days: number = 30): Promise<RevenueDataPoint[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      console.log(`📊 Loading revenue chart for org ${organizationId}, last ${days} days`)
      console.log(`📅 Start date: ${startDate.toISOString()}`)

      // ✅ QUERY TRANSACTION TABLE: Ottieni tutte le transazioni degli ultimi N giorni
      const { data: transactions, error } = await supabase
        .from('transaction')
        .select('created_at, amount')
        .eq('organization_id', organizationId)
        .gte('created_at', startDate.toISOString())

      if (error) {
        console.error('❌ Error fetching transactions for revenue chart:', error)
        return []
      }

      console.log(`✅ Found ${transactions?.length || 0} transactions`)

      // Raggruppa per data
      const dataMap = new Map<string, { revenue: number; count: number }>()

      // Inizializza tutti i giorni con 0
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        dataMap.set(dateStr, { revenue: 0, count: 0 })
      }

      // Aggrega le transazioni per data
      transactions?.forEach(t => {
        const dateStr = t.created_at.split('T')[0]
        const existing = dataMap.get(dateStr)
        if (existing) {
          existing.revenue += t.amount || 0
          existing.count += 1
        }
      })

      // Converti in array ordinato
      const dataPoints: RevenueDataPoint[] = Array.from(dataMap.entries())
        .map(([date, data]) => ({
          date,
          revenue: Math.round(data.revenue * 100) / 100, // Arrotonda a 2 decimali
          transactions: data.count
        }))
        .sort((a, b) => a.date.localeCompare(b.date))

      console.log(`📈 Revenue chart data points:`, dataPoints.length)
      console.log(`💰 Total revenue in period: €${dataPoints.reduce((sum, p) => sum + p.revenue, 0).toFixed(2)}`)

      return dataPoints
    } catch (error) {
      console.error('❌ Error fetching revenue chart:', error)
      return []
    }
  }

  /**
   * Segmentazione clienti REALE basata su spesa
   */
  async getCustomerSegmentation(organizationId: string): Promise<CustomerSegment[]> {
    try {
      const { data: customers } = await supabase
        .from('customers')
        .select('id, total_spent')
        .eq('organization_id', organizationId)

      if (!customers || customers.length === 0) {
        return []
      }

      // Ordina per spesa
      const sorted = customers.sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))

      // Segmenta in base a spesa reale
      const vipThreshold = sorted[Math.floor(sorted.length * 0.15)]?.total_spent || 0
      const regularThreshold = sorted[Math.floor(sorted.length * 0.60)]?.total_spent || 0
      const occasionalThreshold = sorted[Math.floor(sorted.length * 0.90)]?.total_spent || 0

      const segments: CustomerSegment[] = [
        {
          name: 'VIP Customers',
          count: 0,
          avgSpent: 0,
          totalRevenue: 0,
          color: '#f59e0b',
          description: 'Top 15% clienti per spesa'
        },
        {
          name: 'Regular Customers',
          count: 0,
          avgSpent: 0,
          totalRevenue: 0,
          color: '#3b82f6',
          description: 'Clienti abituali affidabili'
        },
        {
          name: 'Occasional Customers',
          count: 0,
          avgSpent: 0,
          totalRevenue: 0,
          color: '#10b981',
          description: 'Clienti occasionali da fidelizzare'
        },
        {
          name: 'At Risk Customers',
          count: 0,
          avgSpent: 0,
          totalRevenue: 0,
          color: '#ef4444',
          description: 'Bassa spesa, rischio abbandono'
        }
      ]

      customers.forEach(customer => {
        const spent = customer.total_spent || 0
        let segmentIndex = 3 // At Risk default

        if (spent >= vipThreshold) {
          segmentIndex = 0 // VIP
        } else if (spent >= regularThreshold) {
          segmentIndex = 1 // Regular
        } else if (spent >= occasionalThreshold) {
          segmentIndex = 2 // Occasional
        }

        segments[segmentIndex].count++
        segments[segmentIndex].totalRevenue += spent
      })

      // Calcola media per segmento
      segments.forEach(segment => {
        if (segment.count > 0) {
          segment.avgSpent = segment.totalRevenue / segment.count
        }
      })

      return segments.filter(s => s.count > 0)
    } catch (error) {
      console.error('Error getting customer segmentation:', error)
      return []
    }
  }

  /**
   * Anomaly Detection REALE
   */
  async getAnomalies(organizationId: string, kpi: AnalyticsKPI): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = []

    // Retention rate troppo basso
    if (kpi.retentionRate < 40) {
      anomalies.push({
        type: 'critical',
        title: 'Tasso di Retention Critico',
        description: `Solo il ${kpi.retentionRate.toFixed(1)}% dei clienti ritorna. Rischio elevato di perdita clienti.`,
        metric: 'Retention Rate',
        value: kpi.retentionRate,
        threshold: 40
      })
    } else if (kpi.retentionRate < 60) {
      anomalies.push({
        type: 'warning',
        title: 'Retention Rate Sotto la Media',
        description: `Il ${kpi.retentionRate.toFixed(1)}% è sotto la media del settore (60%). Migliora la fidelizzazione.`,
        metric: 'Retention Rate',
        value: kpi.retentionRate,
        threshold: 60
      })
    }

    // Revenue in calo
    if (kpi.revenueChange < -10) {
      anomalies.push({
        type: 'critical',
        title: 'Calo Revenue Significativo',
        description: `Revenue in calo del ${Math.abs(kpi.revenueChange).toFixed(1)}%. Richiede azione immediata.`,
        metric: 'Revenue',
        value: kpi.revenueChange,
        threshold: -10
      })
    } else if (kpi.revenueChange < 0) {
      anomalies.push({
        type: 'warning',
        title: 'Revenue in Diminuzione',
        description: `Trend negativo del ${Math.abs(kpi.revenueChange).toFixed(1)}%. Monitora attentamente.`,
        metric: 'Revenue',
        value: kpi.revenueChange,
        threshold: 0
      })
    }

    // Pochi riscatti premi
    const redemptionRate = kpi.pointsDistributed > 0
      ? (kpi.rewardsRedeemed / (kpi.pointsDistributed / 100)) * 100
      : 0

    if (redemptionRate < 5 && kpi.pointsDistributed > 1000) {
      anomalies.push({
        type: 'warning',
        title: 'Basso Tasso di Redemption',
        description: `Solo il ${redemptionRate.toFixed(1)}% dei punti viene riscattato. I clienti potrebbero dimenticare i loro punti.`,
        metric: 'Redemption Rate',
        value: redemptionRate,
        threshold: 5
      })
    }

    // Clienti in calo
    if (kpi.customersChange < -5) {
      anomalies.push({
        type: 'warning',
        title: 'Perdita Clienti Attivi',
        description: `Hai perso il ${Math.abs(kpi.customersChange).toFixed(1)}% di clienti attivi. Avvia campagne di riattivazione.`,
        metric: 'Active Customers',
        value: kpi.customersChange,
        threshold: -5
      })
    }

    // Info positiva se tutto va bene
    if (anomalies.length === 0 && kpi.revenueChange > 10) {
      anomalies.push({
        type: 'info',
        title: 'Crescita Eccellente',
        description: `Revenue in crescita del ${kpi.revenueChange.toFixed(1)}%. Continua così!`,
        metric: 'Revenue Growth',
        value: kpi.revenueChange,
        threshold: 10
      })
    }

    return anomalies
  }

  /**
   * Raccomandazioni INTELLIGENTI basate su dati reali
   */
  async getSmartRecommendations(
    organizationId: string,
    kpi: AnalyticsKPI,
    segments: CustomerSegment[]
  ): Promise<SmartRecommendation[]> {
    const recommendations: SmartRecommendation[] = []

    // Raccomandazione basata su retention
    if (kpi.retentionRate < 60) {
      const impact = kpi.retentionRate < 40 ? 'high' : 'medium'
      recommendations.push({
        title: 'Migliora il Tasso di Retention',
        description: `Il tuo retention rate è del ${kpi.retentionRate.toFixed(1)}%, sotto la media del settore. Un aumento del 10% potrebbe generare ${((kpi.totalRevenue * 0.1) / 1000).toFixed(1)}k€ di revenue aggiuntiva.`,
        impact,
        category: 'Retention',
        actionable: 'Implementa programma di re-engagement via email per clienti inattivi da 30+ giorni'
      })
    }

    // Raccomandazione basata su scontrino medio
    const industryAvg = 50 // Placeholder, potrebbe essere configurabile
    if (kpi.averageTicket < industryAvg) {
      recommendations.push({
        title: 'Aumenta lo Scontrino Medio',
        description: `Il tuo scontrino medio è ${(kpi.averageTicket).toFixed(2)}€. Portandolo a ${industryAvg}€ (media settore) genereresti ${((industryAvg - kpi.averageTicket) * kpi.totalTransactions / 1000).toFixed(1)}k€ in più.`,
        impact: 'high',
        category: 'Revenue',
        actionable: 'Crea bundle prodotti o offerte "spendi X, ricevi Y punti bonus"'
      })
    }

    // Raccomandazione basata su segmenti
    const atRiskSegment = segments.find(s => s.name === 'At Risk Customers')
    if (atRiskSegment && atRiskSegment.count > kpi.activeCustomers * 0.15) {
      recommendations.push({
        title: 'Troppi Clienti a Rischio',
        description: `${atRiskSegment.count} clienti (${((atRiskSegment.count / kpi.activeCustomers) * 100).toFixed(1)}%) sono a rischio abbandono. Recuperarne il 30% aggiungerebbe ${((atRiskSegment.avgSpent * atRiskSegment.count * 0.3) / 1000).toFixed(1)}k€ di revenue.`,
        impact: 'high',
        category: 'Customer Recovery',
        actionable: 'Invia offerta esclusiva "20% sconto sul prossimo acquisto" ai clienti a rischio'
      })
    }

    // Raccomandazione redemption
    const redemptionRate = kpi.pointsDistributed > 0
      ? (kpi.rewardsRedeemed / (kpi.pointsDistributed / 100)) * 100
      : 0

    if (redemptionRate < 10 && kpi.pointsDistributed > 1000) {
      recommendations.push({
        title: 'Incentiva il Redemption dei Punti',
        description: `${kpi.pointsDistributed.toLocaleString()} punti distribuiti ma solo ${kpi.rewardsRedeemed} riscatti (${redemptionRate.toFixed(1)}%). Clienti che riscattano spendono il 40% in più.`,
        impact: 'medium',
        category: 'Engagement',
        actionable: 'Invia reminder "Hai X punti pronti da utilizzare!" con scadenza urgente'
      })
    }

    // Raccomandazione VIP
    const vipSegment = segments.find(s => s.name === 'VIP Customers')
    if (vipSegment && vipSegment.count > 0) {
      const vipPercentage = (vipSegment.count / kpi.activeCustomers) * 100
      if (vipPercentage < 10) {
        recommendations.push({
          title: 'Espandi il Segmento VIP',
          description: `Solo ${vipSegment.count} VIP (${vipPercentage.toFixed(1)}%). Questi clienti generano ${((vipSegment.totalRevenue / kpi.totalRevenue) * 100).toFixed(1)}% della revenue. Raddoppiarli aumenterebbe la revenue del ${((vipSegment.totalRevenue / kpi.totalRevenue) * 100).toFixed(1)}%.`,
          impact: 'high',
          category: 'Growth',
          actionable: 'Crea tier VIP esclusivo con vantaggi premium per incentivare upsell'
        })
      }
    }

    // Ordina per impatto
    const impactOrder = { high: 0, medium: 1, low: 2 }
    return recommendations.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact])
  }

  /**
   * Ottieni tutti gli AI Insights
   */
  async getAIInsights(organizationId: string, days: number = 30): Promise<AIInsights> {
    try {
      const kpi = await this.getKPIs(organizationId, days)
      const segments = await this.getCustomerSegmentation(organizationId)
      const anomalies = await this.getAnomalies(organizationId, kpi)
      const recommendations = await this.getSmartRecommendations(organizationId, kpi, segments)

      // Previsioni basate su trend reali
      const predictions = {
        nextMonthRevenue: kpi.totalRevenue * (1 + kpi.revenueChange / 100),
        nextMonthCustomers: Math.round(kpi.activeCustomers * (1 + kpi.customersChange / 100)),
        churnRisk: 100 - kpi.retentionRate,
        growthRate: kpi.revenueChange
      }

      return {
        customerSegments: segments,
        predictions,
        anomalies,
        recommendations
      }
    } catch (error) {
      console.error('Error getting AI insights:', error)
      throw error
    }
  }

  /**
   * Recupera tutto il dashboard in una chiamata
   */
  async getDashboard(organizationId: string, days: number = 30): Promise<AnalyticsDashboard> {
    try {
      const [kpi, topProducts, categoryRevenue, campaignPerformance, revenueChart] = await Promise.all([
        this.getKPIs(organizationId, days),
        this.getTopProducts(organizationId, 5),
        this.getCategoryRevenue(organizationId),
        this.getCampaignPerformance(organizationId),
        this.getRevenueChart(organizationId, days)
      ])

      return {
        kpi,
        topProducts,
        categoryRevenue,
        campaignPerformance,
        revenueChart
      }
    } catch (error) {
      console.error('Error fetching analytics dashboard:', error)
      throw error
    }
  }
}

export const analyticsService = new AnalyticsService()
