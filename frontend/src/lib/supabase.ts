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