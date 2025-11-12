import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function seedData() {
  console.log('🌱 Seeding test data...\n')

  // 1. Create test organization
  const orgData = {
    name: 'Pizzeria Demo',
    slug: 'pizzeria-demo',
    domain: null,
    plan_type: 'free',
    plan_status: 'active',
    max_customers: 50,
    max_workflows: 3,
    logo_url: null,
    primary_color: '#dc2626',
    secondary_color: '#ef4444',
    is_active: true,
    pos_enabled: false,
    points_name: 'Punti',
    points_per_euro: 1,
    reward_threshold: 100,
    welcome_bonus: 10,
    loyalty_tiers: [
      { name: 'Base', threshold: 0, multiplier: 1, color: '#94a3b8', benefits: [] },
      { name: 'Silver', threshold: 100, multiplier: 1.2, color: '#c0c0c0', benefits: [] },
      { name: 'Gold', threshold: 500, multiplier: 1.5, color: '#ffd700', benefits: [] },
      { name: 'Platinum', threshold: 1000, multiplier: 2, color: '#e5e7eb', benefits: [] }
    ]
  }

  console.log('Creating organization:', orgData.name)
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert(orgData)
    .select()
    .single()

  if (orgError) {
    console.error('❌ Error creating organization:', orgError)
    return
  }

  console.log('✅ Organization created:', org.id)
  console.log('   Slug:', org.slug)
  console.log()

  // 2. Create test customer user in Supabase Auth
  const customerEmail = 'test@customer.com'
  const customerPassword = 'customer123'

  console.log('Creating customer auth user...')
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: customerEmail,
    password: customerPassword
  })

  if (authError) {
    console.error('❌ Error creating auth user:', authError)
    return
  }

  console.log('✅ Auth user created:', authData.user?.id)
  console.log()

  // 3. Create customer record
  const customerData = {
    id: authData.user.id,
    organization_id: org.id,
    name: 'Mario Rossi',
    email: customerEmail,
    phone: '+39 123 456 7890',
    points: 250,
    tier: 'Silver',
    total_spent: 150,
    visits: 5,
    is_active: true,
    notifications_enabled: true
  }

  console.log('Creating customer record...')
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .insert(customerData)
    .select()
    .single()

  if (customerError) {
    console.error('❌ Error creating customer:', customerError)
    return
  }

  console.log('✅ Customer created:', customer.id)
  console.log()

  // Summary
  console.log('==========================================')
  console.log('🎉 Test data created successfully!')
  console.log('==========================================\n')
  console.log('Organization:')
  console.log(`  Name: ${org.name}`)
  console.log(`  Slug: ${org.slug}`)
  console.log(`  URL: http://localhost:5174/${org.slug}\n`)
  console.log('Customer Login:')
  console.log(`  Email: ${customerEmail}`)
  console.log(`  Password: ${customerPassword}`)
  console.log(`  Points: ${customer.points}`)
  console.log(`  Tier: ${customer.tier}\n`)
}

seedData()
