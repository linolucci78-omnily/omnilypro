import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '../.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSetupTokens() {
  console.log('\n🔍 Checking Setup Tokens...\n')

  const { data, error } = await supabase
    .from('setup_tokens')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('❌ Error fetching tokens:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No setup tokens found in database')
    return
  }

  console.log(`✅ Found ${data.length} recent tokens:\n`)

  data.forEach((token, idx) => {
    const expiresAt = new Date(token.expires_at)
    const now = new Date()
    const isExpired = expiresAt < now
    const isUsed = token.used

    console.log(`${idx + 1}. Token: ${token.token.substring(0, 8)}...`)
    console.log(`   Created: ${new Date(token.created_at).toLocaleString('it-IT')}`)
    console.log(`   Expires: ${expiresAt.toLocaleString('it-IT')} ${isExpired ? '🔴 EXPIRED' : '🟢 VALID'}`)
    console.log(`   Status: ${isUsed ? '❌ USED' : '✅ AVAILABLE'}`)
    console.log(`   Uses: ${token.current_uses}/${token.max_uses}`)
    console.log(`   Device: ${token.setup_data?.deviceName || 'N/A'}`)
    console.log(`   QR Generated: ${token.qr_code_generated ? 'Yes' : 'No'}`)
    console.log('')
  })

  // Check for expired tokens
  const { data: expiredTokens } = await supabase
    .from('setup_tokens')
    .select('id')
    .lt('expires_at', new Date().toISOString())
    .eq('used', false)

  if (expiredTokens && expiredTokens.length > 0) {
    console.log(`⚠️  Found ${expiredTokens.length} expired tokens that can be cleaned up`)
  }
}

checkSetupTokens()
