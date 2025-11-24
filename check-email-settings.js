// Quick script to check email settings
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkEmailSettings() {
  console.log('🔍 Checking email settings...\n')

  const { data, error } = await supabase
    .from('email_settings')
    .select('organization_id, enabled, from_email, from_name, reply_to_email')
    .limit(5)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No email settings found in database!')
    console.log('\nYou need to configure email settings:')
    console.log('1. Go to Settings → Email Settings')
    console.log('2. Add Resend API key')
    console.log('3. Configure from_email and from_name')
    console.log('4. Enable email settings')
    return
  }

  console.log('✅ Found email settings:\n')
  data.forEach((setting, idx) => {
    console.log(`${idx + 1}. Organization ID: ${setting.organization_id}`)
    console.log(`   Enabled: ${setting.enabled}`)
    console.log(`   From Email: ${setting.from_email}`)
    console.log(`   From Name: ${setting.from_name}`)
    console.log(`   Reply To: ${setting.reply_to_email || 'N/A'}`)
    console.log(`   Has API Key: ${setting.resend_api_key ? 'YES ✅' : 'NO ❌'}`)
    console.log('')
  })
}

checkEmailSettings()
