import { supabase } from '../lib/supabase'

/**
 * CRM Leads Service - For Sales Agents
 * Manages lead pipeline and sales process
 */

export interface CRMLead {
  id: string

  // Company Info
  company_name: string
  contact_name: string
  email?: string
  phone?: string
  city?: string
  country?: string
  address?: string
  vat_number?: string // P.IVA/CF for contracts

  // Sales Pipeline
  stage: 'lead' | 'contacted' | 'demo_scheduled' | 'demo_completed' |
         'proposal_sent' | 'negotiation' | 'contract_ready' | 'won' | 'lost'
  probability: number // 0-100
  estimated_monthly_value: number

  // Product Interest
  interested_modules?: string[]
  plan_type?: 'basic' | 'professional' | 'enterprise'

  // Assignment
  sales_agent_id?: string

  // Tracking
  last_contact_date?: string
  next_action?: string
  next_action_date?: string

  // Notes
  notes?: string
  loss_reason?: string

  // Links
  customer_id?: string

  // Source
  source?: string

  // Timestamps
  created_at: string
  updated_at: string
  won_at?: string
  lost_at?: string
}

export interface CRMLeadInput {
  company_name: string
  contact_name: string
  email?: string
  phone?: string
  city?: string
  country?: string
  address?: string

  stage?: string
  probability?: number
  estimated_monthly_value?: number

  interested_modules?: string[]
  plan_type?: string

  next_action?: string
  next_action_date?: string
  notes?: string
  source?: string
}

export interface LeadStats {
  total_leads: number
  active_leads: number
  won_this_month: number
  lost_this_month: number
  pipeline_value: number
  conversion_rate: number
  avg_deal_size: number
}

export class CRMLeadsService {

