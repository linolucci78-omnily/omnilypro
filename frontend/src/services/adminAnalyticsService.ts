import { supabase } from '../lib/supabase'

/**
 * Service per calcoli analytics reali dell'amministrazione
 * Sostituisce tutti i mock data con query effettive dal database
 */

export interface AdminAnalytics {
  revenue: {
    monthly: number       // MRR - Monthly Recurring Revenue
    yearly: number        // ARR - Annual Recurring Revenue
    growth: number        // % crescita rispetto al mese precedente
    perOrganization: number // Media revenue per organizzazione
  }
  pos: {
    active: number        // Numero POS attivi
    transactions: number  // Transazioni totali POS (ultimo mese)
    growth: number        // % crescita transazioni
    revenue: number       // Revenue da POS (ultimo mese)
  }
  users: {
    total: number         // Utenti totali sistema
    active: number        // Utenti attivi (ultimo mese)
    growth: number        // % crescita
    perOrganization: number // Media utenti per org
  }
  churn: {
    rate: number          // % churn rate mensile
    cancelled: number     // Organizzazioni cancellate questo mese
    atRisk: number        // Organizzazioni a rischio
  }
}

export class AdminAnalyticsService {
  /**
   * Calcola MRR (Monthly Recurring Revenue) da tutte le organizzazioni
   */
  private async calculateMRR(): Promise<{ current: number; previous: number }> {
    try {
      // Get all active organizations with plan data
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('plan_type, plan_status, created_at')
        .eq('is_active', true)

      if (error) throw error

      // Plan pricing
      const planPrices = {
        free: 0,
        pro: 99,
        enterprise: 299 // Average enterprise pricing
      }

      // Calculate current MRR
      const currentMRR = (orgs || [])
        .filter(org => org.plan_status === 'active')
        .reduce((sum, org) => {
          const price = planPrices[org.plan_type as keyof typeof planPrices] || 0
          return sum + price
        }, 0)

      // Calculate previous month MRR (excluding orgs created this month)
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)

      const previousMRR = (orgs || [])
        .filter(org => {
          if (org.plan_status !== 'active') return false
          const createdAt = new Date(org.created_at)
          return createdAt < monthAgo
        })
        .reduce((sum, org) => {
          const price = planPrices[org.plan_type as keyof typeof planPrices] || 0
          return sum + price
        }, 0)

      return { current: currentMRR, previous: previousMRR }
    } catch (error) {
      console.error('❌ Error calculating MRR:', error)
      return { current: 0, previous: 0 }
    }
  }

  /**
   * Calcola transazioni POS e revenue
   */
  private async calculatePOSMetrics(): Promise<{
    transactions: number
    revenue: number
    previousTransactions: number
  }> {
    try {
      const now = new Date()
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      const twoMonthsAgo = new Date()
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

      // Get all customer activities (transactions) from last month
      const { data: currentActivities, error: currentError } = await supabase
        .from('customer_activities')
        .select('monetary_value, created_at, activity_type')
        .eq('activity_type', 'transaction')
        .gte('created_at', monthAgo.toISOString())
        .lte('created_at', now.toISOString())

      if (currentError) throw currentError

      // Get previous month for comparison
      const { data: previousActivities, error: previousError } = await supabase
        .from('customer_activities')
        .select('monetary_value')
        .eq('activity_type', 'transaction')
        .gte('created_at', twoMonthsAgo.toISOString())
        .lt('created_at', monthAgo.toISOString())

      if (previousError) throw previousError

      const currentTransactions = currentActivities?.length || 0
      const currentRevenue = currentActivities?.reduce(
        (sum, activity) => sum + (activity.monetary_value || 0),
        0
      ) || 0
      const previousTransactions = previousActivities?.length || 0

      return {
        transactions: currentTransactions,
        revenue: currentRevenue,
        previousTransactions
      }
    } catch (error) {
      console.error('❌ Error calculating POS metrics:', error)
      return { transactions: 0, revenue: 0, previousTransactions: 0 }
    }
  }

  /**
   * Calcola metriche utenti
   */
  private async calculateUserMetrics(): Promise<{
    total: number
    active: number
    previousActive: number
  }> {
    try {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      const twoMonthsAgo = new Date()
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

      // Total customers across all organizations
      const { data: allCustomers, error: totalError } = await supabase
        .from('customers')
        .select('id, last_visit, is_active')

      if (totalError) throw totalError

      const total = allCustomers?.length || 0

      // Active customers (visited in last 30 days)
      const active = allCustomers?.filter(customer => {
        if (!customer.last_visit) return false
        const lastVisit = new Date(customer.last_visit)
        return lastVisit >= monthAgo && customer.is_active
      }).length || 0

      // Previous month active
      const previousActive = allCustomers?.filter(customer => {
        if (!customer.last_visit) return false
        const lastVisit = new Date(customer.last_visit)
        return lastVisit >= twoMonthsAgo && lastVisit < monthAgo && customer.is_active
      }).length || 0

      return { total, active, previousActive }
    } catch (error) {
      console.error('❌ Error calculating user metrics:', error)
      return { total: 0, active: 0, previousActive: 0 }
    }
  }

  /**
   * Calcola churn rate
   */
  private async calculateChurnRate(): Promise<{
    rate: number
    cancelled: number
    atRisk: number
  }> {
    try {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)

      // Get all organizations
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('id, plan_status, updated_at, is_active')

      if (error) throw error

      // Total organizations at start of month
      const totalOrgs = orgs?.filter(org => {
        const updatedAt = new Date(org.updated_at)
        return updatedAt < monthAgo || org.is_active
      }).length || 0

      // Cancelled this month
      const cancelled = orgs?.filter(org => {
        if (org.plan_status !== 'cancelled' && org.plan_status !== 'suspended') return false
        const updatedAt = new Date(org.updated_at)
        return updatedAt >= monthAgo
      }).length || 0

      // At risk (no activity in 30+ days, on free plan)
      const { data: activities, error: activitiesError } = await supabase
        .from('customer_activities')
        .select('organization_id, created_at')
        .gte('created_at', monthAgo.toISOString())

      if (activitiesError) throw activitiesError

      const activeOrgIds = new Set(activities?.map(a => a.organization_id) || [])
      const atRisk = orgs?.filter(org => {
        return (
          org.is_active &&
          org.plan_status === 'active' &&
          !activeOrgIds.has(org.id)
        )
      }).length || 0

      // Churn rate = (cancelled / total at start) * 100
      const rate = totalOrgs > 0 ? (cancelled / totalOrgs) * 100 : 0

      return { rate, cancelled, atRisk }
    } catch (error) {
      console.error('❌ Error calculating churn rate:', error)
      return { rate: 0, cancelled: 0, atRisk: 0 }
    }
  }

  /**
   * Ottieni tutte le analytics dell'admin dashboard
   */
  async getAdminAnalytics(): Promise<AdminAnalytics> {
    try {
      console.log('📊 Calculating admin analytics...')

      // Get organization count for averages
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('id')
        .eq('is_active', true)

      if (orgsError) throw orgsError

      const totalOrgs = orgs?.length || 1 // Avoid division by zero

      // ✅ CORRETTO: Conta dispositivi POS REALI dalla tabella devices
      const { data: posDevices, error: posError } = await supabase
        .from('devices')
        .select('id, status, organization_id')
        .in('status', ['online', 'offline', 'setup']) // Escludi solo 'maintenance'

      if (posError) {
        console.warn('⚠️ Tabella devices non trovata, usando fallback')
      }

      const posEnabledCount = posDevices?.length || 0

      // Calculate all metrics in parallel
      const [mrrData, posData, userData, churnData] = await Promise.all([
        this.calculateMRR(),
        this.calculatePOSMetrics(),
        this.calculateUserMetrics(),
        this.calculateChurnRate()
      ])

      // Calculate growth percentages
      const revenueGrowth = mrrData.previous > 0
        ? ((mrrData.current - mrrData.previous) / mrrData.previous) * 100
        : 0

      const posGrowth = posData.previousTransactions > 0
        ? ((posData.transactions - posData.previousTransactions) / posData.previousTransactions) * 100
        : 0

      const userGrowth = userData.previousActive > 0
        ? ((userData.active - userData.previousActive) / userData.previousActive) * 100
        : 0

      const analytics: AdminAnalytics = {
        revenue: {
          monthly: mrrData.current,
          yearly: mrrData.current * 12, // ARR = MRR * 12
          growth: Math.round(revenueGrowth * 10) / 10, // Round to 1 decimal
          perOrganization: Math.round(mrrData.current / totalOrgs)
        },
        pos: {
          active: posEnabledCount,
          transactions: posData.transactions,
          growth: Math.round(posGrowth * 10) / 10,
          revenue: posData.revenue
        },
        users: {
          total: userData.total,
          active: userData.active,
          growth: Math.round(userGrowth * 10) / 10,
          perOrganization: Math.round(userData.total / totalOrgs)
        },
        churn: {
          rate: Math.round(churnData.rate * 10) / 10,
          cancelled: churnData.cancelled,
          atRisk: churnData.atRisk
        }
      }

      console.log('✅ Admin analytics calculated:', analytics)
      return analytics
    } catch (error) {
      console.error('❌ Error getting admin analytics:', error)
      // Return default values on error
      return {
        revenue: { monthly: 0, yearly: 0, growth: 0, perOrganization: 0 },
        pos: { active: 0, transactions: 0, growth: 0, revenue: 0 },
        users: { total: 0, active: 0, growth: 0, perOrganization: 0 },
        churn: { rate: 0, cancelled: 0, atRisk: 0 }
      }
    }
  }

  /**
   * Get top organizations by revenue (last 30 days)
   */
  async getTopOrganizations(limit: number = 10): Promise<Array<{
    id: string
    name: string
    customers: number
    transactions: number
    revenue: number
  }>> {
    try {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)

      // Get all organizations with their activities
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select(`
          id,
          name,
          customers(count),
          customer_activities(monetary_value, activity_type, created_at)
        `)
        .eq('is_active', true)

      if (orgsError) throw orgsError

      // Calculate metrics for each org
      const orgMetrics = (orgs || []).map(org => {
        const recentActivities = (org.customer_activities || []).filter((activity: any) => {
          const activityDate = new Date(activity.created_at)
          return activityDate >= monthAgo && activity.activity_type === 'transaction'
        })

        const revenue = recentActivities.reduce(
          (sum: number, activity: any) => sum + (activity.monetary_value || 0),
          0
        )

        return {
          id: org.id,
          name: org.name,
          customers: org.customers?.[0]?.count || 0,
          transactions: recentActivities.length,
          revenue
        }
      })

      // Sort by revenue and take top N
      return orgMetrics
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit)
    } catch (error) {
      console.error('❌ Error getting top organizations:', error)
      return []
    }
  }

  /**
   * Get recent activities across all organizations
   */
  async getRecentActivities(limit: number = 10): Promise<Array<{
    id: string
    type: 'new_org' | 'pos_config' | 'pos_error' | 'new_user'
    title: string
    detail: string
    timestamp: string
    organizationName: string
  }>> {
    try {
      const activities: Array<any> = []

      // Recent organizations (last 7 days)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)

      const { data: newOrgs, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, city, created_at')
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5)

      if (!orgsError && newOrgs) {
        newOrgs.forEach(org => {
          activities.push({
            id: `org-${org.id}`,
            type: 'new_org',
            title: 'Nuova azienda registrata',
            detail: `${org.name}${org.city ? ` - ${org.city}` : ''}`,
            timestamp: org.created_at,
            organizationName: org.name
          })
        })
      }

      // Recent customers
      const { data: newCustomers, error: customersError } = await supabase
        .from('customers')
        .select(`
          id,
          email,
          created_at,
          organizations(name)
        `)
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5)

      if (!customersError && newCustomers) {
        newCustomers.forEach((customer: any) => {
          activities.push({
            id: `customer-${customer.id}`,
            type: 'new_user',
            title: 'Nuovo utente',
            detail: customer.email || 'Utente senza email',
            timestamp: customer.created_at,
            organizationName: customer.organizations?.name || 'N/A'
          })
        })
      }

      // Sort all activities by timestamp and limit
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)
    } catch (error) {
      console.error('❌ Error getting recent activities:', error)
      return []
    }
  }
}

export const adminAnalyticsService = new AdminAnalyticsService()
