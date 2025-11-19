import { supabase } from '../lib/supabase'

export interface DemoRequest {
  id?: string
  // Company Info
  company_name: string
  website?: string
  industry?: string
  employees_count?: string
  // Locations
  locations_count?: string
  locations_cities?: string
  existing_pos?: string
  existing_pos_name?: string
  // Customer Management
  has_loyalty_program?: string
  current_customer_management?: string
  active_customers_count?: string
  // Goals
  goals?: string[]
  // Timeline & Budget
  timeline?: string
  budget_range?: string
  // Contact Info
  contact_name: string
  contact_email: string
  contact_phone: string
  contact_role?: string
  // Metadata
  status?: 'pending' | 'contacted' | 'approved' | 'rejected' | 'converted'
  notes?: string
  assigned_to?: string
  // Timestamps
  created_at?: string
  updated_at?: string
  contacted_at?: string
  converted_at?: string
}

export const demoRequestsApi = {
  /**
   * Submit a new demo request
   */
  async create(data: DemoRequest): Promise<DemoRequest> {
    console.log('🔑 Supabase client info:', {
      url: supabase.supabaseUrl,
      hasKey: !!supabase.supabaseKey,
      keyPrefix: supabase.supabaseKey?.substring(0, 20)
    })

    const { data: result, error } = await supabase
      .from('demo_requests')
      .insert({
        company_name: data.company_name,
        website: data.website,
        industry: data.industry,
        employees_count: data.employees_count,
        locations_count: data.locations_count,
        locations_cities: data.locations_cities,
        existing_pos: data.existing_pos,
        existing_pos_name: data.existing_pos_name,
        has_loyalty_program: data.has_loyalty_program,
        current_customer_management: data.current_customer_management,
        active_customers_count: data.active_customers_count,
        goals: data.goals,
        timeline: data.timeline,
        budget_range: data.budget_range,
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        contact_role: data.contact_role,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating demo request:', error)
      throw error
    }

    return result
  },

  /**
   * Get all demo requests (admin only)
   */
  async getAll(filters?: {
    status?: string
    limit?: number
    offset?: number
  }): Promise<DemoRequest[]> {
    let query = supabase
      .from('demo_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching demo requests:', error)
      throw error
    }

    return data || []
  },

  /**
   * Get a single demo request by ID
   */
  async getById(id: string): Promise<DemoRequest | null> {
    const { data, error } = await supabase
      .from('demo_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching demo request:', error)
      throw error
    }

    return data
  },

  /**
   * Update demo request (admin only)
   */
  async update(id: string, updates: Partial<DemoRequest>): Promise<DemoRequest> {
    const { data, error } = await supabase
      .from('demo_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating demo request:', error)
      throw error
    }

    return data
  },

  /**
   * Update demo request status
   */
  async updateStatus(
    id: string,
    status: 'pending' | 'contacted' | 'approved' | 'rejected' | 'converted',
    notes?: string
  ): Promise<DemoRequest> {
    const updates: any = { status }

    if (notes) {
      updates.notes = notes
    }

    if (status === 'contacted') {
      updates.contacted_at = new Date().toISOString()
    }

    if (status === 'converted') {
      updates.converted_at = new Date().toISOString()
    }

    return this.update(id, updates)
  },

  /**
   * Assign demo request to a sales agent
   */
  async assign(id: string, userId: string): Promise<DemoRequest> {
    return this.update(id, { assigned_to: userId })
  },

  /**
   * Delete demo request (admin only)
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('demo_requests')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting demo request:', error)
      throw error
    }
  },

  /**
   * Get stats for demo requests
   */
  async getStats(): Promise<{
    total: number
    pending: number
    contacted: number
    approved: number
    converted: number
  }> {
    const { data, error } = await supabase
      .from('demo_requests')
      .select('status')

    if (error) {
      console.error('Error fetching demo request stats:', error)
      throw error
    }

    const stats = {
      total: data.length,
      pending: data.filter(r => r.status === 'pending').length,
      contacted: data.filter(r => r.status === 'contacted').length,
      approved: data.filter(r => r.status === 'approved').length,
      converted: data.filter(r => r.status === 'converted').length
    }

    return stats
  }
}
