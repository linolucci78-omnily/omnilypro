import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.SUPABASE_URL || 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

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

  // Wizard configuration data
  partita_iva?: string
  codice_fiscale?: string
  industry?: string
  city?: string
  postal_code?: string
  business_email?: string
  tagline?: string

  // Loyalty system configuration
  points_name?: string
  points_per_euro?: number
  reward_threshold?: number
  welcome_bonus?: number
  points_expiry_months?: number
  enable_tier_system?: boolean
  loyalty_tiers?: Array<{
    name: string
    threshold: number
    multiplier: number
    color: string
    benefits: string[]
  }>

  // Products & Categories
  import_products?: boolean
  product_categories?: Array<{
    name: string
    description?: string
    color?: string
  }>
  bonus_categories?: Array<{
    category: string
    multiplier: number
  }>

  // Rewards configuration
  reward_types?: string[]
  default_rewards?: Array<{
    name: string
    type: string
    value: number
    description?: string
    requirements?: any
  }>

  // Social Media
  facebook_url?: string
  instagram_url?: string
  linkedin_url?: string
  twitter_url?: string

  // Channels
  enable_pos?: boolean
  enable_ecommerce?: boolean
  enable_app?: boolean
  pos_type?: string
  ecommerce_platform?: string

  // Marketing
  welcome_campaign?: boolean
  birthday_rewards?: boolean
  inactive_campaign?: boolean
  email_templates?: any

  // Team
  admin_name?: string
  admin_email?: string
  invite_emails?: string[]

  // POS Integration
  pos_connection?: string
  enable_receipt_print?: boolean
  enable_nfc?: boolean
  enable_emv?: boolean
  enable_pinpad?: boolean

  // Notifications
  enable_email_notifications?: boolean
  enable_sms?: boolean
  enable_push_notifications?: boolean
  welcome_email_enabled?: boolean

  // Analytics
  enable_advanced_analytics?: boolean
  report_frequency?: string
  kpi_tracking?: string[]

  // Billing
  billing_email?: string
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
  tier: string // Tier dinamico basato sulla configurazione dell'organizzazione
  total_spent: number
  visits: number
  is_active: boolean
  notifications_enabled: boolean
  referral_code?: string
  referred_by?: string
  marketing_consent?: boolean
  privacy_consent?: boolean
  signature_data?: string
  privacy_signed_at?: string
  last_visit?: string
  created_at: string
  updated_at: string
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

export interface CustomerActivity {
  id: string
  organization_id: string
  customer_id: string
  type: 'transaction' | 'points_added' | 'reward_redeemed' | 'visit' | 'registration'
  description: string
  amount?: number
  points?: number
  created_at: string
  // Relazioni
  customer?: Customer
}

