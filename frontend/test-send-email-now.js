// Test invio email reale tramite Supabase Edge Function
import { createClient } from '@supabase/supabase-js'

// Credenziali Supabase (prese da supabase.ts)
const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSendEmail() {
  console.log('\n📧 TEST INVIO EMAIL REALE\n')
  console.log('━'.repeat(60))

  // Email di test - CAMBIA QUESTO CON LA TUA EMAIL!
  const TEST_EMAIL = 'pako.lucci@gmail.com' // <-- Email corretta

  try {
    console.log('\n1️⃣ Carico prima organizzazione...')

    // Carica prima organizzazione disponibile
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1)

    if (orgError || !orgs || orgs.length === 0) {
      console.log('❌ Nessuna organizzazione trovata')
      console.log('   Devi creare almeno un\'organizzazione nel database')
      return
    }

    const org = orgs[0]
    console.log(`✅ Organizzazione: ${org.name} (${org.id})`)

    console.log('\n2️⃣ Invio email di test...')
    console.log(`   Destinatario: ${TEST_EMAIL}`)
    console.log('   Template: newsletter')

    // Chiama Edge Function send-email
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        organization_id: org.id,
        template_type: 'newsletter',
        to_email: TEST_EMAIL,
        to_name: 'Test User',
        dynamic_data: {
          customer_name: 'Test User',
          organization_name: org.name,
          store_name: org.name,
          message: 'Questa è una email di test dal sistema OMNILY PRO!'
        }
      }
    })

    if (error) {
      console.log('\n❌ ERRORE durante l\'invio!')
      console.log('   Errore:', error.message)
      console.log('\n📋 Dettagli errore:')
      console.log(JSON.stringify(error, null, 2))

      console.log('\n🔍 POSSIBILI CAUSE:')
      console.log('   1. Edge Function non deployata: vai su Supabase > Edge Functions')
      console.log('   2. API Key Resend errata nella tabella email_settings')
      console.log('   3. Dominio non verificato su Resend (ma lo abbiamo già verificato)')
      console.log('   4. Daily limit raggiunto')

      return
    }

    console.log('\n✅ EMAIL INVIATA CON SUCCESSO! 🎉')
    console.log('\n📋 Dettagli invio:')
    console.log('   Email ID:', data.email_id)
    console.log('   Destinatario:', TEST_EMAIL)
    console.log('   Template: newsletter')
    console.log('\n📬 Controlla la tua email (anche in spam)!')
    console.log('\n✅ CONFIGURAZIONE CORRETTA - Le email funzionano!')

  } catch (error) {
    console.error('\n❌ Errore durante il test:', error.message)
    console.error(error)
  }

  console.log('\n' + '━'.repeat(60))
}

testSendEmail()
