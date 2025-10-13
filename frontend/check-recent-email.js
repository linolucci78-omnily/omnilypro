// Controlla l'ultima email inviata nel database
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkRecentEmail() {
  console.log('\n📧 CONTROLLO ULTIMA EMAIL INVIATA\n')
  console.log('━'.repeat(60))

  try {
    const { data: logs, error } = await supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('❌ Errore:', error.message)
      return
    }

    if (!logs || logs.length === 0) {
      console.log('❌ Nessuna email trovata nel log!')
      return
    }

    const log = logs[0]
    console.log('📋 Dettagli ultima email:\n')
    console.log('   ID:', log.id)
    console.log('   To:', log.to_email)
    console.log('   From:', log.from_email)
    console.log('   Subject:', log.subject)
    console.log('   Status:', log.status)
    console.log('   Resend Email ID:', log.resend_email_id)
    console.log('   Sent At:', log.sent_at)
    console.log('   Created At:', log.created_at)
    
    if (log.error_message) {
      console.log('   ❌ Error:', log.error_message)
    }

    console.log('\n━'.repeat(60))

    // Adesso controlliamo su Resend lo stato di questa email
    if (log.resend_email_id) {
      console.log('\n🔍 Controllo stato su Resend API...\n')

      // Prima dobbiamo ottenere l'API key
      const { data: settings } = await supabase
        .from('email_settings')
        .select('resend_api_key')
        .eq('enabled', true)
        .limit(1)
        .single()

      if (settings && settings.resend_api_key) {
        const resendResponse = await fetch(`https://api.resend.com/emails/${log.resend_email_id}`, {
          headers: {
            'Authorization': `Bearer ${settings.resend_api_key}`
          }
        })

        if (resendResponse.ok) {
          const resendData = await resendResponse.json()
          console.log('📋 Status da Resend:')
          console.log(JSON.stringify(resendData, null, 2))
        } else {
          const errorData = await resendResponse.json()
          console.log('❌ Errore Resend API:', errorData)
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Errore:', error.message)
    console.error(error)
  }

  console.log('\n' + '━'.repeat(60))
}

checkRecentEmail()
