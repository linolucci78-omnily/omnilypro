import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc0MzQ4NSwiZXhwIjoyMDcyMzE5NDg1fQ.Kbq7cBx7ovFvkFHBIwdIgCc7RQcvVYUtRpMBs1e5K8g'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkCustomer() {
  const userId = '4462e3f1-d08c-4dac-98ae-ba14f28f57fe'
  const orgId = 'c06a8dcf-b209-40b1-92a5-c80facf2eb29'

  console.log('🔍 Checking customer record...\n')
  console.log('User ID:', userId)
  console.log('Organization ID:', orgId)

  // Check if customer exists
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', userId)

  if (error) {
    console.log('\n❌ Error:', error.message)
    return
  }

  if (!data || data.length === 0) {
    console.log('\n❌ No customer record found!')
    console.log('   Creating customer record...\n')

    // Create customer record
    const { error: insertError } = await supabase
      .from('customers')
      .insert({
        id: userId,
        organization_id: orgId,
        name: 'Pasquale Lucci',
        email: 'pako.lucci@gmail.com',
        phone: null,
        points: 0,
        tier: null,
        total_spent: 0,
        visits: 0,
        is_active: true,
        notifications_enabled: true
      })

    if (insertError) {
      console.log('❌ Error creating customer:', insertError.message)
    } else {
      console.log('✅ Customer record created!')
      console.log('   Now you can login at: http://localhost:5174/sapori-colori')
    }
  } else {
    console.log('\n✅ Customer found:', data[0].name)
    console.log('   Points:', data[0].points)
    console.log('   Tier:', data[0].tier || 'None')
  }
}

checkCustomer()