export interface Reward {
  id: string
  organization_id: string
  name: string
  type: 'discount' | 'freeProduct' | 'cashback' | 'giftCard'
  value: number | string
  points_required: number
  required_tier?: string // Livello di fedeltà richiesto
  description: string
  image_url?: string
  is_active: boolean
  stock_quantity?: number
  valid_from?: string
  valid_until?: string
  terms_conditions?: string
  created_at: string
  updated_at: string
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
  async deactivate(cardId: string, organizationId: string): Promise<void> {
    const { error } = await supabase
      .from('nfc_cards')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', cardId)
      .eq('organization_id', organizationId)

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

// Customer Activities API
export const customerActivitiesApi = {
  // Create new activity
  async create(activity: {
    organization_id: string
    customer_id: string
    type: 'transaction' | 'points_added' | 'reward_redeemed' | 'visit' | 'registration'
    description: string
    amount?: number
    points?: number
  }): Promise<CustomerActivity> {
    // Determina se i punti sono guadagnati o spesi
    const pointsEarned = activity.points && activity.points > 0 ? activity.points : null
    const pointsSpent = activity.points && activity.points < 0 ? Math.abs(activity.points) : null

    const { data, error } = await supabase
      .from('customer_activities')
      .insert({
        organization_id: activity.organization_id,
        customer_id: activity.customer_id,
        activity_type: activity.type,
        activity_description: activity.description,
        monetary_value: activity.amount,
        points_earned: pointsEarned,
        points_spent: pointsSpent,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    // Map back to interface format
    return {
      ...data,
      type: data.activity_type,
      description: data.activity_description,
      amount: data.monetary_value,
      points: data.points_earned || (data.points_spent ? -data.points_spent : 0)
    }
  },

  // Get activities for a customer
  async getByCustomerId(customerId: string, limit: number = 10): Promise<CustomerActivity[]> {
    const { data, error } = await supabase
      .from('customer_activities')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    // Map database columns to interface format
    return (data || []).map(activity => ({
      ...activity,
      type: activity.activity_type,
      description: activity.activity_description,
      amount: activity.monetary_value,
      points: activity.points_earned || (activity.points_spent ? -activity.points_spent : 0)
    }))
  },

  // Get recent activities for organization
  async getByOrganizationId(organizationId: string, limit: number = 50): Promise<CustomerActivity[]> {
    const { data, error } = await supabase
      .from('customer_activities')
      .select(`
        *,
        customer:customers(name)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    // Map database columns to interface format
    return (data || []).map(activity => ({
      ...activity,
      type: activity.activity_type,
      description: activity.activity_description,
      amount: activity.monetary_value,
      points: activity.points_earned || (activity.points_spent ? -activity.points_spent : 0)
    }))
  }
}

// Rewards API
export const rewardsApi = {
  // Get all rewards for an organization
  async getAll(organizationId: string): Promise<Reward[]> {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get active rewards for an organization
  async getActive(organizationId: string): Promise<Reward[]> {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('points_required', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Get reward by ID
  async getById(id: string, organizationId: string): Promise<Reward | null> {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows found
    return data
  },

  // Create new reward
  async create(organizationId: string, rewardData: Omit<Reward, 'id' | 'organization_id' | 'created_at' | 'updated_at'>): Promise<Reward> {
    const { data, error } = await supabase
      .from('rewards')
      .insert([{
        ...rewardData,
        organization_id: organizationId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update reward
  async update(id: string, organizationId: string, updates: Partial<Reward>): Promise<Reward> {
    const { data, error } = await supabase
      .from('rewards')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete reward
  async delete(id: string, organizationId: string): Promise<void> {
    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId)

    if (error) throw error
  },

  // Toggle reward status
  async toggleStatus(id: string, organizationId: string, isActive: boolean): Promise<Reward> {
    return this.update(id, organizationId, { is_active: isActive })
  },

  // Get rewards statistics
  async getStats(organizationId: string) {
    const { data: all, error } = await supabase
      .from('rewards')
      .select('id, type, is_active, points_required, created_at')
      .eq('organization_id', organizationId)

    if (error) throw error

    const now = new Date()
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    return {
      total: all.length,
      active: all.filter(r => r.is_active).length,
      inactive: all.filter(r => !r.is_active).length,
      byType: {
        discount: all.filter(r => r.type === 'discount').length,
        freeProduct: all.filter(r => r.type === 'freeProduct').length,
        cashback: all.filter(r => r.type === 'cashback').length,
        giftCard: all.filter(r => r.type === 'giftCard').length
      },
      newThisMonth: all.filter(r => new Date(r.created_at) >= monthAgo).length
    }
  },

  // Get available rewards for customer based on points
  async getAvailableForCustomer(organizationId: string, customerPoints: number): Promise<Reward[]> {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .lte('points_required', customerPoints)
      .order('points_required', { ascending: true })

    if (error) throw error

    // Filter by stock and validity
    const now = new Date()
    return (data || []).filter(reward => {
      if (reward.stock_quantity && reward.stock_quantity <= 0) return false
      if (reward.valid_from && new Date(reward.valid_from) > now) return false
      if (reward.valid_until && new Date(reward.valid_until) < now) return false
      return true
    })
  }
}