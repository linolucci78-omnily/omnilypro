import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions for OMNILY PRO
export interface Organization {
  id: string
  name: string
  slug: string
  domain: string | null
  plan_type: string
  plan_status: string
  max_customers: number
  max_workflows: number
  logo_url: string | null
  primary_color: string
  secondary_color: string
  created_at: string
  updated_at: string
  // Additional fields for admin page
  email?: string
  phone?: string
  website?: string
  address?: string
  business_type?: string
  is_active: boolean
  pos_enabled: boolean
  pos_model?: string
}

export interface Customer {
  id: string
  organization_id: string
  name: string
  email?: string
  phone?: string
  address?: string
  gender?: 'male' | 'female'
  birth_date?: string
  points: number
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Argento' | 'Bronzo'
  total_spent: number
  visits: number
  is_active: boolean
  notifications_enabled: boolean
  created_at: string
  updated_at: string
  last_visit?: string
}

export interface NFCCard {
  id: string
  organization_id: string
  uid: string
  customer_id?: string
  assigned_at?: string
  created_at: string
  updated_at: string
  is_active: boolean
  // Relazioni
  customer?: Customer
}

// API functions
export const organizationsApi = {
  // Get all organizations
  async getAll(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get organization by ID
  async getById(id: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Create new organization (MAGIC WIZARD BACKEND)
  async create(orgData: {
    name: string
    slug: string
    domain: string
    industry: string
    primary_color: string
    secondary_color: string
    plan_type?: string
  }): Promise<Organization> {
    const organizationToCreate = {
      name: orgData.name,
      slug: orgData.slug,
      domain: orgData.domain,
      plan_type: orgData.plan_type || 'free',
      plan_status: 'active',
      max_customers: orgData.plan_type === 'pro' ? 1000 : 50,
      max_workflows: orgData.plan_type === 'pro' ? 10 : 3,
      logo_url: null,
      primary_color: orgData.primary_color,
      secondary_color: orgData.secondary_color,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('organizations')
      .insert([organizationToCreate])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update organization
  async update(id: string, updates: Partial<Organization>): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete organization
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Bulk delete organizations
  async bulkDelete(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .in('id', ids)

    if (error) throw error
  },

  // Toggle organization status
  async toggleStatus(id: string, isActive: boolean): Promise<Organization> {
    return this.update(id, { is_active: isActive })
  },

  // Get organizations stats
  async getStats() {
    const { data: all, error } = await supabase
      .from('organizations')
      .select('id, is_active, pos_enabled, created_at')

    if (error) throw error

    const now = new Date()
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    return {
      total: all.length,
      active: all.filter(o => o.is_active).length,
      withPOS: all.filter(o => o.pos_enabled).length,
      newThisMonth: all.filter(o => new Date(o.created_at) >= monthAgo).length
    }
  },

  // Generate demo data for new organization
  async generateDemoData(organizationId: string) {
    console.log('🎭 Generating demo customers, transactions, and workflows for:', organizationId)
    
    // Demo customers
    const demoCustomers = [
      { name: 'Mario Rossi', email: 'mario.rossi@email.com', points: 150 },
      { name: 'Giulia Bianchi', email: 'giulia.bianchi@email.com', points: 320 },
      { name: 'Luca Ferrari', email: 'luca.ferrari@email.com', points: 85 },
      { name: 'Anna Verdi', email: 'anna.verdi@email.com', points: 240 },
      { name: 'Francesco Romano', email: 'francesco.romano@email.com', points: 410 }
    ]
    
    // This would insert demo data into customers table
    // For now, just log the demo data generation
    console.log('✅ Demo data generated:', demoCustomers)
    
    return {
      customers: demoCustomers.length,
      workflows: 3,
      transactions: 25
    }
  }
}

// Customers API
export const customersApi = {
  // Get all customers for an organization
  async getAll(organizationId?: string): Promise<Customer[]> {
    let query = supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  // Get customer by ID
  async getById(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Create new customer
  async create(customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert([{
        ...customerData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update customer
  async update(id: string, updates: Partial<Customer>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete customer
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Get customers statistics
  async getStats(organizationId?: string) {
    let query = supabase
      .from('customers')
      .select('id, gender, is_active, notifications_enabled, created_at')

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data: all, error } = await query

    if (error) throw error

    return {
      total: all.length,
      male: all.filter(c => c.gender === 'male').length,
      female: all.filter(c => c.gender === 'female').length,
      active: all.filter(c => c.is_active).length,
      withNotifications: all.filter(c => c.notifications_enabled).length
    }
  }
}

// NFC Cards API
export const nfcCardsApi = {
  // Get all NFC cards for an organization
  async getAll(organizationId: string): Promise<NFCCard[]> {
    try {
      // Query base senza join per evitare errori di foreign key
      const { data, error } = await supabase
        .from('nfc_cards')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading NFC cards:', error);

        // Se la tabella non esiste, restituisci array vuoto invece di errore
        if (error.code === 'PGRST106' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.warn('NFC cards table does not exist, returning empty array');
          return [];
        }

        throw error;
      }

      // Se non ci sono dati, restituisci array vuoto
      if (!data || data.length === 0) {
        return [];
      }

      // Carica i customer se necessario
      const cardsWithCustomers = await Promise.all(
        data.map(async (card) => {
          if (card.customer_id) {
            try {
              const { data: customer, error: customerError } = await supabase
                .from('customers')
                .select('*')
                .eq('id', card.customer_id)
                .single();

              if (!customerError && customer) {
                return { ...card, customer };
              }
            } catch (err) {
              console.warn('Error loading customer for card:', card.id);
            }
          }
          return card;
        })
      );

      return cardsWithCustomers;

    } catch (error) {
      console.error('Error in nfcCardsApi.getAll:', error);
      throw error;
    }
  },

  // Get NFC card by UID
  async getByUID(organizationId: string, uid: string): Promise<NFCCard | null> {
    const { data, error } = await supabase
      .from('nfc_cards')
      .select(`
        *,
        customer:customers(*)
      `)
      .eq('organization_id', organizationId)
      .eq('uid', uid)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows found
    return data
  },

  // Create new NFC card
  async create(cardData: {
    organization_id: string
    uid: string
    customer_id?: string
  }): Promise<NFCCard> {
    const { data, error } = await supabase
      .from('nfc_cards')
      .insert([{
        ...cardData,
        assigned_at: cardData.customer_id ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      }])
      .select(`
        *,
        customer:customers(*)
      `)
      .single()

    if (error) throw error
    return data
  },

  // Assign card to customer
  async assignToCustomer(cardId: string, customerId: string): Promise<NFCCard> {
    const { data, error } = await supabase
      .from('nfc_cards')
      .update({
        customer_id: customerId,
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', cardId)
      .select(`
        *,
        customer:customers(*)
      `)
      .single()

    if (error) throw error
    return data
  },

  // Reassign card to different customer
  async reassignToCustomer(cardId: string, customerId: string): Promise<NFCCard> {
    return this.assignToCustomer(cardId, customerId)
  },

  // Unassign card from customer
  async unassign(cardId: string): Promise<NFCCard> {
    const { data, error } = await supabase
      .from('nfc_cards')
      .update({
        customer_id: null,
        assigned_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', cardId)
      .select(`
        *,
        customer:customers(*)
      `)
      .single()

    if (error) throw error
    return data
  },

  // Deactivate card (soft delete)
  async deactivate(cardId: string): Promise<void> {
    const { error } = await supabase
      .from('nfc_cards')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', cardId)

    if (error) throw error
  },

  // Get card statistics
  async getStats(organizationId: string) {
    const { data: all, error } = await supabase
      .from('nfc_cards')
      .select('id, customer_id, created_at')
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    if (error) throw error

    return {
      total: all.length,
      assigned: all.filter(c => c.customer_id).length,
      unassigned: all.filter(c => !c.customer_id).length
    }
  }
}