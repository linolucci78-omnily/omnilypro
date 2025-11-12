import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkSlug() {
  console.log('🔍 Checking organization slug...\n')

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug')

  if (error) {
    console.log('❌ Error:', error.message)
    return
  }

  if (!data || data.length === 0) {
    console.log('❌ No organizations found')
    return
  }

  console.log('Organizations found:\n')
  data.forEach(org => {
    console.log(`  ID: ${org.id}`)
    console.log(`  Name: ${org.name}`)
    console.log(`  Slug: ${org.slug || '(NULL)'}`)
    console.log('')
  })

  const org = data[0]
  if (!org.slug) {
    console.log('⚠️  Slug is NULL! Setting slug to "sapori-colori"...\n')

    // Update with service role
    const serviceClient = createClient(
      supabaseUrl,
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc0MzQ4NSwiZXhwIjoyMDcyMzE5NDg1fQ.Kbq7cBx7ovFvkFHBIwdIgCc7RQcvVYUtRpMBs1e5K8g'
    )

    const { error: updateError } = await serviceClient
      .from('organizations')
      .update({ slug: 'sapori-colori' })
      .eq('id', org.id)

    if (updateError) {
      console.log('❌ Error updating slug:', updateError.message)
    } else {
      console.log('✅ Slug updated successfully!')
      console.log('   Now try: http://localhost:5174/sapori-colori')
    }
  } else if (org.slug !== 'sapori-colori') {
    console.log(`⚠️  Current slug is "${org.slug}"`)
    console.log(`   URL: http://localhost:5174/${org.slug}`)
  } else {
    console.log('✅ Slug is correctly set to "sapori-colori"')
  }
}

checkSlug()
