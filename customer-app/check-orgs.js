import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkOrganizations() {
  console.log('Checking organizations in database...\n')

  const { data, error } = await supabase
    .from('organizations')
    .select('id, slug, name, primary_color, secondary_color')
    .limit(10)

  if (error) {
    console.error('Error:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('No organizations found!')
    return
  }

  console.log(`Found ${data.length} organization(s):\n`)
  data.forEach((org, i) => {
    console.log(`${i + 1}. ${org.name}`)
    console.log(`   Slug: ${org.slug}`)
    console.log(`   ID: ${org.id}`)
    console.log(`   Colors: ${org.primary_color} / ${org.secondary_color}`)
    console.log(`   URL: http://localhost:5174/${org.slug}`)
    console.log()
  })
}

checkOrganizations()
