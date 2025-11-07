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

export interface StaffMember {
  id: string
  organization_id: string
  name: string
  email?: string
  role: 'admin' | 'manager' | 'cashier' | 'staff'
  pin_code: string
  is_active: boolean
  created_at: string
  updated_at: string
  last_login?: string
}

export interface StaffAccessLog {
  id: string
  organization_id: string
  staff_id: string
  action_type: 'login' | 'logout' | 'pos_access' | 'desktop_access'
  device_info?: string
  ip_address?: string
  created_at: string
  // Relazioni
  staff_member?: StaffMember
}

export interface StaffActivityLog {
  id: string
  organization_id: string
  staff_id: string
  action: string
  entity_type?: string
  entity_id?: string
  details?: Record<string, any>
  created_at: string
  // Relazioni
  staff_member?: StaffMember
}

export interface RolePermission {
  id: string
  organization_id: string
  role: 'admin' | 'manager' | 'cashier' | 'staff'

  // Dashboard Sections Access
  can_view_analytics: boolean
  can_view_customers: boolean
  can_add_customers: boolean
  can_edit_customers: boolean
  can_delete_customers: boolean

  can_view_rewards: boolean
  can_create_rewards: boolean
  can_edit_rewards: boolean
  can_delete_rewards: boolean

  can_view_tiers: boolean
  can_edit_tiers: boolean

  can_view_transactions: boolean
  can_add_points: boolean
  can_redeem_rewards: boolean
  can_refund: boolean

  can_view_marketing: boolean
  can_send_campaigns: boolean

  can_view_team: boolean
  can_manage_team: boolean

  can_view_settings: boolean
  can_edit_settings: boolean

  can_view_branding: boolean
  can_edit_branding: boolean

  // POS Access
  can_access_pos: boolean
  can_process_sales: boolean
  can_void_transactions: boolean

  // Advanced
  can_export_data: boolean
  can_view_reports: boolean

  created_at: string
  updated_at: string
}

export interface StaffMemberPermission {
  id: string
  organization_id: string
  staff_id: string

  // NULL = usa permesso del ruolo, TRUE/FALSE = override
  can_view_analytics: boolean | null
  can_view_customers: boolean | null
  can_add_customers: boolean | null
  can_edit_customers: boolean | null
  can_delete_customers: boolean | null

  can_view_rewards: boolean | null
  can_create_rewards: boolean | null
  can_edit_rewards: boolean | null
  can_delete_rewards: boolean | null

  can_view_tiers: boolean | null
  can_edit_tiers: boolean | null

  can_view_transactions: boolean | null
  can_add_points: boolean | null
  can_redeem_rewards: boolean | null
  can_refund: boolean | null

  can_view_marketing: boolean | null
  can_send_campaigns: boolean | null

  can_view_team: boolean | null
  can_manage_team: boolean | null

  can_view_settings: boolean | null
  can_edit_settings: boolean | null

  can_view_branding: boolean | null
  can_edit_branding: boolean | null

  can_access_pos: boolean | null
  can_process_sales: boolean | null
  can_void_transactions: boolean | null

