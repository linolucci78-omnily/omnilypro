import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createGlobalEmailSettings() {
  console.log('🔧 Creating Global Email Settings...\n')

  // Check if global settings already exist
  const { data: existing } = await supabase
    .from('email_settings')
    .select('*')
    .is('organization_id', null)
    .single()

  if (existing) {
    console.log('✅ Global email settings already exist:')
    console.log(existing)
    return
  }

  // Create global email settings
  const globalSettings = {
    organization_id: null, // NULL = global settings
    resend_api_key: null, // You need to add your Resend API key here or in Supabase env
    from_name: 'Omnily PRO',
    from_email: 'noreply@omnilypro.com', // Replace with your verified Resend domain
    reply_to_email: 'support@omnilypro.com',
    primary_color: '#667eea',
    secondary_color: '#764ba2',
    logo_url: null,
    enabled: true,
    emails_sent_today: 0,
    daily_limit: 1000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  console.log('📝 Inserting global email settings...')
  const { data, error } = await supabase
    .from('email_settings')
    .insert(globalSettings)
    .select()

  if (error) {
    console.error('❌ Error creating settings:', error)
    return
  }

  console.log('✅ Global email settings created successfully!')
  console.log(data[0])
  console.log('\n⚠️  IMPORTANT: You need to configure Resend API Key!')
  console.log('   Option 1: Add it to Supabase Edge Function env variables (RESEND_API_KEY)')
  console.log('   Option 2: Update the email_settings table with your API key')
  console.log('\n   Get your API key from: https://resend.com/api-keys')
}

createGlobalEmailSettings().catch(console.error)
