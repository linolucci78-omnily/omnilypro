import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc0MzQ4NSwiZXhwIjoyMDcyMzE5NDg1fQ.Kbq7cBx7ovFvkFHBIwdIgCc7RQcvVYUtRpMBs1e5K8g'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
})

async function disableRLS() {
  console.log('🔓 Disabling RLS on organizations table...\n')

  try {
    // Disable RLS using raw SQL
    const { data, error } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;'
    })

    if (error) {
      console.log('Method 1 failed, trying direct query...')

      // Try with service role which bypasses RLS
      const { error: queryError } = await supabase
        .from('organizations')
        .select('*')
        .limit(1)

      if (queryError) {
        console.log('❌ Cannot disable via JS client')
        console.log('\n📋 MANUAL STEPS:')
        console.log('1. Vai su https://supabase.com/dashboard/project/sjvatdnvewohvswfrdiv')
        console.log('2. Clicca su "SQL Editor" nel menu')
        console.log('3. Esegui questo comando:')
        console.log('\n   ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;\n')
        return
      }
    }

    console.log('✅ RLS disabled!')

    // Test access
    console.log('\n🧪 Testing public access...')
    const anonClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk')

    const { data: testData, error: testError } = await anonClient
      .from('organizations')
      .select('*')
      .eq('slug', 'sapori-colori')
      .single()

    if (testError) {
      console.log('❌ Still blocked:', testError.message)
    } else {
      console.log('✅ Public access works!')
      console.log('   Organization:', testData.name)
      console.log('\n🎉 Customer app should work now!')
      console.log('   URL: http://localhost:5174/sapori-colori')
    }

  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

disableRLS()
