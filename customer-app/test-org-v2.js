import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testOrg() {
  console.log('🧪 Testing organization access...\n')

  // Test 1: Get all organizations (without .single())
  console.log('1️⃣ Fetching all organizations...')
  const { data: allOrgs, error: allError } = await supabase
    .from('organizations')
    .select('*')

  if (allError) {
    console.log('❌ Error:', allError.message)
    console.log('   Code:', allError.code)
    console.log('   Details:', allError.details)
  } else {
    console.log('✅ Found', allOrgs?.length || 0, 'organizations')
    if (allOrgs && allOrgs.length > 0) {
      console.log('   Names:', allOrgs.map(o => o.name).join(', '))
    }
  }

  // Test 2: Get by slug
  console.log('\n2️⃣ Fetching by slug "sapori-colori"...')
  const { data: orgBySlug, error: slugError } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', 'sapori-colori')

  if (slugError) {
    console.log('❌ Error:', slugError.message)
  } else {
    console.log('✅ Found', orgBySlug?.length || 0, 'organizations')
    if (orgBySlug && orgBySlug.length > 0) {
      console.log('   Organization:', orgBySlug[0].name)
      console.log('   Primary color:', orgBySlug[0].primary_color)
    }
  }
}

testOrg()
