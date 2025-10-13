// Controlla l'email mittente configurata
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjvatdnvewohvswfrdiv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqdmF0ZG52ZXdvaHZzd2ZyZGl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NDM0ODUsImV4cCI6MjA3MjMxOTQ4NX0.310-1eBrnWxaDYVJ2QeEhx9xmqVljTBqSDArLMjFiMk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkFromEmail() {
  console.log('\n📧 CONTROLLO EMAIL MITTENTE\n')
  console.log('━'.repeat(60))

  try {
    const { data: settings, error } = await supabase
      .from('email_settings')
      .select('id, organization_id, from_email, from_name, reply_to_email, enabled')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Errore:', error.message)
      return
    }

    if (!settings || settings.length === 0) {
      console.log('❌ Nessun email_settings trovato!')
      return
    }

    console.log(`Trovati ${settings.length} configurazioni email:\n`)

    settings.forEach((s, index) => {
      console.log(`${index + 1}. ${s.organization_id ? 'Org-specific' : 'GLOBALE'}`)
      console.log(`   ID: ${s.id}`)
      console.log(`   From Name: ${s.from_name}`)
      
      // Check if from_email is correct
      if (s.from_email.includes('@resend.dev')) {
        console.log(`   ❌ From Email: ${s.from_email} (PROBLEMA: usa dominio test Resend!)`)
      } else if (s.from_email.includes('@omnilypro.com')) {
        console.log(`   ✅ From Email: ${s.from_email} (CORRETTO: usa dominio verificato)`)
      } else {
        console.log(`   ⚠️  From Email: ${s.from_email} (Dominio sconosciuto)`)
      }
      
      console.log(`   Reply-To: ${s.reply_to_email || 'N/A'}`)
      console.log(`   Enabled: ${s.enabled ? '✅' : '❌'}`)
      console.log('')
    })

    console.log('\n' + '━'.repeat(60))
    console.log('📋 RIEPILOGO:\n')

    const hasResendDev = settings.some(s => s.from_email.includes('@resend.dev'))
    
    if (hasResendDev) {
      console.log('❌ PROBLEMA TROVATO!')
      console.log('   Hai configurazioni che usano @resend.dev')
      console.log('   Questo è un dominio di TEST di Resend\n')
      console.log('✅ SOLUZIONE:')
      console.log('   Cambia from_email in: noreply@omnilypro.com')
      console.log('   Oppure: info@omnilypro.com')
      console.log('   Oppure: marketing@omnilypro.com')
      console.log('\n📝 Comando SQL per fixare:')
      
      settings.forEach(s => {
        if (s.from_email.includes('@resend.dev')) {
          console.log(`\n   UPDATE email_settings`)
          console.log(`   SET from_email = 'noreply@omnilypro.com'`)
          console.log(`   WHERE id = '${s.id}';`)
        }
      })
    } else {
      console.log('✅ Tutto OK! Le email usano il dominio verificato omnilypro.com')
    }

  } catch (error) {
    console.error('\n❌ Errore:', error.message)
  }

  console.log('\n' + '━'.repeat(60))
}

checkFromEmail()
