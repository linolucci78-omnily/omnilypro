import { supabase } from '../lib/supabase'

/**
 * Service for CRM operations in OMNILY PRO
 * Handles customers, campaigns, segments, and analytics
 * Compatible with existing customer table structure
 */

export interface Customer {
  id: string
  // Use existing column names from database
  name: string // existing field
  first_name?: string // added field
  last_name?: string // added field
  email: string
  phone?: string
  birth_date?: string // matches existing column name
  gender?: string
  address?: string // existing field
  organization_id: string
  total_spent: number
  total_orders?: number
  avg_order_value?: number
  lifetime_value?: number
  points: number // existing field (loyalty_points)
  tier: string
  status?: string // added field
  is_active: boolean // existing field
  engagement_score?: number
  predicted_churn_risk?: number
  last_visit?: string // existing field
  last_activity?: string
  created_at: string
  updated_at: string
  visits?: number // existing field
}

export interface CustomerInput {
  company_name: string // Nome Azienda
  first_name: string // Nome Titolare
  last_name: string // Cognome Titolare
  email: string
  phone?: string
  city?: string
  country?: string
  acquisition_channel?: string
  marketing_consent?: boolean
  email_consent?: boolean
  sms_consent?: boolean
}

export interface Campaign {
  id: string
  name: string
  type: 'email' | 'sms' | 'push' | 'direct_mail'
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused'
  organization_id: string
  target_segments: string[]
  subject?: string
  content?: string
  scheduled_at?: string
  budget: number
  sent_count: number
  opened_count: number
  clicked_count: number
  converted_count: number
  revenue_generated: number
  created_at: string
  created_by?: string
}

export interface CampaignInput {
  name: string
  type: 'email' | 'sms' | 'push' | 'direct_mail'
  target_segments: string[]
  subject?: string
  content?: string
  scheduled_at?: string
  budget: number
}

export interface CustomerSegment {
  id: string
  name: string
  description?: string
  organization_id: string
  criteria: any
  customer_count: number
  avg_clv: number
  avg_engagement: number
  is_active: boolean
  is_dynamic: boolean
  created_at: string
  updated_at: string
}

export interface CustomerActivity {
  id: string
  customer_id: string
  organization_id: string
  activity_type: string
  activity_title?: string
  activity_description?: string
  activity_data?: any
  monetary_value: number
  points_earned: number
  points_spent: number
  created_at: string
}

export interface CRMStats {
  total_customers: number
  active_customers: number
  vip_customers: number
  churned_customers: number
  total_revenue: number
  avg_clv: number
  avg_engagement: number
  active_campaigns: number
  conversion_rate: number
  customer_growth_rate: number
}

export class CRMService {

  /**
   * Get all customers for an organization
   * Uses safe column names and error handling
   */
  async getCustomers(organizationId: string, filters?: {
    status?: string
    tier?: string
    search?: string
    limit?: number
    offset?: number
  }): Promise<{ customers: Customer[], total: number }> {
    try {
      console.log('🔄 CRMService.getCustomers called with organizationId:', organizationId)

      // Start with basic query
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId)

      // Apply filters safely
      if (filters?.status && filters.status !== 'all') {
        // Map status filter to appropriate column
        if (filters.status === 'active') {
          query = query.eq('is_active', true)
        } else if (filters.status === 'inactive') {
          query = query.eq('is_active', false)
        } else if (filters.status === 'vip') {
          query = query.eq('tier', 'Platinum').eq('is_active', true)
        }
      }

      if (filters?.tier) {
        query = query.eq('tier', filters.tier)
      }

      if (filters?.search) {
        // Use existing column names for search
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
      }

      // Pagination
      if (filters?.limit) {
        query = query.limit(filters.limit)
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
      }

      // Order by existing columns
      query = query.order('last_visit', { ascending: false, nullsFirst: false })
                   .order('created_at', { ascending: false })

      const { data, error, count } = await query

      if (error) {
        console.error('❌ Failed to get customers:', error)
        console.error('Query details:', { organizationId, filters })
        // Return empty result instead of throwing to prevent app crash
        return {
          customers: [],
          total: 0
        }
      }

      console.log('✅ Successfully loaded customers:', data?.length || 0)
      return {
        customers: data || [],
        total: count || 0
      }
    } catch (error: any) {
      console.error('Error in CRMService.getCustomers:', error)
      // Return empty result to prevent app crash
      return {
        customers: [],
        total: 0
      }
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string, organizationId: string): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('organization_id', organizationId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to get customer:', error)
        throw error
      }