  /**
   * Get all leads (filtered by agent if not admin)
   */
  async getLeads(filters?: {
    stage?: string
    agent_id?: string
    search?: string
  }): Promise<CRMLead[]> {
    try {
      let query = supabase
        .from('crm_leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters?.stage && filters.stage !== 'all') {
        query = query.eq('stage', filters.stage)
      }

      if (filters?.agent_id) {
        query = query.eq('sales_agent_id', filters.agent_id)
      }

      if (filters?.search) {
        query = query.or(
          `company_name.ilike.%${filters.search}%,` +
          `contact_name.ilike.%${filters.search}%,` +
          `email.ilike.%${filters.search}%`
        )
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching leads:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getLeads:', error)
      throw error
    }
  }

  /**
   * Get single lead by ID
   */
  async getLead(leadId: string): Promise<CRMLead | null> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('id', leadId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching lead:', error)
        throw error
      }

      return data || null
    } catch (error) {
      console.error('Error in getLead:', error)
      throw error
    }
  }

  /**
   * Create new lead
   */
  async createLead(leadData: CRMLeadInput, agentId: string): Promise<CRMLead> {
    try {
      const leadToCreate = {
        ...leadData,
        sales_agent_id: agentId,
        stage: leadData.stage || 'lead',
        probability: leadData.probability || 10,
        estimated_monthly_value: leadData.estimated_monthly_value || 0
      }

      const { data, error } = await supabase
        .from('crm_leads')
        .insert(leadToCreate)
        .select()
        .single()

      if (error) {
        console.error('Error creating lead:', error)
        throw error
      }

      console.log('✅ Lead created successfully:', data.company_name)
      return data
    } catch (error) {
      console.error('Error in createLead:', error)
      throw error
    }
  }

  /**
   * Update lead
   */
  async updateLead(leadId: string, updates: Partial<CRMLeadInput>): Promise<CRMLead> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .update(updates)
        .eq('id', leadId)
        .select()
        .single()

      if (error) {
        console.error('Error updating lead:', error)
        throw error
      }

      console.log('✅ Lead updated successfully:', data.company_name)
      return data
    } catch (error) {
      console.error('Error in updateLead:', error)
      throw error
    }
  }

  /**
   * Move lead to different stage
   */
  async moveLeadToStage(leadId: string, newStage: string): Promise<CRMLead> {
    try {
      // Auto-update probability based on stage
      const probabilityMap: { [key: string]: number } = {
        'lead': 10,
        'contacted': 20,
        'demo_scheduled': 40,
        'demo_completed': 50,
        'proposal_sent': 60,
        'negotiation': 70,
        'contract_ready': 90,
        'won': 100,
        'lost': 0
      }

      const { data, error } = await supabase
        .from('crm_leads')
        .update({
          stage: newStage,
          probability: probabilityMap[newStage] || 0,
          last_contact_date: new Date().toISOString()
        })
        .eq('id', leadId)
        .select()
        .single()

      if (error) {
        console.error('Error moving lead:', error)
        throw error
      }

      console.log(`✅ Lead moved to ${newStage}:`, data.company_name)
      return data
    } catch (error) {
      console.error('Error in moveLeadToStage:', error)
      throw error
    }
  }

  /**
   * Mark lead as won - converts to customer
   */
  async markAsWon(leadId: string, customerId: string): Promise<CRMLead> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .update({
          stage: 'won',
          probability: 100,
          customer_id: customerId,
          won_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .select()
        .single()

      if (error) {
        console.error('Error marking lead as won:', error)
        throw error
      }

      console.log('🎉 Lead WON:', data.company_name)
      return data
    } catch (error) {
      console.error('Error in markAsWon:', error)
      throw error
    }
  }

  /**
   * Sign contract - Creates PENDING customer and marks lead as won
   */
  async signContract(leadId: string): Promise<{ lead: CRMLead, customerId: string }> {
    try {
      // Get lead details
      const lead = await this.getLead(leadId)
      if (!lead) {
        throw new Error('Lead not found')
      }

      // Create customer with PENDING status
      // Note: organization_id should be NULL for PENDING customers (not yet activated)
      const customerData = {
        name: lead.company_name, // Company name
        first_name: lead.contact_name.split(' ')[0] || lead.contact_name,
        last_name: lead.contact_name.split(' ').slice(1).join(' ') || '',
        email: lead.email || '',
        phone: lead.phone || null,
        address: lead.address || null,
        city: lead.city || null,
        country: lead.country || null,
        status: 'pending_activation', // PENDING status
        is_active: false, // Not active yet
        total_spent: 0,
        visits: 0,
        plan_type: lead.plan_type || null,
        estimated_monthly_value: lead.estimated_monthly_value,
        sales_agent_id: lead.sales_agent_id
      }

      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single()

      if (customerError) {
        console.error('Error creating customer:', customerError)
        throw customerError
      }

      console.log('✅ Customer created with PENDING status:', customer.id)

      // Mark lead as won and link to customer
      const updatedLead = await this.markAsWon(leadId, customer.id)

      console.log('🎉 Contract signed! Customer ID:', customer.id)
      return {
        lead: updatedLead,
        customerId: customer.id
      }
    } catch (error) {
      console.error('Error in signContract:', error)
      throw error
    }
  }

  /**
   * Mark lead as lost
   */
  async markAsLost(leadId: string, reason: string): Promise<CRMLead> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .update({
          stage: 'lost',
          probability: 0,
          loss_reason: reason,
          lost_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .select()
        .single()

      if (error) {
        console.error('Error marking lead as lost:', error)
        throw error
      }

      console.log('❌ Lead LOST:', data.company_name, 'Reason:', reason)
      return data
    } catch (error) {
      console.error('Error in markAsLost:', error)
      throw error
    }
  }

  /**
   * Delete lead
   */
  async deleteLead(leadId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('crm_leads')
        .delete()
        .eq('id', leadId)

      if (error) {
        console.error('Error deleting lead:', error)
        throw error
      }

      console.log('🗑️ Lead deleted')
    } catch (error) {
      console.error('Error in deleteLead:', error)
      throw error
    }
  }

  /**
   * Get lead statistics for agent
   */
  async getLeadStats(agentId?: string): Promise<LeadStats> {
    try {
      let query = supabase.from('crm_leads').select('*')

      if (agentId) {
        query = query.eq('sales_agent_id', agentId)
      }

      const { data: leads, error } = await query

      if (error) {
        console.error('Error fetching lead stats:', error)
        throw error
      }

      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const activeLeads = leads?.filter(l =>
        !['won', 'lost'].includes(l.stage)
      ) || []

      const wonThisMonth = leads?.filter(l =>
        l.stage === 'won' && new Date(l.won_at || '') >= firstDayOfMonth
      ) || []

      const lostThisMonth = leads?.filter(l =>
        l.stage === 'lost' && new Date(l.lost_at || '') >= firstDayOfMonth
      ) || []

      const pipelineValue = activeLeads.reduce((sum, l) =>
        sum + (l.estimated_monthly_value || 0), 0
      )

      const totalClosed = wonThisMonth.length + lostThisMonth.length
      const conversionRate = totalClosed > 0
        ? (wonThisMonth.length / totalClosed) * 100
        : 0

      const avgDealSize = wonThisMonth.length > 0
        ? wonThisMonth.reduce((sum, l) => sum + (l.estimated_monthly_value || 0), 0) / wonThisMonth.length
        : 0

      return {
        total_leads: leads?.length || 0,
        active_leads: activeLeads.length,
        won_this_month: wonThisMonth.length,
        lost_this_month: lostThisMonth.length,
        pipeline_value: pipelineValue,
        conversion_rate: conversionRate,
        avg_deal_size: avgDealSize
      }
    } catch (error) {
      console.error('Error in getLeadStats:', error)
      throw error
    }
  }
}

export const crmLeadsService = new CRMLeadsService()