  can_export_data: boolean | null
  can_view_reports: boolean | null

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

// ============================================
// STAFF MANAGEMENT API
// ============================================
export const staffApi = {
  // Get all staff members for organization
  async getAll(organizationId: string): Promise<StaffMember[]> {
    const { data, error } = await supabase
      .from('staff_members')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Get single staff member by ID
  async getById(id: string): Promise<StaffMember | null> {
    const { data, error } = await supabase
      .from('staff_members')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Create staff member
  async create(staffMember: Omit<StaffMember, 'id' | 'created_at' | 'updated_at'>): Promise<StaffMember> {
    const { data, error } = await supabase
      .from('staff_members')
      .insert([staffMember])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update staff member
  async update(id: string, updates: Partial<StaffMember>): Promise<StaffMember> {
    const { data, error } = await supabase
      .from('staff_members')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete staff member
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('staff_members')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Verify PIN for POS login
  async verifyPin(organizationId: string, pinCode: string): Promise<StaffMember | null> {
    const { data, error } = await supabase
      .from('staff_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('pin_code', pinCode)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned

    // Update last_login if found
    if (data) {
      await supabase
        .from('staff_members')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id)
    }

    return data || null
  },

  // Log access
  async logAccess(log: Omit<StaffAccessLog, 'id' | 'created_at'>): Promise<StaffAccessLog> {
    const { data, error } = await supabase
      .from('staff_access_logs')
      .insert([log])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Log activity
  async logActivity(log: Omit<StaffActivityLog, 'id' | 'created_at'>): Promise<StaffActivityLog> {
    const { data, error } = await supabase
      .from('staff_activity_logs')
      .insert([log])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get access logs with filters
  async getAccessLogs(
    organizationId: string,
    filters?: {
      staffId?: string
      actionType?: 'login' | 'logout' | 'pos_access' | 'desktop_access'
      startDate?: Date
      endDate?: Date
      limit?: number
    }
  ): Promise<StaffAccessLog[]> {
    let query = supabase
      .from('staff_access_logs')
      .select(`
        *,
        staff_member:staff_members(*)
      `)
      .eq('organization_id', organizationId)

    if (filters?.staffId) {
      query = query.eq('staff_id', filters.staffId)
    }

    if (filters?.actionType) {
      query = query.eq('action_type', filters.actionType)
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString())
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString())
    }

    query = query.order('created_at', { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  // Get activity logs with filters
  async getActivityLogs(
    organizationId: string,
    filters?: {
      staffId?: string
      action?: string
      entityType?: string
      startDate?: Date
      endDate?: Date
      limit?: number
    }
  ): Promise<StaffActivityLog[]> {
    let query = supabase
      .from('staff_activity_logs')
      .select(`
        *,
        staff_member:staff_members(*)
      `)
      .eq('organization_id', organizationId)

    if (filters?.staffId) {
      query = query.eq('staff_id', filters.staffId)
    }

    if (filters?.action) {
      query = query.eq('action', filters.action)
    }

    if (filters?.entityType) {
      query = query.eq('entity_type', filters.entityType)
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString())
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString())
    }

    query = query.order('created_at', { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  // Get staff statistics
  async getStats(organizationId: string, staffId?: string): Promise<{
    totalLogins: number
    totalActions: number
    lastLogin?: string
    mostActiveStaff: Array<{ staff_id: string; name: string; action_count: number }>
  }> {
    // Get total logins
    let loginQuery = supabase
      .from('staff_access_logs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('action_type', 'login')

    if (staffId) {
      loginQuery = loginQuery.eq('staff_id', staffId)
    }

    const { count: totalLogins } = await loginQuery

    // Get total actions
    let activityQuery = supabase
      .from('staff_activity_logs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    if (staffId) {
      activityQuery = activityQuery.eq('staff_id', staffId)
    }

    const { count: totalActions } = await activityQuery

    // Get last login
    let lastLoginQuery = supabase
      .from('staff_access_logs')
      .select('created_at')
      .eq('organization_id', organizationId)
      .eq('action_type', 'login')

    if (staffId) {
      lastLoginQuery = lastLoginQuery.eq('staff_id', staffId)
    }

    const { data: lastLoginData } = await lastLoginQuery
      .order('created_at', { ascending: false })
      .limit(1)

    // Get most active staff (if not filtering by staffId)
    let mostActiveStaff: Array<{ staff_id: string; name: string; action_count: number }> = []

    if (!staffId) {
      const { data: activityData } = await supabase
        .from('staff_activity_logs')
        .select(`
          staff_id,
          staff_member:staff_members(name)
        `)
        .eq('organization_id', organizationId)

      if (activityData) {
        const staffCounts = new Map<string, { name: string; count: number }>()

        activityData.forEach((log: any) => {
          const existing = staffCounts.get(log.staff_id) || { name: log.staff_member?.name || 'Unknown', count: 0 }
          staffCounts.set(log.staff_id, { ...existing, count: existing.count + 1 })
        })

        mostActiveStaff = Array.from(staffCounts.entries())
          .map(([staff_id, data]) => ({ staff_id, name: data.name, action_count: data.count }))
          .sort((a, b) => b.action_count - a.action_count)
          .slice(0, 5)
      }
    }

    return {
      totalLogins: totalLogins || 0,
      totalActions: totalActions || 0,
      lastLogin: lastLoginData?.[0]?.created_at,
      mostActiveStaff
    }
  }
}

// ============================================
// PERMISSIONS API
// ============================================
export const permissionsApi = {
  // Get permissions for a specific role
  async getByRole(organizationId: string, role: string): Promise<RolePermission | null> {
    const { data, error} = await supabase
      .from('role_permissions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('role', role)
      .single()

    if (error) throw error
    return data
  },

  // Get all role permissions for organization
  async getAll(organizationId: string): Promise<RolePermission[]> {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('role', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Update permissions for a role
  async update(organizationId: string, role: string, permissions: Partial<RolePermission>): Promise<RolePermission> {
    const { data, error } = await supabase
      .from('role_permissions')
      .update({ ...permissions, updated_at: new Date().toISOString() })
      .eq('organization_id', organizationId)
      .eq('role', role)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Check if a specific permission is granted for a role
  async hasPermission(
    organizationId: string,
    role: string,
    permission: keyof RolePermission
  ): Promise<boolean> {
    const rolePerms = await this.getByRole(organizationId, role)
    if (!rolePerms) return false
    return rolePerms[permission] as boolean
  },

  // Get permissions for a specific staff member
  async getForStaffMember(organizationId: string, staffId: string): Promise<RolePermission | null> {
    // First get the staff member to know their role
    const { data: staffMember } = await supabase
      .from('staff_members')
      .select('role')
      .eq('id', staffId)
      .single()

    if (!staffMember) return null

    return this.getByRole(organizationId, staffMember.role)
  }
}

// ============================================
// STAFF MEMBER PERMISSIONS API (Individual Override)
// ============================================
export const staffMemberPermissionsApi = {
  // Get individual permissions for a staff member
  async get(organizationId: string, staffId: string): Promise<StaffMemberPermission | null> {
    const { data, error } = await supabase
      .from('staff_member_permissions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('staff_id', staffId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
    return data || null
  },

  // Create or update individual permissions
  async upsert(
    organizationId: string,
    staffId: string,
    permissions: Partial<StaffMemberPermission>
  ): Promise<StaffMemberPermission> {
    const { data, error } = await supabase
      .from('staff_member_permissions')
      .upsert({
        organization_id: organizationId,
        staff_id: staffId,
        ...permissions,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get effective permissions (role + overrides merged)
  async getEffective(organizationId: string, staffId: string): Promise<RolePermission | null> {
    const { data, error } = await supabase
      .rpc('get_effective_permissions', {
        p_organization_id: organizationId,
        p_staff_id: staffId
      })

    if (error) throw error
    return data?.[0] || null
  },

  // Clear all overrides for a staff member (revert to role defaults)
  async clearOverrides(organizationId: string, staffId: string): Promise<void> {
    const { error } = await supabase
      .from('staff_member_permissions')
      .delete()
      .eq('organization_id', organizationId)
      .eq('staff_id', staffId)

    if (error) throw error
  },

  // Set a single permission override
  async setPermission(
    organizationId: string,
    staffId: string,
    permission: keyof StaffMemberPermission,
    value: boolean | null
  ): Promise<void> {
    // First check if record exists
    const existing = await this.get(organizationId, staffId)

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('staff_member_permissions')
        .update({
          [permission]: value,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('staff_id', staffId)

      if (error) throw error
    } else {
      // Create new
      const { error } = await supabase
        .from('staff_member_permissions')
        .insert({
          organization_id: organizationId,
          staff_id: staffId,
          [permission]: value
        })

      if (error) throw error
    }
  }
}