      return data || null
    } catch (error: any) {
      console.error('Error in CRMService.getCustomer:', error)
      throw error
    }
  }

  /**
   * Create new customer
   */
  async createCustomer(organizationId: string, customerData: CustomerInput): Promise<Customer> {
    try {
      // Map CustomerInput to actual database columns
      // Note: In CRM context, these are BUSINESS CUSTOMERS (companies buying OMNILYPRO)
      // company_name = Nome Azienda, name = Nome Titolare completo
      const customerToCreate = {
        organization_id: organizationId,
        name: customerData.company_name, // Nome Azienda nel campo 'name'
        first_name: customerData.first_name, // Nome Titolare
        last_name: customerData.last_name, // Cognome Titolare
        email: customerData.email,
        phone: customerData.phone || null,
        address: customerData.city && customerData.country ? `${customerData.city}, ${customerData.country}` : null,
        total_spent: 0,
        visits: 0,
        is_active: true,
        marketing_consent: customerData.marketing_consent || false,
        privacy_consent: true, // Required for GDPR
        notifications_enabled: customerData.email_consent || false
      }

      const { data, error } = await supabase
        .from('customers')
        .insert(customerToCreate)
        .select()
        .single()

      if (error) {
        console.error('Failed to create customer:', error)
        throw error
      }

      console.log('✅ Customer created successfully:', data.email)
      return data
    } catch (error: any) {
      console.error('❌ Error in CRMService.createCustomer:', error)
      throw error
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(customerId: string, organizationId: string, customerData: Partial<CustomerInput>): Promise<Customer> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', customerId)
        .eq('organization_id', organizationId)
        .select()
        .single()

      if (error) {
        console.error('Failed to update customer:', error)
        throw error
      }

      return data
    } catch (error: any) {
      console.error('Error in CRMService.updateCustomer:', error)
      throw error
    }
  }

  /**
   * Delete customer
   */
  async deleteCustomer(customerId: string, organizationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)
        .eq('organization_id', organizationId)

      if (error) {
        console.error('Failed to delete customer:', error)
        throw error
      }

      console.log('Customer deleted successfully')
    } catch (error: any) {
      console.error('Error in CRMService.deleteCustomer:', error)
      throw error
    }
  }

  /**
   * Get campaigns for organization
   */
  async getCampaigns(organizationId: string): Promise<Campaign[]> {
    try {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to get campaigns:', error)
        throw error
      }

      return data || []
    } catch (error: any) {
      console.error('Error in CRMService.getCampaigns:', error)
      throw error
    }
  }

  /**
   * Create new campaign
   */
  async createCampaign(organizationId: string, campaignData: CampaignInput): Promise<Campaign> {
    try {
      const campaignToCreate = {
        ...campaignData,
        organization_id: organizationId,
        status: 'draft',
        sent_count: 0,
        opened_count: 0,
        clicked_count: 0,
        converted_count: 0,
        revenue_generated: 0,
        created_by: (await supabase.auth.getUser()).data.user?.id
      }

      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert(campaignToCreate)
        .select()
        .single()

      if (error) {
        console.error('Failed to create campaign:', error)
        throw error
      }

      console.log('Campaign created successfully:', data.name)
      return data
    } catch (error: any) {
      console.error('Error in CRMService.createCampaign:', error)
      throw error
    }
  }

  /**
   * Get customer segments
   */
  async getSegments(organizationId: string): Promise<CustomerSegment[]> {
    try {
      console.log('🔄 Loading segments for organization:', organizationId)

      const { data, error } = await supabase
        .from('customer_segments')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('customer_count', { ascending: false })

      if (error) {
        console.error('❌ Failed to get segments:', error)
        // Return empty array instead of throwing
        return []
      }

      console.log('✅ Successfully loaded segments:', data?.length || 0)
      return data || []
    } catch (error: any) {
      console.error('Error in CRMService.getSegments:', error)
      // Return empty array to prevent crash
      return []
    }
  }

  /**
   * Get customer activities
   */
  async getCustomerActivities(customerId: string, organizationId: string, limit = 50): Promise<CustomerActivity[]> {
    try {
      const { data, error } = await supabase
        .from('customer_activities')
        .select('*')
        .eq('customer_id', customerId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Failed to get customer activities:', error)
        throw error
      }

      return data || []
    } catch (error: any) {
      console.error('Error in CRMService.getCustomerActivities:', error)
      throw error
    }
  }

  /**
   * Add customer activity
   */
  async addCustomerActivity(
    customerId: string,
    organizationId: string,
    activityType: string,
    activityData: {
      title?: string
      description?: string
      data?: any
      monetary_value?: number
      points_earned?: number
      points_spent?: number
    }
  ): Promise<CustomerActivity> {
    try {
      const activity = {
        customer_id: customerId,
        organization_id: organizationId,
        activity_type: activityType,
        activity_title: activityData.title,
        activity_description: activityData.description,
        activity_data: activityData.data,
        monetary_value: activityData.monetary_value || 0,
        points_earned: activityData.points_earned || 0,
        points_spent: activityData.points_spent || 0
      }

      const { data, error } = await supabase
        .from('customer_activities')
        .insert(activity)
        .select()
        .single()

      if (error) {
        console.error('Failed to add customer activity:', error)
        throw error
      }

      // Update customer stats after activity
      await this.updateCustomerStats(customerId, organizationId)

      return data
    } catch (error: any) {
      console.error('Error in CRMService.addCustomerActivity:', error)
      throw error
    }
  }

  /**
   * Update customer calculated stats
   */
  async updateCustomerStats(customerId: string, organizationId: string): Promise<void> {
    try {
      // Calculate engagement score using database function
      const { data: engagementData } = await supabase
        .rpc('calculate_customer_engagement', { customer_uuid: customerId })

      // Calculate churn risk using database function
      const { data: churnData } = await supabase
        .rpc('calculate_churn_risk', { customer_uuid: customerId })

      // Get total spent and order count from activities
      const { data: statsData } = await supabase
        .from('customer_activities')
        .select('monetary_value')
        .eq('customer_id', customerId)
        .eq('activity_type', 'purchase')

      const totalSpent = statsData?.reduce((sum, activity) => sum + (activity.monetary_value || 0), 0) || 0
      const totalOrders = statsData?.length || 0
      const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0

      // Update customer with calculated values
      await supabase
        .from('customers')
        .update({
          engagement_score: engagementData || 0,
          predicted_churn_risk: churnData || 0,
          total_spent: totalSpent,
          total_orders: totalOrders,
          avg_order_value: avgOrderValue,
          lifetime_value: totalSpent * 1.2, // Simple CLV calculation
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)
        .eq('organization_id', organizationId)

    } catch (error: any) {
      console.error('Error in CRMService.updateCustomerStats:', error)
      // Don't throw error to avoid blocking the main operation
    }
  }

  /**
   * Get CRM statistics for dashboard
   */
  async getCRMStats(organizationId: string): Promise<CRMStats> {
    try {
      // Get customer counts
      const { data: customers } = await supabase
        .from('customers')
        .select('status, total_spent, lifetime_value, engagement_score')
        .eq('organization_id', organizationId)

      // Get campaign stats
      const { data: campaigns } = await supabase
        .from('marketing_campaigns')
        .select('status, revenue_generated, sent_count, converted_count')
        .eq('organization_id', organizationId)

      const totalCustomers = customers?.length || 0
      const activeCustomers = customers?.filter(c => c.status === 'active' || c.status === 'vip').length || 0
      const vipCustomers = customers?.filter(c => c.status === 'vip').length || 0
      const churnedCustomers = customers?.filter(c => c.status === 'churned').length || 0

      const totalRevenue = customers?.reduce((sum, c) => sum + (c.total_spent || 0), 0) || 0
      const avgClv = customers?.length ? customers.reduce((sum, c) => sum + (c.lifetime_value || 0), 0) / customers.length : 0
      const avgEngagement = customers?.length ? customers.reduce((sum, c) => sum + (c.engagement_score || 0), 0) / customers.length : 0

      const activeCampaigns = campaigns?.filter(c => c.status === 'running').length || 0
      const totalSent = campaigns?.reduce((sum, c) => sum + (c.sent_count || 0), 0) || 0
      const totalConverted = campaigns?.reduce((sum, c) => sum + (c.converted_count || 0), 0) || 0
      const conversionRate = totalSent > 0 ? (totalConverted / totalSent) * 100 : 0

      return {
        total_customers: totalCustomers,
        active_customers: activeCustomers,
        vip_customers: vipCustomers,
        churned_customers: churnedCustomers,
        total_revenue: totalRevenue,
        avg_clv: avgClv,
        avg_engagement: avgEngagement,
        active_campaigns: activeCampaigns,
        conversion_rate: conversionRate,
        customer_growth_rate: 0 // TODO: Calculate based on time periods
      }
    } catch (error: any) {
      console.error('Error in CRMService.getCRMStats:', error)
      // Return default stats to prevent crash
      return {
        total_customers: 0,
        active_customers: 0,
        vip_customers: 0,
        churned_customers: 0,
        total_revenue: 0,
        avg_clv: 0,
        avg_engagement: 0,
        active_campaigns: 0,
        conversion_rate: 0,
        customer_growth_rate: 0
      }
    }
  }

  /**
   * Search customers across all fields
   */
  async searchCustomers(organizationId: string, query: string, limit = 20): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', organizationId)
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(limit)
        .order('last_visit', { ascending: false, nullsFirst: false })

      if (error) {
        console.error('Failed to search customers:', error)
        throw error
      }

      return data || []
    } catch (error: any) {
      console.error('Error in CRMService.searchCustomers:', error)
      // Return empty array to prevent crash
      return []
    }
  }

  /**
   * Get customers by segment
   */
  async getCustomersBySegment(segmentId: string, organizationId: string): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          customer_segment_memberships!inner(
            segment_id
          )
        `)
        .eq('organization_id', organizationId)
        .eq('customer_segment_memberships.segment_id', segmentId)
        .eq('customer_segment_memberships.is_active', true)

      if (error) {
        console.error('Failed to get customers by segment:', error)
        throw error
      }

      return data || []
    } catch (error: any) {
      console.error('Error in CRMService.getCustomersBySegment:', error)
      throw error
    }
  }

  /**
   * Bulk update customer tiers based on spending
   */
  async updateCustomerTiers(organizationId: string): Promise<void> {
    try {
      // Get all customers for organization
      const { data: customers } = await supabase
        .from('customers')
        .select('id, total_spent')
        .eq('organization_id', organizationId)

      if (!customers) return

      // Define tier thresholds
      const tierThresholds = {
        'Platinum': 5000,
        'Gold': 2000,
        'Silver': 500,
        'Bronze': 0
      }

      // Update customers in batches
      for (const customer of customers) {
        let newTier = 'Bronze'
        let newStatus = customer.total_spent > 0 ? 'active' : 'inactive'

        if (customer.total_spent >= tierThresholds.Platinum) {
          newTier = 'Platinum'
          newStatus = 'vip'
        } else if (customer.total_spent >= tierThresholds.Gold) {
          newTier = 'Gold'
          newStatus = 'vip'
        } else if (customer.total_spent >= tierThresholds.Silver) {
          newTier = 'Silver'
        }

        await supabase
          .from('customers')
          .update({ tier: newTier, status: newStatus })
          .eq('id', customer.id)
      }

      console.log('Customer tiers updated successfully')
    } catch (error: any) {
      console.error('Error in CRMService.updateCustomerTiers:', error)
      throw error
    }
  }
}

// Export singleton instance
export const crmService = new CRMService()