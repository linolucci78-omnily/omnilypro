import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
// Using service role key to modify policies (only for dev!)
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc0MzQ4NSwiZXhwIjoyMDcyMzE5NDg1fQ.Kbq7cBx7ovFvkFHBIwdIgCc7RQcvVYUtRpMBs1e5K8g'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testOrgAccess() {
  console.log('🧪 Testing organization access...\n')

  // Test with anon key
  const anonClient = createClient(
    supabaseUrl,
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'
  )

  const { data, error } = await anonClient
    .from('organizations')
    .select('*')
    .eq('slug', 'sapori-colori')
    .single()

  if (error) {
    console.error('❌ Error accessing organization:', error.message)
    console.log('\n💡 This means RLS policies are blocking access.')
    console.log('   We need to enable public read access for organizations table.')
    return false
  }

  console.log('✅ Organization access works!')
  console.log('   Name:', data.name)
  console.log('   Slug:', data.slug)
  return true
}

testOrgAccess()
