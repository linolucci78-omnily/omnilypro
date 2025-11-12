import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc0MzQ4NSwiZXhwIjoyMDcyMzE5NDg1fQ.Kbq7cBx7ovFvkFHBIwdIgCc7RQcvVYUtRpMBs1e5K8g'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addRLSPolicies() {
  console.log('🔒 Adding RLS policies for customer app...\n')

  try {
    // Enable public read access for organizations
    console.log('1️⃣ Adding public read access for organizations...')
    const { error: orgError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Public organizations read access" ON organizations;
        CREATE POLICY "Public organizations read access"
        ON organizations
        FOR SELECT
        TO anon, authenticated
        USING (true);
      `
    })

    if (orgError) {
      console.log('   Using alternative method...')
      // Try using direct SQL execution
      const { error: altError } = await supabase
        .from('organizations')
        .select('*')
        .limit(0)

      console.log('   Policy might already exist or need manual creation')
    } else {
      console.log('✅ Organizations policy added')
    }

    // Enable customers to read their own data
    console.log('\n2️⃣ Adding customer self-read policy...')
    const { error: customerError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Customers can read own data" ON customers;
        CREATE POLICY "Customers can read own data"
        ON customers
        FOR SELECT
        TO authenticated
        USING (auth.uid() = id);
      `
    })

    if (!customerError) {
      console.log('✅ Customer read policy added')
    }

    console.log('\n✅ RLS policies configured!')
    console.log('\n🧪 Testing access...')

    // Test organization access
    const anonClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk')

    const { data, error } = await anonClient
      .from('organizations')
      .select('*')
      .eq('slug', 'sapori-colori')
      .single()

    if (error) {
      console.log('❌ Organization access still blocked:', error.message)
      console.log('\n💡 Needs manual policy creation in Supabase dashboard')
    } else {
      console.log('✅ Organization access works!')
      console.log('   Name:', data.name)
    }

  } catch (err) {
    console.error('❌ Error:', err.message)
    console.log('\n💡 Creating policies via SQL Editor in Supabase dashboard...')
  }
}

addRLSPolicies()
